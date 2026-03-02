LL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
===================================" -ForegroundColor Cyan
Write-Host "Total: $($totalPassed + $totalFailed)" -ForegroundColor White
Write-Host "Passed: $totalPassed" -ForegroundColor Green
Write-Host "Failed: $totalFailed" -ForegroundColor Red
Write-Host ""

foreach ($result in $results) {
    if ($result -like "*PASSED*") {
        Write-Host "✓ $result" -ForegroundColor Green
    } else {
        Write-Host "✗ $result" -ForegroundColor Red
    }
}

Write-Host ""
if ($totalFailed -eq 0) {
    Write-Host "A    Write-Host "Jest not found!" -ForegroundColor Red
    $mobileResult = 1
}
Set-Location ..

if ($mobileResult -eq 0) {
    Write-Host "PASSED" -ForegroundColor Green
    $totalPassed++
    $results += "Mobile App Tests: PASSED"
} else {
    Write-Host "FAILED" -ForegroundColor Red
    $totalFailed++
    $results += "Mobile App Tests: FAILED"
}
Write-Host ""

# TEST SUMMARY
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Running Mobile App Tests..." -ForegroundColor Yellow
Write-Host ""

Set-Location mobile-app
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps 2>&1 | Out-Null
}

$jestPath = "node_modules\.bin\jest.cmd"
if (Test-Path $jestPath) {
    & $jestPath --runInBand --forceExit --maxWorkers=1 --testTimeout=10000 2>&1 | Out-Null
    $mobileResult = $LASTEXITCODE
} else {
-ForegroundColor Red
    $adminResult = 1
}
Set-Location ..

if ($adminResult -eq 0) {
    Write-Host "PASSED" -ForegroundColor Green
    $totalPassed++
    $results += "Admin Portal Tests: PASSED"
} else {
    Write-Host "FAILED" -ForegroundColor Red
    $totalFailed++
    $results += "Admin Portal Tests: FAILED"
}
Write-Host ""

# MOBILE APP TESTS
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "3. MOBILE APP TESTS" -ForegroundColor Cyan
Write-Host "==================estTimeout=10000 2>&1 | Out-Null
    $adminResult = $LASTEXITCODE
} else {
    Write-Host "Jest not found!" sults += "Backend Tests: FAILED"
}
Write-Host ""

# ADMIN PORTAL TESTS
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "2. ADMIN PORTAL TESTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Running Admin Portal Tests..." -ForegroundColor Yellow
Write-Host ""

Set-Location admin-portal
$jestPath = "node_modules\.bin\jest.cmd"
if (Test-Path $jestPath) {
    & $jestPath --runInBand --forceExit --maxWorkers=1 --testPath) {
    & $jestPath --runInBand --forceExit --maxWorkers=1 --testTimeout=10000 2>&1 | Out-Null
    $backendResult = $LASTEXITCODE
} else {
    Write-Host "Jest not found!" -ForegroundColor Red
    $backendResult = 1
}

if ($backendResult -eq 0) {
    Write-Host "PASSED" -ForegroundColor Green
    $totalPassed++
    $results += "Backend Tests: PASSED"
} else {
    Write-Host "FAILED" -ForegroundColor Red
    $totalFailed++
    $ree_modules\.bin\jest.cmd"
if (Test-Path $jnified Test Runner" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$totalPassed = 0
$totalFailed = 0
$results = @()
$env:NODE_ENV = "test"

# BACKEND TESTS
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "1. BACKEND TESTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Running Backend Tests..." -ForegroundColor Yellow
Write-Host ""

$jestPath = "nodndColor Cyan
Write-Host "Sanaathana Aalaya Charithra" -ForegroundColor Cyan
Write-Host "U# Unified Test Runner for All Components
