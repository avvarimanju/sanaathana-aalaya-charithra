# Network Error Fix - "TypeError: fetch failed"

## The Error You're Seeing

```
TypeError: fetch failed
at node:internal/deps/undici/undici:16416:13
```

## What This Means

Expo is trying to connect to the internet to:
- Check for updates
- Fetch native module versions
- Validate dependencies

But your network connection is blocking it (firewall, proxy, or offline).

## Solution 1: Run in Offline Mode (RECOMMENDED)

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npx expo start --web --offline
```

This tells Expo to skip all network checks and run locally.

## Solution 2: Use the Updated START_NOW Script

The script has been updated to include `--offline` flag:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
./START_NOW.ps1
```

## Solution 3: Check Your Network

If you want to run without offline mode:

### Check Internet Connection
```powershell
Test-Connection -ComputerName expo.dev -Count 2
```

### Check Firewall
- Windows Defender Firewall might be blocking Node.js
- Add exception for Node.js in Windows Firewall

### Check Proxy Settings
```powershell
# Check if proxy is set
$env:HTTP_PROXY
$env:HTTPS_PROXY

# If set, try unsetting temporarily
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
```

### Check VPN
- If you're on a VPN, try disconnecting
- Some corporate VPNs block Expo servers

## Solution 4: Skip Version Validation

Create/edit `.npmrc` in mobile-app folder:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
echo "fetch-retries=0" > .npmrc
echo "fetch-retry-mintimeout=0" >> .npmrc
```

Then run:
```powershell
npx expo start --web --offline
```

## Why Offline Mode Works

Offline mode:
- ✅ Skips version checks
- ✅ Skips update checks
- ✅ Uses local cache
- ✅ Doesn't need internet
- ✅ Faster startup

You still get:
- ✅ Full app functionality
- ✅ Hot reload
- ✅ DevTools
- ✅ Web browser access

## What You're Missing in Offline Mode

- ❌ Automatic updates
- ❌ Latest native module versions
- ❌ Expo Go QR code (but web still works!)

## Recommended Command

**For development, always use:**

```powershell
npx expo start --web --offline
```

This is faster and doesn't require internet!

## Alternative: Use Local Network Only

```powershell
npx expo start --web --localhost
```

This runs on localhost only, no external network needed.

## Test If It's Working

After running with `--offline`:

1. You should see:
   ```
   Starting Metro Bundler
   Metro waiting on exp://localhost:8081
   ```

2. Browser should open automatically

3. No "TypeError: fetch failed" error

## Quick Commands Reference

```powershell
# Recommended (offline + web)
npx expo start --web --offline

# With cache clear
npx expo start --web --offline --clear

# Localhost only
npx expo start --web --localhost

# Use the script (now includes --offline)
./START_NOW.ps1
```

## If Still Not Working

1. **Check Node.js version:**
   ```powershell
   node --version
   ```
   Should be v18 or higher

2. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

3. **Reinstall dependencies:**
   ```powershell
   rm -rf node_modules
   npm install
   ```

4. **Try without web:**
   ```powershell
   npx expo start --offline
   # Then press 'w' for web
   ```

## Success Indicators

You'll know it's working when you see:

```
✓ Metro Bundler is ready
✓ Logs for your project will appear below
✓ Press w to open in web browser
```

No "TypeError: fetch failed" error!

## Summary

The error is NOT a code problem - your app is fine! It's just Expo trying to reach the internet and failing.

**Solution:** Add `--offline` flag to all expo start commands.

The START_NOW.ps1 script has been updated to include this automatically.
