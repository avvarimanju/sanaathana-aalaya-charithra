# Fetch Temple Data from Wikidata
# This script queries Wikidata for Hindu temples in India

param(
    [int]$Count = 1000,
    [string]$OutputFile = "data/temples.json",
    [string]$State = "",  # Optional: filter by state
    [switch]$IncludeCoordinates
)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "              FETCH TEMPLE DATA FROM WIKIDATA                                   " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Temples to fetch: $Count" -ForegroundColor White
Write-Host "  Output file: $OutputFile" -ForegroundColor White
if ($State) {
    Write-Host "  Filter by state: $State" -ForegroundColor White
}
Write-Host ""

# SPARQL query for Wikidata
$query = @"
SELECT DISTINCT ?temple ?templeLabel ?stateLabel ?cityLabel ?deityLabel ?coordinates ?inception ?architecturalStyleLabel
WHERE {
  ?temple wdt:P31/wdt:P279* wd:Q842402.  # Instance of Hindu temple
  ?temple wdt:P17 wd:Q668.                # Country: India
  
  OPTIONAL { ?temple wdt:P131 ?state. }
  OPTIONAL { ?temple wdt:P276 ?city. }
  OPTIONAL { ?temple wdt:P825 ?deity. }
  OPTIONAL { ?temple wdt:P625 ?coordinates. }
  OPTIONAL { ?temple wdt:P571 ?inception. }
  OPTIONAL { ?temple wdt:P149 ?architecturalStyle. }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT $Count
"@

Write-Host "Querying Wikidata..." -ForegroundColor Yellow

try {
    # URL encode the query
    $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
    $url = "https://query.wikidata.org/sparql?query=$encodedQuery&format=json"
    
    # Make request
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "User-Agent" = "TempleApp/1.0 (https://github.com/yourrepo)"
    }
    
    Write-Host "  ✓ Received $($response.results.bindings.Count) temples" -ForegroundColor Green
    Write-Host ""
    
    # Parse results
    $temples = @()
    $templeId = 1
    
    foreach ($binding in $response.results.bindings) {
        $temple = @{
            templeId = "temple_$('{0:D3}' -f $templeId)"
            name = $binding.templeLabel.value
            state = if ($binding.stateLabel) { $binding.stateLabel.value } else { "Unknown" }
            city = if ($binding.cityLabel) { $binding.cityLabel.value } else { "Unknown" }
            deity = if ($binding.deityLabel) { $binding.deityLabel.value } else { "Unknown" }
            built = if ($binding.inception) { $binding.inception.value } else { "Unknown" }
            style = if ($binding.architecturalStyleLabel) { $binding.architecturalStyleLabel.value } else { "Unknown" }
        }
        
        # Add coordinates if available
        if ($binding.coordinates -and $IncludeCoordinates) {
            $coords = $binding.coordinates.value -replace 'Point\(([^ ]+) ([^ ]+)\)', '$1,$2'
            $coordParts = $coords -split ','
            $temple.longitude = [double]$coordParts[0]
            $temple.latitude = [double]$coordParts[1]
        }
        
        $temples += $temple
        $templeId++
    }
    
    # Filter by state if specified
    if ($State) {
        $temples = $temples | Where-Object { $_.state -like "*$State*" }
        Write-Host "Filtered to $($temples.Count) temples in $State" -ForegroundColor Yellow
    }
    
    # Create output directory if it doesn't exist
    $outputDir = Split-Path $OutputFile -Parent
    if ($outputDir -and -not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Save to JSON
    $temples | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "                              SUCCESS                                           " -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    Write-Host "  ✓ Fetched: $($temples.Count) temples" -ForegroundColor Green
    Write-Host "  ✓ Saved to: $OutputFile" -ForegroundColor Green
    Write-Host ""
    
    # Show sample
    Write-Host "Sample temples:" -ForegroundColor Yellow
    $temples | Select-Object -First 5 | ForEach-Object {
        Write-Host "  • $($_.name) - $($_.city), $($_.state)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review the temple data: cat $OutputFile" -ForegroundColor White
    Write-Host "  2. Validate the data: .\scripts\validate-temple-data.ps1 -InputFile $OutputFile" -ForegroundColor White
    Write-Host "  3. Generate AI content: .\scripts\generate-content-locally.ps1 -InputFile $OutputFile" -ForegroundColor White
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
