# Test All New Scripts Created in This Session
# This script tests all the scripts created for temple data collection

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "              TESTING ALL NEW SCRIPTS                                           " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# Test 1: validate-temple-links.ps1
Write-Host "TEST 1: validate-temple-links.ps1" -ForegroundColor Yellow
Write-Host "Testing link validation script..." -ForegroundColor White
try {
    $result = & ".\scripts\validate-temple-links.ps1" -FilePath "TEMPLE_NAMING_STANDARDS.md" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] Link validation script works" -ForegroundColor Green
        $testResults += @{ Test = "validate-temple-links.ps1"; Status = "PASS" }
    } else {
        Write-Host "  [FAIL] Link validation script failed" -ForegroundColor Red
        $testResults += @{ Test = "validate-temple-links.ps1"; Status = "FAIL" }
    }
} catch {
    Write-Host "  [FAIL] Error running link validation script: $_" -ForegroundColor Red
    $testResults += @{ Test = "validate-temple-links.ps1"; Status = "FAIL" }
}
Write-Host ""

# Test 2: fetch-1000-temples-simple.ps1 (small test)
Write-Host "TEST 2: fetch-1000-temples-simple.ps1" -ForegroundColor Yellow
Write-Host "Testing Wikidata fetch script with 5 temples..." -ForegroundColor White
try {
    $result = & ".\scripts\fetch-1000-temples-simple.ps1" -Count 5 -OutputFile "data/test-temples.json" 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path "data/test-temples.json")) {
        Write-Host "  [PASS] Wikidata fetch script works" -ForegroundColor Green
        $testResults += @{ Test = "fetch-1000-temples-simple.ps1"; Status = "PASS" }
        # Clean up test file
        Remove-Item "data/test-temples.json" -ErrorAction SilentlyContinue
    } else {
        Write-Host "  [FAIL] Wikidata fetch script failed" -ForegroundColor Red
        $testResults += @{ Test = "fetch-1000-temples-simple.ps1"; Status = "FAIL" }
    }
} catch {
    Write-Host "  [FAIL] Error running Wikidata fetch script: $_" -ForegroundColor Red
    $testResults += @{ Test = "fetch-1000-temples-simple.ps1"; Status = "FAIL" }
}
Write-Host ""

# Test 3: Check if documentation files exist
Write-Host "TEST 3: Documentation Files" -ForegroundColor Yellow
Write-Host "Checking if all documentation files were created..." -ForegroundColor White

$docFiles = @(
    "VERIFIED_TEMPLE_RESOURCES.md",
    "TEMPLE_NAMING_STANDARDS.md",
    "TEMPLE_DATA_CORRECTION_GUIDE.md",
    "BEST_TEMPLE_DATA_SOURCES.md",
    "FETCH_1000_TEMPLES_QUICK_START.txt",
    "TEMPLE_DATA_SOURCES_SUMMARY.txt",
    "LINK_AND_NAME_FIXES_COMPLETE.md",
    "START_HERE_TEMPLE_DATA_QUALITY.txt",
    "SCRIPT_FIXED_RUN_THIS.txt"
)

$allDocsExist = $true
foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file exists" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $allDocsExist = $false
    }
}

if ($allDocsExist) {
    Write-Host "  [PASS] All documentation files exist" -ForegroundColor Green
    $testResults += @{ Test = "Documentation Files"; Status = "PASS" }
} else {
    Write-Host "  [FAIL] Some documentation files missing" -ForegroundColor Red
    $testResults += @{ Test = "Documentation Files"; Status = "FAIL" }
}
Write-Host ""

# Test 4: Check if sample corrected data exists
Write-Host "TEST 4: Sample Corrected Data" -ForegroundColor Yellow
Write-Host "Checking if sample corrected temple data exists..." -ForegroundColor White
if (Test-Path "data/temples-sample-corrected.json") {
    Write-Host "  [PASS] Sample corrected data exists" -ForegroundColor Green
    $testResults += @{ Test = "Sample Corrected Data"; Status = "PASS" }
} else {
    Write-Host "  [FAIL] Sample corrected data missing" -ForegroundColor Red
    $testResults += @{ Test = "Sample Corrected Data"; Status = "FAIL" }
}
Write-Host ""

# Test 5: Validate all links in key documents
Write-Host "TEST 5: Link Validation in All Documents" -ForegroundColor Yellow
Write-Host "Running comprehensive link validation..." -ForegroundColor White
try {
    $result = & ".\scripts\validate-temple-links.ps1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] All links validated successfully" -ForegroundColor Green
        $testResults += @{ Test = "Comprehensive Link Validation"; Status = "PASS" }
    } else {
        Write-Host "  [FAIL] Some links failed validation" -ForegroundColor Red
        $testResults += @{ Test = "Comprehensive Link Validation"; Status = "FAIL" }
    }
} catch {
    Write-Host "  [FAIL] Error during link validation: $_" -ForegroundColor Red
    $testResults += @{ Test = "Comprehensive Link Validation"; Status = "FAIL" }
}
Write-Host ""

# Summary
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

Write-Host "Detailed Results:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    $symbol = if ($result.Status -eq "PASS") { "[PASS]" } else { "[FAIL]" }
    Write-Host "  $symbol $($result.Test): $($result.Status)" -ForegroundColor $color
}
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All scripts are working correctly. You can now:" -ForegroundColor White
    Write-Host "  1. Run: .\scripts\fetch-1000-temples-simple.ps1" -ForegroundColor Cyan
    Write-Host "  2. This will fetch 1,000 temples from Wikidata" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failed tests above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
