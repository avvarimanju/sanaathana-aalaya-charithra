# Replace sanaathanaaalayacharithra.org with charithra.org
# This script updates all documentation files

$oldDomain = "sanaathanaaalayacharithra"
$newDomain = "charithra"

# Files to update
$files = @(
    "UNIVERSAL_LINKS_IMPLEMENTATION_GUIDE.md",
    "UNIVERSAL_LINKS_QUICK_START.md",
    "AWS_ROUTE53_ERROR_SOLUTION.md",
    "DOMAIN_REFACTOR_COMPLETE.md"
)

Write-Host "Replacing $oldDomain with $newDomain in documentation..." -ForegroundColor Cyan

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot "..\$file"
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw
        $updatedContent = $content -replace $oldDomain, $newDomain
        
        Set-Content -Path $filePath -Value $updatedContent -NoNewline
        
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDomain replacement complete!" -ForegroundColor Green
Write-Host "All references to $oldDomain.org have been replaced with $newDomain.org" -ForegroundColor Green
