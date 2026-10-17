# Guardian Wallet - Run Full Monorepo (Windows PowerShell)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Launching Guardian Wallet (Backend & Frontend)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "services/api"

# Start Backend in background
Write-Host "[+] Launching FastAPI backend on http://localhost:8000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "./services/api/venv/Scripts/python.exe" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[+] Launching Web UI on http://localhost:5173..." -ForegroundColor Green
try {
    Push-Location apps/web
    npm run dev
} finally {
    Pop-Location
    Write-Host "`nStopping backend server..." -ForegroundColor Yellow
    if ($backendProc -and !$backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force
    }
}
