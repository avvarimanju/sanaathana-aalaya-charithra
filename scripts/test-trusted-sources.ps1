# Test Trusted Sources Feature
# Comprehensive testing script for the Trusted Sources feature

param(
    [string]$ApiEndpoint = "http://localhost:3000",
    [switch]$SkipBackendTests,
    [switch]$SkipFrontendTests
)

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TRUSTED SOURCES FEATURE - TESTING                                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
    Tests = @()
}

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$Test
    )

    Write-Host "Testing: $Name" -ForegroundColor White
    try {
        $result = & $Test
        Write-Host "  ✓ PASS" -ForegroundColor Green
        $script:testResults.Passed++
        $script:testResults.Tests += @{ Name = $Name; Status = "PASS" }
    }
    catch {
        Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults.Failed++
        $script:testResults.Tests += @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
    }
    Write-Host ""
}

# ============================================================================
# PHASE 1: File Structure Tests
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 1: File Structure Tests" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Test-Feature "Backend types file exists" {
    if (-not (Test-Path "backend/src/types/trustedSource.ts")) {
        throw "File not found"
    }
}

Test-Feature "Trusted sources Lambda exists" {
    if (-not (Test-Path "backend/lambdas/trusted-sources.ts")) {
        throw "File not found"
    }
}

Test-Feature "Temple sources Lambda exists" {
    if (-not (Test-Path "backend/lambdas/temple-sources.ts")) {
        throw "File not found"
    }
}

Test-Feature "Infrastructure stack exists" {
    if (-not (Test-Path "backend/infrastructure/trusted-sources-stack.ts")) {
        throw "File not found"
    }
}

Test-Feature "Admin portal API client exists" {
    if (-not (Test-Path "admin-portal/src/api/trustedSourcesApi.ts")) {
        throw "File not found"
    }
}

Test-Feature "Admin portal page exists" {
    if (-not (Test-Path "admin-portal/src/pages/TrustedSourcesPage.tsx")) {
        throw "File not found"
    }
}

Test-Feature "Admin portal CSS exists" {
    if (-not (Test-Path "admin-portal/src/pages/TrustedSourcesPage.css")) {
        throw "File not found"
    }
}

# ============================================================================
# PHASE 2: Code Quality Tests
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 2: Code Quality Tests" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Test-Feature "TypeScript types are properly defined" {
    $content = Get-Content "backend/src/types/trustedSource.ts" -Raw
    if ($content -notmatch "export interface TrustedSource") {
        throw "TrustedSource interface not found"
    }
    if ($content -notmatch "export interface TempleSourceMapping") {
        throw "TempleSourceMapping interface not found"
    }
    if ($content -notmatch "export type SourceType") {
        throw "SourceType type not found"
    }
}

Test-Feature "Lambda handlers have proper exports" {
    $content = Get-Content "backend/lambdas/trusted-sources.ts" -Raw
    if ($content -notmatch "export const handler") {
        throw "Handler export not found"
    }
}

Test-Feature "API client has all required functions" {
    $content = Get-Content "admin-portal/src/api/trustedSourcesApi.ts" -Raw
    $requiredFunctions = @(
        "listTrustedSources",
        "getTrustedSource",
        "createTrustedSource",
        "updateTrustedSource",
        "deleteTrustedSource",
        "verifyTrustedSource",
        "getTempleSources",
        "addSourceToTemple",
        "removeSourceFromTemple"
    )
    
    foreach ($func in $requiredFunctions) {
        if ($content -notmatch "export async function $func") {
            throw "Function $func not found"
        }
    }
}

Test-Feature "React component imports are correct" {
    $content = Get-Content "admin-portal/src/pages/TrustedSourcesPage.tsx" -Raw
    if ($content -notmatch "import React") {
        throw "React import not found"
    }
    if ($content -notmatch "from '../api/trustedSourcesApi'") {
        throw "API import not found"
    }
}

# ============================================================================
# PHASE 3: Integration Tests
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 3: Integration Tests" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Test-Feature "App.tsx has trusted sources route" {
    $content = Get-Content "admin-portal/src/App.tsx" -Raw
    if ($content -notmatch "import TrustedSourcesPage") {
        throw "TrustedSourcesPage import not found"
    }
    if ($content -notmatch "/trusted-sources") {
        throw "Route not found"
    }
}

Test-Feature "Layout.tsx has navigation link" {
    $content = Get-Content "admin-portal/src/components/Layout.tsx" -Raw
    if ($content -notmatch "Trusted Sources") {
        throw "Navigation link not found"
    }
}

Test-Feature "API index exports trusted sources API" {
    $content = Get-Content "admin-portal/src/api/index.ts" -Raw
    if ($content -notmatch "trustedSourcesApi") {
        throw "API export not found"
    }
}

