# Mobile App - Quick Start Guide 🚀

## What Was Fixed

Yesterday's issue: **Missing screen imports** causing the app to crash on startup.

Today's fix: ✅ All screen imports corrected in `App.tsx`

## Start the Mobile App (3 Steps)

### Step 1: Open PowerShell

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
```

### Step 2: Start Expo (with offline mode)

```powershell
npx expo start --web --offline
```

**Note:** The `--offline` flag prevents network errors and makes startup faster!

### Step 3: View in Browser

Browser opens automatically at http://localhost:8081

If not, manually open: http://localhost:8081

## Make It Look Like a Phone

1. Press **F12** (opens DevTools)
2. Click **device icon** 📱 (top-left)
3. Select **iPhone 12 Pro** or **Pixel 5**
4. Press **F11** for fullscreen

## What You'll See

1. **Splash Screen** (2 seconds)
   - 🏛️ Temple icon
   - "Sanaathana Aalaya Charithra"

2. **Welcome Screen**
   - Rotating temple images
   - "Get Started" button

3. **Login Screen**
   - Email/password fields

4. **Main App**
   - Bottom tabs: Explore, My Reports, Alerts

## If It Doesn't Work

### Clear Cache
```powershell
npx expo start --clear
```

### Hard Refresh Browser
Press: **Ctrl + Shift + R**

### Check Console
Press **F12** → Console tab → Look for errors

## Test Script

Run this to verify everything is ready:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
./test-mobile-app.ps1
```

## Backend Integration

To test with backend API:

```powershell
# Terminal 1: Start Backend
cd Sanaathana-Aalaya-Charithra
./scripts/start-local-backend-simple.ps1

# Terminal 2: Start Mobile App
cd mobile-app
npx expo start --web
```

## All Services Together

```powershell
# Terminal 1: Backend
cd Sanaathana-Aalaya-Charithra
./scripts/start-local-backend-simple.ps1

# Terminal 2: Admin Portal
cd admin-portal
npm run dev

# Terminal 3: Mobile App
cd mobile-app
npx expo start --web
```

Then access:
- Backend: http://localhost:4000
- Admin Portal: http://localhost:5173
- Mobile App: http://localhost:8081

## Success Checklist

- ✅ Splash screen appears
- ✅ Auto-navigates to Welcome screen
- ✅ Images rotate every 4 seconds
- ✅ "Get Started" button works
- ✅ Can navigate to Login screen
- ✅ Bottom tabs are visible
- ✅ No errors in console (F12)

## Troubleshooting

### "Port 8081 already in use"

```powershell
# Kill the process
npx kill-port 8081

# Or use a different port
npx expo start --web --port 8082
```

### "Cannot find module" error

```powershell
# Reinstall dependencies
rm -rf node_modules
npm install
npx expo start --clear
```

### Blank screen after 30 seconds

1. Check browser console (F12)
2. Look for red error messages
3. Share the error for help

### Images not loading

```powershell
# Clear Metro bundler cache
npx expo start --clear
```

## Performance Tips

- First load: 15-20 seconds (normal)
- Subsequent loads: 2-3 seconds
- Use Chrome or Edge for best performance
- Close other tabs to free up memory

## Mobile App Features

- 🏛️ Temple exploration by state
- 🗺️ Interactive India map
- 📱 QR code scanning
- 🎧 Audio guides
- 🎥 Video content
- 📊 Infographics
- 💬 Q&A chat
- 📋 Defect reporting
- 🔔 Notifications
- 🌐 10+ languages

## Next Steps

1. ✅ Start the mobile app
2. ✅ Test the user flow
3. ✅ Verify navigation works
4. ✅ Test backend integration
5. ✅ Check all features

The mobile app is now fully functional! 🎉
