@echo off
REM Quick Start Script for Windows - Start the resume editor when you need it

echo ========================================
echo LaTeX Resume Editor - Quick Start
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo First-time setup: Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -q flask flask-cors python-docx pyyaml
    echo Setup complete!
    echo.
) else (
    call venv\Scripts\activate.bat
)

REM Check if pdflatex is available
where pdflatex >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: pdflatex not found
    echo LaTeX compilation will not work without it.
    echo.
    echo To install: Download MiKTeX from miktex.org
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b
)

echo.
echo Starting application...
echo.

REM Start the application
start /B python start_webapp.py

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Check if server is running
curl -sf http://localhost:5000/api/status >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Resume Editor is running!
    echo ========================================
    echo.
    echo Access the application:
    echo   http://localhost:5000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    echo Opening in browser...
    start http://localhost:5000
    echo.

    REM Keep window open
    pause
) else (
    echo.
    echo Failed to start server
    echo Check the error messages above
    pause
    exit /b 1
)
