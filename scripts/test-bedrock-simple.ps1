# Simple Bedrock Test Script
# Tests Claude 3 Haiku model access

Write-Host "Testing AWS Bedrock Access..." -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
Write-Host "1. Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ AWS CLI not found. Install from: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Check AWS credentials
Write-Host ""
Write-Host "2. Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "   ✓ AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "   ✓ User/Role: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

# Test Bedrock model invocation
Write-Host ""
Write-Host "3. Testing Bedrock model access..." -ForegroundColor Yellow
Write-Host "   Model: Claude 3 Haiku" -ForegroundColor Gray
Write-Host "   Region: ap-south-1" -ForegroundColor Gray

# Create request body
$requestBody = @{
    anthropic_version = "bedrock-2023-05-31"
    max_tokens = 100
    messages = @(
        @{
            role = "user"
            content = "Hello, respond with just 'Hi there!'"
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

# Save to temp file (no BOM, UTF8)
$tempFile = Join-Path $env:TEMP "bedrock-test-$(Get-Random).json"
[System.IO.File]::WriteAllText($tempFile, $requestBody, [System.Text.UTF8Encoding]::new($false))

# Invoke model
$outputFile = "bedrock-test-response.json"
try {
    Write-Host "   Invoking model..." -ForegroundColor Gray
    
    $result = aws bedrock-runtime invoke-model `
        --region ap-south-1 `
        --model-id anthropic.claude-3-haiku-20240307-v1:0 `
        --content-type "application/json" `
        --body "file://$tempFile" `
        $outputFile 2>&1
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outputFile)) {
        Write-Host "   ✓ Model invocation successful!" -ForegroundColor Green
        
        # Parse response
        $response = Get-Content $outputFile -Raw | ConvertFrom-Json
        $responseText = $response.content[0].text
        
        Write-Host ""
        Write-Host "Response from Claude:" -ForegroundColor Cyan
        Write-Host "   $responseText" -ForegroundColor White
        
        Write-Host ""
        Write-Host "✓ SUCCESS! Bedrock is working correctly." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  • Run full test: .\scripts\test-bedrock-models.ps1" -ForegroundColor White
        Write-Host "  • Start development: .\scripts\generate-content-locally.ps1" -ForegroundColor White
        
    } else {
        throw "Model invocation failed: $result"
    }
    
} catch {
    Write-Host "   ✗ Model invocation failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Request body was:" -ForegroundColor Gray
    Write-Host $requestBody -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. IAM permissions missing - Need bedrock:InvokeModel" -ForegroundColor White
    Write-Host "  2. Anthropic models require use case submission" -ForegroundColor White
    Write-Host "  3. Account verification pending" -ForegroundColor White
    Write-Host ""
    Write-Host "See BEDROCK_NEW_AUTO_ACCESS.md for troubleshooting" -ForegroundColor Cyan
    
    exit 1
} finally {
    # Cleanup
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}
