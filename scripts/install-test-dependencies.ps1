# Install Test Dependencies for Admin Portal and Mobile App

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Installing Test Dependencies" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Admin Portal
Write-Host "1. Installing Admin Portal dependencies..." -ForegroundColor Yellow
Write-Host "   Location: admin-portal" -ForegroundColor Gray
Write-Host ""

Push-Location "admin-portal"
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Admin Portal dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to install Admin Portal dependencies" -ForegroundColor Red
        $errors++
    }
}
catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    $errors++
}
finally {
    Pop-Location
    Write-Host ""
}

# Mobile App
Write-Host "2. Installing Mobile App dependencies..." -ForegroundColor Yellow
Write-Host "   Location: mobile-app" -ForegroundColor Gray
Write-Host ""

Push-Location "mobile-app"
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Mobile App dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to install Mobile App dependencies" -ForegroundColor Red
        $errors++
    }
}
catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    $errors++
}
finally {
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "INSTALLATION SUMMARY" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0) {
    Write-Host "SUCCESS: All dependencies installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Run Admin Portal tests: cd admin-portal && npm test" -ForegroundColor White
    Write-Host "2. Run Mobile App tests: cd mobile-app && npm test" -ForegroundColor White
    Write-Host "3. Run all tests: .\scripts\run-all-tests.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "FAILED: $errors error(s) occurred" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  cd admin-portal && npm install" -ForegroundColor White
    Write-Host "  cd mobile-app && npm install" -ForegroundColor White
    Write-Host ""
}
