# Run Mobile App on Laptop - Complete Guide

## Yes! You Can Run Your Mobile App on Laptop

Perfect for testing, demos, and presentations!

---

## Option 1: Android Emulator (Best for Demo) ⭐

Run a full Android device on your laptop.

### Setup Android Studio Emulator

**Step 1: Install Android Studio**

```bash
# Download from: https://developer.android.com/studio
# Install Android Studio (includes emulator)
```

**Step 2: Set Up Emulator**

1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
4. Choose device: Pixel 5 or Pixel 6 (recommended)
5. Choose system image: Android 13 (API 33) or latest
6. Click "Finish"

**Step 3: Start Emulator**

```bash
# From Android Studio
Click ▶️ (Play button) next to your virtual device

# Or from command line
cd ~/AppData/Local/Android/Sdk/emulator  # Windows
./emulator -avd Pixel_5_API_33
```

**Step 4: Run Your App**

```bash
cd mobile-app
npm start

# Press 'a' to open on Android emulator
# Or scan QR code with Expo Go app in emulator
```

### Pros & Cons

✅ **Pros:**
- Full Android experience
- Test all features (camera, QR scanner, etc.)
- Perfect for demos
- Looks professional
- Can record screen easily

❌ **Cons:**
- Requires powerful laptop (8GB+ RAM)
- Takes time to set up (30-60 min first time)
- Can be slow on older laptops

---

## Option 2: Web Browser (Fastest Setup) ⭐⭐⭐

Run your app directly in Chrome/Edge browser.

### Setup (5 Minutes!)

**Step 1: Start Expo**

```bash
cd mobile-app
npm start
```

**Step 2: Open in Browser**

```bash
# Press 'w' in the terminal
# Or open: http://localhost:19006
```

**Step 3: Enable Mobile View**

```bash
# In browser:
1. Press F12 (open DevTools)
2. Click device icon (Toggle device toolbar)
3. Select "iPhone 12 Pro" or "Pixel 5"
4. Refresh page
```

### Pros & Cons

✅ **Pros:**
- Instant setup (5 minutes)
- No emulator needed
- Fast and responsive
- Easy to demo
- Works on any laptop

❌ **Cons:**
- Some features may not work (camera, QR scanner)
- Not exactly like real mobile
- May have minor UI differences

---

## Option 3: Windows Subsystem for Android (WSA)

Run Android apps natively on Windows 11.

### Requirements

- Windows 11 only
- 8GB+ RAM
- Virtualization enabled in BIOS

### Setup

**Step 1: Install WSA**

```powershell
# Open Microsoft Store
# Search "Windows Subsystem for Android"
# Click Install
```

**Step 2: Enable Developer Mode**

```powershell
# Settings → Privacy & Security → For developers
# Turn on "Developer Mode"
```

**Step 3: Install APK**

```bash
# Build APK first
cd mobile-app
eas build --platform android --profile preview

# Install APK
adb connect 127.0.0.1:58526
adb install app.apk
```

### Pros & Cons

✅ **Pros:**
- Native Android on Windows
- Better performance than emulator
- All features work

❌ **Cons:**
- Windows 11 only
- Complex setup
- Requires building APK

---

## Option 4: Expo Web + DevTools (Recommended for Quick Demo)

Simplest option for hackathon demos.

### Quick Start

```bash
cd mobile-app
npm start

# Press 'w' for web
# Browser opens automatically
# Press F12 for mobile view
```

### Make It Look Professional

**Step 1: Full Screen Mode**

```bash
# In browser:
Press F11 for fullscreen
```

**Step 2: Mobile Device View**

```bash
# DevTools (F12):
1. Click device icon (Ctrl+Shift+M)
2. Select device: iPhone 12 Pro
3. Rotate to portrait mode
4. Hide DevTools (F12 again)
```

**Step 3: Record Demo**

```bash
# Use OBS Studio or Windows Game Bar
Win + G → Start recording
```

### Pros & Cons

✅ **Pros:**
- 5-minute setup
- No installation needed
- Perfect for presentations
- Easy screen recording
- Works everywhere

❌ **Cons:**
- Limited mobile features
- Not 100% accurate

---

## Comparison Table

| Option | Setup Time | Performance | Features | Best For |
|--------|-----------|-------------|----------|----------|
| Android Emulator | 30-60 min | Medium | 100% | Full testing |
| Web Browser | 5 min | Fast | 80% | Quick demo ⭐ |
| WSA (Win11) | 60+ min | Fast | 100% | Windows 11 users |
| Expo Web | 2 min | Fast | 80% | Presentations ⭐⭐⭐ |

---

## Recommended Setup for Hackathon Demo

### Option A: Web Browser (Fastest) ⭐⭐⭐

**Perfect for presentations and quick demos**

```bash
# 1. Start app
cd mobile-app
npm start

# 2. Press 'w' for web

# 3. In browser:
#    - Press F12
#    - Click device icon
#    - Select iPhone 12 Pro
#    - Press F11 for fullscreen

# 4. Demo ready! 🎉
```

**Time: 5 minutes**

### Option B: Android Emulator (Most Professional)

**Perfect for detailed demos**

```bash
# 1. Start emulator from Android Studio

# 2. Start app
cd mobile-app
npm start

# 3. Press 'a' to open on Android

# 4. Demo ready! 🎉
```

**Time: 10 minutes (after initial setup)**

---

## Step-by-Step: Web Browser Demo (Recommended)

### Complete Walkthrough

**1. Start Your App (2 minutes)**

