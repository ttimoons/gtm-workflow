#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

info()  { echo -e "${GREEN}✓ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $1${NC}"; }
fail()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo "=========================================="
echo "  GTM Workflow — Full Stack Setup"
echo "=========================================="
echo ""

# ------------------------------------------------------------------
# 1. Check prerequisites
# ------------------------------------------------------------------
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
  fail "Node.js is not installed. Install it from https://nodejs.org (v18+ required)"
fi
NODE_VERSION=$(node -v)
info "Node.js ${NODE_VERSION}"

if ! command -v npm &> /dev/null; then
  fail "npm is not installed. It should come with Node.js"
fi
info "npm $(npm -v)"

if ! command -v python3 &> /dev/null; then
  fail "Python 3 is not installed. Install it from https://python.org (v3.9+ required)"
fi
PYTHON_VERSION=$(python3 --version)
info "${PYTHON_VERSION}"

if ! command -v pip3 &> /dev/null; then
  if python3 -m pip --version &> /dev/null; then
    PIP_CMD="python3 -m pip"
    info "pip (via python3 -m pip)"
  else
    fail "pip3 is not installed. Install it with: python3 -m ensurepip --upgrade"
  fi
else
  PIP_CMD="pip3"
  info "pip3 $(pip3 --version | awk '{print $2}')"
fi

echo ""

# ------------------------------------------------------------------
# 2. Install frontend dependencies
# ------------------------------------------------------------------
echo "Installing frontend dependencies..."
cd "$PROJECT_DIR"
npm install
info "Frontend dependencies installed"
echo ""

# ------------------------------------------------------------------
# 3. Install backend Python dependencies
# ------------------------------------------------------------------
echo "Installing backend Python dependencies..."
cd "$PROJECT_DIR/backend"
$PIP_CMD install -r requirements.txt
info "Backend Python packages installed (Flask, flask-cors, Playwright)"
echo ""

# ------------------------------------------------------------------
# 4. Install Playwright Chromium browser
# ------------------------------------------------------------------
echo "Installing Playwright Chromium browser (this may take a minute)..."
python3 -m playwright install chromium
info "Chromium browser installed for Playwright"
echo ""

# ------------------------------------------------------------------
# Done
# ------------------------------------------------------------------
echo "=========================================="
echo -e "${GREEN}  Setup complete!${NC}"
echo "=========================================="
echo ""
echo "To start the app:"
echo ""
echo "  ./start-dev.sh        # Start both frontend + backend"
echo ""
echo "Or start them separately:"
echo ""
echo "  npm run dev                          # Frontend (Vite)"
echo "  cd backend && python3 app.py         # Backend (Flask + Playwright)"
echo ""
