#!/usr/bin/env pwsh
# Diagnose Trusted Sources Connection Issues

Write-Host ""
Write-Host "Trusted Sources Diagnostics" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:4000"
$adminPortalUrl = "http://localhost:5173"

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend server is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Backend is running!" -ForegroundColor Green
    Write-Host "       Environment: $($health.environment)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[FAIL] Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Open a NEW PowerShell window and run:" -ForegroundColor Yellow
    Write-Host "  cd Sanaathana-Aalaya-Charithra" -ForegroundColor White
    Write-Host "  .\scripts\start-local-backend-simple.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Test 2: Check if trusted sources endpoint is accessible
Write-Host "Test 2: Checking trusted sources endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/admin/trusted-sources" -ErrorAction Stop
    Write-Host "[PASS] Trusted sources endpoint is working!" -ForegroundColor Green
    Write-Host "       Found $($response.data.total) sources" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[FAIL] Trusted sources endpoint failed!" -ForegroundColor Red
    Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Test 3: List sample sources
Write-Host "Test 3: Listing sample sources..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/admin/trusted-sources" -ErrorAction Stop
    
    Write-Host "[PASS] Found $($response.data.total) sources:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($source in $response.data.sources) {
        Write-Host "   - $($source.sourceName)" -ForegroundColor Cyan
        Write-Host "     URL: $($source.sourceUrl)" -ForegroundColor Gray
        Write-Host "     Type: $($source.sourceType)" -ForegroundColor Gray
        Write-Host "     Status: $($source.verificationStatus)" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "[FAIL] Failed to list sources!" -ForegroundColor Red
    Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "Diagnostics Complete!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Open your browser to:" -ForegroundColor Yellow
Write-Host "  http://localhost:5173/trusted-sources" -ForegroundColor Cyan
Write-Host ""
