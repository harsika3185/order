@echo off
title Logistics Intelligence Backend (FastAPI)
echo ==========================================================
echo Starting Logistics Intelligence Backend (FastAPI)...
echo ==========================================================

if exist venv\Scripts\activate.bat (
    echo Activating venv...
    call venv\Scripts\activate.bat
)

python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
