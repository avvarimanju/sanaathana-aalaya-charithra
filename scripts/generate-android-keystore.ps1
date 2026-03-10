# Generate Android Keystore for Charithra App
# This creates a release keystore for signing your Android app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android Keystore Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keytool is available
try {
    $keytoolVersion = keytool -help 2>&1 | Out-Null
    Write-Host "✓ keytool found" -ForegroundColor Green
} catch {
    Write-Host "✗ keytool not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "keytool is part of Java JDK. Please install Java JDK first:" -ForegroundColor Yellow
    Write-Host "https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "This script will generate a keystore file for your Android app." -ForegroundColor Yellow
Write-Host "You'll need to provide some information..." -ForegroundColor Yellow
Write-Host ""

# Get user input
Write-Host "Enter keystore password (remember this!): " -NoNewline -ForegroundColor Cyan
$storePass = Read-Host -AsSecureString
$storePassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePass))

Write-Host "Enter key password (can be same as keystore password): " -NoNewline -ForegroundColor Cyan
$keyPass = Read-Host -AsSecureString
$keyPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPass))

Write-Host ""
Write-Host "Enter your name: " -NoNewline -ForegroundColor Cyan
$name = Read-Host

Write-Host "Enter your organization (e.g., Charithra): " -NoNewline -ForegroundColor Cyan
$org = Read-Host

Write-Host "Enter your city: " -NoNewline -ForegroundColor Cyan
$city = Read-Host

Write-Host "Enter your state: " -NoNewline -ForegroundColor Cyan
$state = Read-Host

Write-Host "Enter your country code (e.g., IN): " -NoNewline -ForegroundColor Cyan
$country = Read-Host

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Yellow

# Generate keystore
$keystorePath = "charithra-release.keystore"
$dname = "CN=$name, OU=Mobile, O=$org, L=$city, ST=$state, C=$country"

$command = "keytool -genkeypair -v -storetype PKCS12 -keystore $keystorePath -alias charithra-key -keyalg RSA -keysize 2048 -validity 10000 -storepass `"$storePassPlain`" -keypass `"$keyPassPlain`" -dname `"$dname`""

try {
    Invoke-Expression $command
    Write-Host ""
    Write-Host "✓ Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Keystore file: $keystorePath" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "✗ Failed to generate keystore" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Get SHA256 fingerprint
Write-Host "Getting SHA256 fingerprint..." -ForegroundColor Yellow
Write-Host ""

$fingerprintCommand = "keytool -list -v -keystore $keystorePath -alias charithra-key -storepass `"$storePassPlain`""

try {
    $output = Invoke-Expression $fingerprintCommand
    Write-Host $output
    Write-Host ""
    
    # Extract SHA256
    $sha256Line = $output | Select-String -Pattern "SHA256:"
    if ($sha256Line) {
        $sha256 = $sha256Line.ToString().Split(":")[1].Trim()
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "YOUR SHA256 FINGERPRINT:" -ForegroundColor Green
        Write-Host $sha256 -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Save this information!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Keystore file: $keystorePath" -ForegroundColor Cyan
        Write-Host "Alias: charithra-key" -ForegroundColor Cyan
        Write-Host "Store password: (the password you entered)" -ForegroundColor Cyan
        Write-Host "Key password: (the password you entered)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next step: Tell Kiro your SHA256 fingerprint!" -ForegroundColor Yellow
        Write-Host "Say: 'My Android SHA256 is: $sha256'" -ForegroundColor Yellow
        Write-Host ""
        
        # Save to file
        $infoFile = "keystore-info.txt"
        @"
Charithra Android Keystore Information
Generated: $(Get-Date)

Keystore file: $keystorePath
Alias: charithra-key
SHA256 Fingerprint: $sha256

IMPORTANT: Keep your passwords safe!
Store password: (you entered this)
Key password: (you entered this)

Next steps:
1. Keep this keystore file safe (backup it!)
2. Update assetlinks.json with the SHA256 fingerprint
3. Deploy to Cloudflare Pages
"@ | Out-File -FilePath $infoFile -Encoding UTF8
        
        Write-Host "✓ Information saved to: $infoFile" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "✗ Failed to get fingerprint" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "Done!" -ForegroundColor Green
