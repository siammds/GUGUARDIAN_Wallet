# Guardian Wallet - Build Production Web App (Windows PowerShell)
Write-Host "Building Guardian Wallet Web Application..." -ForegroundColor Cyan

Push-Location apps/web
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web build failed."
    Pop-Location
    exit 1
}
Pop-Location

# Copy to artifacts/web
New-Item -ItemType Directory -Force -Path artifacts/web | Out-Null
Copy-Item -Path apps/web/dist/* -Destination artifacts/web/ -Recurse -Force

Write-Host "`n[✓] Web build artifact generated at artifacts/web/" -ForegroundColor Green
Get-ChildItem artifacts/web
