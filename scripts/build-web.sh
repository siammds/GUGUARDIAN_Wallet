#!/usr/bin/env bash
set -e

echo "Building Guardian Wallet Web Application..."

cd apps/web
npm run build
cd ../..

mkdir -p artifacts/web
cp -r apps/web/dist/* artifacts/web/

echo ""
echo "[✓] Web build artifact generated at artifacts/web/"
ls -la artifacts/web
