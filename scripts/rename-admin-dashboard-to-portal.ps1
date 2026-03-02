# Script to rename Admin Dashboard to Admin Portal throughout the project
# Excludes node_modules and keeps DashboardPage component name unchanged

Write-Host "Starting rename from Admin Dashboard to Admin Portal..." -ForegroundColor Cyan
Write-Host ""

$rootPath = "."
$replacements = 0

# Get all markdown and text files, excluding node_modules
$files = Get-ChildItem -Path $rootPath -Include *.md,*.txt -Recurse | 
    Where-Object { $_.FullName -notmatch 'node_modules' }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($null -eq $content) { continue }
    
    $modified = $false
    $newContent = $content
    
    # Replace Admin Dashboard with Admin Portal
    if ($content -match 'Admin Dashboard') {
        $newContent = $newContent -replace 'Admin Dashboard', 'Admin Portal'
        $modified = $true
    }
    
    # Replace admin-dashboard with admin-portal
    if ($content -match 'admin-dashboard') {
        $newContent = $newContent -replace 'admin-dashboard', 'admin-portal'
        $modified = $true
    }
    
    # Replace admin dashboard with admin portal
    if ($content -match 'admin dashboard') {
        $newContent = $newContent -replace 'admin dashboard', 'admin portal'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $replacements++
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        Write-Host "Updated: $relativePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Completed! Updated $replacements files." -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: DashboardPage component names were preserved as requested." -ForegroundColor Yellow
