#!/bin/bash

# Defect Tracking System Deployment Script
# This script automates the deployment of the defect tracking system to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse command line arguments
ENVIRONMENT="${1:-staging}"
DRY_RUN=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [environment] [options]"
            echo ""
            echo "Arguments:"
            echo "  environment    Deployment environment (dev|staging|prod). Default: staging"
            echo ""
            echo "Options:"
            echo "  --dry-run      Synthesize CloudFormation template without deploying"
            echo "  --skip-tests   Skip running tests before deployment"
            echo "  --help         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 staging                    # Deploy to staging"
            echo "  $0 prod                       # Deploy to production"
            echo "  $0 staging --dry-run          # Preview staging deployment"
            echo "  $0 staging --skip-tests       # Deploy without running tests"
            exit 0
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_info "Valid environments: dev, staging, prod"
    exit 1
fi

print_info "Starting deployment for environment: $ENVIRONMENT"

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists aws; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    print_error "AWS credentials are not configured or invalid."
    print_info "Run 'aws configure' to set up your credentials."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS credentials valid. Account ID: $ACCOUNT_ID"

# Set environment variables
export ENVIRONMENT="$ENVIRONMENT"
export CDK_DEFAULT_ACCOUNT="$ACCOUNT_ID"

# Load AWS region from global config
source "$(dirname "$0")/../config/global-config.sh"
export CDK_DEFAULT_REGION="${AWS_REGION}"

print_info "Environment variables set:"
print_info "  ENVIRONMENT=$ENVIRONMENT"
print_info "  CDK_DEFAULT_ACCOUNT=$CDK_DEFAULT_ACCOUNT"
print_info "  CDK_DEFAULT_REGION=$CDK_DEFAULT_REGION"

# Install dependencies
print_info "Installing dependencies..."
npm install --silent

# Build the project
print_info "Building TypeScript code..."
npm run build

# Run tests
if [ "$SKIP_TESTS" = false ]; then
    print_info "Running tests..."
    if npm test -- --testPathPattern="defect-tracking" --silent; then
        print_success "All tests passed!"
    else
        print_error "Tests failed. Aborting deployment."
        print_info "Use --skip-tests to deploy anyway (not recommended)."
        exit 1
    fi
else
    print_warning "Skipping tests as requested."
fi

# Synthesize CloudFormation template
print_info "Synthesizing CloudFormation template..."
STACK_NAME="DefectTrackingStack-${ENVIRONMENT}"

if npm run synth -- "$STACK_NAME" >/dev/null 2>&1; then
    print_success "CloudFormation template synthesized successfully."
else
    print_error "Failed to synthesize CloudFormation template."
    exit 1
fi

# Show diff
print_info "Checking for changes..."
if npm run diff -- "$STACK_NAME" 2>&1 | grep -q "There were no differences"; then
    print_info "No changes detected. Stack is up to date."
else
    print_warning "Changes detected. Review the diff above."
fi

# Dry run - stop here
if [ "$DRY_RUN" = true ]; then
    print_info "Dry run complete. CloudFormation template is in cdk.out/"
    print_info "To deploy, run: $0 $ENVIRONMENT"
    exit 0
fi

# Confirm deployment for production
if [ "$ENVIRONMENT" = "prod" ]; then
    print_warning "You are about to deploy to PRODUCTION!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Deploy the stack
print_info "Deploying stack: $STACK_NAME"
print_info "This may take several minutes..."

if npm run cdk -- deploy "$STACK_NAME" --require-approval never; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed."
    exit 1
fi

# Get stack outputs
print_info "Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text 2>/dev/null || echo "")

DEFECTS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='DefectsTableName'].OutputValue" \
    --output text 2>/dev/null || echo "")

STATUS_UPDATES_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='StatusUpdatesTableName'].OutputValue" \
    --output text 2>/dev/null || echo "")

NOTIFICATIONS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='NotificationsTableName'].OutputValue" \
    --output text 2>/dev/null || echo "")

# Display outputs
echo ""
print_success "==================================="
print_success "Deployment Summary"
print_success "==================================="
echo ""
print_info "Environment: $ENVIRONMENT"
print_info "Stack Name: $STACK_NAME"
echo ""
print_info "API URL: $API_URL"
echo ""
print_info "DynamoDB Tables:"
print_info "  - Defects: $DEFECTS_TABLE"
print_info "  - Status Updates: $STATUS_UPDATES_TABLE"
print_info "  - Notifications: $NOTIFICATIONS_TABLE"
echo ""

# Verify deployment
print_info "Verifying deployment..."

# Check DynamoDB tables
print_info "Checking DynamoDB tables..."
for table in "$DEFECTS_TABLE" "$STATUS_UPDATES_TABLE" "$NOTIFICATIONS_TABLE"; do
    if [ -n "$table" ]; then
        STATUS=$(aws dynamodb describe-table --table-name "$table" --query "Table.TableStatus" --output text 2>/dev/null || echo "ERROR")
        if [ "$STATUS" = "ACTIVE" ]; then
            print_success "  ✓ $table is ACTIVE"
        else
            print_error "  ✗ $table status: $STATUS"
        fi
    fi
done

# Check Lambda functions
print_info "Checking Lambda functions..."
LAMBDA_COUNT=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, '${ENVIRONMENT}-defect-tracking')].FunctionName" \
    --output text 2>/dev/null | wc -w)

if [ "$LAMBDA_COUNT" -eq 8 ]; then
    print_success "  ✓ All 8 Lambda functions deployed"
else
    print_warning "  ! Found $LAMBDA_COUNT Lambda functions (expected 8)"
fi

# Test API endpoint
if [ -n "$API_URL" ]; then
    print_info "Testing API endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/defects/user/test-user" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
        print_success "  ✓ API endpoint is responding (HTTP $HTTP_CODE)"
    else
        print_warning "  ! API endpoint returned HTTP $HTTP_CODE"
    fi
fi

echo ""
print_success "==================================="
print_success "Deployment Complete!"
print_success "==================================="
echo ""
print_info "Next steps:"
print_info "  1. Review the deployment guide: src/defect-tracking/DEPLOYMENT_GUIDE.md"
print_info "  2. Test the API endpoints manually"
print_info "  3. Integrate with mobile app and admin dashboard"
print_info "  4. Set up CloudWatch alarms"
echo ""
print_info "To test the API, use the following command:"
echo ""
echo "  curl -X POST \"${API_URL}/defects\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"userId\":\"test-user\",\"title\":\"Test defect\",\"description\":\"Test description\"}'"
echo ""
