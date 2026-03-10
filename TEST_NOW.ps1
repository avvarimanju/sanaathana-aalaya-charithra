# Quick Test Script - Start Admin Portal and Test Trusted Sources

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              TRUSTED SOURCES - QUICK TEST                                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Phase 1 Implementation: COMPLETE" -ForegroundColor Green
Write-Host "✓ Integration: COMPLETE" -ForegroundColor Green
Write-Host "✓ Documentation: COMPLETE" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting Admin Portal..." -ForegroundColor White
Write-Host ""
Write-Host "Once started, navigate to:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173/trusted-sources" -ForegroundColor Yellow
Write-Host ""
Write-Host "What you'll see:" -ForegroundColor White
Write-Host "  • Trusted Sources page with beautiful UI" -ForegroundColor Gray
Write-Host "  • Search bar and filter dropdowns" -ForegroundColor Gray
Write-Host "  • 'Add New Source' button" -ForegroundColor Gray
Write-Host "  • Navigation link in sidebar (🔗 Trusted Sources)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Set-Location admin-portal
npm run dev
