@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Guardian Wallet - Push to GitHub Repository
echo ========================================================
echo.
echo Target Repository: https://github.com/siamm6/guardian-wallet.git
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git command line tool was not found in PATH.
    echo.
    echo Please install Git for Windows from https://git-scm.com/download/win
    echo or use GitHub Desktop (File - Add Local Repository - c:\Users\siamm\Documents\Fintech).
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking Git repository initialization...
if not exist ".git" (
    echo Initializing fresh Git repository...
    git init
    git branch -M main
)

echo [2/5] Staging files according to .gitignore...
git add .

echo [3/5] Creating commit...
git commit -m "Guardian Wallet: Complete AI Agent Autonomous Blockchain Wallet (FinTechathon 2026)"

echo [4/5] Setting remote repository origin...
git remote remove origin 2>nul
git remote add origin https://github.com/siamm6/guardian-wallet.git

echo [5/5] Pushing to GitHub main branch...
git push -u origin main

echo.
echo ========================================================
echo   Push Complete!
echo   Repository: https://github.com/siamm6/guardian-wallet
echo ========================================================
pause
