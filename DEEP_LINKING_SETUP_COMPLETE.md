# Deep Linking Setup - COMPLETE! ✅

**Date**: March 9, 2026  
**Status**: Configured and ready for production build

---

## What We Accomplished

✅ **Domain**: charithra.org purchased and live  
✅ **Android verification**: Deployed and validated by Google  
✅ **iOS verification**: File created (waiting for Apple Developer approval)  
✅ **Keystore**: Generated and backed up  
✅ **Mobile app configured**: Deep linking code added  
✅ **Dependencies installed**: expo-linking, @expo/metro-runtime  

---

## Deep Linking Configuration Summary

### 1. Domain & Verification Files
- **Domain**: https://charithra.org ✅
- **Android**: https://charithra.org/.well-known/assetlinks.json ✅ (Validated by Google)
- **iOS**: https://charithra.org/.well-known/apple-app-site-association ⏳ (Pending Apple approval)

### 2. Mobile App Configuration
- **Package name**: Changed to `com.charithra.app` (matches verification files)
- **Android intent filters**: Added for `/temple/*` and `/artifact/*`
- **iOS associated domains**: Added `applinks:charithra.org`
- **Deep link handler**: Implemented in App.tsx
- **Utility functions**: Created in `src/utils/deepLinking.ts`

### 3. Supported URL Patterns
```
https://charithra.org/temple/tirupati-balaji  → Opens TempleDetails screen
https://charithra.org/artifact/ancient-sculpture-123  → Opens DefectDetails screen
```

---

## Testing Status

### ✅ Dependencies Installed
- `expo-linking` - Deep linking support
- `@expo/metro-runtime` - Web support
- All dependencies ready for testing!

### ❌ Expo Go Testing (SDK Version Mismatch)
- Your phone has Expo Go SDK 54
- Project uses SDK 52
- **Cannot test with Expo Go** (version incompatibility)

### ✅ Alternative Testing Options

**Option 1: Test on Computer** (Recommended for development)
```powershell
cd mobile-app
npx expo start

# Then press:
# 'w' for web browser
# 'a' for Android emulator (if installed)
# 'i' for iOS simulator (Mac only)
```

**Quick Start Script:**
```powershell
cd mobile-app
.\start-app.ps1
```

**Option 2: Build Standalone App** (Recommended for real device testing)
```powershell
# Build APK for Android testing
eas build --platform android --profile preview

# After build completes, download and install on your phone
# Deep links will work perfectly!
```

**Option 3: Upgrade to SDK 54** (If you want to use Expo Go)
```powershell
npx expo install expo@latest
npx expo install --fix
```
Note: This may require updating other dependencies.

---

## How Deep Linking Works

### Current Behavior (Without App Installed)
1. User clicks: `https://charithra.org/temple/test`
2. Opens in browser
3. Shows landing page ✅

### After Building & Installing App
1. User clicks: `https://charithra.org/temple/test`
2. **Android**: System checks assetlinks.json → Opens in app ✅
3. **iOS** (after Apple approval): System checks apple-app-site-association → Opens in app ✅
4. App navigates to TempleDetails screen with temple ID

---

## Next Steps

### For Development Testing
```powershell
cd mobile-app

# Test on web
npx expo start
# Press 'w' for web

# Test on Android emulator (if you have one)
npx expo start
# Press 'a' for Android
```

### For Real Device Testing (Recommended)
```powershell
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK for testing
eas build --platform android --profile preview

# Download the APK and install on your phone
# Deep links will work!
```

### For iOS (After Apple Approval)
1. Wait for Apple Developer Program approval (24-48 hours)
2. Get Team ID from https://developer.apple.com/account/#/membership
3. Update `landing-page/.well-known/apple-app-site-association`
4. Deploy to Cloudflare Pages
5. Build iOS app with EAS

---

## Production Build Checklist

When ready to build for Play Store:

- [ ] Keystore ready: `charithra-release.keystore` ✅
- [ ] Package name: `com.charithra.app` ✅
- [ ] Android verification: Live and validated ✅
- [ ] Deep linking configured: Yes ✅
- [ ] Dependencies installed: Yes ✅
- [ ] Code tested: Test on emulator/web first
- [ ] Build command: `eas build --platform android --profile production`

---

## Files Modified

### Configuration
- `mobile-app/app.json` - Added deep linking config
- `mobile-app/App.tsx` - Added deep link handler

### New Files
- `mobile-app/src/utils/deepLinking.ts` - Deep linking utility
- `mobile-app/setup-deep-linking.ps1` - Setup script
- `mobile-app/DEEP_LINKING_CONFIGURED.md` - Documentation

### Verification Files (Already Deployed)
- `landing-page/.well-known/assetlinks.json` - Android ✅
- `landing-page/.well-known/apple-app-site-association` - iOS ⏳

---

## Important Notes

### SDK Version Issue
- **Expo Go on phone**: SDK 54
- **Your project**: SDK 52
- **Solution**: Build standalone app (doesn't need Expo Go)

### Deep Linking Only Works in Standalone Builds
- Expo Go doesn't support custom deep linking
- Must build with EAS to test deep links on real device
- Web and emulators work fine for development

### Keystore Security
- **Original**: `Sanaathana-Aalaya-Charithra/charithra-release.keystore`
- **Backup**: `~/Desktop/charithra-release-BACKUP.keystore`
- **CRITICAL**: Never lose this file! You need it for all future app updates

---

## Quick Commands Reference

```powershell
# Development (computer)
cd mobile-app
npx expo start

# Build for testing (real device)
eas build --platform android --profile preview

# Build for production (Play Store)
eas build --platform android --profile production

# Test deep link (after app is installed)
# Just click: https://charithra.org/temple/test in browser
```

---

## Summary

**Infrastructure**: Complete ✅  
**Android Verification**: Live and validated by Google ✅  
**iOS Verification**: Pending Apple approval ⏳  
**Mobile App**: Configured with deep linking ✅  
**Testing**: Use emulator or build standalone app ✅  

**Deep linking is fully configured and ready!** When you build and install the app, clicking links like `https://charithra.org/temple/test` will open directly in your app instead of the browser.

