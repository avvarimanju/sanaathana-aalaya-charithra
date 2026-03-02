# Build Failure Troubleshooting

## What Happened

Your EAS build failed with:
```
× Build failed
🤖 Android build failed:
Unknown error. See logs of the Build complete hook build phase for more information.
```

Build ID: `ac4d284d-781a-43a6-aa5e-6726a3dc61c2`

---

## Step 1: Check Detailed Build Logs

The error message is vague, so we need to check the detailed logs:

**View logs at:**
https://expo.dev/accounts/avvarimanju/projects/sanaathana-aalaya-charithra-mobile/builds/ac4d284d-781a-43a6-aa5e-6726a3dc61c2

Look for:
- Red error messages in the "Build complete hook" phase
- Any dependency installation failures
- Memory or timeout issues
- Gradle build errors

---

## Common Causes & Solutions

### 1. Missing Icon/Splash Screen Assets

**Problem**: EAS expects icon and splash screen images but they're missing from app.json

**Solution**: Add icon and splash screen to app.json

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B35"
    }
  }
}
```

### 2. Incompatible Dependencies

**Problem**: Some packages might not be compatible with Expo SDK 54

**Check**: Look for warnings about peer dependencies or version conflicts

### 3. Build Hook Failure

**Problem**: EAS runs post-build hooks that might fail

**Solution**: Check if there are any custom build hooks in eas.json or app.json

### 4. Memory/Timeout Issues (Free Tier)

**Problem**: Free tier builds have limited resources and might timeout

**Solution**: 
- Simplify dependencies
- Remove unused packages
- Try building again (sometimes it's just a temporary issue)

---

## Quick Fix Attempts

### Option 1: Add Missing Assets

Create placeholder icon and splash screen:

```powershell
# Create assets directory if it doesn't exist
cd mobile-app
mkdir -p assets

# You'll need to add:
# - assets/icon.png (1024x1024 PNG)
# - assets/splash.png (1284x2778 PNG for best results)
```

Then update app.json to reference them.

### Option 2: Simplify Build Profile

Try using the simpler "production" profile instead:

```powershell
eas build --platform android --profile production
```

### Option 3: Check for Asset Issues

The build might be failing because of missing adaptive icon:

Update app.json:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#FF6B35"
  }
}
```

---

## Next Steps

1. **Check the detailed logs** at the URL above
2. **Look for specific error messages** in the "Build complete hook" phase
3. **Share the error details** so we can provide a targeted fix
4. **Try the quick fixes** above if they match the error

---

## Alternative: Build APK Instead

If AAB builds keep failing, we can try building an APK first to test:

```powershell
eas build --platform android --profile preview
```

This creates an APK (not AAB) which is simpler and might succeed. You can use this for initial testing, then fix the AAB build for Play Store submission.

---

## What to Share

When you check the logs, look for and share:
- The exact error message from the "Build complete hook" phase
- Any red error text
- Any warnings about missing files or dependencies
- The last few lines before the build failed
