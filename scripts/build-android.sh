#!/usr/bin/env bash
set -e

echo "================================================"
echo "  Building Guardian Wallet Android APK          "
echo "================================================"

# 1. Build Web Assets
echo ""
echo "[1/4] Building production web assets..."
cd apps/web
npm run build

# 2. Sync to Android
echo ""
echo "[2/4] Syncing web assets to Android platform..."
npx cap sync android
cd ../..

# 3. Build APK with Gradle
echo ""
echo "[3/4] Compiling debug APK with Gradle wrapper..."
cd apps/web/android
./gradlew assembleDebug
cd ../../..

# 4. Copy artifact
echo ""
echo "[4/4] Copying APK to artifacts/android/..."
mkdir -p artifacts/android
BUILT_APK="apps/web/android/app/build/outputs/apk/debug/app-debug.apk"
TARGET_APK="artifacts/android/GuardianWallet-debug.apk"

if [ -f "$BUILT_APK" ]; then
    cp "$BUILT_APK" "$TARGET_APK"
    echo "[✓] Android APK generated successfully at $TARGET_APK"
    ls -lh "$TARGET_APK"
else
    echo "[!] Built APK not found at $BUILT_APK"
    exit 1
fi
