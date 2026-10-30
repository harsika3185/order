@echo off
title Logistics Intelligence Frontend (Vite)
echo ==========================================================
echo Starting Logistics Intelligence Frontend (Vite)...
echo ==========================================================

cd frontend
if not exist node_modules (
    echo Installing node modules...
    call npm install
)

call npm run dev
pause
