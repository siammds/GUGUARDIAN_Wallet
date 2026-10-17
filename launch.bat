@echo off
title Guardian Wallet Launcher
echo ========================================================
echo   Starting Guardian Wallet (Backend ^& Web Application)
echo ========================================================

cd /d "%~dp0"

REM 1. Start backend in dedicated window
start "Guardian Wallet Backend (Port 8000)" cmd /k "cd /d "%~dp0services\api" && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM 2. Wait for backend initialization
timeout /t 2 /nobreak >nul

REM 3. Open browser to http://localhost:5173
start http://localhost:5173

REM 4. Start frontend
cd /d "%~dp0apps\web"
npm run dev -- --host 0.0.0.0 --port 5173
