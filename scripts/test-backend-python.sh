#!/bin/bash
# Backend Python Unit Test Runner
# Runs pytest tests for Python Lambda handlers

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
COVERAGE=false
VERBOSE=false
INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --install)
            INSTALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${CYAN}=======================================${NC}"
echo -e "${CYAN}  Backend Python Unit Tests${NC}"
echo -e "${CYAN}=======================================${NC}"
echo ""

# Navigate to backend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../backend"
cd "$BACKEND_DIR"

# Check if Python is installed
echo -e "${YELLOW}Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}  Found: $PYTHON_VERSION${NC}"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}  Found: $PYTHON_VERSION${NC}"
    PYTHON_CMD="python"
else
    echo -e "${RED}  ERROR: Python not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Install dependencies if requested
if [ "$INSTALL" = true ]; then
    echo ""
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    $PYTHON_CMD -m pip install --upgrade pip
    $PYTHON_CMD -m pip install -r tests/requirements.txt
    echo -e "${GREEN}  Dependencies installed${NC}"
fi

# Check if pytest is installed
echo ""
echo -e "${YELLOW}Checking pytest installation...${NC}"
if $PYTHON_CMD -m pytest --version &> /dev/null; then
    PYTEST_VERSION=$($PYTHON_CMD -m pytest --version)
    echo -e "${GREEN}  Found: $PYTEST_VERSION${NC}"
else
    echo -e "${RED}  ERROR: pytest not found. Run with --install flag to install dependencies.${NC}"
    echo -e "${YELLOW}  Or run: $PYTHON_CMD -m pip install -r tests/requirements.txt${NC}"
    exit 1
fi

# Run tests
echo ""
echo -e "${YELLOW}Running tests...${NC}"
echo ""

PYTEST_ARGS=()

if [ "$COVERAGE" = true ]; then
    PYTEST_ARGS+=(--cov=admin/handlers)
    PYTEST_ARGS+=(--cov-report=term-missing)
    PYTEST_ARGS+=(--cov-report=html:htmlcov)
fi

if [ "$VERBOSE" = true ]; then
    PYTEST_ARGS+=(-vv)
else
    PYTEST_ARGS+=(-v)
fi

# Add test directory
PYTEST_ARGS+=(tests/)

# Run pytest
$PYTHON_CMD -m pytest "${PYTEST_ARGS[@]}"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=======================================${NC}"
    echo -e "${GREEN}  ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}=======================================${NC}"
    
    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${CYAN}Coverage report generated in: backend/htmlcov/index.html${NC}"
    fi
else
    echo -e "${RED}=======================================${NC}"
    echo -e "${RED}  SOME TESTS FAILED${NC}"
    echo -e "${RED}=======================================${NC}"
fi

echo ""
exit $EXIT_CODE
