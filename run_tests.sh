#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AccountSafe Test Runner - "No Mercy" Mode
# ═══════════════════════════════════════════════════════════════════════════════
#
# This script runs ALL tests for both Backend and Frontend.
# ANY failure will cause the entire build to fail.
#
# Usage:
#   ./run_tests.sh           # Run all tests
#   ./run_tests.sh backend   # Run only backend tests
#   ./run_tests.sh frontend  # Run only frontend tests
#   ./run_tests.sh --coverage # Run with coverage reports
#
# Exit Codes:
#   0 - All tests passed
#   1 - Backend tests failed
#   2 - Frontend tests failed
#   3 - Both failed
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
BACKEND_FAILED=0
FRONTEND_FAILED=0

# Parse arguments
RUN_BACKEND=1
RUN_FRONTEND=1
COVERAGE_MODE=0

for arg in "$@"; do
    case $arg in
        backend)
            RUN_FRONTEND=0
            ;;
        frontend)
            RUN_BACKEND=0
            ;;
        --coverage)
            COVERAGE_MODE=1
            ;;
    esac
done

# ═══════════════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                               ║${NC}"
echo -e "${BLUE}║   ${YELLOW}AccountSafe Test Suite - \"No Mercy\" Mode${BLUE}                                  ║${NC}"
echo -e "${BLUE}║   ${NC}Zero bugs tolerated. Every test must pass.${BLUE}                                ║${NC}"
echo -e "${BLUE}║                                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory (project root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ═══════════════════════════════════════════════════════════════════════════════
# BACKEND TESTS (Django + Pytest)
# ═══════════════════════════════════════════════════════════════════════════════

if [ $RUN_BACKEND -eq 1 ]; then
    echo ""
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│  BACKEND TESTS (Django + Pytest)                                            │${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    cd "$SCRIPT_DIR/backend"

    # Check if virtual environment exists
    if [ -d "venv" ]; then
        source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
    fi

    # Install test dependencies if needed
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    pip install pytest pytest-django factory-boy pytest-cov -q 2>/dev/null || true

    # Run tests
    echo -e "${YELLOW}Running backend tests...${NC}"
    echo ""

    if [ $COVERAGE_MODE -eq 1 ]; then
        if pytest --cov=api --cov-report=term-missing --cov-report=html -v; then
            echo ""
            echo -e "${GREEN}✓ Backend tests PASSED${NC}"
        else
            echo ""
            echo -e "${RED}✗ Backend tests FAILED${NC}"
            BACKEND_FAILED=1
        fi
    else
        if pytest -v; then
            echo ""
            echo -e "${GREEN}✓ Backend tests PASSED${NC}"
        else
            echo ""
            echo -e "${RED}✗ Backend tests FAILED${NC}"
            BACKEND_FAILED=1
        fi
    fi

    cd "$SCRIPT_DIR"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FRONTEND TESTS (React + Jest)
# ═══════════════════════════════════════════════════════════════════════════════

if [ $RUN_FRONTEND -eq 1 ]; then
    echo ""
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│  FRONTEND TESTS (React + Jest)                                              │${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    cd "$SCRIPT_DIR/frontend"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi

    # Run tests
    echo -e "${YELLOW}Running frontend tests...${NC}"
    echo ""

    if [ $COVERAGE_MODE -eq 1 ]; then
        if CI=true npm test -- --coverage --watchAll=false --passWithNoTests; then
            echo ""
            echo -e "${GREEN}✓ Frontend tests PASSED${NC}"
        else
            echo ""
            echo -e "${RED}✗ Frontend tests FAILED${NC}"
            FRONTEND_FAILED=1
        fi
    else
        if CI=true npm test -- --watchAll=false --passWithNoTests; then
            echo ""
            echo -e "${GREEN}✓ Frontend tests PASSED${NC}"
        else
            echo ""
            echo -e "${RED}✗ Frontend tests FAILED${NC}"
            FRONTEND_FAILED=1
        fi
    fi

    cd "$SCRIPT_DIR"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TEST SUMMARY                                                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $RUN_BACKEND -eq 1 ]; then
    if [ $BACKEND_FAILED -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Backend:  ${GREEN}PASSED${NC}"
    else
        echo -e "  ${RED}✗${NC} Backend:  ${RED}FAILED${NC}"
    fi
fi

if [ $RUN_FRONTEND -eq 1 ]; then
    if [ $FRONTEND_FAILED -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Frontend: ${GREEN}PASSED${NC}"
    else
        echo -e "  ${RED}✗${NC} Frontend: ${RED}FAILED${NC}"
    fi
fi

echo ""

# Calculate exit code
EXIT_CODE=0
if [ $BACKEND_FAILED -eq 1 ]; then
    EXIT_CODE=$((EXIT_CODE + 1))
fi
if [ $FRONTEND_FAILED -eq 1 ]; then
    EXIT_CODE=$((EXIT_CODE + 2))
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ALL TESTS PASSED - Build is safe to deploy! 🚀${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  TESTS FAILED - DO NOT DEPLOY! Fix the failures above.${NC}"
    echo -e "${RED}══════════════════════════════════════════════════════════════════════════════${NC}"
fi

echo ""

exit $EXIT_CODE
