# Unified Test Runner for All Components
# Runs tests for Backend, Admin Portal, and Mobile App

param(
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$totalTests = 0
$passedTests = 0
$failedTests = 0

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Sanaathana Aalaya Charithra" -ForegroundColor Cyan
Write-Host "  Unified Test Runner" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Function to run tests in a directory
function Run-Tests {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Running $Name Tests..." -ForegroundColor Yellow
    Write-Host "Location: $Path" -ForegroundColor Gray
    Write-Host ""
    
    if (-not (Test-Path $Path)) {
        Write-Host "  SKIPPED: Directory not found" -ForegroundColor Yellow
        Write-Host ""
        return $false
    }
    
    Push-Location $Path
    
    try {
        if ($Verbose) {
            Invoke-Expression $Command
        } else {
            Invoke-Expression "$Command 2>&1" | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PASSED" -ForegroundColor Green
            $script:passedTests++
        } else {
            Write-Host "  FAILED (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            $script:failedTests++
        }
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $script:failedTests++
    }
    finally {
        Pop-Location
        Write-Host ""
    }
    
    $script:totalTests++
    return ($LASTEXITCODE -eq 0)
}

# 1. Backend Tests
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "1. BACKEND TESTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if ($Coverage) {
    Run-Tests "Backend" "." "npm run test:coverage"
} elseif ($Watch) {
    Write-Host "Watch mode not supported for unified runner" -ForegroundColor Yellow
    Write-Host "Run 'npm run test:watch' in root directory instead" -ForegroundColor Yellow
    Write-Host ""
} else {
    Run-Tests "Backend" "." "npm test"
}

# 2. Admin Portal Tests
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "2. ADMIN PORTAL TESTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$adminPortalPath = "admin-portal"
if (Test-Path $adminPortalPath) {
    $packageJson = Get-Content "$adminPortalPath/package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.scripts.test) {
        if ($Coverage) {
            Run-Tests "Admin Portal" $adminPortalPath "npm run test:coverage"
        } else {
            Run-Tests "Admin Portal" $adminPortalPath "npm test"
        }
    } else {
        Write-Host "Admin Portal Tests..." -ForegroundColor Yellow
        Write-Host "  SKIPPED: No test command configured" -ForegroundColor Yellow
        Write-Host "  Run: cd admin-portal && npm install --save-dev jest @testing-library/react" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "Admin Portal Tests..." -ForegroundColor Yellow
    Write-Host "  SKIPPED: Directory not found" -ForegroundColor Yellow
    Write-Host ""
}

# 3. Mobile App Tests
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "3. MOBILE APP TESTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$mobileAppPath = "mobile-app"
if (Test-Path $mobileAppPath) {
    $packageJson = Get-Content "$mobileAppPath/package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.scripts.test) {
        if ($Coverage) {
            Run-Tests "Mobile App" $mobileAppPath "npm run test:coverage"
        } else {
            Run-Tests "Mobile App" $mobileAppPath "npm test"
        }
    } else {
        Write-Host "Mobile App Tests..." -ForegroundColor Yellow
        Write-Host "  SKIPPED: No test command configured" -ForegroundColor Yellow
        Write-Host "  Run: cd mobile-app && npm install --save-dev jest @testing-library/react-native" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "Mobile App Tests..." -ForegroundColor Yellow
    Write-Host "  SKIPPED: Directory not found" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Test Suites: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host ""

if ($failedTests -eq 0 -and $passedTests -gt 0) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} elseif ($failedTests -gt 0) {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "NO TESTS RUN" -ForegroundColor Yellow
    exit 0
}
