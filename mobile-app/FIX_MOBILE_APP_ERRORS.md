# Fix Mobile App Runtime Errors

## Error Description

The mobile app is showing these errors:
```
ERROR  [TypeError: Cannot read property 'S' of undefined]
ERROR  [TypeError: Cannot read property 'default' of undefined]
```

## Root Cause

These errors typically occur due to:
1. **Cached Metro bundler** - Old cached modules causing conflicts
2. **Module resolution issues** - Incorrect imports or missing dependencies
3. **React Native version mismatch** - Incompatible package versions

## Solution Steps

### Step 1: Clear All Caches

Stop the current Expo server (Ctrl+C), then run:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app

# Clear Metro bundler cache
npx expo start --clear

# Or use the full cache clear
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
npm install
npx expo start --clear
```

### Step 2: Check for Babel Config Issues

The error message mentioned "Detected a change in babel.config.js". After clearing cache, the babel config should be properly loaded.

Current babel.config.js is correct:
```javascript
module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
```

### Step 3: Verify Dependencies

Check that all dependencies are properly installed:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npm install
```

### Step 4: Start with Clean Cache

```powershell
npx expo start --clear
```

## Quick Fix Command

Run this single command to fix the issue:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app; npx expo start --clear
```

## Alternative: Full Reset

If the above doesn't work, do a complete reset:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app

# Remove all caches and dependencies
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo-shared -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install

# Start with clear cache
npx expo start --clear
```

## Expected Result

After clearing the cache, you should see:
```
› Metro waiting on exp://192.168.0.152:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Web is waiting on http://localhost:8081
```

And NO errors like:
```
ERROR  [TypeError: Cannot read property 'S' of undefined]
```

## Testing

1. Press `w` to open in web browser
2. Scan QR code with Expo Go app on your phone
3. Verify the app loads without errors

## Common Issues

### Issue: Still seeing errors after clearing cache

**Solution**: Check for circular dependencies or incorrect imports in screen files.

### Issue: "Cannot find module" errors

**Solution**: Run `npm install` again to ensure all dependencies are installed.

### Issue: Babel config not being picked up

**Solution**: Restart the Metro bundler completely (Ctrl+C and start again).

## Status

Run the quick fix command and the errors should be resolved.

---

**Next Step**: Run `npx expo start --clear` in the mobile-app directory.
