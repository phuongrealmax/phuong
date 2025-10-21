#!/bin/bash

# MonaAI System Check Script
# Verifies all components are properly installed and configured

echo "🔍 MonaAI System Check"
echo "====================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
PASS=0
FAIL=0
WARN=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAIL++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

# Check Node.js
echo "📦 Checking Dependencies..."
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed: $NODE_VERSION"
else
    print_status 1 "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not found"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status 0 "Python installed: $PYTHON_VERSION"
else
    print_status 1 "Python not found"
fi

# Check pip
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version | cut -d' ' -f2)
    print_status 0 "pip installed: $PIP_VERSION"
else
    print_status 1 "pip not found"
fi

echo ""
echo "📁 Checking Project Structure..."
echo ""

# Check directories
[ -d "contracts" ] && print_status 0 "contracts/ directory exists" || print_status 1 "contracts/ directory missing"
[ -d "backend" ] && print_status 0 "backend/ directory exists" || print_status 1 "backend/ directory missing"
[ -d "frontend" ] && print_status 0 "frontend/ directory exists" || print_status 1 "frontend/ directory missing"
[ -d "ai-models" ] && print_status 0 "ai-models/ directory exists" || print_status 1 "ai-models/ directory missing"
[ -d "tests" ] && print_status 0 "tests/ directory exists" || print_status 1 "tests/ directory missing"
[ -d "scripts" ] && print_status 0 "scripts/ directory exists" || print_status 1 "scripts/ directory missing"

echo ""
echo "📄 Checking Configuration Files..."
echo ""

# Check config files
[ -f "package.json" ] && print_status 0 "package.json exists" || print_status 1 "package.json missing"
[ -f "hardhat.config.js" ] && print_status 0 "hardhat.config.js exists" || print_status 1 "hardhat.config.js missing"
[ -f "backend/package.json" ] && print_status 0 "backend/package.json exists" || print_status 1 "backend/package.json missing"
[ -f "frontend/package.json" ] && print_status 0 "frontend/package.json exists" || print_status 1 "frontend/package.json missing"
[ -f "ai-models/requirements.txt" ] && print_status 0 "ai-models/requirements.txt exists" || print_status 1 "ai-models/requirements.txt missing"

# Check environment files
if [ -f "backend/.env" ]; then
    print_status 0 "backend/.env exists"
else
    print_warning "backend/.env not found (create from .env.example)"
fi

echo ""
echo "🔌 Checking Node Modules..."
echo ""

# Check node_modules
if [ -d "node_modules" ]; then
    print_status 0 "Root dependencies installed"
else
    print_warning "Root dependencies not installed (run: npm install)"
fi

if [ -d "backend/node_modules" ]; then
    print_status 0 "Backend dependencies installed"
else
    print_warning "Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    print_status 0 "Frontend dependencies installed"
else
    print_warning "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "📡 Checking Services..."
echo ""

# Check if Hardhat node is running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Hardhat node is running on port 8545"
else
    print_warning "Hardhat node not running (run: npx hardhat node)"
fi

# Check if backend is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Backend API is running on port 3001"
else
    print_warning "Backend API not running (run: cd backend && npm start)"
fi

# Check if frontend is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status 0 "Frontend is running on port 3000"
else
    print_warning "Frontend not running (run: cd frontend && npm start)"
fi

echo ""
echo "🔐 Checking Smart Contracts..."
echo ""

# Check contract files
[ -f "contracts/MonaAI.sol" ] && print_status 0 "MonaAI.sol exists" || print_status 1 "MonaAI.sol missing"
[ -f "contracts/MonaAIMarketplace.sol" ] && print_status 0 "MonaAIMarketplace.sol exists" || print_status 1 "MonaAIMarketplace.sol missing"
[ -f "contracts/MonaToken.sol" ] && print_status 0 "MonaToken.sol exists" || print_status 1 "MonaToken.sol missing"

# Check if contracts are compiled
if [ -d "artifacts" ]; then
    print_status 0 "Contracts compiled (artifacts/ exists)"
else
    print_warning "Contracts not compiled (run: npx hardhat compile)"
fi

echo ""
echo "====================="
echo "📊 Summary"
echo "====================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed! System is ready.${NC}"
    exit 0
elif [ $FAIL -eq 0 ]; then
    echo -e "${YELLOW}⚠️  System is functional but has warnings.${NC}"
    exit 0
else
    echo -e "${RED}❌ System has errors that need to be fixed.${NC}"
    exit 1
fi
