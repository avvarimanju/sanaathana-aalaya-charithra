# Deep Linking Configured! 🎉

**Date**: March 9, 2026  
**Status**: Ready to build and test

---

## What Was Configured

✅ Updated `app.json` with deep linking configuration  
✅ Changed package names to match verification files (`com.charithra.app`)  
✅ Added Android intent filters for App Links  
✅ Added iOS associated domains for Universal Links  
✅ Created deep linking utility (`src/utils/deepLinking.ts`)  
✅ Updated `App.tsx` to handle incoming links  

---

## Changes Made

### 1. app.json - Package Names Updated

**Android**: `com.sanaathana.aalayacharithra` → `com.charithra.app`  
**iOS**: `com.sanaathana.aalayacharithra` → `com.charithra.app`

This matches the verification files we deployed:
- https://charithra.org/.well-known/assetlinks.json (Android)
- https://charithra.org/.well-known/apple-app-site-association (iOS)

### 2. app.json - Android Intent Filters

Added configuration to handle these URL patterns:
- `https://charithra.org/temple/*`
- `https://charithra.org/artifact/*`

```json
"intentFilters": [
  {
    "action": "VIEW",
    "autoVerify": true,
    "data": [
      {
        "scheme": "https",
        "host": "charithra.org",
        "pathPrefix": "/temple"
      },
      {
        "scheme": "https",
        "host": "charithra.org",
        "pathPrefix": "/artifact"
      }
    ],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]
```

### 3. app.json - iOS Associated Domains

Added configuration for iOS Universal Links:

```json
"associatedDomains": [
  "applinks:charithra.org"
]
```

### 4. Deep Linking Utility

Created `src/utils/deepLinking.ts` with functions to:
- Parse deep link URLs
- Extract temple/artifact IDs
- Subscribe to link events
- Handle initial URL

### 5. App.tsx - Link Handler

Updated main App component to:
- Listen for deep links when app opens
- Listen for deep links while app is running
- Navigate to appropriate screens based on link type

---

## How It Works

### When User Clicks a Link

**Example**: User clicks `https://charithra.org/temple/tirupati-balaji`

1. **Android/iOS detects** the link matches your domain
2. **System checks** verification file (assetlinks.json or apple-app-site-association)
3. **If app is installed**: Opens in your app
4. **If app is NOT installed**: Opens in browser (shows landing page)

### In Your App

1. Deep link is received
2. `parseDeepLink()` extracts type (`temple`) and ID (`tirupati-balaji`)
3. App navigates to `TempleDetails` screen with the temple ID
4. User sees the temple details immediately!

---

## Supported URL Patterns

### Temple Links
```
https://charithra.org/temple/tirupati-balaji
https://charithra.org/temple/golden-temple
https://charithra.org/temple/meenakshi-temple
```
→ Opens `TempleDetails` screen

### Artifact Links
```
https://charithra.org/artifact/ancient-sculpture-123
https://charithra.org/artifact/temple-bell-456
```
→ Opens `DefectDetails` screen

---

## Next Steps

### 1. Install Dependencies

Make sure you have expo-linking installed:

```powershell
cd mobile-app
npm install expo-linking
```

### 2. Test Locally (Development)

```powershell
# Start Expo
npx expo start

# Test deep link in terminal
npx uri-scheme open "https://charithra.org/temple/test" --android
npx uri-scheme open "https://charithra.org/temple/test" --ios
```

### 3. Build for Testing

**For Android (EAS Build)**:

```powershell
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK for testing
eas build --platform android --profile preview
```

**For iOS** (after Apple Developer approval):

```powershell
# Build for iOS
eas build --platform ios --profile preview
```

### 4. Test on Real Device

Once built and installed:

1. Open a browser on your device
2. Navigate to: `https://charithra.org/temple/test`
3. The link should open in your app!

---

## Build Configuration

### EAS Build (eas.json)

Check if you have `eas.json` in your mobile-app folder. If not, create it:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Keystore Configuration

When building for production, EAS will ask for keystore details. Use the keystore we generated:

- **Keystore path**: `../charithra-release.keystore`
- **Keystore password**: (the password you entered)
- **Key alias**: `charithra-key`
- **Key password**: (the password you entered)

Or configure in `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab",
        "credentialsSource": "local"
      }
    }
  }
}
```

---

## Testing Checklist

### Before Building
- [ ] Dependencies installed (`expo-linking`)
- [ ] Code compiles without errors
- [ ] Deep linking utility created
- [ ] App.tsx updated with link handler

### After Building
- [ ] App installs on device
- [ ] App opens normally
- [ ] Click `https://charithra.org/temple/test` in browser
- [ ] App opens and navigates to temple screen
- [ ] Click `https://charithra.org/artifact/test` in browser
- [ ] App opens and navigates to artifact screen

### iOS Specific (After Apple Approval)
- [ ] Apple Developer account approved
- [ ] Team ID added to apple-app-site-association
- [ ] File deployed to Cloudflare
- [ ] iOS build created with correct bundle ID
- [ ] Universal Links working on iOS device

---

## Troubleshooting

### Links Open in Browser Instead of App

**Android**:
1. Check package name matches: `com.charithra.app`
2. Verify assetlinks.json is accessible: https://charithra.org/.well-known/assetlinks.json
3. Check SHA256 fingerprint matches your keystore
4. Ensure `autoVerify: true` in intent filters
5. Clear app data and reinstall

**iOS**:
1. Check bundle ID matches: `com.charithra.app`
2. Verify apple-app-site-association is accessible
3. Check Team ID is correct (after Apple approval)
4. Ensure associated domains are configured
5. Reinstall app

### App Crashes on Deep Link

1. Check console logs for errors
2. Verify navigation screens exist (`TempleDetails`, `DefectDetails`)
3. Ensure navigation ref is ready before navigating
4. Test with simple IDs first (`/temple/test`)

### Deep Link Not Detected

1. Check `expo-linking` is installed
2. Verify deep linking utility is imported
3. Check useEffect is running in App.tsx
4. Test with `npx uri-scheme` command first

---

## Quick Commands

```powershell
# Install dependencies
cd mobile-app
npm install expo-linking

# Test locally
npx expo start

# Test deep link (Android)
npx uri-scheme open "https://charithra.org/temple/test" --android

# Build for testing
eas build --platform android --profile preview

# Build for production
eas build --platform android --profile production
```

---

## Summary

**Configuration**: Complete ✅  
**Android Verification**: Live and validated ✅  
**iOS Verification**: Waiting for Apple approval ⏳  
**Code Changes**: Done ✅  
**Ready to Build**: Yes ✅  

**Next Action**: Install dependencies and build the app!

