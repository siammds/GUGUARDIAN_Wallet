#!/usr/bin/env bash
echo "================================================"
echo "  Launching Guardian Wallet (Backend & Frontend)"
echo "================================================"

export PYTHONPATH="services/api"

# Start Backend in background
echo "[+] Launching FastAPI backend on http://localhost:8000..."
./services/api/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

trap "kill $BACKEND_PID 2>/dev/null" EXIT

sleep 2

# Start Frontend
echo "[+] Launching Web UI on http://localhost:5173..."
cd apps/web
npm run dev
