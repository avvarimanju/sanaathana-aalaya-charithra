# Backend Python Unit Test Runner
# Runs pytest tests for Python Lambda handlers

param(
    [switch]$Coverage,
    [switch]$Verbose,
    [switch]$Install
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Backend Python Unit Tests" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
$backendDir = Join-Path (Join-Path $PSScriptRoot "..") "backend"
Push-Location $backendDir

try {
    # Check if Python is installed
    Write-Host "Checking Python installation..." -ForegroundColor Yellow
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "  Found: $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
        exit 1
    }
    
    # Install dependencies if requested
    if ($Install) {
        Write-Host ""
        Write-Host "Installing test dependencies..." -ForegroundColor Yellow
        python -m pip install --upgrade pip
        python -m pip install -r tests/requirements.txt
        Write-Host "  Dependencies installed" -ForegroundColor Green
    }
    
    # Check if pytest is installed
    Write-Host ""
    Write-Host "Checking pytest installation..." -ForegroundColor Yellow
    try {
        $pytestVersion = pytest --version 2>&1
        Write-Host "  Found: $pytestVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: pytest not found. Run with -Install flag to install dependencies." -ForegroundColor Red
        Write-Host "  Or run: python -m pip install -r tests/requirements.txt" -ForegroundColor Yellow
        exit 1
    }
    
    # Run tests
    Write-Host ""
    Write-Host "Running tests..." -ForegroundColor Yellow
    Write-Host ""
    
    $pytestArgs = @()
    
    if ($Coverage) {
        $pytestArgs += "--cov=admin/handlers"
        $pytestArgs += "--cov-report=term-missing"
        $pytestArgs += "--cov-report=html:htmlcov"
    }
    
    if ($Verbose) {
        $pytestArgs += "-vv"
    }
    else {
        $pytestArgs += "-v"
    }
    
    # Add test directory
    $pytestArgs += "tests/"
    
    # Run pytest
    python -m pytest @pytestArgs
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "=======================================" -ForegroundColor Green
        Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "=======================================" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host ""
            Write-Host "Coverage report generated in: backend/htmlcov/index.html" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "=======================================" -ForegroundColor Red
        Write-Host "  SOME TESTS FAILED" -ForegroundColor Red
        Write-Host "=======================================" -ForegroundColor Red
    }
    
    Write-Host ""
    exit $exitCode
}
finally {
    Pop-Location
}
