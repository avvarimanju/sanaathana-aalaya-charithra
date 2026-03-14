# Fix Temples Table Creation
# Run this if the Temples table failed to create during startup

Write-Host "Fixing Temples table..." -ForegroundColor Yellow
Write-Host ""

# Set environment variables with fallback to defaults
# Best practice: Use environment variable with local fallback
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }
$env:AWS_ENDPOINT_URL = $ENDPOINT
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "test" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "test" }

# Load AWS region from global config
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig
$env:AWS_DEFAULT_REGION = $config.AWS_REGION

# Check if table already exists
Write-Host "Checking if Temples table exists..." -ForegroundColor Cyan
$tableExists = aws dynamodb describe-table --table-name Temples --endpoint-url http://localhost:4566 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Temples table already exists!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Table details:" -ForegroundColor Cyan
    aws dynamodb describe-table --table-name Temples --endpoint-url http://localhost:4566 --query 'Table.[TableName,TableStatus,ItemCount]' --output table
    exit 0
}

# Create the Temples table
Write-Host "Creating Temples table..." -ForegroundColor Cyan

aws dynamodb create-table `
    --endpoint-url http://localhost:4566 `
    --table-name Temples `
    --attribute-definitions `
        AttributeName=PK,AttributeType=S `
        AttributeName=SK,AttributeType=S `
        AttributeName=GSI1PK,AttributeType=S `
        AttributeName=GSI1SK,AttributeType=S `
        AttributeName=GSI2PK,AttributeType=S `
        AttributeName=GSI2SK,AttributeType=S `
    --key-schema `
        AttributeName=PK,KeyType=HASH `
        AttributeName=SK,KeyType=RANGE `
    --global-secondary-indexes `
        "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" `
        "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" `
    --billing-mode PAY_PER_REQUEST

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Temples table created!" -ForegroundColor Green
    Write-Host ""
    
    # Verify table was created
    Write-Host "Verifying table..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    aws dynamodb describe-table --table-name Temples --endpoint-url http://localhost:4566 --query 'Table.[TableName,TableStatus]' --output table
    
    Write-Host ""
    Write-Host "All tables in LocalStack:" -ForegroundColor Cyan
    aws dynamodb list-tables --endpoint-url http://localhost:4566 --query 'TableNames' --output table
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create Temples table!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if LocalStack is running: docker ps | Select-String 'temple-localstack'" -ForegroundColor White
    Write-Host "2. Check LocalStack logs: docker logs temple-localstack" -ForegroundColor White
    Write-Host "3. Restart LocalStack: docker-compose down && docker-compose up -d" -ForegroundColor White
    Write-Host "4. Wait 10 seconds and try again" -ForegroundColor White
    exit 1
}
