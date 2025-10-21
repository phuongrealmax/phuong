#!/bin/bash

# MonaAI Development Startup Script

echo "🚀 Starting MonaAI Development Environment..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Starting services..."
echo ""
echo "Terminal windows:"
echo "  1. Hardhat Local Blockchain (port 8545)"
echo "  2. Backend API (port 3001)"
echo "  3. Frontend React App (port 3000)"
echo ""
echo "To start each service manually:"
echo ""
echo "Terminal 1 - Blockchain:"
echo "  npx hardhat node"
echo ""
echo "Terminal 2 - Deploy Contract:"
echo "  npx hardhat run scripts/deploy.js --network localhost"
echo ""
echo "Terminal 3 - Backend:"
echo "  cd backend && npm start"
echo ""
echo "Terminal 4 - Frontend:"
echo "  cd frontend && npm start"
echo ""
echo "📚 Read QUICKSTART.md for detailed instructions"
echo ""
