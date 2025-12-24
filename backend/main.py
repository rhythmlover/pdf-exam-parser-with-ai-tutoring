from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
from pdf2image import convert_from_bytes
import base64
import io
from typing import List, Optional, Dict, Union
import re
import httpx
import os
from dotenv import load_dotenv
import fitz
import json

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware - Allow all origins for simplicity (or use specific origins list)
# For production, you can restrict this to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins including Vercel preview deployments
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for answer keys (in production, use a database)
answer_keys_storage: Dict[str, Dict[str, str]] = {}
# Store points per question
exam_points_storage: Dict[str, Dict[int, int]] = {}

# Models


class Question(BaseModel):
    id: int
    text: str
    type: str  # 'multiple_choice', 'short_answer', 'essay'
    options: Optional[List[str]] = None
    points: Optional[int] = None
    image: Optional[str] = None  # base64 encoded image


class ExamPaper(BaseModel):
    title: str
    questions: List[Question]
    total_points: int
    images: List[str] = []  # base64 encoded images
    answer_key: Optional[Dict[str, str]] = None
    exam_id: Optional[str] = None  # Unique identifier for this exam


class AIRequest(BaseModel):
    question_text: str
    user_question: str
    model: str  # 'openai' or 'anthropic'
    question_context: Optional[str] = None


class AnswerSubmission(BaseModel):
    question_id: Union[int, str]  # Support both "5" and "5-a)"
    answer: str
    question_text: str
    exam_id: Optional[str] = None  # To identify which exam


class AnswerResult(BaseModel):
    question_id: Union[int, str]
    submitted: bool
    is_correct: Optional[bool]
    message: str
    correct_answer: Optional[str] = None
    points_awarded: int = 0
    points_possible: int = 0


def extract_final_answer(answer: str) -> str:
    """
    Extract the final answer from a string that may contain equations.
    If there's an '=' sign, take the rightmost value after the last '='.
    Also normalize fraction representations.
    Example: "48 / 6 = 8" -> "8"
    Example: "x + 5 = 10 = 2 * 5" -> "2 * 5"
    Example: "2 over 3" -> "2/3"
    """
    # First, extract after '=' if present
    if '=' in answer:
        answer = answer.split('=')[-1].strip()
    else:
        answer = answer.strip()

    # Normalize various fraction representations
    # Handle "over" notation (e.g., "2 over 3" -> "2/3")
    over_pattern = r'(\d+)\s+over\s+(\d+)'
    answer = re.sub(over_pattern, r'\1/\2', answer, flags=re.IGNORECASE)

    # Remove any spaces around the division sign (e.g., "2 / 3" -> "2/3")
    answer = re.sub(r'(\d+)\s*/\s*(\d+)', r'\1/\2', answer)

    # Handle fraction bars/lines that might be represented differently
    # (e.g., "2—3" or "2–3" with dashes/lines -> "2/3")
    answer = re.sub(r'(\d+)\s*[—–-]\s*(\d+)', r'\1/\2', answer)

    return answer.strip()


def extract_images_from_pdf(pdf_bytes: bytes) -> List[str]:
    """Extract images from PDF and return as base64 strings"""
    images = []
    try:
        pdf_images = convert_from_bytes(pdf_bytes, dpi=150)
        for img in pdf_images:
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            images.append(f"data:image/png;base64,{img_str}")
    except Exception as e:
        print(f"Error extracting images: {e}")
    return images


def extract_images_with_pymupdf(pdf_bytes: bytes) -> dict:
    """Extract images using PyMuPDF (fitz) - better for embedded images"""
    page_images = {}

    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            images_on_page = []

            # Get page dimensions
            page_rect = page.rect
            page_width = page_rect.width
            page_height = page_rect.height
            page_area = page_width * page_height

            # Get all images on the page
            image_list = page.get_images()
            print(
                f"Page {page_num + 1}: Found {len(image_list)} images with PyMuPDF")

            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]  # Image reference number
                    base_image = pdf_document.extract_image(xref)
                    image_bytes = base_image["image"]

                    # Get image dimensions
                    img_width = base_image["width"]
                    img_height = base_image["height"]
                    img_area = img_width * img_height

                    # Calculate what percentage of the page this image covers
                    # Assuming 72 DPI for page coordinates
                    coverage_ratio = img_area / page_area

                    # Only include images that are not full-page (< 80% coverage)
                    if coverage_ratio < 0.8:
                        img_str = base64.b64encode(image_bytes).decode()
                        ext = base_image["ext"]
                        images_on_page.append(
                            f"data:image/{ext};base64,{img_str}")

                except Exception as e:
                    print(f"Error processing image {img_index}: {e}")

            if images_on_page:
                page_images[page_num + 1] = images_on_page  # 1-indexed
                print(
                    f"Page {page_num + 1}: Extracted {len(images_on_page)} illustration(s)")

        pdf_document.close()

    except Exception as e:
        print(f"Error with PyMuPDF extraction: {e}")

    return page_images


