# Start Mobile App with Tunnel Mode - Fixes Connection Issues
Write-Host "Starting mobile app with tunnel mode (better for network issues)..." -ForegroundColor Green
Write-Host ""
Write-Host "This uses ngrok tunneling to bypass network/firewall issues" -ForegroundColor Yellow
Write-Host ""

# Clear cache and start with tunnel
npx expo start --clear --tunnel
