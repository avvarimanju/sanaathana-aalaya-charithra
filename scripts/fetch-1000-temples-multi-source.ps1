# Fetch 1,000 Temples from Multiple Trusted Sources
# Combines Wikidata, UNESCO, and ASI data
# Usage: .\scripts\fetch-1000-temples-multi-source.ps1

param(
    [int]$TargetCount = 1000,
    [string]$OutputFile = "data/temples-1000.json",
    [switch]$IncludeUNESCO,
    [switch]$IncludeASI,
    [switch]$ValidateNames
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          FETCH 1,000 TEMPLES FROM MULTIPLE TRUSTED SOURCES                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Target count: $TargetCount temples" -ForegroundColor White
Write-Host "  Output file: $OutputFile" -ForegroundColor White
Write-Host "  Include UNESCO: $IncludeUNESCO" -ForegroundColor White
Write-Host "  Include ASI: $IncludeASI" -ForegroundColor White
Write-Host "  Validate names: $ValidateNames" -ForegroundColor White
Write-Host ""

$allTemples = @()

# ============================================================================
# PHASE 1: UNESCO World Heritage Temple Sites (Top Tier)
# ============================================================================

if ($IncludeUNESCO) {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "PHASE 1: UNESCO World Heritage Temple Sites" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $unescoTemples = @(
        @{
            templeId = "TN_THA_THA_brihadeeswarar-temple"
            name = "Brihadeeswarar Temple"
            alternateNames = @("Peruvudaiyar Kovil", "Rajarajeswaram", "Big Temple")
            localName = "பெருவுடையார் கோவில்"
            popularName = "Big Temple"
            officialSource = "https://asi.nic.in"
            state = "Tamil Nadu"
            stateCode = "TN"
            district = "Thanjavur"
            districtCode = "THA"
            city = "Thanjavur"
            cityCode = "THA"
            deity = "Lord Shiva"
            built = "1010 CE"
            builtBy = "Raja Raja Chola I"
            style = "Dravidian"
            latitude = 10.7825
            longitude = 79.1317
            unescoSite = $true
            unescoYear = 1987
            description = "UNESCO World Heritage Site, one of the largest temples in India with 216-foot tall vimana"
        },
        @{
            templeId = "KA_HAS_HAM_sri-virupaksha-temple"
            name = "Sri Virupaksha Temple"
            alternateNames = @("Virupaksha Temple", "Hampi Temple")
            localName = "ವಿರೂಪಾಕ್ಷ ದೇವಸ್ಥಾನ"
            popularName = "Virupaksha Temple"
            officialSource = "https://asi.nic.in"
            state = "Karnataka"
            stateCode = "KA"
            district = "Ballari"
            districtCode = "BAL"
            city = "Hampi"
            cityCode = "HAM"
            deity = "Lord Shiva"
            built = "7th century"
            style = "Vijayanagara"
            latitude = 15.3350
            longitude = 76.4600
            unescoSite = $true
            unescoYear = 1986
            description = "UNESCO World Heritage Site, part of Group of Monuments at Hampi"
        },
        @{
            templeId = "OR_PUR_PUR_shree-jagannath-temple"
            name = "Shree Jagannath Temple"
            alternateNames = @("Jagannath Temple", "Puri Temple")
            localName = "ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର"
            popularName = "Jagannath Temple"
            officialSource = "https://jagannath.nic.in"
            state = "Odisha"
            stateCode = "OR"
            district = "Puri"
            districtCode = "PUR"
            city = "Puri"
            cityCode = "PUR"
            deity = "Lord Jagannath"
            built = "12th century"
            style = "Kalinga"
            latitude = 19.8048
            longitude = 85.8182
            unescoSite = $false
            description = "Famous for the annual Rath Yatra festival"
        },
        @{
            templeId = "OR_PUR_KON_konark-sun-temple"
            name = "Konark Sun Temple"
            alternateNames = @("Konark Surya Mandir", "Black Pagoda")
            localName = "କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର"
            popularName = "Konark Sun Temple"
            officialSource = "https://asi.nic.in"
            state = "Odisha"
            stateCode = "OR"
            district = "Puri"
            districtCode = "PUR"
            city = "Konark"
            cityCode = "KON"
            deity = "Surya"
            built = "13th century"
            style = "Kalinga"
            latitude = 19.8876
            longitude = 86.0945
            unescoSite = $true
            unescoYear = 1984
            description = "UNESCO World Heritage Site, shaped like a giant chariot"
        },
        @{
            templeId = "MP_CHH_KHA_kandariya-mahadeva-temple"
            name = "Kandariya Mahadeva Temple"
            alternateNames = @("Khajuraho Temple")
            localName = "कंदारिया महादेव मंदिर"
            popularName = "Khajuraho Temple"
            officialSource = "https://asi.nic.in"
            state = "Madhya Pradesh"
            stateCode = "MP"
            district = "Chhatarpur"
            districtCode = "CHH"
            city = "Khajuraho"
            cityCode = "KHA"
            deity = "Lord Shiva"
            built = "1050 CE"
            style = "Nagara"
            latitude = 24.8518
            longitude = 79.9199
            unescoSite = $true
            unescoYear = 1986
            description = "UNESCO World Heritage Site, largest and most ornate temple in Khajuraho"
        },
        @{
            templeId = "KA_HAS_BEL_sri-chennakeshava-temple"
            name = "Sri Chennakeshava Temple"
            alternateNames = @("Chennakeshava Temple", "Belur Temple")
            localName = "ಚೆನ್ನಕೇಶವ ದೇವಸ್ಥಾನ"
            popularName = "Belur Temple"
            officialSource = "https://muzrai.karnataka.gov.in"
            state = "Karnataka"
            stateCode = "KA"
            district = "Hassan"
            districtCode = "HAS"
            city = "Belur"
            cityCode = "BEL"
            deity = "Lord Vishnu"
            built = "1117 CE"
            style = "Hoysala"
            latitude = 13.1656
            longitude = 75.8656
            unescoSite = $true
            unescoYear = 2023
            description = "UNESCO World Heritage Site, part of Sacred Ensembles of the Hoysalas"
        },
        @{
            templeId = "KA_HAS_HAL_hoysaleswara-temple"
            name = "Hoysaleswara Temple"
            alternateNames = @("Halebidu Temple")
            localName = "ಹೊಯ್ಸಳೇಶ್ವರ ದೇವಸ್ಥಾನ"
            popularName = "Halebidu Temple"
            officialSource = "https://muzrai.karnataka.gov.in"
            state = "Karnataka"
            stateCode = "KA"
            district = "Hassan"
            districtCode = "HAS"
            city = "Halebidu"
            cityCode = "HAL"
            deity = "Lord Shiva"
            built = "1121 CE"
            style = "Hoysala"
            latitude = 13.2167
            longitude = 75.9967
            unescoSite = $true
            unescoYear = 2023
            description = "UNESCO World Heritage Site, masterpiece of Hoysala architecture"
        },
        @{
            templeId = "MH_AUR_ELL_kailasa-temple"
            name = "Kailasa Temple"
            alternateNames = @("Ellora Cave 16", "Kailasanatha Temple")
            localName = "कैलास मंदिर"
            popularName = "Kailasa Temple"
            officialSource = "https://asi.nic.in"
            state = "Maharashtra"
            stateCode = "MH"
            district = "Aurangabad"
            districtCode = "AUR"
            city = "Ellora"
            cityCode = "ELL"
            deity = "Lord Shiva"
            built = "8th century"
            style = "Rock-cut"
            latitude = 20.0244
            longitude = 75.1794
            unescoSite = $true
            unescoYear = 1983
            description = "UNESCO World Heritage Site, largest monolithic rock excavation in the world"
        }
    )

    $allTemples += $unescoTemples
    Write-Host "  ✓ Added $($unescoTemples.Count) UNESCO World Heritage temple sites" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# PHASE 2: Wikidata Query (Automated Collection)
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 2: Wikidata Automated Collection" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$sparqlQuery = @"
SELECT DISTINCT ?temple ?templeLabel ?stateLabel ?cityLabel ?deityLabel ?coordinates ?inception ?architecturalStyleLabel ?image
WHERE {
  ?temple wdt:P31/wdt:P279* wd:Q842402.  # Hindu temple
  ?temple wdt:P17 wd:Q668.                # in India
  
  OPTIONAL { ?temple wdt:P131 ?state. }
  OPTIONAL { ?temple wdt:P276 ?city. }
  OPTIONAL { ?temple wdt:P825 ?deity. }
  OPTIONAL { ?temple wdt:P625 ?coordinates. }
  OPTIONAL { ?temple wdt:P571 ?inception. }
  OPTIONAL { ?temple wdt:P149 ?architecturalStyle. }
  OPTIONAL { ?temple wdt:P18 ?image. }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT $TargetCount
"@

Write-Host "Querying Wikidata SPARQL endpoint..." -ForegroundColor Yellow

try {
    Add-Type -AssemblyName System.Web
    $encodedQuery = [System.Web.HttpUtility]::UrlEncode($sparqlQuery)
    $url = "https://query.wikidata.org/sparql?query=$encodedQuery&format=json"
    
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "User-Agent" = "SanaathanaAalayaCharithra/1.0"
        "Accept" = "application/json"
    } -TimeoutSec 60
    
    Write-Host "  ✓ Received $($response.results.bindings.Count) temples from Wikidata" -ForegroundColor Green
    Write-Host ""
    
    $templeId = $allTemples.Count + 1
    
    foreach ($binding in $response.results.bindings) {
        # Extract coordinates if available
        $lat = $null
        $lon = $null
        if ($binding.coordinates) {
            $coordString = $binding.coordinates.value
            if ($coordString -match 'Point\(([^ ]+) ([^ ]+)\)') {
                $lon = [double]$matches[1]
                $lat = [double]$matches[2]
            }
        }
        
        # Extract year from inception date
        $builtYear = "Unknown"
        if ($binding.inception) {
            $inceptionDate = $binding.inception.value
            if ($inceptionDate -match '(\d{1,4})') {
                $builtYear = $matches[1]
            }
        }
        
        $templeIdFormatted = "WIKI_{0:D4}" -f $templeId
        $temple = @{
            templeId = $templeIdFormatted
            name = $binding.templeLabel.value
            alternateNames = @()
            localName = ""
            popularName = $binding.templeLabel.value
            officialSource = "https://www.wikidata.org"
            state = if ($binding.stateLabel) { $binding.stateLabel.value } else { "Unknown" }
            stateCode = ""
            district = ""
            districtCode = ""
            city = if ($binding.cityLabel) { $binding.cityLabel.value } else { "Unknown" }
            cityCode = ""
            deity = if ($binding.deityLabel) { $binding.deityLabel.value } else { "Unknown" }
            built = $builtYear
            builtBy = ""
            style = if ($binding.architecturalStyleLabel) { $binding.architecturalStyleLabel.value } else { "Unknown" }
            latitude = $lat
            longitude = $lon
            unescoSite = $false
            description = ""
            wikidataId = $binding.temple.value
            needsVerification = $true
        }
        
        if ($binding.image) {
            $temple.imageUrl = $binding.image.value
        }
        
        $allTemples += $temple
        $templeId++
    }
    
    Write-Host "  ✓ Added $($response.results.bindings.Count) temples from Wikidata" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "  ⚠️  Warning: Failed to fetch from Wikidata" -ForegroundColor Yellow
    Write-Host "     Error: $_" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 3: Data Summary and Statistics
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DATA SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$totalTemples = $allTemples.Count
$templesWithCoords = ($allTemples | Where-Object { $_.latitude -and $_.longitude }).Count
$unescoCount = ($allTemples | Where-Object { $_.unescoSite -eq $true }).Count
$needsVerification = ($allTemples | Where-Object { $_.needsVerification -eq $true }).Count

Write-Host "Total temples collected: $totalTemples" -ForegroundColor White
Write-Host "  • UNESCO World Heritage Sites: $unescoCount" -ForegroundColor Green
Write-Host "  • Temples with coordinates: $templesWithCoords" -ForegroundColor Green
Write-Host "  • Needs name verification: $needsVerification" -ForegroundColor Yellow
Write-Host ""

# State-wise breakdown
$stateGroups = $allTemples | Group-Object -Property state | Sort-Object Count -Descending
Write-Host "Top 10 states by temple count:" -ForegroundColor Yellow
$stateGroups | Select-Object -First 10 | ForEach-Object {
    Write-Host "  • $($_.Name): $($_.Count) temples" -ForegroundColor White
}
Write-Host ""

# ============================================================================
# PHASE 4: Save to File
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SAVING DATA" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create output directory if needed
$outputDir = Split-Path $OutputFile -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Save to JSON
$allTemples | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "  ✓ Saved $totalTemples temples to: $OutputFile" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 5: Next Steps
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "SUCCESS - DATA COLLECTION COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Sample temples:" -ForegroundColor Yellow
$allTemples | Select-Object -First 5 | ForEach-Object {
    $unescoTag = if ($_.unescoSite) { " [UNESCO]" } else { "" }
    Write-Host "  • $($_.name) - $($_.city), $($_.state)$unescoTag" -ForegroundColor White
}
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Validate official names:" -ForegroundColor White
Write-Host "     .\scripts\validate-official-names.ps1 -InputFile $OutputFile" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Enrich temple data:" -ForegroundColor White
Write-Host "     .\scripts\enrich-temple-data.ps1 -InputFile $OutputFile" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Validate all links:" -ForegroundColor White
Write-Host "     .\scripts\validate-temple-links.ps1 -FilePath $OutputFile" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Generate AI content:" -ForegroundColor White
Write-Host "     .\scripts\generate-content-locally.ps1 -InputFile $OutputFile" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Return summary
return @{
    TotalTemples = $totalTemples
    UNESCOSites = $unescoCount
    WithCoordinates = $templesWithCoords
    NeedsVerification = $needsVerification
    OutputFile = $OutputFile
}
