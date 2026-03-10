# Complete Guide: Build AAB for Play Store

## Quick Start (Recommended)

Run this single command from the `mobile-app` directory:

```powershell
.\build-aab.ps1
```

This script will:
- ✅ Set up Java environment automatically
- ✅ Create keystore.properties (if needed)
- ✅ Clean previous builds
- ✅ Build the release AAB
- ✅ Show you exactly where the AAB file is

## What You Need

1. ✅ Android Studio installed (you have this)
2. ✅ Signing keystore created (you have: `sanaathana-release-key.keystore`)
3. ✅ Know your keystore passwords

## Step-by-Step Instructions

### Option 1: Automated Build (Easiest)

```powershell
# Navigate to mobile-app directory
cd C:\Users\avvar\OneDrive\LEARNING\MANJU_PROJECTS\Sanaathana-Aalaya-Charithra\mobile-app

# Run the build script
.\build-aab.ps1
```

The script will:
1. Ask for your keystore passwords (first time only)
2. Build the AAB (takes 10-20 minutes first time)
3. Copy the AAB to an easy location

### Option 2: Manual Build

If you prefer to do it manually:

```powershell
# 1. Set Java environment
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# 2. Create keystore.properties file
# Create file: android/keystore.properties with:
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=sanaathana-key
storeFile=../sanaathana-release-key.keystore

# 3. Build
cd android
.\gradlew bundleRelease
```

### Option 3: Quick Build (If Already Configured)

If you've already run the full build script once:

```powershell
.\quick-build.ps1
```

## Understanding the Build Process

### First Build (10-20 minutes)
- Downloads Gradle dependencies (~500 MB)
- Downloads Android SDK components
- Compiles your app
- Creates the AAB file

### Subsequent Builds (2-5 minutes)
- Uses cached dependencies
- Only recompiles changed code
- Much faster!

## Output Location

After successful build, your AAB will be at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

The script also copies it to:
```
mobile-app/app-release.aab
```

## Troubleshooting

### Error: "JAVA_HOME is not set"

**Cause**: Java environment not configured

**Solution**: The build script handles this automatically. If you're running gradlew directly:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

### Error: "Keystore file not found"

**Cause**: keystore.properties points to wrong location

**Solution**: Verify the keystore file exists:

```powershell
Test-Path sanaathana-release-key.keystore
```

Should return `True`. If not, regenerate the keystore:

```powershell
.\generate-signing-key.ps1
```

### Error: "Incorrect keystore password"

**Cause**: Wrong password in keystore.properties

**Solution**: Delete `android/keystore.properties` and run the build script again. It will prompt for passwords.

### Error: "Task failed with an exception"

**Cause**: Various build issues

**Solution**: Clean and rebuild:

```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease --info
cd ..
```

The `--info` flag shows detailed error messages.

### Build Hangs or Times Out

**Cause**: Large download or slow internet

**Solution**: 
1. Be patient (first build takes time)
2. Check internet connection
3. Run with `--info` to see progress:

```powershell
cd android
.\gradlew bundleRelease --info
```

## Verifying Your AAB

After build completes, verify the AAB:

```powershell
# Check file exists
Test-Path android\app\build\outputs\bundle\release\app-release.aab

# Check file size (should be 20-50 MB typically)
(Get-Item android\app\build\outputs\bundle\release\app-release.aab).Length / 1MB
```

## Next Steps: Upload to Play Store

1. **Go to Play Console**: https://play.google.com/console

2. **Create App** (if first time):
   - Click "Create app"
   - Fill in app details
   - Complete all required sections

3. **Upload AAB**:
   - Go to: Testing → Internal testing
   - Click "Create new release"
   - Upload your AAB file
   - Add release notes
   - Save and review

4. **Add Testers**:
   - Create tester list
   - Add email addresses
   - Testers will receive invitation

5. **Roll Out**:
   - Review release
   - Click "Start rollout to Internal testing"
   - Wait for processing (5-30 minutes)

6. **Test**:
   - Testers can install from Play Store
   - Collect feedback
   - Fix issues and rebuild

## Build Variants

### AAB (Android App Bundle) - Recommended
```powershell
.\gradlew bundleRelease
```
- Smaller download size for users
- Required for Play Store
- Google optimizes for each device

### APK (Android Package) - For Direct Install
```powershell
.\gradlew assembleRelease
```
- Larger file size
- Can install directly on device
- Good for testing outside Play Store

## Architecture Notes

Your project structure:
```
Sanaathana-Aalaya-Charithra/
├── mobile-app/              ← Mobile app (this folder)
│   ├── android/            ← Native Android project
│   ├── src/                ← React Native source
│   └── build-aab.ps1       ← Build script
├── admin-portal/           ← Admin web app
└── src/                    ← Backend API
```

The mobile app is independent and can be built separately. You don't need the backend running to build the AAB.

## Docker and Backend

**Q: Do I need Docker running to build the AAB?**

**A: No!** Building the mobile app AAB is completely independent of:
- Backend API
- Docker containers
- Database
- Admin portal

You only need Docker running when:
- Testing the mobile app with real backend API
- Developing backend features
- Running admin portal with backend

## Moving Backend Code

**Q: Should I move backend code to a separate folder?**

**A: Not necessary for building the AAB.** The current structure is fine:
- Mobile app builds from `mobile-app/` folder
- Backend code location doesn't affect mobile builds
- EAS Build uses `.easignore` to exclude backend files

If you want to reorganize for clarity, you can, but it won't solve build issues.

## Common Misconceptions

❌ "I need expo.dev to build"
✅ You can build locally with Android Studio

❌ "I need the backend running"
✅ AAB build is independent of backend

❌ "I need to move backend code"
✅ Current structure works fine

❌ "Build should be instant"
✅ First build takes 10-20 minutes (normal)

## Quick Reference

```powershell
# Full automated build
.\build-aab.ps1

# Quick build (if configured)
.\quick-build.ps1

# Manual build
cd android
.\gradlew bundleRelease
cd ..

# Clean build
cd android
.\gradlew clean
.\gradlew bundleRelease
cd ..

# Build APK instead
cd android
.\gradlew assembleRelease
cd ..

# Check build output
Test-Path android\app\build\outputs\bundle\release\app-release.aab
```

## Success Indicators

You'll know the build succeeded when you see:

```
BUILD SUCCESSFUL in 15m 23s
```

And the AAB file exists:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Look in the Troubleshooting section above
3. Run with `--info` flag for details
4. Check `android/app/build.gradle` for configuration
5. Verify keystore file and passwords

## Summary

Building an AAB locally with Android Studio is:
- ✅ Faster than EAS Build (no queue)
- ✅ Free (no build limits)
- ✅ Works offline (after first build)
- ✅ Gives you full control
- ✅ Independent of backend/Docker

Just run `.\build-aab.ps1` and wait 10-20 minutes!
