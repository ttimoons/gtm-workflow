#!/bin/bash
# Start both frontend and backend dev servers for GTM Workflow

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/ttimoon/Dev/gtm-workflow"

echo -e "${GREEN}Starting GTM Workflow Development Servers${NC}"
echo "=========================================="

# Check if node is in PATH, if not add nvm node
if ! command -v node &> /dev/null; then
    export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"
fi

# Start backend in background
echo -e "${YELLOW}Starting backend server on port 5001...${NC}"
cd "$PROJECT_DIR/backend"
python3 app.py > /tmp/gtm-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${YELLOW}Starting frontend server on port 5173...${NC}"
cd "$PROJECT_DIR"
npm run dev

# When frontend exits, cleanup backend
echo -e "${YELLOW}Shutting down backend...${NC}"
kill $BACKEND_PID 2>/dev/null
