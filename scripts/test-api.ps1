# Test API Script for AvvarI for Bharat (PowerShell)
# This script tests all API endpoints to verify the backend is working

Write-Host "🧪 Testing AvvarI API Endpoints" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get API URL from CloudFormation stack
Write-Host "📡 Getting API Gateway URL..." -ForegroundColor Yellow
try {
    $API_URL = aws cloudformation describe-stacks `
        --stack-name AvvarIForBharatStack `
        --query 'Stacks[0].Outputs[?OutputKey==``APIGatewayURL``].OutputValue' `
        --output text 2>$null

    if ([string]::IsNullOrEmpty($API_URL)) {
        Write-Host "❌ Could not find API Gateway URL" -ForegroundColor Red
        Write-Host "   Make sure the stack is deployed: npm run deploy" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ API URL: $API_URL" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error getting API URL: $_" -ForegroundColor Red
    exit 1
}

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "${API_URL}health" -Method Get
    if ($healthResponse.status -eq "healthy") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed" -ForegroundColor Red
        Write-Host "   Response: $healthResponse" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: QR Code Scan
Write-Host "2️⃣  Testing QR Scan Endpoint..." -ForegroundColor Cyan
try {
    $qrBody = @{
        qrData = "HM-TEMPLE-001"
    } | ConvertTo-Json

    $qrResponse = Invoke-RestMethod -Uri "${API_URL}qr" -Method Post `
        -ContentType "application/json" -Body $qrBody

    if ($qrResponse.success) {
        Write-Host "✅ QR scan test passed" -ForegroundColor Green
        if ($qrResponse.data.artifact.name) {
            Write-Host "   Artifact: $($qrResponse.data.artifact.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  QR scan test returned error (expected if data not seeded)" -ForegroundColor Yellow
        Write-Host "   Run: npm run seed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  QR scan test failed: $_" -ForegroundColor Yellow
    Write-Host "   Run: npm run seed" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Content Generation
Write-Host "3️⃣  Testing Content Generation Endpoint..." -ForegroundColor Cyan
try {
    $contentBody = @{
        artifactId = "virupaksha-temple"
        siteId = "hampi-ruins-karnataka"
        contentType = "audio_guide"
        language = "en"
    } | ConvertTo-Json

    $contentResponse = Invoke-RestMethod -Uri "${API_URL}content" -Method Post `
        -ContentType "application/json" -Body $contentBody

    if ($contentResponse.success) {
        Write-Host "✅ Content generation test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Content generation test returned error (expected if data not seeded)" -ForegroundColor Yellow
        Write-Host "   Run: npm run seed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Content generation test failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Q&A Endpoint
Write-Host "4️⃣  Testing Q&A Endpoint..." -ForegroundColor Cyan
try {
    $qaBody = @{
        question = "Tell me about Virupaksha Temple"
        language = "en"
        siteId = "hampi-ruins-karnataka"
    } | ConvertTo-Json

    $qaResponse = Invoke-RestMethod -Uri "${API_URL}qa" -Method Post `
        -ContentType "application/json" -Body $qaBody

    if ($qaResponse.success) {
        Write-Host "✅ Q&A test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Q&A test returned error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Q&A test failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Analytics Endpoint
Write-Host "5️⃣  Testing Analytics Endpoint..." -ForegroundColor Cyan
try {
    $analyticsBody = @{
        eventType = "qr_scan"
        siteId = "hampi-ruins-karnataka"
        artifactId = "virupaksha-temple"
        sessionId = "test-session-123"
    } | ConvertTo-Json

    $analyticsResponse = Invoke-RestMethod -Uri "${API_URL}analytics" -Method Post `
        -ContentType "application/json" -Body $analyticsBody

    if ($analyticsResponse.success) {
        Write-Host "✅ Analytics test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Analytics test returned error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Analytics test failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. If tests failed, run: npm run seed" -ForegroundColor White
Write-Host "2. Update mobile app API URL in: mobile-app/src/config/api.ts" -ForegroundColor White
Write-Host "3. Start mobile app: cd mobile-app && npm start" -ForegroundColor White
Write-Host ""
Write-Host "API URL for mobile app:" -ForegroundColor Cyan
Write-Host $API_URL -ForegroundColor Green
