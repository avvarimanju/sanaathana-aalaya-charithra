# Mobile App - Clean Start Script
# This script clears cache and starts the app fresh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mobile App - Clean Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to mobile-app directory
Set-Location -Path $PSScriptRoot

Write-Host "Step 1: Clearing Metro bundler cache..." -ForegroundColor Yellow
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
