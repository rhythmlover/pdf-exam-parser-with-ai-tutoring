# PDF Exam Parser with AI Tutoring - Setup Guide

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Note: For `pdf2image`, you also need to install Poppler:
- **Windows**: Download from https://github.com/oschwartz10612/poppler-windows/releases/ and add to PATH

### 2. Configure API Keys

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   - **OPENAI_API_KEY**: Required for AI-powered PDF parsing. Get from https://platform.openai.com/api-keys

### 3. Start Backend Server

```bash
cd backend
python main.py
```

The backend will run at `http://localhost:8000`

## Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will run at `http://localhost:3000`

## How It Works

### PDF Parsing
The system uses **GPT-4 Vision (gpt-4o)** to intelligently parse exam papers:
- Converts PDF pages to images
- Sends images to GPT-4o with structured prompts
- Extracts questions, options, and metadata
- Falls back to basic regex parsing if AI is unavailable or API key is missing

### Features
- **Smart Question Extraction**: Handles various exam formats including English and Chinese papers
- **Multiple Choice Detection**: Automatically identifies and extracts MCQ options
- **Image Preservation**: Shows original PDF pages as reference
- **AI Tutoring**: Ask questions about any problem using OpenAI or Claude
- **Answer Submission**: Save and track your answers

## Troubleshooting

### Backend Issues
- **"www.sgexam.com" watermarks showing**: Make sure your OPENAI_API_KEY is set correctly in `.env`
- **PDF not parsing**: Check that Poppler is installed for pdf2image
- **API errors**: Verify your API keys are valid and have sufficient credits

### Frontend Issues
- **Can't connect to backend**: Ensure backend is running on port 8000
```
