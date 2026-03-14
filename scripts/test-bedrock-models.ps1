# Test Bedrock Models - Compare Haiku vs Sonnet
# This script shows how content generation differs between staging and production models

param(
    [switch]$HaikuOnly,
    [switch]$SonnetOnly,
    [string]$Prompt = "Generate a detailed description for the Lepakshi Temple's famous Hanging Pillar. Include historical significance, architectural marvel, and the legend behind it. Keep it engaging for tourists. Maximum 200 words."
)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                    BEDROCK MODEL COMPARISON TEST                               " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Import global configuration
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig

# Configuration
$REGION = $config.AWS_REGION
$HAIKU_MODEL = "anthropic.claude-3-5-haiku-20241022-v1:0"  # Using newer ACTIVE model
$SONNET_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"

# Check AWS CLI
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
$awsVersion = aws --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI not found!" -ForegroundColor Red
    Write-Host "Please install AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: AWS CLI installed" -ForegroundColor Green
Write-Host ""

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS credentials not configured!" -ForegroundColor Red
    Write-Host "Please run: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: AWS credentials configured" -ForegroundColor Green
Write-Host ""

# Function to test a model
function Test-BedrockModel {
    param(
        [string]$ModelId,
        [string]$ModelName,
        [string]$Prompt
    )

    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "Testing: $ModelName" -ForegroundColor Cyan
    Write-Host "Model ID: $ModelId" -ForegroundColor Gray
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""

    # Create request body
    $requestBody = @{
        anthropic_version = "bedrock-2023-05-31"
        max_tokens = 2048
        temperature = 0.7
        messages = @(
            @{
                role = "user"
                content = $Prompt
            }
        )
    } | ConvertTo-Json -Depth 10

    # Save to temp file (UTF8 without BOM)
    $tempFile = [System.IO.Path]::GetTempFileName()
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tempFile, $requestBody, $utf8NoBom)

    # Invoke model
    Write-Host "Invoking model..." -ForegroundColor Yellow
    $startTime = Get-Date

    try {
        $response = aws bedrock-runtime invoke-model `
            --model-id $ModelId `
            --region $REGION `
            --body "fileb://$tempFile" `
            response.json 2>&1

        $endTime = Get-Date
        $latencyMs = ($endTime - $startTime).TotalMilliseconds

        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to invoke model" -ForegroundColor Red
            Write-Host $response -ForegroundColor Red
            
            if ($response -match "AccessDeniedException") {
                Write-Host ""
                Write-Host "Model access not enabled. To enable:" -ForegroundColor Yellow
                Write-Host "  1. Go to AWS Console → Bedrock → Model access" -ForegroundColor White
                Write-Host "  2. Request access to Claude 3 models" -ForegroundColor White
                Write-Host "  3. Wait for approval (usually instant)" -ForegroundColor White
            }
            
            return $null
        }

        # Parse response
        $responseData = Get-Content response.json | ConvertFrom-Json
        $content = $responseData.content[0].text
        $inputTokens = $responseData.usage.input_tokens
        $outputTokens = $responseData.usage.output_tokens
        $totalTokens = $inputTokens + $outputTokens

        # Calculate cost
        $cost = 0
        if ($ModelName -eq "Haiku") {
            $cost = ($inputTokens * 0.25 / 1000000) + ($outputTokens * 1.25 / 1000000)
        } else {
            $cost = ($inputTokens * 3.0 / 1000000) + ($outputTokens * 15.0 / 1000000)
        }

        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Latency:     $([math]::Round($latencyMs, 0)) ms" -ForegroundColor Cyan
        Write-Host "Tokens Used: $totalTokens (Input: $inputTokens, Output: $outputTokens)" -ForegroundColor Cyan
        Write-Host "Cost:        `$$($cost.ToString('F6'))" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Generated Content:" -ForegroundColor Yellow
        Write-Host "─────────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host $content -ForegroundColor White
        Write-Host "─────────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host ""

        return @{
            Model = $ModelName
            ModelId = $ModelId
            Content = $content
            LatencyMs = [math]::Round($latencyMs, 0)
            TokensUsed = $totalTokens
            InputTokens = $inputTokens
            OutputTokens = $outputTokens
            Cost = $cost
        }
    }
    finally {
        # Cleanup
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        Remove-Item response.json -ErrorAction SilentlyContinue
    }
}

