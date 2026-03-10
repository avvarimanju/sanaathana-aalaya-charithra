# Get SHA256 Fingerprint from Existing Keystore
# Quick script to extract the SHA256 fingerprint

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get SHA256 Fingerprint" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$keystorePath = "charithra-release.keystore"

if (-not (Test-Path $keystorePath)) {
    Write-Host "✗ Keystore file not found: $keystorePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're in the Sanaathana-Aalaya-Charithra directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found keystore: $keystorePath" -ForegroundColor Green
Write-Host ""
Write-Host "Enter keystore password: " -NoNewline -ForegroundColor Cyan
$storePass = Read-Host -AsSecureString
$storePassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePass))

Write-Host ""
Write-Host "Getting certificate information..." -ForegroundColor Yellow
Write-Host ""

try {
    # Run keytool and capture output
    $output = & keytool -list -v -keystore $keystorePath -alias charithra-key -storepass $storePassPlain 2>&1 | Out-String
    
    # Display full output
    Write-Host $output
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "LOOK FOR THE SHA256 LINE ABOVE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "It should look like:" -ForegroundColor Yellow
    Write-Host "SHA256: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copy the ENTIRE line after 'SHA256:' (including all the colons)" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to extract SHA256
    if ($output -match "SHA256:\s*([A-F0-9:]+)") {
        $sha256 = $matches[1]
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "YOUR SHA256 FINGERPRINT:" -ForegroundColor Green
        Write-Host $sha256 -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Copy this fingerprint and tell me:" -ForegroundColor Cyan
        Write-Host "My Android SHA256 is: $sha256" -ForegroundColor White
        Write-Host ""
        
        # Update the info file
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
        
        Write-Host "✓ Updated: $infoFile" -ForegroundColor Green
    } else {
        Write-Host "Could not automatically extract SHA256." -ForegroundColor Yellow
        Write-Host "Please look at the output above and find the SHA256 line manually." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ Error getting fingerprint" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
