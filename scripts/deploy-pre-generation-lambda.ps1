###############################################################################
# Pre-Generation Lambda Deployment Script (PowerShell)
#
# This script packages and deploys the Pre-Generation Lambda function to AWS.
# It performs the following steps:
# 1. Builds TypeScript code
# 2. Bundles Lambda code with dependencies
# 3. Deploys using AWS CDK
# 4. Verifies deployment success
#
# Usage:
#   .\scripts\deploy-pre-generation-lambda.ps1 [options]
#
# Options:
#   -SkipBuild      Skip the TypeScript build step
#   -SkipBundle     Skip the Lambda bundling step
#   -SkipDeploy     Skip the CDK deployment (useful for testing build/bundle)
#   -VerifyOnly     Only verify the deployment, don't deploy
#   -Help           Show this help message
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

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipBundle = $false,
    [switch]$SkipDeploy = $false,
    [switch]$VerifyOnly = $false,
    [switch]$Help = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show help
if ($Help) {
    Get-Content $PSCommandPath | Select-Object -First 30 | Select-Object -Skip 2 | ForEach-Object { $_ -replace '^# ', '' }
    exit 0
}

# Function to check if a command exists
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Print banner
Write-Host ""
Write-Host "=========================================================================="
Write-Host "  Pre-Generation Lambda Deployment Script"
Write-Host "=========================================================================="
Write-Host ""

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Command "node")) {
    Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Error "npm is not installed. Please install npm and try again."
    exit 1
}

if (-not (Test-Command "aws")) {
    Write-Error "AWS CLI is not installed. Please install AWS CLI and try again."
    exit 1
}

if (-not (Test-Command "cdk")) {
    Write-Error "AWS CDK CLI is not installed. Please run: npm install -g aws-cdk"
    exit 1
}

Write-Success "All prerequisites are installed"

# Check AWS credentials
Write-Info "Checking AWS credentials..."
try {
    $callerIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $awsAccount = $callerIdentity.Account
    $awsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
    Write-Success "AWS credentials configured (Account: $awsAccount, Region: $awsRegion)"
}
catch {
    Write-Error "AWS credentials are not configured. Please configure AWS CLI and try again."
    exit 1
}

# Verify only mode
if ($VerifyOnly) {
    Write-Info "Running in verify-only mode..."
    
    # Check if Lambda function exists
    $functionName = "SanaathanaAalayaCharithra-PreGeneration"
    Write-Info "Checking if Lambda function exists: $functionName"
    
    try {
        $functionInfo = aws lambda get-function --function-name $functionName --region $awsRegion --output json | ConvertFrom-Json
        Write-Success "Lambda function exists: $functionName"
        
        # Get function details
        Write-Info "Function details:"
        aws lambda get-function --function-name $functionName --region $awsRegion `
            --query 'Configuration.{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' `
            --output table
        
        # Get environment variables
        Write-Info "Environment variables:"
        aws lambda get-function-configuration --function-name $functionName --region $awsRegion `
            --query 'Environment.Variables' `
            --output table
        
        Write-Success "Deployment verification complete"
    }
    catch {
        Write-Error "Lambda function does not exist: $functionName"
        Write-Info "Please run the deployment script without -VerifyOnly to deploy the function"
        exit 1
    }
    
    exit 0
}

# Step 1: Build TypeScript code
if (-not $SkipBuild) {
    Write-Info "Step 1: Building TypeScript code..."
    npm run build
    Write-Success "TypeScript build complete"
}
else {
    Write-Warning "Skipping TypeScript build (-SkipBuild flag)"
}

# Step 2: Bundle Lambda code
if (-not $SkipBundle) {
    Write-Info "Step 2: Bundling Lambda code with dependencies..."
    npm run bundle
    Write-Success "Lambda bundling complete"
    
    # Check if the pre-generation Lambda bundle exists
    if (-not (Test-Path "dist/lambdas/pre-generation.js")) {
        Write-Error "Lambda bundle not found: dist/lambdas/pre-generation.js"
        Write-Error "Bundle step may have failed. Please check the output above."
        exit 1
    }
    
    # Show bundle size
    $bundleSize = (Get-Item "dist/lambdas/pre-generation.js").Length / 1KB
    Write-Info "Bundle size: $([math]::Round($bundleSize, 2)) KB"
}
else {
    Write-Warning "Skipping Lambda bundling (-SkipBundle flag)"
}

