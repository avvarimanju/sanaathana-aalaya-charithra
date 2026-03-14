# ============================================================================
# Development Environment Startup Script
# Ensures backend server is running before starting admin portal
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Starting Development Environment                            " -ForegroundColor Cyan
Write-Host "   Backend API + Admin Portal + Mobile App                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check Docker Desktop
# ============================================================================

Write-Host "[1/7] Checking Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Docker Desktop is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Yellow
        Write-Host "  Docker Desktop is required for LocalStack (DynamoDB)." -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "  SUCCESS: Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Docker is not installed or not accessible!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "  https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: Start LocalStack Container
# ============================================================================

Write-Host "[2/7] Starting LocalStack (DynamoDB)..." -ForegroundColor Yellow

# Check if LocalStack is already running
$localstackRunning = docker ps --filter "name=temple-localstack" --filter "status=running" --format "{{.Names}}"

if ($localstackRunning -eq "temple-localstack") {
    Write-Host "  INFO: LocalStack is already running" -ForegroundColor Cyan
} else {
    Write-Host "  Starting LocalStack container..." -ForegroundColor Cyan
    
    # Start LocalStack using docker-compose
    docker-compose up -d 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to start LocalStack!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Try running: docker-compose up -d" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host "  Waiting for LocalStack to be ready..." -ForegroundColor Cyan
    
    # Wait for LocalStack health endpoint
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
            # Not ready yet
        }
        
        Start-Sleep -Seconds 1
        $attempt++
        
        if ($attempt % 5 -eq 0) {
            Write-Host "  Still waiting... ($attempt/$maxAttempts)" -ForegroundColor Cyan
        }
    }
    
    if (-not $localstackReady) {
        Write-Host "  WARNING: LocalStack health check timed out" -ForegroundColor Yellow
        Write-Host "  Continuing anyway, but there may be issues..." -ForegroundColor Yellow
    } else {
        Write-Host "  SUCCESS: LocalStack is ready" -ForegroundColor Green
    }
    
    # Additional wait for DynamoDB service
    Start-Sleep -Seconds 2
}

Write-Host "  LocalStack URL: http://localhost:4566" -ForegroundColor White
Write-Host ""

# ============================================================================
# STEP 3: Initialize DynamoDB Tables
# ============================================================================

Write-Host "[3/7] Initializing DynamoDB Tables..." -ForegroundColor Yellow

# Set AWS credentials for LocalStack
$env:AWS_ENDPOINT_URL = "http://localhost:4566"
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"

# Load AWS region from global config
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig
$env:AWS_DEFAULT_REGION = $config.AWS_REGION

# Check if tables already exist
$existingTables = aws dynamodb list-tables --endpoint-url http://localhost:4566 --query 'TableNames' --output text 2>$null

if ($existingTables -match "Temples") {
    Write-Host "  INFO: Tables already exist" -ForegroundColor Cyan
    Write-Host "  SUCCESS: DynamoDB is ready" -ForegroundColor Green
} else {
    Write-Host "  Creating DynamoDB tables..." -ForegroundColor Cyan
    
    # Run initialization script
    $initScript = Join-Path $PSScriptRoot "init-db-simple.ps1"
    if (Test-Path $initScript) {
        & $initScript 2>&1 | Out-Null
        
        # Verify Temples table was created
        Start-Sleep -Seconds 2
        $templesExists = aws dynamodb describe-table --table-name Temples --endpoint-url http://localhost:4566 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: DynamoDB tables created" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Table creation may have failed" -ForegroundColor Yellow
            Write-Host "  You may need to run: .\scripts\init-db-simple.ps1" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARNING: init-db-simple.ps1 not found" -ForegroundColor Yellow
        Write-Host "  Tables may need to be created manually" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================================================
# STEP 4: Start Backend Server
# ============================================================================

Write-Host "[4/7] Starting Backend Server..." -ForegroundColor Yellow

# Check if backend dependencies are installed
$backendPath = "backend/src/local-server"
if (-not (Test-Path "$backendPath/node_modules")) {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
    Push-Location $backendPath
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Dependencies installed" -ForegroundColor Green
}

# Check if port 4000 is already in use
$portInUse = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "  INFO: Backend server is already running on port 4000" -ForegroundColor Cyan
    $backendAlreadyRunning = $true
} else {
    Write-Host "  Starting backend on http://localhost:4000..." -ForegroundColor Cyan
    Write-Host "  (Opening in new window)" -ForegroundColor Cyan
    
    # Start backend in new window
    $backendScript = Join-Path $PSScriptRoot "start-local-backend.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; & '$backendScript'"
    
    $backendAlreadyRunning = $false
}

# Wait for backend health check
Write-Host "  Waiting for backend to be ready..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$backendHealthy = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        # Not ready yet
    }
    
    Start-Sleep -Seconds 1
    $attempt++
    
    if ($attempt % 5 -eq 0) {
        Write-Host "  Still waiting... ($attempt/$maxAttempts)" -ForegroundColor Cyan
    }
}

