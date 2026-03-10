# Fix Navigation Issue - React Version Mismatch
Write-Host "Fixing React version mismatch..." -ForegroundColor Cyan

# Stop any running Metro bundler
Write-Host "`nStopping Metro bundler..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Clear all caches
Write-Host "`nClearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item yarn.lock -ErrorAction SilentlyContinue

# Reinstall dependencies
Write-Host "`nReinstalling dependencies..." -ForegroundColor Yellow
npm install

# Start with tunnel mode
Write-Host "`n✅ Ready! Starting app with tunnel mode..." -ForegroundColor Green
Write-Host "Scan the QR code with Expo Go on your iPhone" -ForegroundColor Cyan
npx expo start --tunnel --clear
