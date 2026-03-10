# Mobile App Blank Screen - Complete Fix Guide

## Problem

Mobile app shows blank screen on:
- Web browser (http://localhost:8081)
- Mobile device (Expo Go app)

## Root Cause Analysis

The Expo server bundles successfully (515 modules), but the app doesn't render. This typically indicates:
1. JavaScript runtime error in a component
2. Navigation setup issue
3. Missing or incorrect dependencies
4. Environment variable issues

## Solution Applied

### Step 1: Restart Expo with Cache Clear

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npx expo start --web --clear
```

This clears the Metro bundler cache and rebuilds everything fresh.

### Step 2: Verify Environment Variables

Confirmed `.env.development` is being loaded with:
- EXPO_PUBLIC_API_URL=http://localhost:4000
- EXPO_PUBLIC_ENVIRONMENT=development
- EXPO_PUBLIC_DEMO_MODE=false

### Step 3: Test with Minimal App

Created `App-Minimal-Test.tsx` to test if React Native rendering works at all.

To test:
1. Temporarily rename `App.tsx` to `App-Full.tsx`
2. Rename `App-Minimal-Test.tsx` to `App.tsx`
3. Restart Expo server
4. Check if minimal app renders

## Diagnostic Steps

### Check Browser Console

1. Open http://localhost:8081 in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for error messages (red text)

Common errors:
- `Cannot read property 'X' of undefined` - Component trying to access undefined data
- `Element type is invalid` - Import/export issue with a component
- `Navigation error` - react-navigation setup issue
- `Network request failed` - API connection issue

### Check Expo Terminal

Look for:
- Build errors
- TypeScript errors
- Module resolution errors
- Dependency warnings

### Test Individual Components

If the full app doesn't work, test components individually:

```typescript
// Test SplashScreen only
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  return <SplashScreen navigation={{ replace: () => {} }} />;
}
```

## Common Fixes

### Fix 1: Missing Dependencies

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npm install
```

### Fix 2: Clear All Caches

```powershell
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Fix 3: Check Navigation Setup

Ensure all navigation dependencies are installed:
```json
{
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.11.0",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.2"
}
```

### Fix 4: Add Error Boundary

Add error boundary to catch and display errors:

```typescript
import React from 'react';
import { View, Text } from 'react-native';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: 'red', marginBottom: 10 }}>
            Something went wrong!
          </Text>
          <Text style={{ fontSize: 14 }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* Your app content */}
    </ErrorBoundary>
  );
}
```

## Testing Checklist

- [ ] Expo server starts without errors
- [ ] Bundle completes successfully (100%)
- [ ] Browser opens to http://localhost:8081
- [ ] No red errors in browser console
- [ ] App renders (not blank screen)
- [ ] Navigation works (can move between screens)
- [ ] API calls work (backend at localhost:4000)

## Next Steps

1. **Wait for Expo server to finish starting** (rebuilding cache)
2. **Open http://localhost:8081 in browser**
3. **Check browser console for errors**
4. **Share the error message** if any
5. **Test with minimal app** if full app doesn't work

## Expected Behavior

When working correctly:
1. Expo server starts and shows QR code
2. Browser opens automatically to localhost:8081
3. Splash screen appears (orange background with temple icon)
4. After 2 seconds, navigates to Welcome screen
5. Can navigate through the app

## Troubleshooting

### Issue: "Module not found"
**Solution**: Install missing dependency
```powershell
npm install <missing-module>
```

### Issue: "Cannot find module './src/screens/...'"
**Solution**: Check file exists and path is correct

### Issue: "Network request failed"
**Solution**: Ensure backend server is running on localhost:4000

### Issue: "Invariant Violation"
**Solution**: Usually a navigation or component setup issue. Check stack trace.

## Files Created

- `MOBILE_APP_FIX_STEPS.md` - Quick fix steps
- `App-Minimal-Test.tsx` - Minimal test app
- `MOBILE_APP_BLANK_SCREEN_FIX.md` - This comprehensive guide

## Status

- ✅ Expo server restarted with --clear flag
- ✅ Environment variables loading correctly
- ✅ Cache being rebuilt
- 🔄 Waiting for bundle to complete
- ⏳ Need to test in browser

## What to Do Now

1. Wait for the Expo server to finish starting (watch the terminal)
2. When you see "Metro waiting on exp://..." or similar, open http://localhost:8081
3. Check if the app renders or if there's a blank screen
4. If blank screen, open browser console (F12) and share the error message
5. We'll fix the specific error based on what we find
