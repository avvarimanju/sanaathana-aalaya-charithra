#!/usr/bin/env pwsh
# Simple Local Backend Server Startup (No LocalStack Required)
# Perfect for testing Trusted Sources and other in-memory features

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "   Starting Local Backend Server (Simple Mode)             " -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:PORT = "4000"
$env:NODE_ENV = "development"
$env:AWS_REGION = "ap-south-1"

# Navigate to local-server directory
$localServerPath = "src/local-server"

if (-not (Test-Path $localServerPath)) {
    Write-Host "[ERROR] Local server directory not found!" -ForegroundColor Red
    Write-Host "   Expected path: $localServerPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Navigating to: $localServerPath" -ForegroundColor Green
Set-Location $localServerPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[SUCCESS] Dependencies installed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Starting server..." -ForegroundColor Cyan
Write-Host "   Server URL:    http://localhost:4000" -ForegroundColor White
Write-Host "   Environment:   development" -ForegroundColor White
Write-Host "   Storage:       In-Memory (resets on restart)" -ForegroundColor White
Write-Host ""
Write-Host "[TIP] Open http://localhost:5173/trusted-sources in your browser" -ForegroundColor Yellow
Write-Host "      (Make sure admin portal is running: npm run dev)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start
