# Fix Temple State Assignments
# The GitHub data has temples assigned to wrong states
# This script extracts the correct state from the description

Write-Host "Fixing temple state assignments..." -ForegroundColor Cyan

# Load the data
$temples = Get-Content "data/temples-github-transformed.json" -Raw | ConvertFrom-Json

# Valid Indian states
$validStates = @(
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
)

$fixed = 0
$couldNotFix = 0
$alreadyCorrect = 0

foreach ($temple in $temples) {
    $originalState = $temple.location.state
    $correctState = $null
    
    # Try to extract state from description
    if ($temple.description -match 'Location:\s*([^,]+),\s*([^,\n]+),\s*India') {
        $extractedState = $matches[2].Trim()
        if ($validStates -contains $extractedState) {
            $correctState = $extractedState
        }
    }
    
    # Try to extract from info field if available
    if (-not $correctState -and $temple.description -match '([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*India') {
        $extractedState = $matches[1].Trim()
        if ($validStates -contains $extractedState) {
            $correctState = $extractedState
        }
    }
    
    if ($correctState) {
        if ($correctState -ne $originalState) {
            Write-Host "  Fixing: $($temple.name)" -ForegroundColor Yellow
            Write-Host "    From: $originalState -> To: $correctState" -ForegroundColor Gray
            $temple.location.state = $correctState
            $fixed++
        } else {
            $alreadyCorrect++
        }
    } else {
        Write-Host "  ⚠️  Could not determine correct state for: $($temple.name)" -ForegroundColor Red
        $couldNotFix++
    }
}

# Save fixed data
$temples | ConvertTo-Json -Depth 10 | Set-Content "data/temples-github-fixed.json" -Encoding UTF8

Write-Host "`n✅ State fixing complete!" -ForegroundColor Green
Write-Host "Fixed: $fixed temples" -ForegroundColor Cyan
Write-Host "Already correct: $alreadyCorrect temples" -ForegroundColor Cyan
Write-Host "Could not fix: $couldNotFix temples" -ForegroundColor Yellow

# Show state distribution after fix
Write-Host "`nTemples by state (after fix):" -ForegroundColor Yellow
$temples | Group-Object { $_.location.state } | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count)" -ForegroundColor White
}
