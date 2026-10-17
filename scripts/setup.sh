#!/usr/bin/env bash
set -e

echo "================================================"
echo "  Guardian Wallet — Initializing Environment    "
echo "================================================"

# 1. Check Node.js
if command -v node >/dev/null 2>&1; then
    echo "[✓] Node.js detected: $(node -v)"
else
    echo "[!] Node.js not found. Please install Node.js (v18+)."
    exit 1
fi

# 2. Check Python
if command -v python3 >/dev/null 2>&1; then
    echo "[✓] Python detected: $(python3 --version)"
    PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    echo "[✓] Python detected: $(python --version)"
    PY_CMD="python"
else
    echo "[!] Python not found. Please install Python (3.10+)."
    exit 1
fi

# 3. Environment configuration
if [ ! -f .env ]; then
    echo "[+] Creating .env from .env.example..."
    cp .env.example .env
else
    echo "[✓] Existing .env file preserved."
fi

# 4. Install Frontend Dependencies
echo ""
echo "[+] Installing Web Frontend dependencies..."
cd apps/web
npm install --no-audit --no-fund
cd ../..
echo "[✓] Frontend dependencies installed successfully."

# 5. Setup Python Virtual Environment and Backend Dependencies
echo ""
echo "[+] Setting up Python backend virtual environment..."
if [ ! -d services/api/venv ]; then
    $PY_CMD -m venv services/api/venv
fi
./services/api/venv/bin/python -m pip install --upgrade pip --quiet
./services/api/venv/bin/pip install -r services/api/requirements.txt --quiet
echo "[✓] Backend dependencies installed successfully."

echo ""
echo "================================================"
echo "  Setup Complete! Guardian Wallet is ready.     "
echo "  Run: ./scripts/run-all.sh or ./scripts/run-web.sh"
echo "================================================"
