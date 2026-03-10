# Test Trusted Sources Feature - Simple Version
# Quick validation of file structure and integration

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TRUSTED SOURCES FEATURE - TESTING                                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

# Test file existence
Write-Host "Testing File Structure..." -ForegroundColor Yellow
Write-Host ""

$files = @(
    "backend/src/types/trustedSource.ts",
    "backend/lambdas/trusted-sources.ts",
    "backend/lambdas/temple-sources.ts",
    "backend/infrastructure/trusted-sources-stack.ts",
    "admin-portal/src/api/trustedSourcesApi.ts",
    "admin-portal/src/pages/TrustedSourcesPage.tsx",
    "admin-portal/src/pages/TrustedSourcesPage.css",
    "TRUSTED_SOURCES_FEATURE.md",
    "TRUSTED_SOURCES_IMPLEMENTATION_STATUS.md",
    "TRUSTED_SOURCES_QUICK_START.txt",
    "TRUSTED_SOURCES_NEXT_STEPS.txt"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Testing Integration..." -ForegroundColor Yellow
Write-Host ""

# Test App.tsx integration
$appContent = Get-Content "admin-portal/src/App.tsx" -Raw
if ($appContent -match "TrustedSourcesPage" -and $appContent -match "/trusted-sources") {
    Write-Host "  ✓ App.tsx has trusted sources route" -ForegroundColor Green
    $passed++
}
else {
    Write-Host "  ✗ App.tsx missing trusted sources route" -ForegroundColor Red
    $failed++
}

# Test Layout.tsx integration
$layoutContent = Get-Content "admin-portal/src/components/Layout.tsx" -Raw
if ($layoutContent -match "Trusted Sources") {
    Write-Host "  ✓ Layout.tsx has navigation link" -ForegroundColor Green
    $passed++
}
else {
    Write-Host "  ✗ Layout.tsx missing navigation link" -ForegroundColor Red
    $failed++
}

# Test API index integration
$apiContent = Get-Content "admin-portal/src/api/index.ts" -Raw
if ($apiContent -match "trustedSourcesApi") {
    Write-Host "  ✓ API index exports trusted sources API" -ForegroundColor Green
    $passed++
}
else {
    Write-Host "  ✗ API index missing trusted sources export" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "TEST RESULTS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$total = $passed + $failed
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "  ✓ Passed: $passed" -ForegroundColor Green
Write-Host "  ✗ Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to deploy and test!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Run: .\scripts\deploy-trusted-sources.ps1" -ForegroundColor Gray
    Write-Host "  2. Start admin portal: cd admin-portal ; npm run dev" -ForegroundColor Gray
    Write-Host "  3. Navigate to: http://localhost:5173/trusted-sources" -ForegroundColor Gray
}
else {
    Write-Host "⚠ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please fix the issues above before deploying." -ForegroundColor Yellow
}

Write-Host ""
