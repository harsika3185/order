# ==============================================================================
# Order-Time Late Delivery Risk Prediction - Backend Launcher (PowerShell)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Logistics Intelligence Backend (FastAPI)..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Activate virtual environment if present
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment (.\venv)..." -ForegroundColor Green
    & ".\venv\Scripts\Activate.ps1"
} elseif (Test-Path "..\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment (..\venv)..." -ForegroundColor Green
    & "..\venv\Scripts\Activate.ps1"
} else {
    Write-Host "Virtual environment not detected. Using system Python..." -ForegroundColor Yellow
}

# 2. Run Uvicorn
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
