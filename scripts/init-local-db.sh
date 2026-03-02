#!/bin/bash

# Initialize local DynamoDB tables for Temple Pricing Management
echo "🚀 Initializing local DynamoDB tables..."

# Use environment variable with fallback to localhost
ENDPOINT=${DYNAMODB_ENDPOINT:-http://localhost:4566}

# Set LocalStack endpoint
export AWS_ENDPOINT_URL=$ENDPOINT
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
export AWS_DEFAULT_REGION=${AWS_REGION:-ap-south-1}

# Function to create table
create_table() {
  local table_name=$1
  echo "Creating table: $table_name"
  
  case $table_name in
    "Temples")
      aws dynamodb create-table \
        --endpoint-url $AWS_ENDPOINT_URL \
        --table-name $table_name \
        --attribute-definitions \
          AttributeName=PK,AttributeType=S \
          AttributeName=SK,AttributeType=S \
          AttributeName=GSI1PK,AttributeType=S \
          AttributeName=GSI1SK,AttributeType=S \
          AttributeName=GSI2PK,AttributeType=S \
          AttributeName=GSI2SK,AttributeType=S \
        --key-schema \
          AttributeName=PK,KeyType=HASH \
          AttributeName=SK,KeyType=RANGE \
        --global-secondary-indexes \
          "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
          "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
        --billing-mode PAY_PER_REQUEST
      ;;
    
    "TempleGroups")
      aws dynamodb create-table \
        --endpoint-url $AWS_ENDPOINT_URL \
        --table-name $table_name \
        --attribute-definitions \
          AttributeName=PK,AttributeType=S \
          AttributeName=SK,AttributeType=S \
          AttributeName=GSI1PK,AttributeType=S \
          AttributeName=GSI1SK,AttributeType=S \
        --key-schema \
          AttributeName=PK,KeyType=HASH \
          AttributeName=SK,KeyType=RANGE \
        --global-secondary-indexes \
          "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
        --billing-mode PAY_PER_REQUEST
      ;;
    
    "Artifacts")
      aws dynamodb create-table \
        --endpoint-url $AWS_ENDPOINT_URL \
        --table-name $table_name \
        --attribute-definitions \
          AttributeName=PK,AttributeType=S \
          AttributeName=SK,AttributeType=S \
          AttributeName=GSI1PK,AttributeType=S \
          AttributeName=GSI1SK,AttributeType=S \
        --key-schema \
          AttributeName=PK,KeyType=HASH \
          AttributeName=SK,KeyType=RANGE \
        --global-secondary-indexes \
          "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
        --billing-mode PAY_PER_REQUEST
      ;;
    
    "PriceConfigurations"|"PriceHistory"|"PricingFormulas"|"FormulaHistory"|"AccessGrants"|"PriceOverrides"|"AuditLog")
      aws dynamodb create-table \
        --endpoint-url $AWS_ENDPOINT_URL \
        --table-name $table_name \
        --attribute-definitions \
          AttributeName=PK,AttributeType=S \
          AttributeName=SK,AttributeType=S \
        --key-schema \
          AttributeName=PK,KeyType=HASH \
          AttributeName=SK,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST
      ;;
  esac
  
  if [ $? -eq 0 ]; then
    echo "✓ Table $table_name created successfully"
  else
    echo "✗ Failed to create table $table_name"
  fi
}

# Create all tables
create_table "Temples"
create_table "TempleGroups"
create_table "Artifacts"
create_table "PriceConfigurations"
create_table "PriceHistory"
create_table "PricingFormulas"
create_table "FormulaHistory"
create_table "AccessGrants"
create_table "PriceOverrides"
create_table "AuditLog"

echo ""
echo "🎉 All tables created successfully!"
echo ""
echo "Using endpoint: $ENDPOINT"
echo ""
echo "Next steps:"
echo "1. Start backend server: npm run dev:backend"
echo "2. Admin dashboard is already running on http://localhost:5173"
