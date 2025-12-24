@echo off
echo Starting Exam Parser Backend Server...
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create a .env file with your OPENAI_API_KEY
    echo You can copy .env.example to .env and add your key
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv\ (
    echo Creating virtual environment...
    python -m venv venv
    echo Installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo.
echo Starting server at http://localhost:8000
echo Press Ctrl+C to stop
echo.

python main.py
