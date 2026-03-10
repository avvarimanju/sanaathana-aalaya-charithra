# Diagnose Build Issues
# Run this to see detailed error information

Write-Host "Diagnosing build issues..." -ForegroundColor Cyan
Write-Host ""

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java version:" -ForegroundColor Yellow
java -version

Write-Host "`nChecking keystore file..." -ForegroundColor Yellow
if (Test-Path "sanaathana-release-key.keystore") {
    Write-Host "✓ Keystore file exists" -ForegroundColor Green
} else {
    Write-Host "✗ Keystore file NOT found" -ForegroundColor Red
}

Write-Host "`nChecking keystore.properties..." -ForegroundColor Yellow
if (Test-Path "android\keystore.properties") {
    Write-Host "✓ keystore.properties exists" -ForegroundColor Green
    Write-Host "Contents:" -ForegroundColor Cyan
    Get-Content "android\keystore.properties" | ForEach-Object {
        if ($_ -match "Password") {
            Write-Host "  $($_ -replace '=.*', '=****')" -ForegroundColor White
        } else {
            Write-Host "  $_" -ForegroundColor White
        }
    }
} else {
    Write-Host "✗ keystore.properties NOT found" -ForegroundColor Red
}

Write-Host "`nChecking Android SDK..." -ForegroundColor Yellow
if (Test-Path "android\local.properties") {
    Write-Host "✓ local.properties exists" -ForegroundColor Green
    Get-Content "android\local.properties" | Select-Object -First 5
} else {
    Write-Host "⚠ local.properties not found (may be auto-generated)" -ForegroundColor Yellow
}

Write-Host "`nRunning build with detailed output..." -ForegroundColor Yellow
Write-Host "This will show the actual error..." -ForegroundColor Cyan
Write-Host ""

Set-Location android
.\gradlew bundleRelease --info --stacktrace 2>&1 | Tee-Object -FilePath "..\build-log.txt"

Set-Location ..

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Build log saved to: build-log.txt" -ForegroundColor Yellow
Write-Host "Check the end of the file for error details" -ForegroundColor Yellow
