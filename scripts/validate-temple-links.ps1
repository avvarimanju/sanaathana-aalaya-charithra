# Validate Temple Links
# Checks all URLs in temple data and documentation for validity
# Usage: .\scripts\validate-temple-links.ps1

param(
    [switch]$CheckAll,
    [string]$FilePath
)

Write-Host "=== Temple Link Validator ===" -ForegroundColor Cyan
Write-Host ""

# Function to validate URL format
function Test-UrlFormat {
    param([string]$Url)
    
    $issues = @()
    
    # Check for spaces
    if ($Url -match '\s') {
        $issues += "Contains spaces"
    }
    
    # Check for HTTPS
    if ($Url -notmatch '^https://') {
        $issues += "Not using HTTPS protocol"
    }
    
    # Check for common typos
    if ($Url -match 'http://https://') {
        $issues += "Duplicate protocol"
    }
    
    # Check for missing protocol
    if ($Url -notmatch '^https?://') {
        $issues += "Missing protocol"
    }
    
    return $issues
}

# Function to extract URLs from file
function Get-UrlsFromFile {
    param([string]$Path)
    
    $content = Get-Content $Path -Raw
    $urlPattern = 'https?://[^\s\)\]\>"]+'
    $urls = [regex]::Matches($content, $urlPattern) | ForEach-Object { $_.Value }
    
    return $urls
}

# Function to validate URL accessibility (optional - requires internet)
function Test-UrlAccessibility {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        return @{
            Accessible = $true
            StatusCode = $response.StatusCode
        }
    }
    catch {
        return @{
            Accessible = $false
            Error = $_.Exception.Message
        }
    }
}

# Main validation logic
$filesToCheck = @()

if ($FilePath) {
    $filesToCheck += $FilePath
}
elseif ($CheckAll) {
    # Check all documentation files
    $filesToCheck += Get-ChildItem -Path "." -Recurse -Include "*.md","*.json" | Where-Object {
        $_.FullName -notmatch '\\node_modules\\' -and
        $_.FullName -notmatch '\\.git\\' -and
        $_.FullName -notmatch '\\.expo\\' -and
        $_.FullName -notmatch '\\.pre-generation\\'
    } | Select-Object -ExpandProperty FullName
}
else {
    # Check key temple files
    $filesToCheck = @(
        "TEMPLE_NAMING_STANDARDS.md",
        "VERIFIED_TEMPLE_RESOURCES.md",
        "data/temples-sample.json",
        "TEMPLE_ID_FORMAT_GUIDE.md"
    )
}

Write-Host "Checking $($filesToCheck.Count) file(s)..." -ForegroundColor Yellow
Write-Host ""

$totalIssues = 0
$totalUrls = 0

foreach ($file in $filesToCheck) {
    if (-not (Test-Path $file)) {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📄 Checking: $file" -ForegroundColor Cyan
    
    $urls = Get-UrlsFromFile -Path $file
    $totalUrls += $urls.Count
    
    if ($urls.Count -eq 0) {
        Write-Host "   No URLs found" -ForegroundColor Gray
        continue
    }
    
    $fileIssues = 0
    
    foreach ($url in $urls) {
        $issues = Test-UrlFormat -Url $url
        
        if ($issues.Count -gt 0) {
            $fileIssues++
            $totalIssues++
            Write-Host "   ❌ $url" -ForegroundColor Red
            foreach ($issue in $issues) {
                Write-Host "      - $issue" -ForegroundColor Red
            }
        }
    }
    
    if ($fileIssues -eq 0) {
        Write-Host "   ✅ All $($urls.Count) URL(s) valid" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Found $fileIssues issue(s)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Summary
Write-Host "=== Validation Summary ===" -ForegroundColor Cyan
Write-Host "Total URLs checked: $totalUrls" -ForegroundColor White
Write-Host "Total issues found: $totalIssues" -ForegroundColor $(if ($totalIssues -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($totalIssues -eq 0) {
    Write-Host "✅ All URLs are valid!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ Please fix the issues above" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Remove spaces from URLs" -ForegroundColor White
    Write-Host "  2. Use HTTPS instead of HTTP" -ForegroundColor White
    Write-Host "  3. Add protocol (https://) if missing" -ForegroundColor White
    Write-Host "  4. Check for typos" -ForegroundColor White
    Write-Host ""
    Write-Host "Refer to VERIFIED_TEMPLE_RESOURCES.md for correct URLs" -ForegroundColor Cyan
    exit 1
}
