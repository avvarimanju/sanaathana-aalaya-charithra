# Start Local Backend Server
Write-Host "Starting Local Backend Server..." -ForegroundColor Green

# Set environment variables
$env:AWS_ENDPOINT_URL = "http://localhost:4566"
$env:AWS_REGION = "ap-south-1"
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:PORT = "4000"
$env:NODE_ENV = "development"

# Table names
$env:TEMPLES_TABLE = "Temples"
$env:TEMPLE_GROUPS_TABLE = "TempleGroups"
$env:ARTIFACTS_TABLE = "Artifacts"
$env:PRICE_CONFIGURATIONS_TABLE = "PriceConfigurations"
$env:PRICE_HISTORY_TABLE = "PriceHistory"
$env:PRICING_FORMULAS_TABLE = "PricingFormulas"
$env:FORMULA_HISTORY_TABLE = "FormulaHistory"
$env:ACCESS_GRANTS_TABLE = "AccessGrants"
$env:PRICE_OVERRIDES_TABLE = "PriceOverrides"
$env:AUDIT_LOG_TABLE = "AuditLog"

# Check if LocalStack is running
Write-Host "Checking LocalStack..." -ForegroundColor Cyan
$localstackRunning = docker ps | Select-String "temple-localstack"

if (-not $localstackRunning) {
    Write-Host "ERROR: LocalStack is not running!" -ForegroundColor Red
    Write-Host "Please start LocalStack first:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor White
    exit 1
}

Write-Host "LocalStack is running" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "src/local-server/node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Set-Location src/local-server
    npm install
    Set-Location ../..
}

# Start the server
Write-Host "Starting server on http://localhost:4000..." -ForegroundColor Cyan
Set-Location src/local-server
npm start
