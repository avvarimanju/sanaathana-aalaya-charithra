# Check Expo and SDK Versions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Expo Version Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Expo CLI version
Write-Host "Expo CLI Version:" -ForegroundColor Yellow
npx expo --version

Write-Host ""

# Check project SDK version
Write-Host "Project SDK Version:" -ForegroundColor Yellow
$packageJson = Get-Content package.json | ConvertFrom-Json
$expoVersion = $packageJson.dependencies.expo
Write-Host "  Expo SDK: $expoVersion" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Compatibility Info" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your project uses Expo SDK ~55" -ForegroundColor White
Write-Host ""
Write-Host "Expo Go Requirements:" -ForegroundColor Yellow
Write-Host "  - iOS: Expo Go 2.32.0 or newer" -ForegroundColor White
Write-Host "  - Android: Expo Go 2.32.0 or newer" -ForegroundColor White
Write-Host ""
Write-Host "To check your Expo Go version:" -ForegroundColor Yellow
Write-Host "  1. Open Expo Go app on your phone" -ForegroundColor White
Write-Host "  2. Look at the bottom of the screen" -ForegroundColor White
Write-Host "  3. You'll see version number (e.g., 2.32.1)" -ForegroundColor White
Write-Host ""
Write-Host "If your Expo Go is older:" -ForegroundColor Yellow
Write-Host "  - Update from App Store (iOS)" -ForegroundColor White
Write-Host "  - Update from Play Store (Android)" -ForegroundColor White
Write-Host ""
