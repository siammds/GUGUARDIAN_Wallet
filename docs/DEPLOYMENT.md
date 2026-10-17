# Guardian Wallet — Deployment & Operations Guide

## 1. System Requirements

- Node.js: v18.0.0 or later (v25 tested)
- Python: 3.10 or later (3.13 tested)
- Android SDK: API Level 34+ (for Android builds)
- Java: OpenJDK 17 or 21 (for Gradle APK assembly)
- Operating Systems: Windows 10/11, macOS, Linux

---

## 2. One-Command Setup

Run the automated environment setup script from the monorepo root:

### Windows PowerShell:
```powershell
./scripts/setup.ps1
```

### Linux / macOS:
```bash
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

This automatically:
1. Validates Node.js and Python runtimes.
2. Creates `.env` from `.env.example`.
3. Installs all npm dependencies in `apps/web`.
4. Creates a Python virtual environment in `services/api/venv` and installs all backend dependencies.

---

## 3. Running Guardian Wallet Locally

### Option A: Launch Full Monorepo (Backend + Frontend)
```powershell
# Windows PowerShell
./scripts/run-all.ps1

# Linux / macOS
./scripts/run-all.sh
```
- Backend API runs at: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`
- Web Application UI: `http://localhost:5173`

### Option B: Run Web Frontend Only (Standalone Demo Mode)
Guardian Wallet features a 100% self-contained offline Demo Mode that does not require an active backend server:
```powershell
./scripts/run-web.ps1
```

---

## 4. Serving the Production Web Build

The production build is pre-compiled into `artifacts/web/`:
```bash
# Serve static artifacts using any HTTP server
npx serve artifacts/web -p 3000
```
Open `http://localhost:3000` in any browser.

---

## 5. Android APK Installation & Verification

The compiled Android debug APK is generated at:
```
artifacts/android/GuardianWallet-debug.apk
```

### Installing on an Android Device or Emulator via ADB:
```bash
# Check connected device
adb devices

# Install APK
adb install -r artifacts/android/GuardianWallet-debug.apk

# Launch the app
adb shell monkey -p com.guardianwallet.app -c android.intent.category.LAUNCHER 1
```

### Manual Installation:
1. Transfer `artifacts/android/GuardianWallet-debug.apk` to an Android phone via USB or Google Drive.
2. Tap the file in the device's Files app.
3. Allow "Install unknown apps" if prompted.
4. Launch Guardian Wallet.

---

## 6. Testnet Configuration & Smart Contracts

- Network: Ethereum Sepolia Testnet
- Chain ID: `11155111`
- Public RPC: `https://rpc.sepolia.org`
- Explorer: `https://sepolia.etherscan.io`
- Contract Source: `contracts/src/GuardianPolicyGuard.sol`
- Mock Token: `contracts/src/MockERC20.sol` (Simulated USDC)
