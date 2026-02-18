#!/bin/bash

# Start GTM Workflow development environment
# This script starts both the frontend (Vite) and backend (Flask) servers

echo "🚀 Starting GTM Workflow development environment..."
echo ""

# Start backend server in background
echo "📦 Starting Python backend API server on http://127.0.0.1:5001"
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo "⚡ Starting Vite dev server on http://localhost:5173"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run dev

# Cleanup on exit
trap "echo ''; echo '🛑 Shutting down servers...'; kill $BACKEND_PID 2>/dev/null" EXIT
