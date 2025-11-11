#!/bin/bash

# AI Text Editor - Development Server Startup Script
# This script automatically detects and starts a local web server

PORT=8000
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI Text Editor - Starting Development Server${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use.${NC}"
    echo -e "${YELLOW}   Please stop the existing server or choose a different port.${NC}\n"
    exit 1
fi

# Function to open browser
open_browser() {
    sleep 2
    URL="http://localhost:$PORT"
    echo -e "\n${GREEN}✅ Server is running!${NC}"
    echo -e "${GREEN}📱 Opening browser at: $URL${NC}\n"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"
    
    # Open browser based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$URL"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$URL" 2>/dev/null || echo -e "${YELLOW}Please open $URL in your browser${NC}"
    else
        echo -e "${YELLOW}Please open $URL in your browser${NC}"
    fi
}

# Try different server options in order of preference

# Option 1: Python 3
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Found Python 3${NC}"
    echo -e "  Starting server on port $PORT...\n"
    open_browser &
    python3 -m http.server $PORT
    exit 0
fi

# Option 2: Python 2
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | grep -o 'Python 2')
    if [ ! -z "$PYTHON_VERSION" ]; then
        echo -e "${GREEN}✓ Found Python 2${NC}"
        echo -e "  Starting server on port $PORT...\n"
        open_browser &
        python -m SimpleHTTPServer $PORT
        exit 0
    fi
fi

# Option 3: Node.js with npx http-server
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✓ Found npx (Node.js)${NC}"
    echo -e "  Starting server on port $PORT...\n"
    open_browser &
    npx --yes http-server -p $PORT
    exit 0
fi

# Option 4: Node.js with serve (if installed globally)
if command -v serve &> /dev/null; then
    echo -e "${GREEN}✓ Found serve (Node.js)${NC}"
    echo -e "  Starting server on port $PORT...\n"
    open_browser &
    serve -p $PORT
    exit 0
fi

# Option 5: PHP
if command -v php &> /dev/null; then
    echo -e "${GREEN}✓ Found PHP${NC}"
    echo -e "  Starting server on port $PORT...\n"
    open_browser &
    php -S localhost:$PORT
    exit 0
fi

# No server found
echo -e "${RED}❌ No suitable server found!${NC}\n"
echo -e "${YELLOW}Please install one of the following:${NC}"
echo -e "  1. Python 3:  ${BLUE}brew install python3${NC} (macOS) or ${BLUE}apt install python3${NC} (Linux)"
echo -e "  2. Node.js:   ${BLUE}brew install node${NC} (macOS) or ${BLUE}apt install nodejs npm${NC} (Linux)"
echo -e "  3. PHP:       ${BLUE}brew install php${NC} (macOS) or ${BLUE}apt install php${NC} (Linux)"
echo -e "\n${YELLOW}Or manually start a server:${NC}"
echo -e "  ${BLUE}python3 -m http.server 8000${NC}"
echo -e "  ${BLUE}npx http-server -p 8000${NC}"
echo -e "  ${BLUE}php -S localhost:8000${NC}\n"
exit 1

