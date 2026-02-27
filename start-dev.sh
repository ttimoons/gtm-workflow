#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PID=""

cleanup() {
  if [[ -n "$BACKEND_PID" ]]; then
    echo -e "\n${YELLOW}Shutting down backend (PID $BACKEND_PID)...${NC}"
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo -e "${GREEN}Starting GTM Workflow Development Servers${NC}"
echo "=========================================="

# Preflight: check that dependencies are installed
if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
  echo -e "${RED}Frontend dependencies not installed. Run ./setup.sh first.${NC}"
  exit 1
fi

if ! python3 -c "import flask" 2>/dev/null; then
  echo -e "${YELLOW}Flask not found — starting frontend only (domain scanner disabled).${NC}"
  echo -e "${YELLOW}Run ./setup.sh to install the full stack.${NC}"
  echo ""
  cd "$PROJECT_DIR"
  exec npm run dev
fi

# Start backend
echo -e "${YELLOW}Starting backend server on http://127.0.0.1:5001 ...${NC}"
cd "$PROJECT_DIR/backend"
python3 app.py &
BACKEND_PID=$!

sleep 1
if kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo -e "${GREEN}✓ Backend running (PID $BACKEND_PID)${NC}"
else
  echo -e "${RED}✗ Backend failed to start — check backend/app.py${NC}"
  BACKEND_PID=""
  exit 1
fi

# Start frontend (foreground — Ctrl-C stops everything via trap)
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$PROJECT_DIR"
npm run dev
