# Fetch 1,000 Temples from Wikidata (Simplified Version)
# Usage: .\scripts\fetch-1000-temples-simple.ps1

param(
    [int]$Count = 1000,
    [string]$OutputFile = "data/temples-1000.json"
)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "              FETCH 1,000 TEMPLES FROM WIKIDATA                                 " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Target count: $Count temples" -ForegroundColor White
Write-Host "  Output file: $OutputFile" -ForegroundColor White
Write-Host ""

# SPARQL query for Wikidata
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
LIMIT $Count
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
    
    Write-Host "  Success! Received $($response.results.bindings.Count) temples from Wikidata" -ForegroundColor Green
    Write-Host ""
    
    $temples = @()
    $templeId = 1
    
    foreach ($binding in $response.results.bindings) {
        # Extract coordinates if available
        $lat = $null
        $lon = $null
        if ($binding.coordinates) {
            $coordString = $binding.coordinates.value
            # Simple string parsing for coordinates
            if ($coordString -like "*Point*") {
                $coordString = $coordString -replace 'Point\(', '' -replace '\)', ''
                $parts = $coordString -split ' '
                if ($parts.Count -eq 2) {
                    $lon = [double]$parts[0]
                    $lat = [double]$parts[1]
                }
            }
        }
        
        # Extract year from inception date
        $builtYear = "Unknown"
        if ($binding.inception) {
            $inceptionDate = $binding.inception.value
            # Extract first 4 digits
            if ($inceptionDate -match '\d{4}') {
                $builtYear = $matches[0]
            }
        }
        
        $temple = @{
            templeId = "WIKI_" + $templeId.ToString("D4")
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
            description = ""
            wikidataId = $binding.temple.value
            needsVerification = $true
        }
        
        if ($binding.image) {
            $temple.imageUrl = $binding.image.value
        }
        
        $temples += $temple
        $templeId++
    }
    
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "DATA SUMMARY" -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $totalTemples = $temples.Count
    $templesWithCoords = ($temples | Where-Object { $_.latitude -and $_.longitude }).Count
    
    Write-Host "Total temples collected: $totalTemples" -ForegroundColor White
    Write-Host "  Temples with coordinates: $templesWithCoords" -ForegroundColor Green
    Write-Host ""
    
    # State-wise breakdown
    $stateGroups = $temples | Group-Object -Property state | Sort-Object Count -Descending
    Write-Host "Top 10 states by temple count:" -ForegroundColor Yellow
    $stateGroups | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count) temples" -ForegroundColor White
    }
    Write-Host ""
    
    # Create output directory if needed
    $outputDir = Split-Path $OutputFile -Parent
    if ($outputDir -and -not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Save to JSON
    $temples | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "SUCCESS - DATA COLLECTION COMPLETE" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Saved $totalTemples temples to: $OutputFile" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Sample temples:" -ForegroundColor Yellow
    $temples | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.name) - $($_.city), $($_.state)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review the data: cat $OutputFile" -ForegroundColor White
    Write-Host "  2. Validate links: .\scripts\validate-temple-links.ps1 -FilePath $OutputFile" -ForegroundColor White
    Write-Host "  3. Generate content: .\scripts\generate-content-locally.ps1 -InputFile $OutputFile" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to fetch data from Wikidata" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check internet connection" -ForegroundColor White
    Write-Host "  2. Verify Wikidata is accessible: https://query.wikidata.org/" -ForegroundColor White
    Write-Host "  3. Try reducing the count: -Count 100" -ForegroundColor White
    exit 1
}

Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
