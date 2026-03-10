#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run all test suites (unit, integration, and E2E tests)

.DESCRIPTION
    This script runs all test suites in sequence:
    1. Unit tests (admin portal components)
    2. Integration tests (backend API)
    3. End-to-end tests (full workflows)

.EXAMPLE
    .\scripts\run-all-tests.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Running All Test Suites" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    unit = $false
    integration = $false
    e2e = $false
}

# ============================================================================
# 1. Unit Tests (Admin Portal)
# ============================================================================

Write-Host "📋 Step 1: Running Unit Tests..." -ForegroundColor Yellow
Write-Host "Testing admin portal components..." -ForegroundColor Gray
Write-Host ""

try {
    Push-Location admin-portal
    
    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install --silent
    
    Write-Host "Running unit tests..." -ForegroundColor Gray
    npm test -- --coverage --watchAll=false
    
    $testResults.unit = $LASTEXITCODE -eq 0
    
    if ($testResults.unit) {
        Write-Host "✅ Unit tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Unit tests failed!" -ForegroundColor Red
    }
    
    Pop-Location
} catch {
    Write-Host "❌ Error running unit tests: $_" -ForegroundColor Red
    $testResults.unit = $false
    Pop-Location
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# 2. Integration Tests (Backend API)
# ============================================================================

Write-Host "📋 Step 2: Running Integration Tests..." -ForegroundColor Yellow
Write-Host "Testing backend API endpoints..." -ForegroundColor Gray
Write-Host ""

# Check if backend is running
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    $backendRunning = $response.StatusCode -eq 200
} catch {
    $backendRunning = $false
}

if (-not $backendRunning) {
    Write-Host "⚠️  Backend server not running. Skipping integration tests." -ForegroundColor Yellow
    Write-Host "Please start backend manually: npx tsx src/local-server/server.ts" -ForegroundColor Gray
    $testResults.integration = $null
} else {
    Write-Host "✅ Backend server already running" -ForegroundColor Green
}

if ($testResults.integration -ne $null) {
    try {
        Push-Location tests
        
        Write-Host "Installing test dependencies..." -ForegroundColor Gray
        npm install --silent 2>&1 | Out-Null
        
        Write-Host "Running integration tests..." -ForegroundColor Gray
        npm test -- --config jest.config.js
        
        $testResults.integration = $LASTEXITCODE -eq 0
        
        if ($testResults.integration) {
            Write-Host "✅ Integration tests passed!" -ForegroundColor Green
        } else {
            Write-Host "❌ Integration tests failed!" -ForegroundColor Red
        }
        
        Pop-Location
    } catch {
        Write-Host "❌ Error running integration tests: $_" -ForegroundColor Red
        $testResults.integration = $false
        Pop-Location
    }
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# 3. End-to-End Tests (Full Workflows)
# ============================================================================

Write-Host "📋 Step 3: Running End-to-End Tests..." -ForegroundColor Yellow
Write-Host "Testing complete user workflows..." -ForegroundColor Gray
Write-Host ""

# Check if services are running
$backendRunning = $false
$adminRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    $backendRunning = $response.StatusCode -eq 200
} catch {
    $backendRunning = $false
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    $adminRunning = $response.StatusCode -eq 200
} catch {
    $adminRunning = $false
}

if (-not $backendRunning -or -not $adminRunning) {
    Write-Host "⚠️  Services not running. E2E tests require:" -ForegroundColor Yellow
    Write-Host "   - Backend server on port 4000" -ForegroundColor Gray
    Write-Host "   - Admin portal on port 5173" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please start services manually:" -ForegroundColor Yellow
    Write-Host "   Terminal 1: npx tsx src/local-server/server.ts" -ForegroundColor Gray
    Write-Host "   Terminal 2: cd admin-portal && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏭️  Skipping E2E tests" -ForegroundColor Yellow
    $testResults.e2e = $null
} else {
    Write-Host "✅ All services running" -ForegroundColor Green
    
    try {
        Push-Location tests
        
        Write-Host "Installing Playwright..." -ForegroundColor Gray
        npx playwright install --with-deps chromium
        
        Write-Host "Running E2E tests..." -ForegroundColor Gray
        npx playwright test --project=chromium
        
        $testResults.e2e = $LASTEXITCODE -eq 0
        
        if ($testResults.e2e) {
            Write-Host "✅ E2E tests passed!" -ForegroundColor Green
        } else {
            Write-Host "❌ E2E tests failed!" -ForegroundColor Red
        }
        
        Pop-Location
    } catch {
        Write-Host "❌ Error running E2E tests: $_" -ForegroundColor Red
        $testResults.e2e = $false
        Pop-Location
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Display results
$allPassed = $true

Write-Host "Unit Tests:        " -NoNewline
if ($testResults.unit) {
    Write-Host "✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "Integration Tests: " -NoNewline
if ($testResults.integration) {
    Write-Host "✅ PASSED" -ForegroundColor Green
} elseif ($null -eq $testResults.integration) {
    Write-Host "⏭️  SKIPPED" -ForegroundColor Yellow
} else {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "E2E Tests:         " -NoNewline
if ($testResults.e2e) {
    Write-Host "✅ PASSED" -ForegroundColor Green
} elseif ($null -eq $testResults.e2e) {
    Write-Host "⏭️  SKIPPED" -ForegroundColor Yellow
} else {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

if ($allPassed) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  • Review test coverage reports" -ForegroundColor Gray
    Write-Host "  • Check for any warnings" -ForegroundColor Gray
    Write-Host "  • Commit your changes" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some tests failed. Please review the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  • Check test logs for error details" -ForegroundColor Gray
    Write-Host "  • Verify all services are running" -ForegroundColor Gray
    Write-Host "  • Review TESTING_GUIDE.md for help" -ForegroundColor Gray
}

Write-Host ""
Write-Host "View detailed reports:" -ForegroundColor Cyan
Write-Host "  • Unit test coverage:  admin-portal/coverage/lcov-report/index.html" -ForegroundColor Gray
Write-Host "  • E2E test report:     npx playwright show-report test-results/e2e-report" -ForegroundColor Gray
Write-Host ""

# Exit with appropriate code
if ($allPassed) {
    exit 0
} else {
    exit 1
}
