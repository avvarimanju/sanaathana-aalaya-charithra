# Initialize local DynamoDB tables
Write-Host "Initializing local DynamoDB tables..." -ForegroundColor Green

# Use environment variable with fallback to localhost
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }

$env:AWS_ENDPOINT_URL = $ENDPOINT
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "test" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "test" }
$env:AWS_DEFAULT_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }

$tables = @("Temples", "TempleGroups", "Artifacts", "PriceConfigurations", "PriceHistory", "PricingFormulas", "FormulaHistory", "AccessGrants", "PriceOverrides", "AuditLog")

foreach ($table in $tables) {
    Write-Host "Creating table: $table" -ForegroundColor Cyan
    
    if ($table -eq "Temples") {
        aws dynamodb create-table --endpoint-url $ENDPOINT --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S AttributeName=GSI2PK,AttributeType=S AttributeName=GSI2SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST | Out-Null
    }
    elseif ($table -eq "TempleGroups" -or $table -eq "Artifacts") {
        aws dynamodb create-table --endpoint-url $ENDPOINT --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST | Out-Null
    }
    else {
        aws dynamodb create-table --endpoint-url $ENDPOINT --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --billing-mode PAY_PER_REQUEST | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS: Table $table created" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Failed to create table $table" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All tables created successfully!" -ForegroundColor Green
Write-Host "Using endpoint: $ENDPOINT" -ForegroundColor Yellow
