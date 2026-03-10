# Transform GitHub Hindu Temples Data to Our Format
# Source: https://github.com/ShashiTharoor/hindu-temples
# License: MIT License - Free to use with attribution

Write-Host "Transforming GitHub temple data..." -ForegroundColor Cyan

# Read the raw GitHub data
$githubData = Get-Content "data/temples-github-raw.json" -Raw | ConvertFrom-Json

# Initialize output array
$temples = @()
$templeId = 1

# Process each state
foreach ($stateName in $githubData.PSObject.Properties.Name) {
    $stateTemples = $githubData.$stateName
    
    Write-Host "Processing $stateName - $($stateTemples.Count) temples" -ForegroundColor Yellow
    
    foreach ($temple in $stateTemples) {
        # Generate temple ID
        $id = "TMPL-GH-" + $templeId.ToString("D4")
        
        # Extract city from info or name
        $city = ""
        if ($temple.info -match "Location:\s*([^,\n]+),") {
            $city = $matches[1].Trim()
        }
        
        # Create temple object in our format
        $templeObj = [PSCustomObject]@{
            templeId = $id
            name = $temple.name
            description = if ($temple.info) { 
                # Clean up the info - remove markdown and limit length
                $cleanInfo = $temple.info -replace '\*\*', '' -replace '\n\n+', ' ' -replace '\n', ' '
                if ($cleanInfo.Length > 500) {
                    $cleanInfo.Substring(0, 497) + "..."
                } else {
                    $cleanInfo
                }
            } else { "" }
            location = [PSCustomObject]@{
                state = $stateName
                city = $city
                district = ""
                address = ""
                pincode = ""
                coordinates = $null
            }
            deity = ""  # Not in source data
            architecture = if ($temple.architecture) { 
                $arch = $temple.architecture -replace '\*\*', '' -replace '\n\n+', ' ' -replace '\n', ' '
                if ($arch.Length > 300) {
                    $arch.Substring(0, 297) + "..."
                } else {
                    $arch
                }
            } else { "" }
            history = if ($temple.story) { 
                $hist = $temple.story -replace '\*\*', '' -replace '\n\n+', ' ' -replace '\n', ' '
                if ($hist.Length > 500) {
                    $hist.Substring(0, 497) + "..."
                } else {
                    $hist
                }
            } else { "" }
            visitingGuide = if ($temple.visiting_guide) { 
                $guide = $temple.visiting_guide -replace '\*\*', '' -replace '\n\n+', ' ' -replace '\n', ' '
                if ($guide.Length > 500) {
                    $guide.Substring(0, 497) + "..."
                } else {
                    $guide
                }
            } else { "" }
            scriptureReference = if ($temple.mention_in_scripture) { 
                $ref = $temple.mention_in_scripture -replace '\*\*', '' -replace '\n\n+', ' ' -replace '\n', ' '
                if ($ref.Length > 300) {
                    $ref.Substring(0, 297) + "..."
                } else {
                    $ref
                }
            } else { "" }
            accessMode = "FREE"
            status = "active"
            imageUrl = ""
            qrCodeImageUrl = ""
            officialWebsite = ""
            contactNumber = ""
            timings = ""
            entryFee = ""
            facilities = @()
            nearbyAttractions = @()
            bestTimeToVisit = ""
            dataSource = "GitHub: ShashiTharoor/hindu-temples"
            dataSourceUrl = "https://github.com/ShashiTharoor/hindu-temples"
            dataLicense = "MIT License"
            needsVerification = $false
            createdAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
            updatedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
            createdBy = "system"
            updatedBy = "system"
            version = 1
        }
        
        $temples += $templeObj
        $templeId++
    }
}

# Save transformed data
$outputPath = "data/temples-github-transformed.json"
$temples | ConvertTo-Json -Depth 10 | Set-Content $outputPath -Encoding UTF8

Write-Host "`n✅ Transformation complete!" -ForegroundColor Green
Write-Host "Total temples: $($temples.Count)" -ForegroundColor Cyan
Write-Host "Output file: $outputPath" -ForegroundColor Cyan

# Show state distribution
Write-Host "`nTemples by state:" -ForegroundColor Yellow
$temples | Group-Object { $_.location.state } | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count)" -ForegroundColor White
}

Write-Host "`n📝 Data Source Attribution:" -ForegroundColor Magenta
Write-Host "  Repository: https://github.com/ShashiTharoor/hindu-temples" -ForegroundColor White
Write-Host "  License: MIT License" -ForegroundColor White
Write-Host "  Attribution: Required (included in each temple record)" -ForegroundColor White
