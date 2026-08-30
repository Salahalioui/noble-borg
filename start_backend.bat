@echo off
title Noble-Borg Backend API
cd /d "%~dp0backend"
echo ====================================================
echo Starting Noble-Borg AI Trading Backend Engine on Port 8001...
echo ====================================================
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating venv...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
pause
