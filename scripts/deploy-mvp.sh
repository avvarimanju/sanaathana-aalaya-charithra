#!/bin/bash

# MVP Deployment Script - 2 Environment Setup
# Deploys minimal backend with full mobile app features
# Usage: ./scripts/deploy-mvp.sh [staging|prod]
# Default Region: ap-south-1 (Mumbai) for Indian users

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Sanaathana Aalaya Charithra - MVP Deployment      ║${NC}"
echo -e "${BLUE}║              2-Environment Setup                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}❌ Error: Environment must be 'staging' or 'prod'${NC}"
    echo "Usage: $0 [staging|prod]"
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Project Root: $PROJECT_ROOT"
echo ""

# Function to print step
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Prerequisites Check
print_step "Step 1: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) found"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi
print_success "AWS CLI found"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    exit 1
fi
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS Account: $AWS_ACCOUNT"

# Check CDK
if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK is not installed"
    echo "Install with: npm install -g aws-cdk"
    exit 1
fi
print_success "AWS CDK $(cdk --version) found"

echo ""

# Step 2: Install Dependencies
print_step "Step 2: Installing dependencies..."
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

echo ""

# Step 3: Build TypeScript
print_step "Step 3: Building TypeScript code..."

npm run build
print_success "TypeScript build completed"

echo ""

# Step 4: Run Tests
print_step "Step 4: Running tests..."

if [ "$ENVIRONMENT" == "prod" ]; then
    print_warning "Running full test suite for production deployment..."
    npm run test
    print_success "All tests passed"
else
    print_warning "Skipping tests for staging (run manually if needed)"
fi

echo ""

# Step 5: CDK Bootstrap (if needed)
print_step "Step 5: Checking CDK bootstrap..."

if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    print_warning "CDK not bootstrapped, bootstrapping now..."
    cdk bootstrap
    print_success "CDK bootstrapped"
else
    print_success "CDK already bootstrapped"
fi

echo ""

# Step 6: CDK Synth
print_step "Step 6: Synthesizing CloudFormation template..."

cdk synth --context environment=$ENVIRONMENT
print_success "CloudFormation template synthesized"

echo ""

# Step 7: Show Diff
print_step "Step 7: Showing infrastructure changes..."

cdk diff --context environment=$ENVIRONMENT || true

echo ""

# Step 8: Confirm Deployment
if [ "$ENVIRONMENT" == "prod" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
fi

# Step 9: Deploy
print_step "Step 9: Deploying to $ENVIRONMENT..."

cdk deploy --context environment=$ENVIRONMENT --require-approval never

print_success "Deployment completed"

echo ""

# Step 10: Get Stack Outputs
print_step "Step 10: Retrieving stack outputs..."

STACK_NAME="TempleApp-$ENVIRONMENT"

# Get API URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region ${AWS_REGION:-ap-south-1} \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text 2>/dev/null || echo "Not found")

# Get User Pool ID
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
    --output text 2>/dev/null || echo "Not found")

# Get User Pool Client ID
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
    --output text 2>/dev/null || echo "Not found")

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Successful! 🎉                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Stack Outputs:${NC}"
echo "  API URL: $API_URL"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo ""

# Step 11: Verify Deployment
print_step "Step 11: Verifying deployment..."

# Check DynamoDB tables
TABLES=$(aws dynamodb list-tables --query "TableNames[?contains(@, '$ENVIRONMENT')]" --output text)
if [ -n "$TABLES" ]; then
    print_success "DynamoDB tables created"
    echo "  Tables: $TABLES"
else
    print_warning "No DynamoDB tables found"
fi

# Check Lambda functions
FUNCTIONS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, '$ENVIRONMENT')].FunctionName" --output text)
if [ -n "$FUNCTIONS" ]; then
    print_success "Lambda functions deployed"
    echo "  Functions: $FUNCTIONS"
else
    print_warning "No Lambda functions found"
fi

echo ""

# Step 12: Next Steps
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$ENVIRONMENT" == "staging" ]; then
    echo "1. Run E2E tests:"
    echo "   npm run test:e2e:staging"
    echo ""
    echo "2. Test the API:"
    echo "   curl $API_URL/health"
    echo ""
    echo "3. View logs:"
    echo "   npm run logs:staging"
    echo ""
    echo "4. When ready, deploy to production:"
    echo "   ./scripts/deploy-mvp.sh prod"
else
    echo "1. Run smoke tests:"
    echo "   npm run test:smoke:prod"
    echo ""
    echo "2. Monitor the deployment:"
    echo "   npm run logs:prod"
    echo ""
    echo "3. Check CloudWatch metrics:"
    echo "   aws cloudwatch get-metric-statistics --namespace AWS/Lambda ..."
    echo ""
    echo "4. Update mobile app configuration with:"
    echo "   API_URL=$API_URL"
    echo "   USER_POOL_ID=$USER_POOL_ID"
    echo "   USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID"
fi

echo ""
echo -e "${GREEN}✓ Deployment script completed successfully!${NC}"
echo ""

# Save outputs to file
OUTPUT_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
cat > "$OUTPUT_FILE" << EOF
# Auto-generated by deploy-mvp.sh on $(date)
STAGE=$ENVIRONMENT
API_URL=$API_URL
USER_POOL_ID=$USER_POOL_ID
USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
AWS_REGION=${AWS_REGION:-ap-south-1}
EOF

print_success "Environment variables saved to $OUTPUT_FILE"
echo ""
