# PDF Exam Parser with AI Tutoring

An intelligent exam assistant that parses PDF exam papers using AI vision and provides interactive tutoring.

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API key (get from https://platform.openai.com/api-keys)
- Poppler (for PDF processing)

## Technical Details

### Architecture
- **Frontend**: React + TypeScript with Tailwind CSS
- **Backend**: FastAPI (Python) with GPT-4o Vision
- **PDF Processing**: pdfplumber + pdf2image + Poppler

### Why Python Backend?
Python libraries handle complex PDFs, tables, and image extraction much better. Both OpenAI and Anthropic have excellent Python SDKs.
FastAPI is Modern, fast, and includes automatic API documentation.

### Why ReactJS Frontend?
Familiar, component-based, great for interactive UIs.

### AI Models Used
- **GPT-4o**: For visual PDF parsing
- **GPT-4**: For conversational tutoring

### Parsing Strategy
1. Convert PDF pages to images (150 DPI)
2. Send to GPT-4o with structured JSON prompt
3. Extract questions, options, types, and metadata
4. Fallback to regex parsing if AI unavailable

## Trade-offs & Design Decisions (For MVP)

### 1. **Why AI Vision over Traditional OCR**
1. AI vision is more accurate especially when it comes to complex layouts
2. There is higher context understanding especially when it comes to handling subsections
3. Can support more languages, no need to download language packs

### 2. **Why In-Memory over Database Storage**
1. Its free and doesn't need much setup, very fast prototyping speed
2. But no persistence in data, data lost upon restart
3. Accepting data loss for faster development

### 3. **Why Server-Side PDF Processing over Client-side**
1. Reliable processing power
2. Higher file size limits
3. Can invoke OpenAI calls directly

### 4. **Why Monolithic vs Microservices**
1. Fast development/iteration for prototyping
2. Easy to understand
3. Single point for deployments

## Scope & Assumptions

### Current Scope (MVP)

1. **Single-user local operation**: No authentication or multi-user support
2. **Session-based usage**: Complete exam in one sitting
3. **In-memory storage**: No database persistence
4. **Limited PDF size**: Optimized for 8-page exams
5. **Standard exam formats**: Works best with structured exam papers

### Key Assumptions

#### 1. **Small to Medium Exam Papers**
- **Assumption**: Most exams are 5-15 pages
- **Limit**: Currently processes first 8 pages only because GPT-4 Vision has 90-second processing limit

#### 2. **Single Session Usage**
- **Assumption**: Students complete exams in one sitting
- **Limit**: No progress saving or answer editing, hitting refresh loses all progress

#### 3. **Trust Model**
- **Assumption**: Users are trusted (no cheating prevention)
- **Limit**: No proctoring, time limits, or answer locking, not suitable for official examinations

#### 4. **English/Chinese Primary Support**
- **Assumption**: Most target users use English or Chinese exams
- **Limit**: Other languages untested, may be unstable

#### 5. **Reliable Internet Connection**
- **Assumption**: Users have stable, fast internet
- **Limit**: No offline mode or request queueing

#### 6. **Clean, Standard PDF Format**
- **Assumption**: PDFs are text-based, not scanned images
- **Limit**: Handwritten or heavily distorted PDFs may fail

## Configuration

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-...       # For AI parsing and AI tutoring
ANTHROPIC_API_KEY=sk-...    # For Claude tutoring
```



