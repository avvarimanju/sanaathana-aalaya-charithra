#!/usr/bin/env pwsh
# Development watch mode - Auto-reload all applications on file changes
# Starts all dev servers with hot-reload enabled

Write-Host "🔥 Development Watch Mode - Hot Reload Enabled" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting all development servers with auto-reload..." -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "admin-portal") -or -not (Test-Path "mobile-app")) {
    Write-Host "❌ Error: Must run from project root (Sanaathana-Aalaya-Charithra)" -ForegroundColor Red
    exit 1
}

# Function to start a dev server in a new terminal
function Start-DevServer {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Command,
        [string]$Color
    )
    
    Write-Host "🚀 Starting: $Name" -ForegroundColor $Color
    Write-Host "   Location: $Path" -ForegroundColor Gray
    Write-Host "   Command: $Command" -ForegroundColor Gray
    Write-Host ""
    
    # Start in new PowerShell window
    $scriptBlock = @"
Set-Location '$Path'
Write-Host '🔥 $Name - Development Server' -ForegroundColor $Color
Write-Host '=============================' -ForegroundColor $Color
Write-Host ''
$Command
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
}

# 1. Start Backend Server
Start-DevServer `
    -Path "src/local-server" `
    -Name "Backend Server" `
    -Command "npm start" `
    -Color "Green"

Start-Sleep -Seconds 2

# 2. Start Admin Portal
Start-DevServer `
    -Path "admin-portal" `
    -Name "Admin Portal" `
    -Command "npm run dev" `
    -Color "Cyan"

Start-Sleep -Seconds 2

# 3. Start Mobile App
Start-DevServer `
    -Path "mobile-app" `
    -Name "Mobile App" `
    -Command "npx expo start" `
    -Color "Magenta"

Write-Host ""
Write-Host "✅ All development servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Development URLs" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Backend:      http://localhost:4000" -ForegroundColor Green
Write-Host "💻 Admin Portal: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📱 Mobile App:   Expo Dev Tools (opens automatically)" -ForegroundColor Magenta
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔥 Hot Reload Features" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend:      Auto-restarts on file changes" -ForegroundColor Green
Write-Host "✅ Admin Portal: Hot Module Replacement (HMR)" -ForegroundColor Cyan
Write-Host "✅ Mobile App:   Fast Refresh enabled" -ForegroundColor Magenta
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💡 Tips" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "• Changes are automatically detected and reloaded" -ForegroundColor White
Write-Host "• No need to manually restart servers" -ForegroundColor White
Write-Host "• Just save your files and see changes instantly" -ForegroundColor White
Write-Host "• Press Ctrl+C in any window to stop that server" -ForegroundColor White
Write-Host ""
Write-Host "🎯 To stop all servers: Close all PowerShell windows" -ForegroundColor Yellow
Write-Host ""
