# Expo Go Battery Usage - Explained

## Yes, Expo Go Uses More Battery! ⚡

This is **completely normal** and expected during development. Here's why:

## Why Expo Go Drains Battery Faster

### 1. **Development Mode Overhead**
- Running in development mode (not optimized)
- Extra debugging tools active
- Performance monitoring running
- Console logging active
- Source maps being processed

### 2. **Hot Reload / Fast Refresh**
- Constantly watching for file changes
- Maintaining WebSocket connection to dev server
- Reloading code on every save
- Processing updates in real-time

### 3. **Network Activity**
- Continuous connection to your computer
- Downloading JavaScript bundles over network
- Fetching assets from dev server
- Metro bundler communication

### 4. **No Optimizations**
- Code not minified
- No tree shaking
- No code splitting
- Debug symbols included
- Larger bundle sizes

### 5. **Expo Go App Itself**
- Running the Expo Go container app
- Plus your app inside it
- Double the overhead

## Battery Usage Comparison

### Development (Expo Go)
```
Battery Drain: 🔋🔋🔋🔋🔋 (HIGH)
- 15-30% per hour
- Phone gets warm
- Fast battery discharge
```

### Production (Standalone App)
```
Battery Drain: 🔋 (NORMAL)
- 3-5% per hour
- Normal temperature
- Standard battery usage
```

**That's 5-10x difference!**

## Solutions & Workarounds

### For Development Testing

#### 1. **Use Web Browser Instead**
```bash
npm run web
```
- No battery drain on phone
- Faster testing
- Better for UI development
- Perfect for hackathon demo!

#### 2. **Keep Phone Plugged In**
- Charge while testing
- Prevents battery drain
- Maintains full performance

#### 3. **Test in Short Sessions**
- Test specific features
- Close Expo Go when done
- Don't leave it running

#### 4. **Reduce Screen Brightness**
- Lower brightness = less battery
- Still functional for testing

### For Production/Demo

#### 1. **Build Standalone App** (Recommended for Demo)
```bash
# Build APK for Android
eas build --platform android --profile preview

# Or build for local testing
npx expo run:android
```

**Benefits:**
- ✅ Normal battery usage
- ✅ Faster performance
- ✅ No dev server needed
- ✅ Professional experience
- ✅ Can share APK file

#### 2. **Use Production Mode**
```bash
# Start in production mode
expo start --no-dev --minify
```

**Benefits:**
- ✅ Optimized code
- ✅ Better battery life
- ✅ Faster performance

## For Your Hackathon Demo

### Best Options (Ranked)

#### 🥇 **Option 1: Web Browser Demo**
```bash
npm run web
```
- **Pros**: No battery issues, fast, easy to show
- **Cons**: Not "real" mobile experience
- **Best for**: Quick demos, presentations

#### 🥈 **Option 2: Build APK**
```bash
eas build --platform android --profile preview
```
- **Pros**: Real app, normal battery, professional
- **Cons**: Takes time to build (20-30 min)
- **Best for**: Final demo, judges testing

#### 🥉 **Option 3: Expo Go (Keep Plugged In)**
```bash
expo start
# Scan QR code, keep phone charging
```
- **Pros**: Quick to start, easy updates
- **Cons**: Battery drain, needs charging
- **Best for**: Development, quick tests

## Recommendations

### During Development (Now)
1. ✅ Use **web browser** for most testing
2. ✅ Use Expo Go for mobile-specific features only
3. ✅ Keep phone **plugged in** when using Expo Go
4. ✅ Close Expo Go when not actively testing

### For Hackathon Demo (Soon)
1. ✅ **Build standalone APK** (best option!)
2. ✅ Or use **web browser** demo
3. ✅ Have phone **fully charged** before demo
4. ✅ Keep **charger nearby** as backup

### For Production Release
1. ✅ Build production APK/IPA
2. ✅ Submit to Play Store/App Store
3. ✅ Users get optimized app
4. ✅ Normal battery usage

## Quick Commands

### Test on Web (No Battery Drain)
```bash
cd mobile-app
npm run web
```

### Build Production APK
```bash
# Install EAS CLI (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Run in Production Mode
```bash
expo start --no-dev --minify
```

## Battery Saving Tips

### While Using Expo Go

1. **Lower Screen Brightness**
   - Settings → Display → Brightness
   - Reduces battery by 20-30%

2. **Close Other Apps**
   - Free up resources
   - Better performance

3. **Disable Location Services**
   - If not needed for testing
   - Saves significant battery

4. **Use Airplane Mode + WiFi**
   - Disable cellular data
   - Keep WiFi on for dev server
   - Saves battery

5. **Reduce Auto-Lock Time**
   - Screen turns off faster
   - Saves battery when idle

## The Bottom Line

### Is This Normal?
✅ **YES!** Expo Go battery drain is completely normal during development.

### Should You Worry?
❌ **NO!** This only happens in development mode.

### What Should You Do?
1. **For now**: Use web browser for most testing
2. **For demo**: Build standalone APK or use web
3. **For production**: Build optimized app for stores

### Will Users Experience This?
❌ **NO!** Production apps have normal battery usage.

## Summary

| Mode | Battery Drain | Use Case |
|------|---------------|----------|
| **Expo Go (Dev)** | 🔋🔋🔋🔋🔋 Very High | Development only |
| **Web Browser** | 🔋 None (laptop) | Testing, demos |
| **Standalone APK** | 🔋 Normal | Demos, production |
| **Production App** | 🔋 Normal | End users |

## Your Situation

**Current**: Using Expo Go → High battery drain ✅ Normal!

**Solution**: 
- For testing: Use web browser
- For demo: Build APK or use web
- Keep phone charged during development

**Don't worry** - this is how React Native development works. Your production app will have normal battery usage! 🎉

---

**TL;DR**: Expo Go drains battery fast because it's in development mode. Use web browser for testing, or build a standalone APK for the demo. Production apps will have normal battery usage.
