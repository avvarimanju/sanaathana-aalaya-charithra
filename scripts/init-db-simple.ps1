# Initialize local DynamoDB tables
Write-Host "Initializing local DynamoDB tables..." -ForegroundColor Green

$env:AWS_ENDPOINT_URL = "http://localhost:4566"
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:AWS_DEFAULT_REGION = "ap-south-1"

$tables = @("Temples", "TempleGroups", "Artifacts", "PriceConfigurations", "PriceHistory", "PricingFormulas", "FormulaHistory", "AccessGrants", "PriceOverrides", "AuditLog")

foreach ($table in $tables) {
    Write-Host "Creating table: $table" -ForegroundColor Cyan
    
    if ($table -eq "Temples") {
        aws dynamodb create-table --endpoint-url http://localhost:4566 --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S AttributeName=GSI2PK,AttributeType=S AttributeName=GSI2SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST | Out-Null
    }
    elseif ($table -eq "TempleGroups" -or $table -eq "Artifacts") {
        aws dynamodb create-table --endpoint-url http://localhost:4566 --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST | Out-Null
    }
    else {
        aws dynamodb create-table --endpoint-url http://localhost:4566 --table-name $table --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --billing-mode PAY_PER_REQUEST | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS: Table $table created" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Failed to create table $table" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All tables created successfully!" -ForegroundColor Green
Write-Host "LocalStack is running on http://localhost:4566" -ForegroundColor Yellow
