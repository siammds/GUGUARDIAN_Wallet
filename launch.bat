@echo off
title Guardian Wallet Launcher
echo ========================================================
echo   Starting Guardian Wallet (Backend ^& Web Application)
echo ========================================================

cd /d "%~dp0"

REM Step 1: Clean up any stale instances occupying ports 8000 and 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

timeout /t 1 /nobreak >nul

REM Step 2: Start backend in a dedicated window
pushd "%~dp0services\api"
start "Guardian Wallet Backend (Port 8000)" cmd /k ".\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
popd

REM Step 3: Wait for backend initialization
timeout /t 3 /nobreak >nul

REM Step 4: Start frontend in a dedicated window
pushd "%~dp0apps\web"
start "Guardian Wallet Web (Port 5173)" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"
popd

REM Step 5: Wait for frontend server to initialize
timeout /t 3 /nobreak >nul

REM Step 6: Open browser to application dashboard
start http://localhost:5173

echo.
echo ========================================================
echo   Guardian Wallet successfully launched:
echo   - Web Interface: http://localhost:5173
echo   - Backend API:   http://localhost:8000/health
echo ========================================================
echo.
echo Press any key to exit this launcher window (servers stay running)...
pause >nul
