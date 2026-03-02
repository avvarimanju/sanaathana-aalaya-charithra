# Test Admin Portal Only
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Testing Admin Portal" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Set-Location admin-portal

$env:NODE_ENV = "test"

# Run Jest with explicit configuration
npx jest --runInBand --forceExit --maxWorkers=1 --testTimeout=10000

$exitCode = $LASTEXITCODE

Set-Location ..

if ($exitCode -eq 0) {
    Write-Host "`n✓ Admin Portal tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Admin Portal tests failed!" -ForegroundColor Red
}

exit $exitCode
