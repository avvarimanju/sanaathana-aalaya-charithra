Write-Host "=== Bug Fix Verification - Automated Checks ===" -ForegroundColor Cyan
Write-Host ""

# Check 1: Startup script exists
Write-Host "[1/5] Checking startup script..." -ForegroundColor Yellow
$scriptExists = Test-Path "scripts\start-dev-environment.ps1"
if ($scriptExists) {
    Write-Host "  PASS: Startup script exists" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Startup script not found" -ForegroundColor Red
}

# Check 2: QUICK_START.md updated
Write-Host "[2/5] Checking documentation..." -ForegroundColor Yellow
$docExists = Test-Path "QUICK_START.md"
if ($docExists) {
    $content = Get-Content "QUICK_START.md" -Raw
    $hasStartupScript = $content -match "start-dev-environment.ps1"
    if ($hasStartupScript) {
        Write-Host "  PASS: Documentation updated" -ForegroundColor Green
    } else {
        Write-Host "  PARTIAL: Documentation exists" -ForegroundColor Yellow
    }
} else {
    Write-Host "  FAIL: Documentation not found" -ForegroundColor Red
}

# Check 3: Docker running
Write-Host "[3/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS: Docker is running" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: Docker not running" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL: Docker not accessible" -ForegroundColor Red
}

# Check 4: Script structure
Write-Host "[4/5] Checking script structure..." -ForegroundColor Yellow
if ($scriptExists) {
    $scriptContent = Get-Content "scripts\start-dev-environment.ps1" -Raw
    $hasHealthCheck = $scriptContent -match "http://localhost:4000/health"
    if ($hasHealthCheck) {
        Write-Host "  PASS: Script has health check" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: Script missing health check" -ForegroundColor Red
    }
}

# Check 5: API client
Write-Host "[5/5] Checking API client..." -ForegroundColor Yellow
$clientExists = Test-Path "admin-portal\src\api\client.ts"
if ($clientExists) {
    Write-Host "  PASS: API client exists" -ForegroundColor Green
} else {
    Write-Host "  SKIP: API client location unknown" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Automated checks completed. Manual verification required:" -ForegroundColor Yellow
Write-Host "  1. Run: .\scripts\start-dev-environment.ps1" -ForegroundColor White
Write-Host "  2. Open: http://localhost:5173" -ForegroundColor White
Write-Host "  3. Verify temples list loads" -ForegroundColor White
Write-Host "  4. Check console for no errors" -ForegroundColor White
Write-Host ""