# Function to print comparison
function Show-Comparison {
    param(
        [object]$Haiku,
        [object]$Sonnet
    )

    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "                           COMPARISON RESULTS                                   " -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "┌─────────────────────┬──────────────────┬──────────────────┐" -ForegroundColor White
    Write-Host "│ Metric              │ Haiku (Staging)  │ Sonnet (Prod)    │" -ForegroundColor White
    Write-Host "├─────────────────────┼──────────────────┼──────────────────┤" -ForegroundColor White
    Write-Host "│ Latency (ms)        │ $($Haiku.LatencyMs.ToString().PadRight(16)) │ $($Sonnet.LatencyMs.ToString().PadRight(16)) │" -ForegroundColor White
    Write-Host "│ Tokens Used         │ $($Haiku.TokensUsed.ToString().PadRight(16)) │ $($Sonnet.TokensUsed.ToString().PadRight(16)) │" -ForegroundColor White
    Write-Host "│ Cost                │ `$$($Haiku.Cost.ToString('F6').PadRight(15)) │ `$$($Sonnet.Cost.ToString('F6').PadRight(15)) │" -ForegroundColor White
    Write-Host "│ Content Length      │ $($Haiku.Content.Length.ToString().PadRight(16)) │ $($Sonnet.Content.Length.ToString().PadRight(16)) │" -ForegroundColor White
    Write-Host "└─────────────────────┴──────────────────┴──────────────────┘" -ForegroundColor White

    $speedDiff = [math]::Round((($Sonnet.LatencyMs - $Haiku.LatencyMs) / $Haiku.LatencyMs * 100), 1)
    $costDiff = [math]::Round((($Sonnet.Cost - $Haiku.Cost) / $Haiku.Cost * 100), 1)
    $costMultiplier = [math]::Round($Sonnet.Cost / $Haiku.Cost, 1)

    Write-Host ""
    Write-Host "Analysis:" -ForegroundColor Yellow
    if ($speedDiff -gt 0) {
        Write-Host "  • Sonnet is $speedDiff% slower than Haiku" -ForegroundColor White
    } else {
        Write-Host "  • Sonnet is $([math]::Abs($speedDiff))% faster than Haiku" -ForegroundColor White
    }
    Write-Host "  • Sonnet costs ${costMultiplier}x more than Haiku" -ForegroundColor White
    Write-Host "  • Sonnet is $costDiff% more expensive than Haiku" -ForegroundColor White

    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "  • Use Haiku for:" -ForegroundColor Cyan
    Write-Host "    - Testing and development" -ForegroundColor White
    Write-Host "    - QA and staging environments" -ForegroundColor White
    Write-Host "    - Bulk content generation" -ForegroundColor White
    Write-Host "    - Cost-sensitive operations" -ForegroundColor White
    Write-Host ""
    Write-Host "  • Use Sonnet for:" -ForegroundColor Cyan
    Write-Host "    - Production user-facing content" -ForegroundColor White
    Write-Host "    - High-quality requirements" -ForegroundColor White
    Write-Host "    - Complex reasoning tasks" -ForegroundColor White
    Write-Host "    - Final published content" -ForegroundColor White

    Write-Host ""
    Write-Host "Content Quality:" -ForegroundColor Yellow
    Write-Host "  • Haiku:  $($Haiku.Content.Length) characters" -ForegroundColor White
    Write-Host "  • Sonnet: $($Sonnet.Content.Length) characters" -ForegroundColor White
    Write-Host "  • Review the generated content above to compare quality" -ForegroundColor Gray
}

# Main execution
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Region: $REGION" -ForegroundColor White
Write-Host "  Haiku Model:  $HAIKU_MODEL" -ForegroundColor White
Write-Host "  Sonnet Model: $SONNET_MODEL" -ForegroundColor White
Write-Host ""
Write-Host "Prompt:" -ForegroundColor Yellow
Write-Host "  $Prompt" -ForegroundColor White
Write-Host ""

$results = @()

# Test Haiku
if (-not $SonnetOnly) {
    $haikuResult = Test-BedrockModel -ModelId $HAIKU_MODEL -ModelName "Haiku" -Prompt $Prompt
    if ($haikuResult) {
        $results += $haikuResult
    }
    
    if (-not $HaikuOnly) {
        Write-Host "Waiting 2 seconds before next request..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

# Test Sonnet
if (-not $HaikuOnly) {
    $sonnetResult = Test-BedrockModel -ModelId $SONNET_MODEL -ModelName "Sonnet" -Prompt $Prompt
    if ($sonnetResult) {
        $results += $sonnetResult
    }
}

# Show comparison if both succeeded
if ($results.Count -eq 2) {
    Show-Comparison -Haiku $results[0] -Sonnet $results[1]
} elseif ($results.Count -eq 1) {
    Write-Host ""
    Write-Host "Only one model tested successfully" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Both models failed. Check AWS credentials and model access." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "                              TEST COMPLETE                                     " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the generated content quality above" -ForegroundColor White
Write-Host "  2. Compare latency and cost differences" -ForegroundColor White
Write-Host "  3. Configure environment variables for deployment" -ForegroundColor White
Write-Host ""
Write-Host "Environment Configuration:" -ForegroundColor Yellow
Write-Host "  Staging:    BEDROCK_MODEL=$HAIKU_MODEL" -ForegroundColor Cyan
Write-Host "  Production: BEDROCK_MODEL=$SONNET_MODEL" -ForegroundColor Cyan
Write-Host ""
