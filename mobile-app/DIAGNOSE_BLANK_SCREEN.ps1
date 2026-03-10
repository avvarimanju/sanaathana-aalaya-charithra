#!/usr/bin/env pwsh
# Diagnostic Script for Blank Screen Issue

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Mobile App - Blank Screen Diagnostic              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$mobileAppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $mobileAppDir

Write-Host "Running diagnostics..." -ForegroundColor Yellow
Write-Host ""

# Check 1: Entry point
Write-Host "1. Checking entry point..." -ForegroundColor Cyan
if (Test-Path "index.js") {
    Write-Host "   ✓ index.js exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ index.js missing!" -ForegroundColor Red
}

if (Test-Path "App.tsx") {
    Write-Host "   ✓ App.tsx exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ App.tsx missing!" -ForegroundColor Red
}
Write-Host ""

# Check 2: Package.json main field
Write-Host "2. Checking package.json..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "   Main entry: $($packageJson.main)" -ForegroundColor White
Write-Host ""

# Check 3: App.json entry point
Write-Host "3. Checking app.json..." -ForegroundColor Cyan
$appJson = Get-Content "app.json" | ConvertFrom-Json
if ($appJson.expo.entryPoint) {
    Write-Host "   Entry point: $($appJson.expo.entryPoint)" -ForegroundColor Yellow
    Write-Host "   ⚠ Custom entry point detected" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Using default entry point (index.js)" -ForegroundColor Green
}
Write-Host ""

# Check 4: React Navigation dependencies
Write-Host "4. Checking React Navigation..." -ForegroundColor Cyan
$deps = @(
    "@react-navigation/native",
    "@react-navigation/native-stack",
    "@react-navigation/bottom-tabs",
    "react-native-screens",
    "react-native-safe-area-context"
)

foreach ($dep in $deps) {
    if (Test-Path "node_modules/$dep") {
        Write-Host "   ✓ $dep installed" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $dep missing!" -ForegroundColor Red
    }
}
Write-Host ""

# Check 5: Screen files
Write-Host "5. Checking screen files..." -ForegroundColor Cyan
$screens = @(
    "src/screens/SplashScreen.tsx",
    "src/screens/WelcomeScreen.tsx",
    "src/screens/LoginScreen.tsx",
    "src/screens/ExploreScreen.tsx"
)

$missingScreens = 0
foreach ($screen in $screens) {
    if (Test-Path $screen) {
        Write-Host "   ✓ $screen" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $screen missing!" -ForegroundColor Red
        $missingScreens++
    }
}
Write-Host ""

# Check 6: Web configuration
Write-Host "6. Checking web configuration..." -ForegroundColor Cyan
if (Test-Path "web/index.html") {
    Write-Host "   ✓ web/index.html exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ web/index.html missing (optional)" -ForegroundColor Yellow
}

if (Test-Path "metro.config.js") {
    Write-Host "   ✓ metro.config.js exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ metro.config.js missing (optional)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($missingScreens -gt 0) {
    Write-Host "❌ ISSUE FOUND: Missing screen files" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
} elseif ($appJson.expo.entryPoint) {
    Write-Host "⚠ POTENTIAL ISSUE: Custom entry point" -ForegroundColor Yellow
    Write-Host "   The app.json has a custom entryPoint" -ForegroundColor Yellow
    Write-Host "   This might cause issues with Expo" -ForegroundColor Yellow
} else {
    Write-Host "✓ All checks passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test with simple app:" -ForegroundColor White
Write-Host "   - Rename App.tsx to App-Original.tsx" -ForegroundColor Gray
Write-Host "   - Rename App-Simple-Test.tsx to App.tsx" -ForegroundColor Gray
Write-Host "   - Run: npx expo start --web --offline" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check browser console:" -ForegroundColor White
Write-Host "   - Open http://localhost:8081" -ForegroundColor Gray
Write-Host "   - Press F12" -ForegroundColor Gray
Write-Host "   - Look for errors in Console tab" -ForegroundColor Gray
Write-Host ""
Write-Host "3. If simple app works:" -ForegroundColor White
Write-Host "   - The issue is in App-Original.tsx" -ForegroundColor Gray
Write-Host "   - Check for import errors or missing dependencies" -ForegroundColor Gray
Write-Host ""
