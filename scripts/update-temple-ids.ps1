# Update Temple IDs to New Format
# Converts old format (temple_001) to new format (STATE_DISTRICT_CITY_temple-name)

param(
    [string]$InputFile = "data/temples-sample.json",
    [string]$OutputFile = "data/temples-updated.json"
)

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "              UPDATE TEMPLE IDS TO NEW FORMAT                                  " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# State codes mapping
$stateCodes = @{
    "Tamil Nadu" = "TN"
    "Andhra Pradesh" = "AP"
    "Karnataka" = "KA"
    "Kerala" = "KL"
    "Maharashtra" = "MH"
    "Gujarat" = "GJ"
    "Uttar Pradesh" = "UP"
    "Uttarakhand" = "UK"
    "Odisha" = "OD"
    "Madhya Pradesh" = "MP"
    "Telangana" = "TS"
    "Delhi" = "DL"
    "Punjab" = "PB"
    "Rajasthan" = "RJ"
    "Assam" = "AS"
    "West Bengal" = "WB"
    "Haryana" = "HR"
    "Himachal Pradesh" = "HP"
    "Jharkhand" = "JH"
    "Chhattisgarh" = "CG"
    "Goa" = "GA"
    "Bihar" = "BR"
    "Jammu & Kashmir" = "JK"
    "Puducherry" = "PY"
    "Chandigarh" = "CH"
}

# District codes mapping (simplified - first 3 letters)
function Get-DistrictCode {
    param([string]$District)
    if (-not $District) { return "UNK" }
    return $District.Substring(0, [Math]::Min(3, $District.Length)).ToUpper()
}

# City codes mapping (first 3 letters)
function Get-CityCode {
    param([string]$City)
    if (-not $City) { return "UNK" }
    return $City.Substring(0, [Math]::Min(3, $City.Length)).ToUpper()
}

# Convert temple name to kebab-case
function Get-TempleSlug {
    param([string]$TempleName)
    $slug = $TempleName.ToLower()
    $slug = $slug -replace '\s+', '-'
    $slug = $slug -replace '[^a-z0-9-]', ''
    return $slug
}

# Generate new temple ID
function Generate-TempleId {
    param(
        [string]$State,
        [string]$District,
        [string]$City,
        [string]$TempleName
    )
    
    $stateCode = $stateCodes[$State]
    if (-not $stateCode) {
        $stateCode = $State.Substring(0, 2).ToUpper()
    }
    
    $districtCode = Get-DistrictCode $District
    $cityCode = Get-CityCode $City
    $templeSlug = Get-TempleSlug $TempleName
    
    return "${stateCode}_${districtCode}_${cityCode}_${templeSlug}"
}

# Infer district from city (simplified mapping)
function Get-District {
    param([string]$City, [string]$State)
    
    # Common mappings
    $districtMap = @{
        "Thanjavur" = "Thanjavur"
        "Madurai" = "Madurai"
        "Tirupati" = "Chittoor"
        "Prabhas Patan" = "Gir Somnath"
        "Kedarnath" = "Rudraprayag"
        "Badrinath" = "Chamoli"
        "Puri" = "Puri"
        "Konark" = "Puri"
        "Varanasi" = "Varanasi"
        "Amritsar" = "Amritsar"
        "Rameswaram" = "Ramanathapuram"
        "Hampi" = "Bellary"
        "Halebidu" = "Hassan"
        "Belur" = "Hassan"
        "Ellora" = "Aurangabad"
        "Mumbai" = "Mumbai"
        "Kolhapur" = "Kolhapur"
        "Dwarka" = "Devbhoomi Dwarka"
        "New Delhi" = "Central Delhi"
        "Khajuraho" = "Chhatarpur"
        "Ujjain" = "Ujjain"
        "Omkareshwar" = "Khandwa"
        "Thiruvananthapuram" = "Thiruvananthapuram"
        "Guruvayur" = "Thrissur"
        "Pathanamthitta" = "Pathanamthitta"
        "Guwahati" = "Kamrup"
        "Bhubaneswar" = "Khordha"
        "Tirumala" = "Chittoor"
        "Lepakshi" = "Anantapur"
        "Srikalahasti" = "Chittoor"
        "Srisailam" = "Kurnool"
        "Visakhapatnam" = "Visakhapatnam"
        "Annavaram" = "East Godavari"
        "Bhadrachalam" = "Bhadradri Kothagudem"
        "Warangal" = "Warangal"
        "Hyderabad" = "Hyderabad"
        "Srirangam" = "Tiruchirappalli"
        "Chennai" = "Chennai"
        "Kanchipuram" = "Kanchipuram"
        "Chidambaram" = "Cuddalore"
        "Tiruvannamalai" = "Tiruvannamalai"
        "Tiruchirappalli" = "Tiruchirappalli"
        "Murudeshwar" = "Uttara Kannada"
        "Udupi" = "Udupi"
        "Subramanya" = "Dakshina Kannada"
        "Dharmasthala" = "Dakshina Kannada"
        "Kollur" = "Udupi"
        "Trimbak" = "Nashik"
    }
    
    if ($districtMap.ContainsKey($City)) {
        return $districtMap[$City]
    }
    
    # Default: use city name as district
    return $City
}

