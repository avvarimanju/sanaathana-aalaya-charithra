# Setup Deep Linking - Quick Start Script
# This script helps you set up and test deep linking

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deep Linking Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the mobile-app directory
if (-not (Test-Path "package.json")) {
    Write-Host "✗ Not in mobile-app directory!" -ForegroundColor Red
    Write-Host "Please run this script from the mobile-app folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ In mobile-app directory" -ForegroundColor Green
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Installing expo-linking..." -ForegroundColor Cyan
    npm install expo-linking
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "What's Next?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test locally:" -ForegroundColor Yellow
Write-Host "   npx expo start" -ForegroundColor White
Write-Host ""
Write-Host "2. Test deep link:" -ForegroundColor Yellow
Write-Host "   npx uri-scheme open `"https://charithra.org/temple/test`" --android" -ForegroundColor White
Write-Host ""
Write-Host "3. Build for testing:" -ForegroundColor Yellow
Write-Host "   eas build --platform android --profile preview" -ForegroundColor White
Write-Host ""
Write-Host "4. Build for production:" -ForegroundColor Yellow
Write-Host "   eas build --platform android --profile production" -ForegroundColor White
Write-Host ""

Write-Host "Documentation: DEEP_LINKING_CONFIGURED.md" -ForegroundColor Cyan
Write-Host ""
