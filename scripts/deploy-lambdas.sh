#!/bin/bash
# Deploy Lambda Functions for Authentication Service
# Requirements: 13.6

set -e

# Configuration
STACK_NAME="SanaathanaAalayaCharithra-Authentication"
REGION="${AWS_REGION:-us-east-1}"

echo "Deploying Lambda functions for authentication service..."
echo "Stack: $STACK_NAME"
echo "Region: $REGION"

# Build Lambda layer first
echo ""
echo "Step 1: Building Lambda layer..."
./scripts/build-lambda-layer.sh

# Package Lambda functions
echo ""
echo "Step 2: Packaging Lambda functions..."
BUILD_DIR="build/lambda-functions"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy Lambda handlers
cp -r src/auth/lambdas/* "$BUILD_DIR/"

# Copy service modules
mkdir -p "$BUILD_DIR/services"
cp -r src/auth/services/* "$BUILD_DIR/services/"

# Copy provider modules
mkdir -p "$BUILD_DIR/providers"
cp -r src/auth/providers/* "$BUILD_DIR/providers/"

# Copy models
mkdir -p "$BUILD_DIR/models"
cp -r src/auth/models/* "$BUILD_DIR/models/"

# Copy utils
mkdir -p "$BUILD_DIR/utils"
cp -r src/auth/utils/* "$BUILD_DIR/utils/"

# Copy config
cp src/auth/config.py "$BUILD_DIR/"

# Create deployment package
echo "Creating Lambda deployment package..."
cd "$BUILD_DIR"
zip -r ../lambda-functions.zip . -x "*.pyc" -x "*__pycache__*" -x "test_*.py"
cd ../..

echo "Lambda functions packaged successfully: build/lambda-functions.zip"
echo "Package size: $(du -h build/lambda-functions.zip | cut -f1)"

# Deploy using CDK
echo ""
echo "Step 3: Deploying infrastructure with CDK..."
cd infrastructure
cdk deploy "$STACK_NAME" --require-approval never
cd ..

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure OAuth credentials in AWS Secrets Manager"
echo "2. Update ALLOWED_REDIRECT_URIS environment variable"
echo "3. Test authentication endpoints"
