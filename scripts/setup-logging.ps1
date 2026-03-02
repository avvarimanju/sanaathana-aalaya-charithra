#!/usr/bin/env pwsh
# Setup Better Logging for Local Backend

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   📊 Setting Up Better Logging...                         ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Navigate to local server directory
Write-Host "📁 Navigating to local server directory..." -ForegroundColor Yellow
Set-Location -Path "src/local-server"

# Install dependencies
Write-Host "📦 Installing dependencies (morgan + types)..." -ForegroundColor Yellow
npm install

# Check if installation was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Logging setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 What was added:" -ForegroundColor Cyan
    Write-Host "   • Morgan HTTP request logger" -ForegroundColor White
    Write-Host "   • Enhanced error handling" -ForegroundColor White
    Write-Host "   • User tracking (x-user-id header)" -ForegroundColor White
    Write-Host "   • Response time tracking" -ForegroundColor White
    Write-Host "   • Better startup message" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Start the backend server:" -ForegroundColor White
    Write-Host "      cd ../.." -ForegroundColor Gray
    Write-Host "      .\scripts\start-local-backend.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Make some API requests and watch the logs!" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   See LOGGING_SETUP_COMPLETE.md for details" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host "   Please check the error messages above." -ForegroundColor Red
    Write-Host ""
}

# Return to root directory
Set-Location -Path "../.."