# Load temples
Write-Host "Loading temples from: $InputFile" -ForegroundColor Yellow
$temples = Get-Content $InputFile | ConvertFrom-Json

Write-Host "  ✓ Loaded $($temples.Count) temples" -ForegroundColor Green
Write-Host ""

# Update each temple
$updatedTemples = @()
$updateCount = 0

foreach ($temple in $temples) {
    Write-Host "Processing: $($temple.name)" -ForegroundColor Yellow
    
    # Infer district if not present
    $district = if ($temple.district) { $temple.district } else { Get-District $temple.city $temple.state }
    
    # Generate new ID
    $newId = Generate-TempleId -State $temple.state -District $district -City $temple.city -TempleName $temple.name
    
    # Create updated temple object
    $updatedTemple = [PSCustomObject]@{
        templeId = $newId
        legacyId = $temple.templeId  # Keep old ID for reference
        name = $temple.name
        state = $temple.state
        stateCode = $stateCodes[$temple.state]
        district = $district
        districtCode = (Get-DistrictCode $district)
        city = $temple.city
        cityCode = (Get-CityCode $temple.city)
        deity = $temple.deity
        built = $temple.built
        style = $temple.style
        latitude = $temple.latitude
        longitude = $temple.longitude
        description = $temple.description
    }
    
    # Add optional fields if present
    if ($temple.builtBy) { $updatedTemple | Add-Member -NotePropertyName "builtBy" -NotePropertyValue $temple.builtBy }
    
    $updatedTemples += $updatedTemple
    $updateCount++
    
    Write-Host "  Old ID: $($temple.templeId)" -ForegroundColor Gray
    Write-Host "  New ID: $newId" -ForegroundColor Green
    Write-Host ""
}

# Save updated temples
Write-Host "Saving updated temples to: $OutputFile" -ForegroundColor Yellow
$updatedTemples | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                              SUCCESS                                          " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  ✓ Updated: $updateCount temples" -ForegroundColor Green
Write-Host "  ✓ Saved to: $OutputFile" -ForegroundColor Green
Write-Host ""

# Show sample
Write-Host "Sample updated temples:" -ForegroundColor Yellow
$updatedTemples | Select-Object -First 3 | ForEach-Object {
    Write-Host "  • $($_.name)" -ForegroundColor White
    Write-Host "    ID: $($_.templeId)" -ForegroundColor Cyan
    Write-Host "    Location: $($_.city), $($_.district), $($_.state)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review updated file: cat $OutputFile" -ForegroundColor White
Write-Host "  2. Replace old file: mv $OutputFile $InputFile" -ForegroundColor White
Write-Host "  3. Generate AI content: .\scripts\generate-content-locally.ps1 -InputFile $InputFile" -ForegroundColor White
Write-Host ""

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
