# Initialize local DynamoDB tables for Temple Pricing Management
Write-Host "🚀 Initializing local DynamoDB tables..." -ForegroundColor Green

# Use environment variable with fallback to localhost
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }

# Set LocalStack endpoint
$env:AWS_ENDPOINT_URL = $ENDPOINT
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "test" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "test" }
$env:AWS_DEFAULT_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }

# Function to create table
function Create-Table {
    param (
        [string]$TableName
    )
    
    Write-Host "Creating table: $TableName" -ForegroundColor Cyan
    
    switch ($TableName) {
        "Temples" {
            aws dynamodb create-table `
                --endpoint-url $env:AWS_ENDPOINT_URL `
                --table-name $TableName `
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
        }
        
        "TempleGroups" {
            aws dynamodb create-table `
                --endpoint-url $env:AWS_ENDPOINT_URL `
                --table-name $TableName `
                --attribute-definitions `
                    AttributeName=PK,AttributeType=S `
                    AttributeName=SK,AttributeType=S `
                    AttributeName=GSI1PK,AttributeType=S `
                    AttributeName=GSI1SK,AttributeType=S `
                --key-schema `
                    AttributeName=PK,KeyType=HASH `
                    AttributeName=SK,KeyType=RANGE `
                --global-secondary-indexes `
                    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" `
                --billing-mode PAY_PER_REQUEST
        }
        
        "Artifacts" {
            aws dynamodb create-table `
                --endpoint-url $env:AWS_ENDPOINT_URL `
                --table-name $TableName `
                --attribute-definitions `
                    AttributeName=PK,AttributeType=S `
                    AttributeName=SK,AttributeType=S `
                    AttributeName=GSI1PK,AttributeType=S `
                    AttributeName=GSI1SK,AttributeType=S `
                --key-schema `
                    AttributeName=PK,KeyType=HASH `
                    AttributeName=SK,KeyType=RANGE `
                --global-secondary-indexes `
                    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" `
                --billing-mode PAY_PER_REQUEST
        }
        
        default {
            # Simple tables without GSIs
            aws dynamodb create-table `
                --endpoint-url $env:AWS_ENDPOINT_URL `
                --table-name $TableName `
                --attribute-definitions `
                    AttributeName=PK,AttributeType=S `
                    AttributeName=SK,AttributeType=S `
                --key-schema `
                    AttributeName=PK,KeyType=HASH `
                    AttributeName=SK,KeyType=RANGE `
                --billing-mode PAY_PER_REQUEST
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Table $TableName created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create table $TableName" -ForegroundColor Red
    }
}

# Create all tables
Create-Table "Temples"
Create-Table "TempleGroups"
Create-Table "Artifacts"
Create-Table "PriceConfigurations"
Create-Table "PriceHistory"
Create-Table "PricingFormulas"
Create-Table "FormulaHistory"
Create-Table "AccessGrants"
Create-Table "PriceOverrides"
Create-Table "AuditLog"

Write-Host ""
Write-Host "🎉 All tables created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Using endpoint: $ENDPOINT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Admin dashboard is already running on http://localhost:5173" -ForegroundColor White
Write-Host "2. Backend API will be available soon" -ForegroundColor White
