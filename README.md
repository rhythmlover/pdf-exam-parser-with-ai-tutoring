# PDF Exam Parser with AI Tutoring

An intelligent exam assistant that parses PDF exam papers using AI vision and provides interactive tutoring.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API key (get from https://platform.openai.com/api-keys)
- Poppler (for PDF processing)

### Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Add your OpenAI API key to .env file
echo "OPENAI_API_KEY=your_key_here" > .env

python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

See [SETUP.md](SETUP.md) for detailed instructions.

## Technical Details

### Architecture
- **Frontend**: React + TypeScript with Tailwind CSS
- **Backend**: FastAPI (Python) with GPT-4o Vision
- **PDF Processing**: pdfplumber + pdf2image + Poppler

### AI Models
- **GPT-4o**: For visual PDF parsing (high accuracy)
- **GPT-4**: For conversational tutoring

### Parsing Strategy
1. Convert PDF pages to images (150 DPI)
2. Send to GPT-4o with structured JSON prompt
3. Extract questions, options, types, and metadata
4. Fallback to regex parsing if AI unavailable

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI server with AI parsing
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # API keys (create from .env.example)
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React application
│   │   ├── input.css        # Tailwind source
│   │   └── output.css       # Compiled styles
│   └── package.json
├── SETUP.md                 # Detailed setup instructions
└── README.md                # This file
```

## Configuration

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-...       # Required for AI parsing
ANTHROPIC_API_KEY=sk-...    # Optional for Claude tutoring
```

## 🐛 Troubleshooting

**"www.sgexam.com" watermarks appearing:**
- Ensure `OPENAI_API_KEY` is set in `backend/.env`
- Restart the backend server after adding the key

**PDF not parsing:**
- Install Poppler: Windows users download from https://github.com/oschwartz10612/poppler-windows/releases/
- Add Poppler to your system PATH

## Example Exam Papers

The system has been tested with:
- Primary 4 English exams (multiple choice and comprehension)
- Primary 4 Chinese exams (various question types)
- Papers from various Singapore schools