# ============================================================================
# PHASE 4: Backend API Tests (if endpoint available)
# ============================================================================

if (-not $SkipBackendTests) {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "PHASE 4: Backend API Tests" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Note: Backend API tests require deployed infrastructure" -ForegroundColor Cyan
    Write-Host "Skipping API tests (backend not deployed yet)" -ForegroundColor Yellow
    Write-Host ""

    $script:testResults.Skipped += 5
    $script:testResults.Tests += @{ Name = "Backend API Tests"; Status = "SKIPPED"; Reason = "Backend not deployed" }
}

# ============================================================================
# PHASE 5: Documentation Tests
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 5: Documentation Tests" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Test-Feature "Feature documentation exists" {
    if (-not (Test-Path "TRUSTED_SOURCES_FEATURE.md")) {
        throw "Documentation not found"
    }
}

Test-Feature "Implementation status document exists" {
    if (-not (Test-Path "TRUSTED_SOURCES_IMPLEMENTATION_STATUS.md")) {
        throw "Documentation not found"
    }
}

Test-Feature "Quick start guide exists" {
    if (-not (Test-Path "TRUSTED_SOURCES_QUICK_START.txt")) {
        throw "Documentation not found"
    }
}

Test-Feature "Next steps guide exists" {
    if (-not (Test-Path "TRUSTED_SOURCES_NEXT_STEPS.txt")) {
        throw "Documentation not found"
    }
}

# ============================================================================
# TEST RESULTS SUMMARY
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$totalTests = $testResults.Passed + $testResults.Failed + $testResults.Skipped

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "  ✓ Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "  ✗ Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host "  ⊘ Skipped: $($testResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    foreach ($test in $testResults.Tests) {
        if ($test.Status -eq "FAIL") {
            Write-Host "  • $($test.Name): $($test.Error)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

$passRate = if ($totalTests -gt 0) { [math]::Round(($testResults.Passed / $totalTests) * 100, 2) } else { 0 }
$passRateColor = if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" }
Write-Host "Pass Rate: $passRate%" -ForegroundColor $passRateColor
Write-Host ""

# ============================================================================
# MANUAL TESTING CHECKLIST
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "MANUAL TESTING CHECKLIST" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Frontend Testing (Admin Portal):" -ForegroundColor Cyan
Write-Host "  [ ] Navigate to /trusted-sources" -ForegroundColor White
Write-Host "  [ ] Page loads without errors" -ForegroundColor White
Write-Host "  [ ] Search functionality works" -ForegroundColor White
Write-Host "  [ ] Filter by source type works" -ForegroundColor White
Write-Host "  [ ] Filter by verification status works" -ForegroundColor White
Write-Host "  [ ] Add new source button visible" -ForegroundColor White
Write-Host "  [ ] Source cards display correctly" -ForegroundColor White
Write-Host "  [ ] Responsive design works on mobile" -ForegroundColor White
Write-Host ""

Write-Host "Backend Testing (Once Deployed):" -ForegroundColor Cyan
Write-Host "  [ ] Create trusted source via API" -ForegroundColor White
Write-Host "  [ ] List sources with pagination" -ForegroundColor White
Write-Host "  [ ] Update source details" -ForegroundColor White
Write-Host "  [ ] Verify source" -ForegroundColor White
Write-Host "  [ ] Delete source" -ForegroundColor White
Write-Host "  [ ] Add source to temple" -ForegroundColor White
Write-Host "  [ ] Get sources for temple" -ForegroundColor White
Write-Host "  [ ] Remove source from temple" -ForegroundColor White
Write-Host ""

Write-Host "Integration Testing:" -ForegroundColor Cyan
Write-Host "  [ ] Add source to temple form" -ForegroundColor White
Write-Host "  [ ] Select primary source" -ForegroundColor White
Write-Host "  [ ] Generate content using selected source" -ForegroundColor White
Write-Host "  [ ] Verify source attribution in content" -ForegroundColor White
Write-Host ""

# ============================================================================
# NEXT STEPS
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "✓ All automated tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to proceed with:" -ForegroundColor White
    Write-Host "  1. Deploy backend infrastructure (AWS CDK)" -ForegroundColor Gray
    Write-Host "  2. Start admin portal development server" -ForegroundColor Gray
    Write-Host "  3. Perform manual testing" -ForegroundColor Gray
    Write-Host "  4. Move to Phase 2: Integration" -ForegroundColor Gray
} else {
    Write-Host "⚠ Some tests failed. Please fix issues before deploying." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To deploy and test:" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy-trusted-sources.ps1" -ForegroundColor Yellow
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Return exit code based on test results
if ($testResults.Failed -gt 0) {
    exit 1
} else {
    exit 0
}