async def parse_exam_paper_with_ai(pdf_bytes: bytes) -> ExamPaper:
    """Parse PDF exam paper using AI vision to extract structured content"""
    api_key = os.getenv("OPENAI_API_KEY")

    # Extract full page images for AI analysis
    full_page_images = extract_images_from_pdf(pdf_bytes)

    # Extract individual illustrations from PDF using PyMuPDF only
    print("Extracting images with PyMuPDF...")
    question_images = extract_images_with_pymupdf(pdf_bytes)

    print(f"Extracted {len(full_page_images)} full pages and {sum(len(imgs) for imgs in question_images.values())} individual images from PDF.")

    if not api_key:
        raise Exception("OpenAI API key not configured")
    
    #only first 8 pages for testing
    full_page_images = full_page_images[:8]

    # Use all pages for analysis
    image_data = []
    for idx, img_data in enumerate(full_page_images):
        # Remove the data:image/png;base64, prefix
        base64_img = img_data.split(',')[1] if ',' in img_data else img_data
        
        # Use "low" detail for faster processing
        # Only use "high" for first few pages where questions usually are
        detail_level = "high" if idx < 5 else "low"
        
        image_data.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{base64_img}",
                "detail": detail_level
            }
        })

        # Construct prompt for GPT-4 Vision
    prompt = """Analyze this exam paper PDF and extract all questions WITH THEIR ANSWERS in a structured format.

FIRST, look for any mark allocation instructions (e.g., "Question 1 to 10 carry 2 marks each", "Each question carries X marks").

For each question, provide:
1. Question number/ID (as integer)
2. Full question text (preserve exact wording)
3. Question type (multiple_choice, short_answer, or essay)
4. If multiple choice, list all options (A, B, C, D, etc.)
5. Point value - USE THE ALLOCATION STATED FOR THAT QUESTION NUMBER, NOT THE SUM OF SUBSECTIONS
   - If the instructions say "Question 1 to 10 carry 2 marks each", then Question 5 = 2 marks total (even if it has parts a, b, c)
   - Only use explicitly shown individual point values if they override the general allocation
6. Page number (1-indexed)
7. has_illustration (boolean) - TRUE if the question refers to or requires an image/diagram/illustration to be answered
   - Examples: "Use all the digits below", "Look at the diagram", "The figure shows", "Refer to the image"
   - If question text says "below", "above", "shown", "diagram", "figure", "image" and there's an illustration, set to true
8. illustration_index (integer, 0-indexed) - If has_illustration is true, indicate which illustration on the page (0 for first, 1 for second, etc.). Default to 0 if only one illustration.
9. is_context_based (boolean) - TRUE if this is a fill-in-the-blank question within a larger passage/text context where the entire page should be shown
10. answer (string) - The correct answer to the question. Look for answer keys, answer sections, or any provided answers in the document.
   - For multiple choice questions with lettered options (A, B, C, D), provide the LETTER (e.g., "A", "B", "C", "D")
   - For multiple choice questions with numbered options like "(1) in, (2) on, (3) for", provide the ACTUAL TEXT of the correct option (e.g., "in", "on", "for"), NOT the number
   - For visual fractions (numerator over denominator), write as "numerator/denominator" (e.g., "2/3")
   - For equations, provide the final answer after the equals sign
   - If the answer is not provided in the document, set to null

IMPORTANT RULES FOR DIFFERENT QUESTION TYPES:

1. FILL-IN-THE-BLANK WITH CONTEXT (like vocabulary in passage):
   - Each blank/question number should be SEPARATE (Q7, Q8, etc.)
   - Set is_context_based to TRUE for all questions in that section
   - Set has_illustration to TRUE (to show the full page)
   - Question text should just be the question number/identifier (e.g., "Question 7", "Question 8")
   - The full page will serve as the context/reference

2. REGULAR SUBSECTIONS (like math problems with parts a, b, c):
   - COMBINE into ONE question entry
   - Include the main question stem FIRST, then subsections
   - Separate subsections with double line breaks (\\n\\n)
   - DO NOT include the main question number (like "5a", "5b") - only use a), b), c)
   - For subsection answers, provide a JSON object mapping subsection letters to answers

3. COMPREHENSION PASSAGES:
   - Each question should be separate
   - Set is_context_based to TRUE
   - Set has_illustration to TRUE
   - Include the full question text

IMPORTANT: If a question has subsections (a, b, c, etc.), COMBINE them into ONE question entry:
- FIRST, include the main question stem/context if present (e.g., "School A has 3064 story books...")
- THEN add each subsection as "a) [question text]", "b) [question text]", etc.
- Separate the main stem and subsections with double line breaks (\\n\\n)
- Also separate each subsection with double line breaks (\\n\\n)
- DO NOT include the main question number (like "13a", "13b") - only use a), b), c)
- DO NOT include "Question X:" prefix
- The points value is for the ENTIRE question, not per subsection
- If ANY subsection needs an illustration, set has_illustration to true for the entire question
- For subsection answers, provide a JSON object mapping subsection letters to answers

Return the data in this JSON format:
{
  "title": "Exam title from the document",
  "questions": [
    {
      "id": 1,
      "text": "Jason won a computer _____________ an Art contest.\\n(1) in\\n(2) on\\n(3) for\\n(4) with",
      "type": "multiple_choice",
      "options": ["in", "on", "for", "with"],
      "points": 1,
      "page": 1,
      "has_illustration": false,
      "answer": "in"
    },
    {
      "id": 2,
      "text": "What is the capital of France?\\nA. London\\nB. Paris\\nC. Berlin\\nD. Madrid",
      "type": "multiple_choice",
      "options": ["A. London", "B. Paris", "C. Berlin", "D. Madrid"],
      "points": 2,
      "page": 1,
      "has_illustration": false,
      "answer": "B"
    },
    {
      "id": 3,
      "text": "Use all the digits below to form the smallest 4-digit number.",
      "type": "short_answer",
      "points": 2,
      "page": 1,
      "has_illustration": true,
      "illustration_index": 0,
      "answer": "1234"
    },
    {
      "id": 13,
      "text": "School A has 3064 story books in its library. School B has 4 times as many books as School A.\\n\\na) How many more story books does School B have than School A?\\n\\nb) How many story books must be moved from School B to School A so that there will be the same number of books in both schools?",
      "type": "short_answer",
      "points": 2,
      "page": 3,
      "has_illustration": false,
      "answer": {
        "a)": "9192",
        "b)": "4596"
      }
    }
  ]
}

Important:
- Extract ALL questions visible in the pages
- For questions with subsections: include the main question stem FIRST, then the subsections
- COMBINE subsections into ONE question with subsections labeled ONLY as a), b), c)
- Set is_context_based to TRUE for questions where the full page context is needed
- Set has_illustration to TRUE for is_context_based questions
- Remove all question number prefixes from the text (no "5a", "Question 5", etc.)
- Preserve question wording exactly as it appears
- USE THE MARK ALLOCATION FROM THE INSTRUCTIONS (e.g., if it says Q1-10 = 2 marks each, then Q5 = 2 marks total)
- Accurately identify questions that need illustrations to be answered
- Provide illustration_index for questions with illustrations (0 for first image on page, 1 for second, etc.)
- EXTRACT ANSWERS from any answer key section or inline answers in the document
- For multiple choice with numbered options (1), (2), (3): extract the TEXT of the correct option, NOT the number
- For multiple choice with lettered options A, B, C, D: extract the LETTER only
- For fractions shown visually, convert to "numerator/denominator" format
- Ignore watermarks like "www.sgexam.com"
- If no explicit point values or allocation instructions are shown, omit the points field"""

    try:
        max_retries = 3
        retry_delay = 5  # seconds
        parsed_data = None

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o",
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": prompt},
                                        *image_data
                                    ]
                                }
                            ],
                            "max_tokens": 4096,
                            "response_format": {"type": "json_object"}
                        }
                    )

                    if response.status_code == 502 or response.status_code == 503:
                        if attempt < max_retries - 1:
                            print(
                                f"OpenAI API returned {response.status_code}, retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                            import asyncio
                            await asyncio.sleep(retry_delay)
                            continue
                        else:
                            print(
                                f"OpenAI API error after {max_retries} attempts: {response.status_code}")

                    if response.status_code != 200:
                        print(
                            f"OpenAI API error: {response.status_code} - {response.text}")

                    result = response.json()
                    parsed_data = result["choices"][0]["message"]["content"]
                    break  # Success, exit retry loop

            except httpx.TimeoutException:
                if attempt < max_retries - 1:
                    print(
                        f"Request timeout, retrying... (attempt {attempt + 1}/{max_retries})")
                    import asyncio
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    raise

        exam_data = json.loads(parsed_data)

        # Convert to ExamPaper model and extract answers
        questions = []
        answer_key = {}
        question_counter = 1

        for q in exam_data.get("questions", []):
            # Check if question needs an illustration
            question_image = None
            if q.get("has_illustration", False):
                page_num = q.get("page", 1)
                illustration_index = q.get("illustration_index", 0)

                # Try to get the specific illustration from that page
                if page_num in question_images and len(question_images[page_num]) > illustration_index:
                    question_image = question_images[page_num][illustration_index]
                    print(
                        f"Question {question_counter} has illustration {illustration_index} on page {page_num}")
                elif page_num in question_images and question_images[page_num]:
                    # Fallback to first image on page if index not found
                    question_image = question_images[page_num][0]
                    print(
                        f"Question {question_counter} using first illustration on page {page_num}")
                else:
                    # Fallback to full page if no extracted images
                    page_idx = page_num - 1
                    if 0 <= page_idx < len(full_page_images):
                        question_image = full_page_images[page_idx]
                        print(
                            f"Question {question_counter} using full page {page_num} (no extracted images)")

            questions.append(Question(
                id=question_counter,
                text=q.get("text", ""),
                type=q.get("type", "short_answer"),
                options=q.get("options"),
                points=q.get("points"),
                image=question_image
            ))

            # Extract and process answers
            answer = q.get("answer")
            if answer is not None:
                if isinstance(answer, dict):
                    # Subsection answers (e.g., {"a)": "74950", "b)": "74900"})
                    for subsection_key, subsection_answer in answer.items():
                        full_key = f"{question_counter}-{subsection_key}"
                        processed_answer = extract_final_answer(
                            str(subsection_answer))
                        answer_key[full_key] = processed_answer
                        print(f"Answer for {full_key}: {processed_answer}")
                else:
                    # Single answer
                    processed_answer = extract_final_answer(str(answer))
                    answer_key[str(question_counter)] = processed_answer
                    print(
                        f"Answer for question {question_counter}: {processed_answer}")

            question_counter += 1

        total_points = sum(q.points or 0 for q in questions)

        # Generate unique exam ID
        import hashlib
        import time
        exam_id = hashlib.md5(f"{time.time()}".encode()).hexdigest()[:12]

        # Store answer key and points in global storage
        answer_keys_storage[exam_id] = answer_key
        exam_points_storage[exam_id] = {q.id: q.points or 0 for q in questions}

        print(f"Final answer key: {answer_key}")

        return ExamPaper(
            title=exam_data.get("title", "Exam Paper"),
            questions=questions,
            total_points=total_points,
            images=full_page_images,
            answer_key=answer_key,
            exam_id=exam_id
        )

    except Exception as e:
        print(f"Error parsing with AI: {e}")


async def query_openai(question: str, context: str) -> str:
    """Query OpenAI API"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI API key not configured"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a helpful tutor explaining exam questions to students."},
                        {"role": "user", "content": f"Question: {context}\n\nStudent asks: {question}"}
                    ],
                    "max_tokens": 500
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error querying OpenAI: {str(e)}"


async def query_anthropic(question: str, context: str) -> str:
    """Query Anthropic Claude API"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key.strip() == "":
        return "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env file."

    print(f"Using Anthropic API key: {api_key[:10]}...{api_key[-4:]}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-5",
                    "max_tokens": 1024,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"You are a helpful tutor. A student has this exam question:\n\n{context}\n\nThe student asks: {question}\n\nProvide a clear, helpful explanation."
                        }
                    ]
                },
                timeout=30.0
            )

            print(f"Anthropic API response status: {response.status_code}")

            if response.status_code == 404:
                return "Error: Anthropic API endpoint not found. Please verify your API key is valid and has access to the Messages API."

            response.raise_for_status()
            result = response.json()
            return result["content"][0]["text"]
    except httpx.HTTPStatusError as e:
        return f"Error querying Anthropic (HTTP {e.response.status_code}): {e.response.text}"
    except Exception as e:
        return f"Error querying Anthropic: {str(e)}"

