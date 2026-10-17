# Guardian Wallet - Build Android APK (Windows PowerShell)
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Building Guardian Wallet Android APK          " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Build Web Assets
Write-Host "`n[1/4] Building production web assets..." -ForegroundColor Cyan
Push-Location apps/web
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web build failed."
    Pop-Location
    exit 1
}

# 2. Sync to Android
Write-Host "`n[2/4] Syncing web assets to Android platform..." -ForegroundColor Cyan
.\node_modules\.bin\cap.cmd sync android
Pop-Location

# 3. Build APK with Gradle
Write-Host "`n[3/4] Compiling debug APK with Gradle wrapper..." -ForegroundColor Cyan
if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    $possibleJava = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Eclipse Adoptium\jdk*",
        "C:\Program Files\Java\jdk*"
    )
    foreach ($p in $possibleJava) {
        $resolved = Resolve-Path $p -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path
        if ($resolved -and (Test-Path $resolved)) {
            $env:JAVA_HOME = $resolved
            break
        }
    }
}
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }

Push-Location apps/web/android
cmd.exe /c gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle assembleDebug failed."
    Pop-Location
    exit 1
}
Pop-Location

# 4. Copy artifact
Write-Host "`n[4/4] Copying APK to artifacts/android/..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path artifacts/android | Out-Null
$builtApk = "apps/web/android/app/build/outputs/apk/debug/app-debug.apk"
$targetApk = "artifacts/android/GuardianWallet-debug.apk"

if (Test-Path $builtApk) {
    Copy-Item -Path $builtApk -Destination $targetApk -Force
    Copy-Item -Path $builtApk -Destination "GuardianWallet-debug.apk" -Force
    $sizeBytes = (Get-Item $targetApk).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
    Write-Host "`n[Android APK generated successfully!]" -ForegroundColor Green
    Write-Host "Target: $targetApk" -ForegroundColor Green
    Write-Host "Root:   GuardianWallet-debug.apk" -ForegroundColor Green
    Write-Host "Size:   $sizeMB MB" -ForegroundColor Green
} else {
    Write-Error "Built APK not found at $builtApk"
    exit 1
}
