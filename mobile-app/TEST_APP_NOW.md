# Test Your App Now! 🚀

**Date**: March 9, 2026  
**Status**: Ready to test with SDK 52

---

## ✅ Dependencies Installed

All required dependencies are now installed:
- `expo-linking` - For deep linking
- `@expo/metro-runtime` - For web support

---

## Quick Start Testing

### Option 1: Test on Web Browser (Easiest)

```powershell
cd mobile-app
npx expo start
```

Then press `w` to open in web browser.

**What you'll see:**
- App opens in your browser
- You can navigate through screens
- Test the UI and functionality

---

### Option 2: Test on Android Emulator

**Requirements**: Android Studio with emulator installed

```powershell
cd mobile-app
npx expo start
```

Then press `a` to open in Android emulator.

---

### Option 3: Build Standalone App for Real Device

**This is the ONLY way to test deep linking on your phone!**

```powershell
cd mobile-app

# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Build APK for testing
eas build --platform android --profile preview
```

After the build completes:
1. Download the APK from the link provided
2. Install on your Android phone
3. Test deep links by clicking: https://charithra.org/temple/test

---

## Testing Deep Links

### Without App Installed
- Click: https://charithra.org/temple/test
- Opens in browser → Shows landing page ✅

### With App Installed (After Building)
- Click: https://charithra.org/temple/test
- Opens directly in your app! ✅
- Navigates to TempleDetails screen

---

## Supported Deep Link Patterns

```
https://charithra.org/temple/tirupati-balaji
→ Opens TempleDetails screen with temple ID

https://charithra.org/artifact/ancient-sculpture-123
→ Opens DefectDetails screen with artifact ID
```

---

## Important Notes

### SDK Version
- Your project: SDK 52 ✅
- Expo Go on phone: SDK 54 ❌
- **Cannot use Expo Go** - Must build standalone app

### Deep Linking
- Works ONLY in standalone builds
- Does NOT work in Expo Go
- Web and emulators work for general testing

### Keystore
- Location: `charithra-release.keystore`
- Backup: `~/Desktop/charithra-release-BACKUP.keystore`
- **Keep this safe!** You need it for all future updates

---

## Next Steps

1. **Test on web first** (quickest way to see if app works)
   ```powershell
   cd mobile-app
   npx expo start
   # Press 'w'
   ```

2. **Build for real device testing** (to test deep links)
   ```powershell
   eas build --platform android --profile preview
   ```

3. **After Apple approval** (24-48 hours)
   - Get Team ID
   - Update iOS verification file
   - Build iOS app

---

## Troubleshooting

### If you see "SDK version mismatch"
- This is expected with Expo Go
- Solution: Build standalone app instead

### If build fails
- Check `eas.json` configuration
- Ensure keystore is in correct location
- Check EAS build logs for details

### If deep links don't work
- Make sure you built a standalone app (not using Expo Go)
- Verify app is installed on device
- Check that verification files are live:
  - https://charithra.org/.well-known/assetlinks.json
  - https://charithra.org/.well-known/apple-app-site-association

---

## Quick Commands

```powershell
# Start development server
npx expo start

# Build for testing
eas build --platform android --profile preview

# Build for production
eas build --platform android --profile production

# Check build status
eas build:list
```

---

**You're all set!** Start with web testing, then build for your phone when ready to test deep links.