# Routes


@app.post("/api/upload", response_model=ExamPaper)
async def upload_exam(file: UploadFile = File(...)):
    """Upload and parse exam PDF"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400, detail="Only PDF files are allowed")

    try:
        pdf_bytes = await file.read()
        exam_paper = await parse_exam_paper_with_ai(pdf_bytes)
        return exam_paper
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error parsing PDF: {str(e)}")


@app.post("/api/ask-ai")
async def ask_ai(request: AIRequest):
    """Ask AI about a question"""
    print(
        f"Received AI request - Model: '{request.model}', Question: '{request.user_question[:50]}...'")
    context = f"{request.question_text}\n{request.question_context or ''}"

    model = request.model.lower().strip()  # Normalize model name

    if model == "openai":
        response = await query_openai(request.user_question, context)
    elif model == "anthropic":
        response = await query_anthropic(request.user_question, context)
    else:
        raise HTTPException(
            status_code=400, detail=f"Invalid AI model: '{request.model}'. Must be 'Openai' or 'Anthropic'")
    return {"response": response, "model": request.model}


@app.post("/api/submit-answer", response_model=AnswerResult)
async def submit_answer(submission: AnswerSubmission):
    """Submit an answer for evaluation and compare with answer key"""
    exam_id = submission.exam_id

    if not exam_id or exam_id not in answer_keys_storage:
        # No answer key available
        return AnswerResult(
            question_id=submission.question_id,
            submitted=True,
            is_correct=None,
            message="Answer submitted successfully (no answer key available for grading)",
            correct_answer=None,
            points_awarded=0,
            points_possible=0
        )

    answer_key = answer_keys_storage[exam_id]
    points_map = exam_points_storage.get(exam_id, {})

    # Convert question_id to string for comparison
    question_id_str = str(submission.question_id)

    # Get the correct answer
    correct_answer = answer_key.get(question_id_str)

    if correct_answer is None:
        return AnswerResult(
            question_id=submission.question_id,
            submitted=True,
            is_correct=None,
            message="Answer submitted (correct answer not found in answer key)",
            correct_answer=None,
            points_awarded=0,
            points_possible=0
        )

    # Extract final answers if they contain '=' signs
    user_answer_raw = submission.answer.strip()
    user_answer = extract_final_answer(user_answer_raw)
    correct_answer_normalized = correct_answer.strip()

    # Log the extraction if user included equation
    if user_answer != user_answer_raw:
        print(f"Extracted user answer: '{user_answer_raw}' -> '{user_answer}'")

    # Check if it's a multiple choice question (single letter answer)
    is_multiple_choice = len(
        correct_answer_normalized) == 1 and correct_answer_normalized.isalpha()

    if is_multiple_choice:
        # Case-insensitive comparison for multiple choice
        is_correct = user_answer.upper() == correct_answer_normalized.upper()
    else:
        # Exact match for other question types
        is_correct = user_answer == correct_answer_normalized

    # Calculate points
    # Extract main question number for points lookup
    main_question_id = int(str(submission.question_id).split(
        '-')[0]) if '-' in str(submission.question_id) else int(submission.question_id)
    total_question_points = points_map.get(main_question_id, 0)

    # If it's a subquestion, divide points among subsections
    if '-' in str(submission.question_id):
        # Count how many subsections this question has
        subsection_count = sum(1 for key in answer_key.keys(
        ) if key.startswith(f"{main_question_id}-"))
        points_possible = total_question_points // subsection_count if subsection_count > 0 else total_question_points
    else:
        points_possible = total_question_points

    points_awarded = points_possible if is_correct else 0

    if is_correct:
        message = f"Correct! You earned {points_awarded} point{'s' if points_awarded != 1 else ''}."
    else:
        message = f"Incorrect. You earned 0 out of {points_possible} point{'s' if points_possible != 1 else ''}."

    return AnswerResult(
        question_id=submission.question_id,
        submitted=True,
        is_correct=is_correct,
        message=message,
        correct_answer=correct_answer if not is_correct else None,
        points_awarded=points_awarded,
        points_possible=points_possible
    )


@app.get("/")
async def root():
    return {"message": "Exam Paper API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
