#!/bin/bash

# start.sh - Development startup script for eco-ops-manager
# Starts both frontend (Next.js) and backend (Node API) servers

echo "======================================"
echo "  Eco-Ops Manager - Development Mode"
echo "======================================"
echo ""

# Find available ports
find_free_port() {
  local start_port=$1
  local end_port=$2
  for port in $(seq $start_port $end_port); do
    if ! lsof -i:$port > /dev/null 2>&1; then
      echo $port
      return
    fi
  done
  echo ""
}

# Find frontend port (5173-5185)
FRONTEND_PORT=$(find_free_port 5173 5185)
if [ -z "$FRONTEND_PORT" ]; then
  echo "Error: No free port found in range 5173-5185 for frontend"
  exit 1
fi

# Find backend port (3001-3013)
BACKEND_PORT=$(find_free_port 3001 3013)
if [ -z "$BACKEND_PORT" ]; then
  echo "Error: No free port found in range 3001-3013 for backend"
  exit 1
fi

echo "Frontend will run on: http://localhost:$FRONTEND_PORT"
echo "Backend will run on:  http://localhost:$BACKEND_PORT"
echo "Ensure FORM_ENDPOINT, DATABASE_URL, and OPENWEATHER_API_KEY are set in your environment."
echo ""

# Export environment variables
export USE_MOCK_DATA=true
export NEXT_PUBLIC_USE_MOCK_DATA=true
export PORT=$BACKEND_PORT
export NODE_ENV=development
export NEXT_PUBLIC_API_BASE="http://localhost:$BACKEND_PORT"

echo "Mock Mode: ENABLED (UI + API using sandbox data)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Start servers concurrently
echo "Starting servers..."
echo "Press Ctrl+C to stop both servers"
echo ""

# Use npx concurrently if available, otherwise run sequentially
if command -v npx &> /dev/null; then
  npx concurrently \
    --names "FRONTEND,BACKEND" \
    --prefix-colors "cyan,green" \
    "npx next dev -p $FRONTEND_PORT" \
    "node server.js"
else
  echo "Note: Install 'concurrently' for better dev experience"
  echo "Running backend only. Start frontend in another terminal with: npm run dev"
  node server.js
fi
