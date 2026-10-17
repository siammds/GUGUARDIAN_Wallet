# Guardian Wallet Setup Script (Windows PowerShell)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Guardian Wallet — Initializing Environment    " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVer = node -v
    Write-Host "[✓] Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not found in PATH. Please install Node.js (v18+) to continue."
    exit 1
}

# 2. Check Python
try {
    $pyVer = python --version
    Write-Host "[✓] Python detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Error "Python is not found in PATH. Please install Python (3.10+) to continue."
    exit 1
}

# 3. Environment configuration
if (!(Test-Path .env)) {
    Write-Host "[+] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
} else {
    Write-Host "[✓] Existing .env file preserved." -ForegroundColor Green
}

# 4. Install Frontend Dependencies
Write-Host "`n[+] Installing Web Frontend dependencies..." -ForegroundColor Cyan
Push-Location apps/web
npm install --no-audit --no-fund
Pop-Location
Write-Host "[✓] Frontend dependencies installed successfully." -ForegroundColor Green

# 5. Setup Python Virtual Environment and Backend Dependencies
Write-Host "`n[+] Setting up Python backend virtual environment..." -ForegroundColor Cyan
if (!(Test-Path services/api/venv)) {
    python -m venv services/api/venv
}
& "./services/api/venv/Scripts/python.exe" -m pip install --upgrade pip --quiet
& "./services/api/venv/Scripts/pip.exe" install -r services/api/requirements.txt --quiet
Write-Host "[✓] Backend dependencies installed successfully." -ForegroundColor Green

# 6. Check Android Tooling
Write-Host "`n[+] Checking Android development tooling..." -ForegroundColor Cyan
if (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
    Write-Host "[✓] OpenJDK 21 detected in Android Studio." -ForegroundColor Green
}
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    Write-Host "[✓] Android SDK detected at $env:LOCALAPPDATA\Android\Sdk." -ForegroundColor Green
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  Setup Complete! Guardian Wallet is ready.     " -ForegroundColor Green
Write-Host "  Run: ./scripts/run-all.ps1 or ./scripts/run-web.ps1" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
