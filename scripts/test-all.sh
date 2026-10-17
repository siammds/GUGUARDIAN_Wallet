#!/usr/bin/env bash
echo "================================================"
echo "  Running All Automated Test Suites             "
echo "================================================"

mkdir -p evidence/test-results

# 1. Backend Pytest
echo ""
echo "[1/2] Running Backend Policy & API Tests (pytest)..."
export PYTHONPATH="services/api"
./services/api/venv/bin/pytest -v services/api/tests/ | tee evidence/test-results/backend-pytest.txt

# 2. Frontend Vitest
echo ""
echo "[2/2] Running Frontend Vitest Tests..."
cd apps/web
npm run test | tee ../../evidence/test-results/frontend-vitest.txt
cd ../..

echo ""
echo "================================================"
echo "  Test Suites Completed                         "
echo "  Evidence saved to evidence/test-results/      "
echo "================================================"
