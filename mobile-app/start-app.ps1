#!/usr/bin/env pwsh
# Quick Start Script for Mobile App Testing
# Date: March 9, 2026

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sanaathana Aalaya Charithra Mobile App" -ForegroundColor Cyan
Write-Host "  Quick Start - SDK 52" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Dependencies installed:" -ForegroundColor Green
Write-Host "   - expo-linking (deep linking)" -ForegroundColor White
Write-Host "   - @expo/metro-runtime (web support)" -ForegroundColor White
Write-Host ""

Write-Host "📱 Testing Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Web Browser (Easiest)" -ForegroundColor White
Write-Host "   Press 'w' after server starts" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Android Emulator" -ForegroundColor White
Write-Host "   Press 'a' after server starts (requires Android Studio)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. iOS Simulator (Mac only)" -ForegroundColor White
Write-Host "   Press 'i' after server starts" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "   - Cannot use Expo Go (SDK version mismatch)" -ForegroundColor White
Write-Host "   - Deep links only work in standalone builds" -ForegroundColor White
Write-Host "   - Use 'eas build' to test deep links on real device" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting Expo development server..." -ForegroundColor Green
Write-Host ""

# Start Expo
npx expo start

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
