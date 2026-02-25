#!/bin/bash

###############################################################################
# Pre-Generation Lambda Deployment Script
#
# This script packages and deploys the Pre-Generation Lambda function to AWS.
# It performs the following steps:
# 1. Builds TypeScript code
# 2. Bundles Lambda code with dependencies
# 3. Deploys using AWS CDK
# 4. Verifies deployment success
#
# Usage:
#   ./scripts/deploy-pre-generation-lambda.sh [options]
#
# Options:
#   --skip-build    Skip the TypeScript build step
#   --skip-bundle   Skip the Lambda bundling step
#   --skip-deploy   Skip the CDK deployment (useful for testing build/bundle)
#   --verify-only   Only verify the deployment, don't deploy
#   --help          Show this help message
#
# Requirements:
#   - Node.js 18+ with npm
#   - AWS CLI configured with appropriate credentials
#   - AWS CDK CLI installed (npm install -g aws-cdk)
#   - IAM permissions to deploy Lambda functions and related resources
#
# Environment Variables:
#   AWS_PROFILE     AWS profile to use (optional)
#   AWS_REGION      AWS region to deploy to (default: us-east-1)
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_BUILD=false
SKIP_BUNDLE=false
SKIP_DEPLOY=false
VERIFY_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-bundle)
      SKIP_BUNDLE=true
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=true
      shift
      ;;
    --help)
      head -n 30 "$0" | tail -n +3 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to print colored messages
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Print banner
echo ""
echo "=========================================================================="
echo "  Pre-Generation Lambda Deployment Script"
echo "=========================================================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command_exists node; then
  log_error "Node.js is not installed. Please install Node.js 18+ and try again."
  exit 1
fi

if ! command_exists npm; then
  log_error "npm is not installed. Please install npm and try again."
  exit 1
fi

if ! command_exists aws; then
  log_error "AWS CLI is not installed. Please install AWS CLI and try again."
  exit 1
fi

if ! command_exists cdk; then
  log_error "AWS CDK CLI is not installed. Please run: npm install -g aws-cdk"
  exit 1
fi

log_success "All prerequisites are installed"

# Check AWS credentials
log_info "Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  log_error "AWS credentials are not configured. Please configure AWS CLI and try again."
  exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
log_success "AWS credentials configured (Account: $AWS_ACCOUNT, Region: $AWS_REGION)"

# Verify only mode
if [ "$VERIFY_ONLY" = true ]; then
  log_info "Running in verify-only mode..."
  
  # Check if Lambda function exists
  FUNCTION_NAME="SanaathanaAalayaCharithra-PreGeneration"
  log_info "Checking if Lambda function exists: $FUNCTION_NAME"
  
  if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    log_success "Lambda function exists: $FUNCTION_NAME"
    
    # Get function details
    log_info "Function details:"
    aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
      --query 'Configuration.{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' \
      --output table
    
    # Get environment variables
    log_info "Environment variables:"
    aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
      --query 'Environment.Variables' \
      --output table
    
    log_success "Deployment verification complete"
  else
    log_error "Lambda function does not exist: $FUNCTION_NAME"
    log_info "Please run the deployment script without --verify-only to deploy the function"
    exit 1
  fi
  
  exit 0
fi

# Step 1: Build TypeScript code
if [ "$SKIP_BUILD" = false ]; then
  log_info "Step 1: Building TypeScript code..."
  npm run build
  log_success "TypeScript build complete"
else
  log_warning "Skipping TypeScript build (--skip-build flag)"
fi

# Step 2: Bundle Lambda code
if [ "$SKIP_BUNDLE" = false ]; then
  log_info "Step 2: Bundling Lambda code with dependencies..."
  npm run bundle
  log_success "Lambda bundling complete"
  
  # Check if the pre-generation Lambda bundle exists
  if [ ! -f "dist/lambdas/pre-generation.js" ]; then
    log_error "Lambda bundle not found: dist/lambdas/pre-generation.js"
    log_error "Bundle step may have failed. Please check the output above."
    exit 1
  fi
  
  # Show bundle size
  BUNDLE_SIZE=$(du -h dist/lambdas/pre-generation.js | cut -f1)
  log_info "Bundle size: $BUNDLE_SIZE"
else
  log_warning "Skipping Lambda bundling (--skip-bundle flag)"
fi

# Step 3: Deploy using CDK
if [ "$SKIP_DEPLOY" = false ]; then
  log_info "Step 3: Deploying Lambda function using AWS CDK..."
  
  # Check if CDK is bootstrapped
  log_info "Checking if CDK is bootstrapped in region $AWS_REGION..."
  if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" >/dev/null 2>&1; then
    log_warning "CDK is not bootstrapped in region $AWS_REGION"
    log_info "Bootstrapping CDK..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
    log_success "CDK bootstrap complete"
  else
    log_success "CDK is already bootstrapped"
  fi
  
  # Deploy the stack
  log_info "Deploying CDK stack..."
  cdk deploy --require-approval never
  
  log_success "CDK deployment complete"
else
  log_warning "Skipping CDK deployment (--skip-deploy flag)"
fi

# Step 4: Verify deployment
log_info "Step 4: Verifying deployment..."

FUNCTION_NAME="SanaathanaAalayaCharithra-PreGeneration"
log_info "Checking Lambda function: $FUNCTION_NAME"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  log_success "Lambda function deployed successfully: $FUNCTION_NAME"
  
  # Get function ARN
  FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
    --query 'Configuration.FunctionArn' --output text)
  log_info "Function ARN: $FUNCTION_ARN"
  
  # Get function details
  log_info "Function configuration:"
  aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
    --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' \
    --output table
  
  # Check environment variables
  log_info "Verifying environment variables..."
  ENV_VARS=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
    --query 'Environment.Variables' --output json)
  
  # Check required environment variables
  REQUIRED_VARS=("S3_BUCKET" "DYNAMODB_PROGRESS_TABLE" "DYNAMODB_CACHE_TABLE" "BATCH_SIZE")
  ALL_VARS_PRESENT=true
  
  for VAR in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "\"$VAR\""; then
      log_success "Environment variable present: $VAR"
    else
      log_error "Missing environment variable: $VAR"
      ALL_VARS_PRESENT=false
    fi
  done
  
  if [ "$ALL_VARS_PRESENT" = true ]; then
    log_success "All required environment variables are configured"
  else
    log_error "Some required environment variables are missing"
    exit 1
  fi
  
else
  log_error "Lambda function not found: $FUNCTION_NAME"
  log_error "Deployment may have failed. Please check the CDK output above."
  exit 1
fi

# Print summary
echo ""
echo "=========================================================================="
echo "  Deployment Summary"
echo "=========================================================================="
echo ""
log_success "Pre-Generation Lambda function deployed successfully!"
echo ""
echo "Function Name: $FUNCTION_NAME"
echo "Function ARN:  $FUNCTION_ARN"
echo "AWS Region:    $AWS_REGION"
echo "AWS Account:   $AWS_ACCOUNT"
echo ""
echo "Next steps:"
echo "  1. Test the Lambda function:"
echo "     aws lambda invoke --function-name $FUNCTION_NAME \\"
echo "       --payload '{\"mode\":\"batch\",\"jobId\":\"test-job\",\"batchSize\":5}' \\"
echo "       --region $AWS_REGION \\"
echo "       response.json"
echo ""
echo "  2. View the response:"
echo "     cat response.json"
echo ""
echo "  3. Check CloudWatch logs:"
echo "     aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $AWS_REGION"
echo ""
echo "=========================================================================="
echo ""
