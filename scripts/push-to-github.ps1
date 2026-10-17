# Guardian Wallet - Push to GitHub Repository
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Guardian Wallet - Push to GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Target Repository: https://github.com/siamm6/guardian-wallet.git`n"

$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "[ERROR] Git was not found in your environment PATH." -ForegroundColor Red
    Write-Host "Please install Git for Windows (https://git-scm.com/download/win)" -ForegroundColor Yellow
    Write-Host "or open GitHub Desktop and add this folder (c:\Users\siamm\Documents\Fintech)." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Checking Git repository initialization..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

Write-Host "[2/5] Staging repository files..." -ForegroundColor Yellow
git add .

Write-Host "[3/5] Creating commit..." -ForegroundColor Yellow
git commit -m "Guardian Wallet: Complete AI Agent Autonomous Blockchain Wallet (FinTechathon 2026)"

Write-Host "[4/5] Setting remote repository origin..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/siamm6/guardian-wallet.git

Write-Host "[5/5] Pushing to GitHub main branch..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`nRepository successfully updated:" -ForegroundColor Green
Write-Host "https://github.com/siamm6/guardian-wallet" -ForegroundColor Green
