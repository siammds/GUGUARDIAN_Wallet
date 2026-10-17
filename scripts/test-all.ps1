# Guardian Wallet - Run All Test Suites (Windows PowerShell)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Running All Automated Test Suites             " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path evidence/test-results | Out-Null

# 1. Backend Pytest
Write-Host "`n[1/2] Running Backend Policy & API Tests (pytest)..." -ForegroundColor Cyan
$env:PYTHONPATH = "services/api"
& "./services/api/venv/Scripts/pytest.exe" -v services/api/tests/ | Tee-Object -FilePath "evidence/test-results/backend-pytest.txt"
$backendExit = $LASTEXITCODE

# 2. Frontend Vitest
Write-Host "`n[2/2] Running Frontend Vitest Tests..." -ForegroundColor Cyan
Push-Location apps/web
npm run test | Tee-Object -FilePath "../../evidence/test-results/frontend-vitest.txt"
$frontendExit = $LASTEXITCODE
Pop-Location

Write-Host "`n================================================" -ForegroundColor Cyan
if ($backendExit -eq 0 -and $frontendExit -eq 0) {
    Write-Host "  ALL TEST SUITES PASSED (100% SUCCESS)         " -ForegroundColor Green
    Write-Host "  Evidence saved to evidence/test-results/      " -ForegroundColor Green
} else {
    Write-Host "  SOME TESTS FAILED! Check evidence/logs.       " -ForegroundColor Red
}
Write-Host "================================================" -ForegroundColor Cyan
