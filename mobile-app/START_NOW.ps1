#!/usr/bin/env pwsh
# Quick Start Script for Mobile App

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Sanaathana Aalaya Charithra - Mobile App          ║" -ForegroundColor Cyan
Write-Host "║              Quick Start Script                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to mobile app directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "📱 Starting Mobile App..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Clear Metro bundler cache" -ForegroundColor Gray
Write-Host "  2. Start Expo development server" -ForegroundColor Gray
Write-Host "  3. Open in web browser automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "⏱️  First load takes 15-20 seconds" -ForegroundColor Yellow
Write-Host "⚡ Subsequent loads take 2-3 seconds" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed. Installing now..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🚀 Starting Expo..." -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Start Expo with web, clear cache, and offline mode
npx expo start --web --clear --offline

# If Expo exits, show message
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "👋 Expo stopped" -ForegroundColor Yellow
Write-Host ""
