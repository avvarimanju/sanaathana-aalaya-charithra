# Build AAB using Android Studio's Gradle
# This script sets up the environment and builds the release AAB

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sanaathana Aalaya Charithra - AAB Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set JAVA_HOME to Android Studio's bundled JDK
Write-Host "[1/5] Setting up Java environment..." -ForegroundColor Yellow

$androidStudioJDK = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $androidStudioJDK) {
    $env:JAVA_HOME = $androidStudioJDK
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    Write-Host "✓ Using Android Studio's JDK" -ForegroundColor Green
    java -version 2>&1 | Select-Object -First 1
} else {
    Write-Host "✗ Android Studio JDK not found at: $androidStudioJDK" -ForegroundColor Red
    Write-Host "  Please install Android Studio or update the path in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check keystore file exists
Write-Host "[2/6] Checking keystore file..." -ForegroundColor Yellow

if (-not (Test-Path "sanaathana-release-key.keystore")) {
    Write-Host "✗ Keystore file not found!" -ForegroundColor Red
    Write-Host "  Please run: .\generate-signing-key.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Keystore file exists" -ForegroundColor Green
Write-Host ""

# Step 3: Create keystore.properties if it doesn't exist
Write-Host "[3/6] Checking keystore configuration..." -ForegroundColor Yellow

$keystorePropsPath = "android\keystore.properties"
if (-not (Test-Path $keystorePropsPath)) {
    Write-Host "Creating keystore.properties file..." -ForegroundColor Cyan
    
    # Prompt for passwords securely
    Write-Host ""
    Write-Host "Please enter your keystore passwords:" -ForegroundColor White
    $storePassword = Read-Host "Keystore password" -AsSecureString
    $keyPassword = Read-Host "Key password" -AsSecureString
    
    # Convert secure strings to plain text for the properties file
    $storePwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))
    $keyPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))
    
    $keystoreContent = @"
storePassword=$storePwd
keyPassword=$keyPwd
keyAlias=sanaathana-key
storeFile=../sanaathana-release-key.keystore
"@
    
    Set-Content -Path $keystorePropsPath -Value $keystoreContent
    Write-Host "✓ keystore.properties created" -ForegroundColor Green
} else {
    Write-Host "✓ keystore.properties already exists" -ForegroundColor Green
}

Write-Host ""

# Step 4: Navigate to android directory
Write-Host "[4/6] Navigating to android directory..." -ForegroundColor Yellow
Set-Location -Path "android"
Write-Host "✓ Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 5: Clean previous builds
Write-Host "[5/6] Cleaning previous builds..." -ForegroundColor Yellow
.\gradlew clean 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Clean successful" -ForegroundColor Green
} else {
    Write-Host "⚠ Clean had warnings (continuing anyway)" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Build release AAB
Write-Host "[6/6] Building release AAB..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will take 10-20 minutes on first build..." -ForegroundColor Cyan
Write-Host "Gradle is downloading dependencies and compiling..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Progress:" -ForegroundColor White

.\gradlew bundleRelease --console=plain

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        $fileSize = (Get-Item $aabPath).Length / 1MB
        $fullPath = Resolve-Path $aabPath
        
        Write-Host "📦 AAB File Details:" -ForegroundColor Cyan
        Write-Host "   Location: $fullPath" -ForegroundColor White
        Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📱 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Go to https://play.google.com/console" -ForegroundColor White
        Write-Host "   2. Select your app (or create new app)" -ForegroundColor White
        Write-Host "   3. Go to: Testing → Internal testing" -ForegroundColor White
        Write-Host "   4. Click 'Create new release'" -ForegroundColor White
        Write-Host "   5. Upload the AAB file above" -ForegroundColor White
        Write-Host "   6. Add release notes and save" -ForegroundColor White
        Write-Host "   7. Review and roll out to internal testing" -ForegroundColor White
        Write-Host ""
        
        # Copy to easier location
        $easyPath = "..\app-release.aab"
        Copy-Item $aabPath $easyPath -Force
        Write-Host "✓ Also copied to: mobile-app\app-release.aab (for easy access)" -ForegroundColor Green
    }
} else {
    Write-Host "❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Check if keystore password is correct" -ForegroundColor White
    Write-Host "2. Ensure Android SDK is properly installed" -ForegroundColor White
    Write-Host "3. Try running: .\gradlew clean" -ForegroundColor White
    Write-Host "4. Check the error messages above" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed logs, run:" -ForegroundColor Cyan
    Write-Host "   .\gradlew bundleRelease --info" -ForegroundColor White
}

Write-Host ""
Set-Location ..
