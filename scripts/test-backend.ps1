# Test Backend Only
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Testing Backend (Root Project)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$env:NODE_ENV = "test"

# Run Jest with explicit configuration
npx jest --config package.json --runInBand --forceExit --maxWorkers=1 --testTimeout=10000

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Backend tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Backend tests failed!" -ForegroundColor Red
}

exit $LASTEXITCODE
