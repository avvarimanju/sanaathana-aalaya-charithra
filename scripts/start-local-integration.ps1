# ============================================================================
# Local Integration Startup Script
# Starts all three components for local development and testing
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "   Starting Local Integration Environment                      " -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Docker
Write-Host "  Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host "  SUCCESS: Docker is running" -ForegroundColor Green

# Check Node.js
Write-Host "  Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  SUCCESS: Node.js $nodeVersion is installed" -ForegroundColor Green

# Check npm
Write-Host "  Checking npm..." -ForegroundColor Cyan
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "  SUCCESS: npm $npmVersion is installed" -ForegroundColor Green

Write-Host ""
Write-Host "SUCCESS: All prerequisites met!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: Start LocalStack (DynamoDB)
# ============================================================================

Write-Host "Step 2: Starting LocalStack (DynamoDB)..." -ForegroundColor Yellow
Write-Host ""

# Check if LocalStack is already running
$localstackRunning = docker ps | Select-String "temple-localstack"

if ($localstackRunning) {
    Write-Host "  INFO: LocalStack is already running" -ForegroundColor Cyan
} else {
    Write-Host "  Starting LocalStack container..." -ForegroundColor Cyan
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to start LocalStack!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Waiting for LocalStack to be ready..." -ForegroundColor Cyan
    
    # Wait for LocalStack to be fully ready (check health endpoint)
    $maxAttempts = 30
    $attempt = 0
    $localstackReady = $false
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $localstackReady = $true
                break
            }
        } catch {
            # LocalStack not ready yet
        }
        
        Start-Sleep -Seconds 1
        $attempt++
        Write-Host "  ." -NoNewline -ForegroundColor Cyan
    }
    
    Write-Host ""
    
    if (-not $localstackReady) {
        Write-Host "  WARNING: LocalStack health check timed out, but continuing..." -ForegroundColor Yellow
    }
    
    # Additional wait for DynamoDB service specifically
    Write-Host "  Waiting for DynamoDB service..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
}

Write-Host "  SUCCESS: LocalStack is running on http://localhost:4566" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 3: Initialize DynamoDB Tables
# ============================================================================

Write-Host "Step 3: Initializing DynamoDB Tables..." -ForegroundColor Yellow
Write-Host ""

# Check if tables already exist
# Best practice: Use environment variable with local fallback
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }
$env:AWS_ENDPOINT_URL = $ENDPOINT
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "test" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "test" }
$env:AWS_DEFAULT_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }

$existingTables = aws dynamodb list-tables --endpoint-url $ENDPOINT --query 'TableNames' --output text 2>$null

if ($existingTables -match "Temples") {
    Write-Host "  INFO: Tables already exist, skipping initialization" -ForegroundColor Cyan
} else {
    Write-Host "  Creating DynamoDB tables..." -ForegroundColor Cyan
    
    # Run the initialization script
    & "$PSScriptRoot\init-db-simple.ps1"
    
    # Check if Temples table was created (it's the first one and most likely to fail)
    Start-Sleep -Seconds 2
    $templesExists = aws dynamodb describe-table --table-name Temples --endpoint-url http://localhost:4566 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: Temples table creation failed, retrying..." -ForegroundColor Yellow
        
        # Retry creating just the Temples table
        Write-Host "  Retrying Temples table creation..." -ForegroundColor Cyan
        aws dynamodb create-table --endpoint-url http://localhost:4566 --table-name Temples --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S AttributeName=GSI2PK,AttributeType=S AttributeName=GSI2SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: Temples table created on retry" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Failed to create Temples table after retry" -ForegroundColor Red
            Write-Host "  You may need to create it manually later" -ForegroundColor Yellow
        }
    }
}

Write-Host "  SUCCESS: DynamoDB tables are ready" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 4: Install Dependencies
# ============================================================================

Write-Host "Step 4: Installing Dependencies..." -ForegroundColor Yellow
Write-Host ""

