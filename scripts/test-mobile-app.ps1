# Test Mobile App Only
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Testing Mobile App" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Set-Location mobile-app

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies first..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

$env:NODE_ENV = "test"

# Run Jest with explicit configuration
npx jest --runInBand --forceExit --maxWorkers=1 --testTimeout=10000

$exitCode = $LASTEXITCODE

Set-Location ..

if ($exitCode -eq 0) {
    Write-Host "`n✓ Mobile App tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Mobile App tests failed!" -ForegroundColor Red
}

exit $exitCode
