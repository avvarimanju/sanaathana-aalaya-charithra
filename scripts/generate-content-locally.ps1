# Generate Temple Content Locally (Before AWS Deployment)
# This script generates AI content for temples using AWS Bedrock from your local machine

param(
    [string]$Model = "haiku",  # "haiku" or "sonnet"
    [int]$TempleCount = 10,    # Number of temples to generate (default: 10 for testing)
    [string]$OutputDir = "data/generated-content",
    [string]$InputFile = "data/temples.json",
    [switch]$DryRun
)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "              LOCAL TEMPLE CONTENT GENERATION                                   " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$REGION = "us-east-1"
$MODELS = @{
    "haiku" = @{
        id = "anthropic.claude-3-5-haiku-20241022-v1:0"
        name = "Claude 3.5 Haiku"
        costPer1k = 0.0006
    }
    "sonnet" = @{
        id = "anthropic.claude-3-sonnet-20240229-v1:0"
        name = "Claude 3 Sonnet"
        costPer1k = 0.0092
    }
}

$selectedModel = $MODELS[$Model.ToLower()]
if (-not $selectedModel) {
    Write-Host "ERROR: Invalid model '$Model'. Use 'haiku' or 'sonnet'" -ForegroundColor Red
    exit 1
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Model: $($selectedModel.name)" -ForegroundColor White
Write-Host "  Model ID: $($selectedModel.id)" -ForegroundColor White
Write-Host "  Region: $REGION" -ForegroundColor White
Write-Host "  Temples to generate: $TempleCount" -ForegroundColor White
Write-Host "  Output directory: $OutputDir" -ForegroundColor White
Write-Host "  Estimated cost: `$$([math]::Round($TempleCount * $selectedModel.costPer1k, 2))" -ForegroundColor White
Write-Host ""

# Check AWS CLI
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$awsVersion = aws --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI not found!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ AWS CLI installed" -ForegroundColor Green

# Check AWS credentials
$identity = aws sts get-caller-identity 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS credentials not configured!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ AWS credentials configured" -ForegroundColor Green
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

# Sample temple data (replace with your actual data)
$sampleTemples = @(
    @{
        id = "temple_001"
        name = "Brihadeeswarar Temple"
        location = "Thanjavur, Tamil Nadu"
        deity = "Lord Shiva"
        built = "1010 CE"
        style = "Dravidian"
    },
    @{
        id = "temple_002"
        name = "Meenakshi Temple"
        location = "Madurai, Tamil Nadu"
        deity = "Goddess Meenakshi"
        built = "17th century"
        style = "Dravidian"
    },
    @{
        id = "temple_003"
        name = "Tirupati Temple"
        location = "Tirupati, Andhra Pradesh"
        deity = "Lord Venkateswara"
        built = "300 CE"
        style = "Dravidian"
    }
)

# Load temples from file if exists
if (Test-Path $InputFile) {
    Write-Host "Loading temples from $InputFile..." -ForegroundColor Yellow
    $temples = Get-Content $InputFile | ConvertFrom-Json
    Write-Host "  ✓ Loaded $($temples.Count) temples" -ForegroundColor Green
} else {
    Write-Host "Using sample temple data (3 temples)" -ForegroundColor Yellow
    $temples = $sampleTemples
}

# Limit to requested count
$temples = $temples | Select-Object -First $TempleCount

Write-Host ""
Write-Host "Generating content for $($temples.Count) temples..." -ForegroundColor Cyan
Write-Host ""

$results = @()
$totalCost = 0
$successCount = 0
$failCount = 0

foreach ($temple in $temples) {
    $templeNum = $temples.IndexOf($temple) + 1
    Write-Host "[$templeNum/$($temples.Count)] Processing: $($temple.name)" -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would generate content" -ForegroundColor Gray
        continue
    }
    
    # Create prompt
    $prompt = @"
Generate comprehensive content for the following Hindu temple:

Temple Name: $($temple.name)
Location: $($temple.location)
Deity: $($temple.deity)
Built: $($temple.built)
Architectural Style: $($temple.style)

Please provide the following sections:

1. ABOUT (150-200 words): Brief introduction to the temple, its significance, and what makes it special.

2. HISTORY (250-300 words): Historical background, when it was built, by whom, major events, renovations, and historical importance.

3. SIGNIFICANCE (200-250 words): Religious and cultural significance, why devotees visit, festivals celebrated, spiritual importance.

4. ARCHITECTURE (250-300 words): Architectural features, style, unique elements, gopurams, mandapams, sculptures, and artistic details.

Format the response as JSON with these exact keys: about, history, significance, architecture
"@

    # Create request body
    $requestBody = @{
        anthropic_version = "bedrock-2023-05-31"
        max_tokens = 2048
        temperature = 0.7
        messages = @(
            @{
                role = "user"
                content = $prompt
            }
        )
    } | ConvertTo-Json -Depth 10

    # Save to temp file
    $tempFile = [System.IO.Path]::GetTempFileName()
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tempFile, $requestBody, $utf8NoBom)

    try {
        # Invoke Bedrock
        $startTime = Get-Date
        $response = aws bedrock-runtime invoke-model `
            --model-id $selectedModel.id `
            --region $REGION `
            --body "fileb://$tempFile" `
            response.json 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ Failed to generate content" -ForegroundColor Red
            Write-Host "    Error: $response" -ForegroundColor Red
            $failCount++
            continue
        }

        $endTime = Get-Date
        $latencyMs = ($endTime - $startTime).TotalMilliseconds

        # Parse response
        $responseData = Get-Content response.json | ConvertFrom-Json
        $content = $responseData.content[0].text
        $inputTokens = $responseData.usage.input_tokens
        $outputTokens = $responseData.usage.output_tokens

        # Calculate cost
        if ($Model -eq "haiku") {
            $cost = ($inputTokens * 0.25 / 1000000) + ($outputTokens * 1.25 / 1000000)
        } else {
            $cost = ($inputTokens * 3.0 / 1000000) + ($outputTokens * 15.0 / 1000000)
        }
        $totalCost += $cost

        # Save generated content
        $outputFile = Join-Path $OutputDir "$($temple.id).json"
        $generatedContent = @{
            templeId = $temple.id
            templeName = $temple.name
            location = $temple.location
            content = $content
            metadata = @{
                model = $selectedModel.name
                modelId = $selectedModel.id
                generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
                latencyMs = [math]::Round($latencyMs, 0)
                tokensUsed = $inputTokens + $outputTokens
                cost = $cost
            }
        } | ConvertTo-Json -Depth 10

        $generatedContent | Out-File -FilePath $outputFile -Encoding UTF8

        Write-Host "  ✓ Generated successfully" -ForegroundColor Green
        Write-Host "    Latency: $([math]::Round($latencyMs, 0)) ms | Tokens: $($inputTokens + $outputTokens) | Cost: `$$($cost.ToString('F6'))" -ForegroundColor Gray
        Write-Host "    Saved to: $outputFile" -ForegroundColor Gray
        
        $successCount++

        # Rate limiting - wait 2 seconds between requests
        if ($templeNum -lt $temples.Count) {
            Write-Host "    Waiting 2 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }

    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $failCount++
    } finally {
        # Cleanup
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        Remove-Item response.json -ErrorAction SilentlyContinue
    }

    Write-Host ""
}

# Summary
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "                           GENERATION COMPLETE                                  " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  ✓ Successful: $successCount" -ForegroundColor Green
Write-Host "  ✗ Failed: $failCount" -ForegroundColor Red
Write-Host "  Total Cost: `$$($totalCost.ToString('F4'))" -ForegroundColor Cyan
Write-Host "  Output Directory: $OutputDir" -ForegroundColor White
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review generated content in: $OutputDir" -ForegroundColor White
    Write-Host "  2. Edit/improve content if needed" -ForegroundColor White
    Write-Host "  3. Import to DynamoDB when ready:" -ForegroundColor White
    Write-Host "     .\scripts\import-content-to-dynamodb.ps1 -InputDir $OutputDir" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
