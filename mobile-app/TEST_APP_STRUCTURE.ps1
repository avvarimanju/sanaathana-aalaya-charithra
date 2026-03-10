# Test Mobile App Structure
# Verifies all required files exist

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Mobile App Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check critical files
$criticalFiles = @(
    "App.tsx",
    "index.js",
    "package.json",
    "tsconfig.json",
    "babel.config.js",
    "metro.config.js"
)

Write-Host "Checking critical files..." -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "Checking screens..." -ForegroundColor Yellow
$screens = @(
    "src/screens/SplashScreen.tsx",
    "src/screens/WelcomeScreen.tsx",
    "src/screens/LoginScreen.tsx",
    "src/screens/ExploreScreen.tsx",
    "src/screens/TempleDetailsScreen.tsx"
)

foreach ($screen in $screens) {
    if (Test-Path $screen) {
        Write-Host "  ✓ $screen" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $screen MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  All files present! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to start the app!" -ForegroundColor Cyan
    Write-Host "Run: ./START_APP_FIXED.ps1" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Some files are missing! ✗" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the missing files above." -ForegroundColor Yellow
}
