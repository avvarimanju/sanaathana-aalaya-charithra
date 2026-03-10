#!/usr/bin/env pwsh
# Test Trusted Sources Local Backend Integration

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   🧪 Testing Trusted Sources Local Backend                ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4000/api"
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host " ✅ PASSED" -ForegroundColor Green
        $script:testsPassed++
        return $response
    }
    catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

# Check if server is running
Write-Host "Checking if local backend is running..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -ErrorAction Stop
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "   Environment: $($health.environment)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "❌ Server is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  .\scripts\start-local-backend-simple.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Running API Tests..." -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test 1: List all sources
$sources = Test-Endpoint -Name "List all trusted sources" -Url "$baseUrl/admin/trusted-sources"

if ($sources) {
    Write-Host "   Found $($sources.data.total) sources" -ForegroundColor Gray
}

# Test 2: Get single source
Test-Endpoint -Name "Get single source (source_001)" -Url "$baseUrl/admin/trusted-sources/source_001"

# Test 3: Filter by type
Test-Endpoint -Name "Filter by type (temple_official)" -Url "$baseUrl/admin/trusted-sources?sourceType=temple_official"

# Test 4: Filter by status
Test-Endpoint -Name "Filter by verification status (verified)" -Url "$baseUrl/admin/trusted-sources?verificationStatus=verified"

# Test 5: Create new source
$newSource = @{
    sourceName = "Test Temple Website"
    sourceUrl = "https://test-temple.org"
    sourceType = "temple_official"
    trustScore = 8
    metadata = @{
        description = "Test temple for automated testing"
    }
}

$created = Test-Endpoint -Name "Create new source" -Url "$baseUrl/admin/trusted-sources" -Method "POST" -Body $newSource

# Test 6: Update source (if created successfully)
if ($created) {
    $sourceId = $created.data.sourceId
    $update = @{
        trustScore = 9
    }
    Test-Endpoint -Name "Update source" -Url "$baseUrl/admin/trusted-sources/$sourceId" -Method "PUT" -Body $update
    
    # Test 7: Verify source
    Test-Endpoint -Name "Verify source" -Url "$baseUrl/admin/trusted-sources/$sourceId/verify" -Method "POST"
    
    # Test 8: Unverify source
    Test-Endpoint -Name "Unverify source" -Url "$baseUrl/admin/trusted-sources/$sourceId/unverify" -Method "POST"
    
    # Test 9: Delete source
    Test-Endpoint -Name "Delete source" -Url "$baseUrl/admin/trusted-sources/$sourceId" -Method "DELETE"
}

# Test 10: Get temple sources (should be empty)
Test-Endpoint -Name "Get temple sources" -Url "$baseUrl/admin/temples/TEST_TEMPLE_ID/sources"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Integration is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Open http://localhost:5173/trusted-sources in your browser" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}
else {
    Write-Host "⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