if ($backendHealthy) {
    Write-Host "  SUCCESS: Backend server is ready" -ForegroundColor Green
    Write-Host "  Backend URL: http://localhost:4000" -ForegroundColor White
} else {
    Write-Host "  ERROR: Backend server failed to start!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please check the backend window for errors." -ForegroundColor Yellow
    Write-Host "  Common issues:" -ForegroundColor Yellow
    Write-Host "    - Port 4000 is blocked by another application" -ForegroundColor White
    Write-Host "    - LocalStack is not accessible" -ForegroundColor White
    Write-Host "    - Missing dependencies" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 5: Start Admin Portal
# ============================================================================

Write-Host "[5/7] Starting Admin Portal..." -ForegroundColor Yellow

# Check if admin portal dependencies are installed
$adminPortalPath = "admin-portal"
if (-not (Test-Path "$adminPortalPath/node_modules")) {
    Write-Host "  Installing admin portal dependencies..." -ForegroundColor Cyan
    Push-Location $adminPortalPath
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Dependencies installed" -ForegroundColor Green
}

# Check if port 5173 is already in use
$portInUse = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "  INFO: Admin portal is already running on port 5173" -ForegroundColor Cyan
} else {
    Write-Host "  Starting admin portal on http://localhost:5173..." -ForegroundColor Cyan
    Write-Host "  (Opening in new window)" -ForegroundColor Cyan
    
    # Start admin portal in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin-portal'; npm run dev"
    
    # Wait for admin portal to start
    Write-Host "  Waiting for admin portal to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}

Write-Host "  SUCCESS: Admin portal is starting" -ForegroundColor Green
Write-Host "  Admin Portal URL: http://localhost:5173" -ForegroundColor White
Write-Host ""

# ============================================================================
# STEP 6: Start Mobile App
# ============================================================================

Write-Host "[6/7] Starting Mobile App..." -ForegroundColor Yellow

# Check if mobile app dependencies are installed
$mobileAppPath = "mobile-app"
if (-not (Test-Path "$mobileAppPath/node_modules")) {
    Write-Host "  Installing mobile app dependencies..." -ForegroundColor Cyan
    Push-Location $mobileAppPath
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  Dependencies installed" -ForegroundColor Green
}

# Check if Expo is already running (port 8081 for Metro bundler)
$portInUse = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "  INFO: Mobile app is already running on port 8081" -ForegroundColor Cyan
} else {
    Write-Host "  Starting mobile app with Expo..." -ForegroundColor Cyan
    Write-Host "  (Opening in new window)" -ForegroundColor Cyan
    
    # Start mobile app in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\mobile-app'; npx expo start"
    
    # Wait for Expo to start
    Write-Host "  Waiting for Expo to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}

Write-Host "  SUCCESS: Mobile app is starting" -ForegroundColor Green
Write-Host "  Expo DevTools: http://localhost:8081" -ForegroundColor White
Write-Host "  Scan QR code with Expo Go app to test on device" -ForegroundColor White
Write-Host ""

# ============================================================================
# STEP 7: Verify Connection
# ============================================================================

Write-Host "[7/7] Verifying Connection..." -ForegroundColor Yellow

# Test backend health endpoint one more time
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 5
    Write-Host "  SUCCESS: Backend is responding" -ForegroundColor Green
    Write-Host "  Backend Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "  Environment: $($healthResponse.environment)" -ForegroundColor White
} catch {
    Write-Host "  WARNING: Could not verify backend health" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   Development Environment Ready!                              " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Backend API:    http://localhost:4000" -ForegroundColor White
Write-Host "  Admin Portal:   http://localhost:5173" -ForegroundColor White
Write-Host "  Mobile App:     http://localhost:8081" -ForegroundColor White
Write-Host "  LocalStack:     http://localhost:4566" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  Admin Portal:" -ForegroundColor Cyan
Write-Host "    1. Open your browser to http://localhost:5173" -ForegroundColor White
Write-Host "    2. The admin portal should load without connection errors" -ForegroundColor White
Write-Host "    3. You should see the temples list load successfully" -ForegroundColor White
Write-Host ""
Write-Host "  Mobile App:" -ForegroundColor Cyan
Write-Host "    1. Open Expo DevTools at http://localhost:8081" -ForegroundColor White
Write-Host "    2. Scan QR code with Expo Go app on your phone" -ForegroundColor White
Write-Host "    3. Or press 'w' in the Expo window to open in web browser" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - If you see connection errors, check the backend window" -ForegroundColor White
Write-Host "  - Backend logs are in the separate PowerShell window" -ForegroundColor White
Write-Host "  - Admin portal logs are in its PowerShell window" -ForegroundColor White
Write-Host "  - Mobile app logs are in the Expo window" -ForegroundColor White
Write-Host ""
Write-Host "To Stop Services:" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+C in each PowerShell window (Backend, Admin, Mobile)" -ForegroundColor White
Write-Host "  - Run 'docker-compose down' to stop LocalStack" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