```bash
# Open terminal
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\mobile-app

# Start Expo
npm start

# Wait for QR code to appear
```

**2. Open in Browser (1 minute)**

```bash
# In terminal, press: w
# Or open browser and go to: http://localhost:19006

# Browser opens automatically with your app
```

**3. Enable Mobile View (2 minutes)**

```bash
# In browser:
1. Press F12 (opens DevTools)
2. Click device icon (top-left of DevTools)
   Or press: Ctrl + Shift + M
3. Select device: iPhone 12 Pro or Pixel 5
4. Ensure orientation is Portrait
5. Zoom to 100%
```

**4. Make It Professional (1 minute)**

```bash
# Hide DevTools:
Press F12 again

# Fullscreen mode:
Press F11

# Now it looks like a real phone! 📱
```

**5. Demo Your App**

```bash
# Navigate through screens
# Show features
# Explain functionality

# Exit fullscreen: Press F11
# Exit mobile view: Press F12, click device icon
```

---

## Troubleshooting

### Issue: "Cannot connect to Metro"

**Solution:**
```bash
# Clear cache and restart
cd mobile-app
npm start -- --clear
```

### Issue: "App not loading in browser"

**Solution:**
```bash
# Check if port 19006 is available
netstat -ano | findstr :19006

# If blocked, kill process or use different port
npm start -- --port 19007
```

### Issue: "Emulator is slow"

**Solution:**
```bash
# Enable hardware acceleration
# In Android Studio:
# Tools → AVD Manager → Edit device → Show Advanced Settings
# Enable: Hardware - GLES 2.0
```

### Issue: "QR scanner not working in browser"

**Expected:** Camera features don't work in web browser

**Solution:**
- Use Android emulator for camera features
- Or use real phone with Expo Go
- For demo, show screenshots of QR scanning

---

## Recording Your Demo

### Option 1: OBS Studio (Free, Professional)

```bash
# Download: https://obsproject.com/

# Setup:
1. Add "Display Capture" source
2. Select your screen
3. Crop to show only app
4. Click "Start Recording"
5. Demo your app
6. Click "Stop Recording"
```

### Option 2: Windows Game Bar (Built-in)

```bash
# Start recording:
Win + G → Click record button

# Stop recording:
Win + G → Click stop button

# Videos saved to: Videos/Captures folder
```

### Option 3: Screen Recording in Browser

```bash
# Chrome extension: Loom or Screencastify
# Install from Chrome Web Store
# Click extension icon → Start recording
```

---

## Tips for Professional Demo

### 1. Prepare Your Environment

```bash
✓ Close unnecessary tabs/windows
✓ Hide desktop icons (right-click desktop → View → Show desktop icons)
✓ Set clean wallpaper
✓ Disable notifications (Win + A → Focus Assist → Priority only)
✓ Charge laptop fully
✓ Test audio/video before demo
```

### 2. Optimize Browser View

```bash
✓ Use Chrome or Edge (best Expo support)
✓ Zoom to 100% (Ctrl + 0)
✓ Hide bookmarks bar (Ctrl + Shift + B)
✓ Use fullscreen mode (F11)
✓ Clear browser cache before demo
```

### 3. Practice Your Demo

```bash
✓ Run through demo 3-5 times
✓ Time your demo (aim for 5-7 minutes)
✓ Prepare talking points
✓ Have backup plan (screenshots/video)
✓ Test on presentation laptop beforehand
```

### 4. Have Backup Ready

```bash
✓ Screenshots of key screens
✓ Recorded demo video
✓ Presentation slides
✓ QR code for Expo Go (if judges have phones)
```

---

## Quick Commands Reference

### Start App in Browser
```bash
cd mobile-app
npm start
# Press 'w'
```

### Start App in Android Emulator
```bash
cd mobile-app
npm start
# Press 'a'
```

### Start App in iOS Simulator (Mac only)
```bash
cd mobile-app
npm start
# Press 'i'
```

### Clear Cache
```bash
cd mobile-app
npm start -- --clear
```

### Change Port
```bash
cd mobile-app
npm start -- --port 19007
```

---

## For Your Hackathon Presentation

### Recommended Setup

**Before Presentation:**
1. Start app in browser (5 min)
2. Enable mobile view (F12 → device icon)
3. Test all screens work
4. Practice navigation
5. Prepare talking points

**During Presentation:**
1. Press F11 for fullscreen
2. Demo key features:
   - Login/signup
   - Temple browsing
   - QR code scanning (show screenshot)
   - Content viewing
   - Payment flow (show UI)
3. Exit fullscreen (F11)
4. Show code if asked

**Backup Plan:**
- Have screenshots ready
- Have recorded demo video
- Have Expo Go QR code (if judges have phones)

---

## Summary

**Can you run mobile app on laptop?** YES! Multiple ways!

**Best for hackathon demo:**
→ Web browser with mobile view (5 min setup)
→ Looks professional
→ Easy to present
→ No complex setup needed

**Best for full testing:**
→ Android emulator (30 min setup)
→ All features work
→ Most accurate

**Quickest option:**
→ Expo web (2 min)
→ Press 'w' and you're done!

---

**My Recommendation for Your Hackathon:**

Use web browser with mobile view:
1. `cd mobile-app && npm start`
2. Press 'w'
3. Press F12 → device icon → iPhone 12 Pro
4. Press F11 for fullscreen
5. Demo! 🎉

**Time needed:** 5 minutes
**Looks:** Professional
**Works:** Perfectly for demo

Good luck with your presentation! 🏆

