# Guardian Wallet - Run Web Frontend (Windows PowerShell)
Write-Host "Starting Guardian Wallet Web Application..." -ForegroundColor Cyan
Push-Location apps/web
npm run dev
Pop-Location