# Step 3: Deploy using CDK
if (-not $SkipDeploy) {
    Write-Info "Step 3: Deploying Lambda function using AWS CDK..."
    
    # Check if CDK is bootstrapped
    Write-Info "Checking if CDK is bootstrapped in region $awsRegion..."
    try {
        aws cloudformation describe-stacks --stack-name CDKToolkit --region $awsRegion --output json | Out-Null
        Write-Success "CDK is already bootstrapped"
    }
    catch {
        Write-Warning "CDK is not bootstrapped in region $awsRegion"
        Write-Info "Bootstrapping CDK..."
        cdk bootstrap "aws://$awsAccount/$awsRegion"
        Write-Success "CDK bootstrap complete"
    }
    
    # Deploy the stack
    Write-Info "Deploying CDK stack..."
    cdk deploy --require-approval never
    
    Write-Success "CDK deployment complete"
}
else {
    Write-Warning "Skipping CDK deployment (-SkipDeploy flag)"
}

# Step 4: Verify deployment
Write-Info "Step 4: Verifying deployment..."

$functionName = "SanaathanaAalayaCharithra-PreGeneration"
Write-Info "Checking Lambda function: $functionName"

try {
    $functionInfo = aws lambda get-function --function-name $functionName --region $awsRegion --output json | ConvertFrom-Json
    Write-Success "Lambda function deployed successfully: $functionName"
    
    # Get function ARN
    $functionArn = $functionInfo.Configuration.FunctionArn
    Write-Info "Function ARN: $functionArn"
    
    # Get function details
    Write-Info "Function configuration:"
    aws lambda get-function-configuration --function-name $functionName --region $awsRegion `
        --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' `
        --output table
    
    # Check environment variables
    Write-Info "Verifying environment variables..."
    $envVarsJson = aws lambda get-function-configuration --function-name $functionName --region $awsRegion `
        --query 'Environment.Variables' --output json
    $envVars = $envVarsJson | ConvertFrom-Json
    
    # Check required environment variables
    $requiredVars = @("S3_BUCKET", "DYNAMODB_PROGRESS_TABLE", "DYNAMODB_CACHE_TABLE", "BATCH_SIZE")
    $allVarsPresent = $true
    
    foreach ($var in $requiredVars) {
        if ($envVars.PSObject.Properties.Name -contains $var) {
            Write-Success "Environment variable present: $var"
        }
        else {
            Write-Error "Missing environment variable: $var"
            $allVarsPresent = $false
        }
    }
    
    if ($allVarsPresent) {
        Write-Success "All required environment variables are configured"
    }
    else {
        Write-Error "Some required environment variables are missing"
        exit 1
    }
}
catch {
    Write-Error "Lambda function not found: $functionName"
    Write-Error "Deployment may have failed. Please check the CDK output above."
    exit 1
}

# Print summary
Write-Host ""
Write-Host "=========================================================================="
Write-Host "  Deployment Summary"
Write-Host "=========================================================================="
Write-Host ""
Write-Success "Pre-Generation Lambda function deployed successfully!"
Write-Host ""
Write-Host "Function Name: $functionName"
Write-Host "Function ARN:  $functionArn"
Write-Host "AWS Region:    $awsRegion"
Write-Host "AWS Account:   $awsAccount"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Test the Lambda function:"
Write-Host "     aws lambda invoke --function-name $functionName \"
Write-Host "       --payload '{\"mode\":\"batch\",\"jobId\":\"test-job\",\"batchSize\":5}' \"
Write-Host "       --region $awsRegion \"
Write-Host "       response.json"
Write-Host ""
Write-Host "  2. View the response:"
Write-Host "     Get-Content response.json"
Write-Host ""
Write-Host "  3. Check CloudWatch logs:"
Write-Host "     aws logs tail /aws/lambda/$functionName --follow --region $awsRegion"
Write-Host ""
Write-Host "=========================================================================="
Write-Host ""
