#!/usr/bin/env pwsh
# Auto-commit script for development environment
# Commits and pushes changes from Admin Portal, Mobile App, and Backend

param(
    [string]$Message = "Auto-commit: Dev changes",
    [switch]$DryRun = $false
)

Write-Host "🔄 Auto-Commit Script for Dev Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "$Message - $timestamp"

# Check if we're in the right directory
if (-not (Test-Path "admin-portal") -or -not (Test-Path "mobile-app")) {
    Write-Host "❌ Error: Must run from project root (Sanaathana-Aalaya-Charithra)" -ForegroundColor Red
    exit 1
}

# Function to check git status
function Get-GitStatus {
    param([string]$Path)
    
    Push-Location $Path
    $status = git status --porcelain
    Pop-Location
    
    return $status
}

# Function to commit and push
function Commit-AndPush {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Message
    )
    
    Write-Host "📁 Processing: $Name" -ForegroundColor Yellow
    Write-Host "   Location: $Path" -ForegroundColor Gray
    
    Push-Location $Path
    
    try {
        # Check if there are changes
        $status = git status --porcelain
        
        if ([string]::IsNullOrWhiteSpace($status)) {
            Write-Host "   ✓ No changes to commit" -ForegroundColor Green
            Pop-Location
            return $true
        }
        
        Write-Host "   📝 Changes detected:" -ForegroundColor Cyan
        git status --short
        Write-Host ""
        
        if ($DryRun) {
            Write-Host "   🔍 DRY RUN - Would commit these changes" -ForegroundColor Magenta
            Pop-Location
            return $true
        }
        
        # Stage all changes
        Write-Host "   ➕ Staging changes..." -ForegroundColor Cyan
        git add -A
        
        # Commit
        Write-Host "   💾 Committing..." -ForegroundColor Cyan
        git commit -m $Message
        
        # Push
        Write-Host "   🚀 Pushing to remote..." -ForegroundColor Cyan
        git push
        
        Write-Host "   ✅ Successfully committed and pushed!" -ForegroundColor Green
        Write-Host ""
        
        Pop-Location
        return $true
    }
    catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

# Main execution
Write-Host "Commit Message: $commitMessage" -ForegroundColor White
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be committed" -ForegroundColor Magenta
    Write-Host ""
}

$results = @()

# 1. Admin Portal
if (Test-Path "admin-portal/.git") {
    $results += Commit-AndPush -Path "admin-portal" -Name "Admin Portal" -Message $commitMessage
} else {
    Write-Host "⚠️  Admin Portal: Not a git repository (skipping)" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Mobile App
if (Test-Path "mobile-app/.git") {
    $results += Commit-AndPush -Path "mobile-app" -Name "Mobile App" -Message $commitMessage
} else {
    Write-Host "⚠️  Mobile App: Not a git repository (skipping)" -ForegroundColor Yellow
    Write-Host ""
}

# 3. Backend (if separate repo)
if (Test-Path "backend/.git") {
    $results += Commit-AndPush -Path "backend" -Name "Backend" -Message $commitMessage
} else {
    Write-Host "ℹ️  Backend: Not a separate git repository (part of main repo)" -ForegroundColor Gray
    Write-Host ""
}

# 4. Main Repository (root)
Write-Host "📁 Processing: Main Repository (Root)" -ForegroundColor Yellow
Write-Host "   Location: ." -ForegroundColor Gray

$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "   ✓ No changes to commit" -ForegroundColor Green
} else {
    Write-Host "   📝 Changes detected:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "   🔍 DRY RUN - Would commit these changes" -ForegroundColor Magenta
    } else {
        try {
            Write-Host "   ➕ Staging changes..." -ForegroundColor Cyan
            git add -A
            
            Write-Host "   💾 Committing..." -ForegroundColor Cyan
            git commit -m $commitMessage
            
            Write-Host "   🚀 Pushing to remote..." -ForegroundColor Cyan
            git push
            
            Write-Host "   ✅ Successfully committed and pushed!" -ForegroundColor Green
            $results += $true
        }
        catch {
            Write-Host "   ❌ Error: $_" -ForegroundColor Red
            $results += $false
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

if ($DryRun) {
    Write-Host "🔍 Dry run completed - no changes were committed" -ForegroundColor Magenta
} else {
    Write-Host "✅ Successful: $successCount / $totalCount" -ForegroundColor Green
    
    if ($successCount -eq $totalCount) {
        Write-Host "🎉 All repositories updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some repositories had issues" -ForegroundColor Yellow
    }
}

Write-Host ""
