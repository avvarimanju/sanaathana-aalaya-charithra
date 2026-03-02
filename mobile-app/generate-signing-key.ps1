# Generate App Signing Key for Sanaathana Aalaya Charithra
# This script helps you create a signing key for your Android app

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Sanaathana Aalaya Charithra" -ForegroundColor Cyan
Write-Host "  App Signing Key Generator" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keytool is available
Write-Host "Checking if keytool is available..." -ForegroundColor Yellow
try {
    $keytoolVersion = keytool -help 2>&1
    Write-Host "✓ keytool found!" -ForegroundColor Green
} catch {
    Write-Host "✗ keytool not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to install Java JDK first:" -ForegroundColor Yellow
    Write-Host "  Option 1: choco install openjdk" -ForegroundColor White
    Write-Host "  Option 2: Download from https://www.oracle.com/java/technologies/downloads/" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Check if keystore already exists
if (Test-Path "sanaathana-release-key.keystore") {
    Write-Host "⚠️  WARNING: Keystore file already exists!" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Exiting without changes." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item "sanaathana-release-key.keystore"
    Write-Host "Old keystore deleted." -ForegroundColor Green
    Write-Host ""
}

# Explain what we're doing
Write-Host "This script will create a signing key for your Android app." -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll be asked for:" -ForegroundColor White
Write-Host "  1. A password (SAVE THIS!)" -ForegroundColor White
Write-Host "  2. Your name" -ForegroundColor White
Write-Host "  3. Organization details" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save the password in a secure location!" -ForegroundColor Red
Write-Host "⚠️  You'll need it for ALL future app updates!" -ForegroundColor Red
Write-Host ""

$continue = Read-Host "Ready to continue? (yes/no)"
if ($continue -ne "yes") {
    Write-Host "Exiting." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Generating Signing Key..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Run keytool command
Write-Host "Running keytool command..." -ForegroundColor Yellow
Write-Host ""

keytool -genkeypair -v -storetype PKCS12 `
  -keystore sanaathana-release-key.keystore `
  -alias sanaathana-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

Write-Host ""

# Check if keystore was created
if (Test-Path "sanaathana-release-key.keystore") {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  ✓ SUCCESS!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Keystore file created: sanaathana-release-key.keystore" -ForegroundColor Green
    Write-Host ""
    
    # Get file info
    $fileInfo = Get-Item "sanaathana-release-key.keystore"
    Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor White
    Write-Host "Created: $($fileInfo.CreationTime)" -ForegroundColor White
    Write-Host ""
    
    # Create credentials template
    Write-Host "Creating credentials template..." -ForegroundColor Yellow
    
    $credentialsTemplate = @"
===========================================
SANAATHANA AALAYA CHARITHRA
APP SIGNING KEY CREDENTIALS
===========================================

⚠️ KEEP THIS FILE SECURE AND PRIVATE! ⚠️
⚠️ DO NOT COMMIT TO GIT! ⚠️
⚠️ BACKUP TO MULTIPLE LOCATIONS! ⚠️

Keystore File: sanaathana-release-key.keystore
Keystore Password: [ENTER YOUR PASSWORD HERE]
Key Alias: sanaathana-key
Key Password: [SAME AS KEYSTORE PASSWORD]

Created Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Created By: [Your Name]

Organization Details:
- Name: Sanaathana Aalaya Charithra
- City: [Your City]
- State: [Your State]
- Country: IN

===========================================
BACKUP LOCATIONS:
===========================================
1. [ ] USB Drive
2. [ ] Cloud Storage (encrypted)
3. [ ] Password Manager
4. [ ] Physical Paper (in safe)

===========================================
IMPORTANT NOTES:
===========================================
- This key is required for ALL future app updates
- If you lose this key, you CANNOT update your app
- You'll have to create a new app with a new package name
- All existing users will have to uninstall and reinstall
- Keep multiple backups in secure locations

===========================================
NEXT STEPS:
===========================================
1. Fill in your password above
2. Save this file securely
3. Backup the keystore file to multiple locations
4. Add both files to .gitignore
5. Continue to Step 2: Configure EAS Build
"@

    $credentialsTemplate | Out-File -FilePath "KEYSTORE_CREDENTIALS.txt" -Encoding UTF8
    Write-Host "✓ Created KEYSTORE_CREDENTIALS.txt" -ForegroundColor Green
    Write-Host ""
    
    # Check .gitignore
    Write-Host "Checking .gitignore..." -ForegroundColor Yellow
    
    $gitignoreContent = ""
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
    }
    
    $needsUpdate = $false
    $gitignoreAdditions = @()
    
    if ($gitignoreContent -notmatch "\.keystore") {
        $gitignoreAdditions += "*.keystore"
        $needsUpdate = $true
    }
    
    if ($gitignoreContent -notmatch "\.jks") {
        $gitignoreAdditions += "*.jks"
        $needsUpdate = $true
    }
    
    if ($gitignoreContent -notmatch "KEYSTORE_CREDENTIALS") {
        $gitignoreAdditions += "KEYSTORE_CREDENTIALS.txt"
        $needsUpdate = $true
    }
    
    if ($needsUpdate) {
        Write-Host "Updating .gitignore..." -ForegroundColor Yellow
        
        if (-not (Test-Path ".gitignore")) {
            New-Item ".gitignore" -ItemType File | Out-Null
        }
        
        Add-Content ".gitignore" "`n# App Signing Keys (DO NOT COMMIT!)"
        foreach ($addition in $gitignoreAdditions) {
            Add-Content ".gitignore" $addition
        }
        
        Write-Host "✓ Updated .gitignore" -ForegroundColor Green
    } else {
        Write-Host "✓ .gitignore already configured" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  IMPORTANT: NEXT STEPS" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open KEYSTORE_CREDENTIALS.txt" -ForegroundColor Yellow
    Write-Host "2. Fill in your password" -ForegroundColor Yellow
    Write-Host "3. Save the file securely" -ForegroundColor Yellow
    Write-Host "4. Backup both files to:" -ForegroundColor Yellow
    Write-Host "   - USB drive" -ForegroundColor White
    Write-Host "   - Cloud storage (encrypted)" -ForegroundColor White
    Write-Host "   - Password manager" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Verify the key works:" -ForegroundColor Yellow
    Write-Host "   keytool -list -v -keystore sanaathana-release-key.keystore" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Continue to Step 2: Configure EAS Build" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Step 1 Complete! ✓" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "  ✗ FAILED" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Keystore file was not created." -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    exit 1
}
