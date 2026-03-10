# Mobile App - Complete Fix and Start Script
# This script fixes common issues and starts the app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mobile App - Complete Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to mobile-app directory
Set-Location -Path $PSScriptRoot

Write-Host "Step 1: Removing node_modules and package-lock..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

Write-Host "Step 2: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Step 3: Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 3b: Forcing React version consistency..." -ForegroundColor Yellow
npm install react@18.3.1 react-dom@18.3.1 --save-exact
npm install @types/react@18.3.1 --save-dev --save-exact

Write-Host "Step 4: Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
}

Write-Host "Step 5: Starting app with clean cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  App Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  - Press 'w' to open in web browser" -ForegroundColor White
Write-Host "  - Press 'i' to open in iOS simulator" -ForegroundColor White
Write-Host "  - Press 'a' to open in Android emulator" -ForegroundColor White
Write-Host "  - Scan QR code with Expo Go app on your phone" -ForegroundColor White
Write-Host ""