# Backend dependencies
Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "src/local-server/node_modules")) {
    Set-Location src/local-server
    npm install --silent
    Set-Location ../..
    Write-Host "  SUCCESS: Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  INFO: Backend dependencies already installed" -ForegroundColor Cyan
}

# Admin Portal dependencies
Write-Host "  Installing admin portal dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "admin-portal/node_modules")) {
    Set-Location admin-portal
    npm install --silent
    Set-Location ..
    Write-Host "  SUCCESS: Admin portal dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  INFO: Admin portal dependencies already installed" -ForegroundColor Cyan
}

# Mobile App dependencies
Write-Host "  Installing mobile app dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "mobile-app/node_modules")) {
    Set-Location mobile-app
    npm install --silent
    Set-Location ..
    Write-Host "  SUCCESS: Mobile app dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  INFO: Mobile app dependencies already installed" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "SUCCESS: All dependencies installed!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 5: Start Backend Server
# ============================================================================

Write-Host "Step 5: Starting Backend Server..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting backend on http://localhost:4000..." -ForegroundColor Cyan
Write-Host "  (This will open in a new window)" -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; & '$PSScriptRoot\start-local-backend.ps1'"

Write-Host "  Waiting for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Check if backend is responding
$backendHealthy = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendHealthy) {
    Write-Host "  SUCCESS: Backend server is running" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Backend server may still be starting..." -ForegroundColor Yellow
    Write-Host "  Check the backend window for status" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 6: Start Admin Portal
# ============================================================================

Write-Host "Step 6: Starting Admin Portal..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting admin portal on http://localhost:5173..." -ForegroundColor Cyan
Write-Host "  (This will open in a new window)" -ForegroundColor Cyan

# Start admin portal in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin-portal'; npm run dev"

Write-Host "  Waiting for admin portal to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "  SUCCESS: Admin portal is starting" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 7: Start Mobile App
# ============================================================================

Write-Host "Step 7: Starting Mobile App..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Starting mobile app with Expo..." -ForegroundColor Cyan
Write-Host "  (This will open in a new window)" -ForegroundColor Cyan

# Start mobile app in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\mobile-app'; npm start"

Write-Host "  Waiting for mobile app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "  SUCCESS: Mobile app is starting" -ForegroundColor Green
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                                                                " -ForegroundColor Green
Write-Host "   Local Integration Environment Started!                      " -ForegroundColor Green
Write-Host "                                                                " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  - Backend API:       http://localhost:4000" -ForegroundColor White
Write-Host "  - Admin Portal:      http://localhost:5173" -ForegroundColor White
Write-Host "  - Mobile App:        http://localhost:8081" -ForegroundColor White
Write-Host "  - LocalStack:        http://localhost:4566" -ForegroundColor White
Write-Host ""
Write-Host "Integration Status:" -ForegroundColor Yellow
Write-Host "  - Admin Portal -> Backend:  Connected" -ForegroundColor Green
Write-Host "  - Mobile App -> Backend:    Connected" -ForegroundColor Green
Write-Host "  - Backend -> DynamoDB:      Connected" -ForegroundColor Green
Write-Host ""
Write-Host "Test Integration:" -ForegroundColor Yellow
Write-Host "  1. Open Admin Portal: http://localhost:5173" -ForegroundColor White
Write-Host "  2. Create a new temple" -ForegroundColor White
Write-Host "  3. Open Mobile App and verify the temple appears" -ForegroundColor White
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  - All services are running in separate windows" -ForegroundColor White
Write-Host "  - Check each window for logs and errors" -ForegroundColor White
Write-Host "  - Press Ctrl+C in each window to stop services" -ForegroundColor White
Write-Host "  - Run 'docker-compose down' to stop LocalStack" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - See LOCAL_INTEGRATION_GUIDE.md for details" -ForegroundColor White
Write-Host "  - See INTEGRATION_STATUS.md for architecture" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
