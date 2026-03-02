# Verification script for Admin Portal rename

Write-Host "Verifying Admin Portal Rename..." -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Check 1: Folder exists
Write-Host "1. Checking folder structure..." -ForegroundColor Yellow
if (Test-Path "admin-portal") {
    Write-Host "   OK: admin-portal folder exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR: admin-portal folder NOT found" -ForegroundColor Red
    $errors++
}

if (Test-Path "admin-dashboard") {
    Write-Host "   ERROR: admin-dashboard folder still exists" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   OK: admin-dashboard folder removed" -ForegroundColor Green
}

# Check 2: Package.json updated
Write-Host ""
Write-Host "2. Checking package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "admin-portal/package.json" -Raw
if ($packageJson -match "admin-portal") {
    Write-Host "   OK: package.json updated" -ForegroundColor Green
} else {
    Write-Host "   ERROR: package.json not updated" -ForegroundColor Red
    $errors++
}

# Check 3: Layout component updated
Write-Host ""
Write-Host "3. Checking UI component..." -ForegroundColor Yellow
$layout = Get-Content "admin-portal/src/components/Layout.tsx" -Raw
if ($layout -match "Admin Portal") {
    Write-Host "   OK: Layout shows Admin Portal" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Layout not updated" -ForegroundColor Red
    $errors++
}

# Summary
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "VERIFICATION PASSED" -ForegroundColor Green
} else {
    Write-Host "VERIFICATION FAILED - $errors errors" -ForegroundColor Red
}
Write-Host "=======================================" -ForegroundColor Cyan
