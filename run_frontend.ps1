# ==============================================================================
# Order-Time Late Delivery Risk Prediction - Frontend Launcher (PowerShell)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Logistics Intelligence Frontend (Vite + React)..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
    npm install
}

npm run dev
