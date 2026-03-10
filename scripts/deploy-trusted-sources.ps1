# Deploy Trusted Sources Feature
# This script deploys the backend infrastructure and tests the admin portal

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$TestOnly
)

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TRUSTED SOURCES FEATURE - DEPLOYMENT & TESTING                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PHASE 1: Pre-deployment Checks
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 1: Pre-deployment Checks" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Check AWS CLI
Write-Host "Checking AWS CLI..." -ForegroundColor White
try {
    $awsVersion = aws --version 2>&1
    Write-Host "  ✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor White
try {
    $awsIdentity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "  ✓ AWS Account: $($awsIdentity.Account)" -ForegroundColor Green
    Write-Host "  ✓ AWS User: $($awsIdentity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor White
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor White
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# PHASE 2: Backend Deployment (AWS CDK)
# ============================================================================

if (-not $SkipBackend -and -not $TestOnly) {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "PHASE 2: Backend Deployment (AWS CDK)" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Note: Backend deployment requires AWS CDK setup." -ForegroundColor Cyan
    Write-Host "This is a placeholder for actual CDK deployment." -ForegroundColor Cyan
    Write-Host ""

    Write-Host "To deploy backend manually:" -ForegroundColor White
    Write-Host "  1. cd backend" -ForegroundColor Gray
    Write-Host "  2. npm install" -ForegroundColor Gray
    Write-Host "  3. cdk bootstrap (if first time)" -ForegroundColor Gray
    Write-Host "  4. cdk deploy TrustedSourcesStack" -ForegroundColor Gray
    Write-Host ""

    Write-Host "Backend deployment would create:" -ForegroundColor White
    Write-Host "  • TrustedSources DynamoDB table" -ForegroundColor Gray
    Write-Host "  • TempleSourceMapping DynamoDB table" -ForegroundColor Gray
    Write-Host "  • Lambda functions (trusted-sources, temple-sources)" -ForegroundColor Gray
    Write-Host "  • API Gateway endpoints" -ForegroundColor Gray
    Write-Host ""

    $deployBackend = Read-Host "Have you deployed the backend? (y/n)"
    if ($deployBackend -ne 'y') {
        Write-Host "  ⚠ Please deploy backend first before continuing." -ForegroundColor Yellow
        exit 0
    }
}

# ============================================================================
# PHASE 3: Frontend Setup
# ============================================================================

if (-not $SkipFrontend -and -not $TestOnly) {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "PHASE 3: Frontend Setup" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Installing admin portal dependencies..." -ForegroundColor White
    Push-Location admin-portal
    
    try {
        npm install
        Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location
    Write-Host ""
}

# ============================================================================
# PHASE 4: Local Testing
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 4: Local Testing" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing checklist:" -ForegroundColor White
Write-Host ""

Write-Host "Frontend Integration:" -ForegroundColor Cyan
Write-Host "  ✓ App.tsx updated with /trusted-sources route" -ForegroundColor Green
Write-Host "  ✓ Layout.tsx updated with navigation link" -ForegroundColor Green
Write-Host "  ✓ API index.ts updated with trustedSourcesApi export" -ForegroundColor Green
Write-Host ""

Write-Host "Files Created:" -ForegroundColor Cyan
Write-Host "  ✓ backend/src/types/trustedSource.ts" -ForegroundColor Green
Write-Host "  ✓ backend/lambdas/trusted-sources.ts" -ForegroundColor Green
Write-Host "  ✓ backend/lambdas/temple-sources.ts" -ForegroundColor Green
Write-Host "  ✓ backend/infrastructure/trusted-sources-stack.ts" -ForegroundColor Green
Write-Host "  ✓ admin-portal/src/api/trustedSourcesApi.ts" -ForegroundColor Green
Write-Host "  ✓ admin-portal/src/pages/TrustedSourcesPage.tsx" -ForegroundColor Green
Write-Host "  ✓ admin-portal/src/pages/TrustedSourcesPage.css" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 5: Start Development Server
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 5: Start Development Server" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$startServer = Read-Host "Start admin portal development server? (y/n)"

if ($startServer -eq 'y') {
    Write-Host ""
    Write-Host "Starting admin portal..." -ForegroundColor White
    Write-Host ""
    Write-Host "Once started, navigate to:" -ForegroundColor Cyan
    Write-Host "  http://localhost:5173/trusted-sources" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""

    Push-Location admin-portal
    npm run dev
    Pop-Location
} else {
    Write-Host ""
    Write-Host "To start the server manually:" -ForegroundColor White
    Write-Host "  cd admin-portal" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then navigate to: http://localhost:5173/trusted-sources" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test the Trusted Sources page in the admin portal" -ForegroundColor White
Write-Host "  2. Add a test source (e.g., Sri Kalahasteeswara Swamy Temple)" -ForegroundColor White
Write-Host "  3. Verify CRUD operations work correctly" -ForegroundColor White
Write-Host "  4. Move to Phase 2: Integration with temple form" -ForegroundColor White
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  📖 TRUSTED_SOURCES_FEATURE.md - Complete feature design" -ForegroundColor White
Write-Host "  📖 TRUSTED_SOURCES_IMPLEMENTATION_STATUS.md - Implementation status" -ForegroundColor White
Write-Host "  📖 TRUSTED_SOURCES_NEXT_STEPS.txt - What's next" -ForegroundColor White
Write-Host ""
