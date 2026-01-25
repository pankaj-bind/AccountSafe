@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM AccountSafe Test Runner - Windows Version
REM ═══════════════════════════════════════════════════════════════════════════════
REM
REM This script runs ALL tests for both Backend and Frontend.
REM ANY failure will cause the entire build to fail.
REM
REM Usage:
REM   run_tests.bat           - Run all tests
REM   run_tests.bat backend   - Run only backend tests
REM   run_tests.bat frontend  - Run only frontend tests
REM
REM Exit Codes:
REM   0 - All tests passed
REM   1 - Backend tests failed
REM   2 - Frontend tests failed
REM   3 - Both failed
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion

set BACKEND_FAILED=0
set FRONTEND_FAILED=0
set RUN_BACKEND=1
set RUN_FRONTEND=1

REM Parse arguments
if "%1"=="backend" (
    set RUN_FRONTEND=0
)
if "%1"=="frontend" (
    set RUN_BACKEND=0
)

REM Get script directory
set SCRIPT_DIR=%~dp0

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                               ║
echo ║   AccountSafe Test Suite - "No Mercy" Mode                                    ║
echo ║   Zero bugs tolerated. Every test must pass.                                  ║
echo ║                                                                               ║
echo ╚═══════════════════════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════════════════════
REM BACKEND TESTS
REM ═══════════════════════════════════════════════════════════════════════════════

if %RUN_BACKEND%==1 (
    echo.
    echo ┌─────────────────────────────────────────────────────────────────────────────┐
    echo │  BACKEND TESTS ^(Django + Pytest^)                                            │
    echo └─────────────────────────────────────────────────────────────────────────────┘
    echo.

    cd /d "%SCRIPT_DIR%backend"

    echo Installing test dependencies...
    pip install pytest pytest-django factory-boy pytest-cov -q 2>nul

    echo Running backend tests...
    echo.

    pytest -v
    if errorlevel 1 (
        echo.
        echo [FAILED] Backend tests FAILED
        set BACKEND_FAILED=1
    ) else (
        echo.
        echo [PASSED] Backend tests PASSED
    )

    cd /d "%SCRIPT_DIR%"
)

REM ═══════════════════════════════════════════════════════════════════════════════
REM FRONTEND TESTS
REM ═══════════════════════════════════════════════════════════════════════════════

if %RUN_FRONTEND%==1 (
    echo.
    echo ┌─────────────────────────────────────────────────────────────────────────────┐
    echo │  FRONTEND TESTS ^(React + Jest^)                                              │
    echo └─────────────────────────────────────────────────────────────────────────────┘
    echo.

    cd /d "%SCRIPT_DIR%frontend"

    if not exist "node_modules" (
        echo Installing frontend dependencies...
        call npm install
    )

    echo Running frontend tests...
    echo.

    set CI=true
    call npm test -- --watchAll=false --passWithNoTests
    if errorlevel 1 (
        echo.
        echo [FAILED] Frontend tests FAILED
        set FRONTEND_FAILED=1
    ) else (
        echo.
        echo [PASSED] Frontend tests PASSED
    )

    cd /d "%SCRIPT_DIR%"
)

REM ═══════════════════════════════════════════════════════════════════════════════
REM FINAL SUMMARY
REM ═══════════════════════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════╗
echo ║  TEST SUMMARY                                                                 ║
echo ╚═══════════════════════════════════════════════════════════════════════════════╝
echo.

if %RUN_BACKEND%==1 (
    if %BACKEND_FAILED%==0 (
        echo   [PASS] Backend:  PASSED
    ) else (
        echo   [FAIL] Backend:  FAILED
    )
)

if %RUN_FRONTEND%==1 (
    if %FRONTEND_FAILED%==0 (
        echo   [PASS] Frontend: PASSED
    ) else (
        echo   [FAIL] Frontend: FAILED
    )
)

echo.

REM Calculate exit code
set /a EXIT_CODE=0
if %BACKEND_FAILED%==1 set /a EXIT_CODE+=1
if %FRONTEND_FAILED%==1 set /a EXIT_CODE+=2

if %EXIT_CODE%==0 (
    echo ══════════════════════════════════════════════════════════════════════════════
    echo   ALL TESTS PASSED - Build is safe to deploy!
    echo ══════════════════════════════════════════════════════════════════════════════
) else (
    echo ══════════════════════════════════════════════════════════════════════════════
    echo   TESTS FAILED - DO NOT DEPLOY! Fix the failures above.
    echo ══════════════════════════════════════════════════════════════════════════════
)

echo.

exit /b %EXIT_CODE%
