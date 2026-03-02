# Visual Step-by-Step: Run Mobile App on Laptop

## 5-Minute Setup for Professional Demo

---

## Step 1: Start Your App (2 minutes)

### Open Terminal

```bash
# Windows: Press Win + R, type 'cmd', press Enter
# Or use PowerShell, Git Bash, or VS Code terminal
```

### Navigate to Mobile App Folder

```bash
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\mobile-app
```

### Start Expo

```bash
npm start
```

**What you'll see:**
```
Starting Metro Bundler...
Metro waiting on exp://192.168.x.x:19000

› Press a │ open Android
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu

QR code appears here
```

---

## Step 2: Open in Browser (30 seconds)

### Press 'w' Key

```bash
# In the terminal where Expo is running, press: w
```

**What happens:**
- Browser opens automatically
- URL: http://localhost:19006
- Your app loads in browser

**If browser doesn't open automatically:**
- Manually open Chrome or Edge
- Go to: http://localhost:19006

---

## Step 3: Enable Mobile View (1 minute)

### Open Developer Tools

**Method 1:** Press `F12`
**Method 2:** Press `Ctrl + Shift + I`
**Method 3:** Right-click → "Inspect"

**What you'll see:**
```
┌─────────────────────────────────────────────────────┐
│ Your App                                            │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ DevTools Panel (bottom or right side)              │
│ Elements | Console | Sources | Network | ...       │
└─────────────────────────────────────────────────────┘
```

### Toggle Device Toolbar

**Method 1:** Click device icon (📱) in top-left of DevTools
**Method 2:** Press `Ctrl + Shift + M`

**Device icon looks like:**
```
┌──┐
│  │  ← Small phone/tablet icon
└──┘
```

**What happens:**
- App view changes to mobile size
- Device selector appears at top
- Looks like a phone screen

### Select Device

**Click dropdown at top:**
```
┌─────────────────────────────────────┐
│ Responsive ▼                        │
└─────────────────────────────────────┘
```

**Choose device:**
- iPhone 12 Pro (390 × 844) ⭐ Recommended
- iPhone 14 Pro Max (430 × 932)
- Pixel 5 (393 × 851)
- Galaxy S20 Ultra (412 × 915)

**What you'll see:**
```
┌─────────────────────────────────────┐
│ iPhone 12 Pro ▼    100% ▼   ⟲  ⚙️  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │      Your App                   │ │
│ │      (Mobile View)              │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Ensure Portrait Orientation

**Look for rotation icon (⟲) at top**
- Click if app is in landscape
- Should be in portrait (vertical) mode

---

## Step 4: Make It Professional (1 minute)

### Hide Developer Tools

**Press `F12` again**

**What happens:**
- DevTools panel disappears
- Only mobile view remains
- Looks cleaner

**What you'll see:**
```
┌─────────────────────────────────────┐
│ iPhone 12 Pro ▼    100% ▼   ⟲  ⚙️  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │      Your App                   │ │
│ │      (Mobile View)              │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Enable Fullscreen Mode

**Press `F11`**

**What happens:**
- Browser UI disappears
- Address bar hidden
- Tabs hidden
- Only your app visible
- Looks like a real phone!

**What you'll see:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ │      Your App                   │ │
│ │      (Fullscreen)               │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Perfect for presentations!** 🎉

---

## Step 5: Demo Your App

### Navigate Through Screens

**Use mouse to:**
- Click buttons
- Scroll through content
- Fill in forms
- Navigate between screens

**Keyboard shortcuts:**
- `Tab` - Move between fields
- `Enter` - Submit forms
- `Esc` - Go back (if implemented)
- `F11` - Exit fullscreen

### Show Key Features

**Demo flow:**
1. **Splash Screen** - Show branding
2. **Login/Signup** - Show authentication
3. **Temple List** - Browse temples
4. **Temple Details** - View information
5. **Artifact List** - Show artifacts
6. **QR Scanner** - Explain feature (show screenshot)
7. **Content View** - Audio/video guides
8. **Payment** - Show pricing

---

## Step 6: Exit Demo Mode

### Exit Fullscreen

**Press `F11`**

**What happens:**
- Browser UI returns
- Address bar visible
- Tabs visible

### Exit Mobile View

**Press `F12` to open DevTools**
**Click device icon (📱) or press `Ctrl + Shift + M`**

**What happens:**
- App returns to desktop view
- DevTools visible again

### Stop Expo

**In terminal:**
**Press `Ctrl + C`**

**What happens:**
- Metro bundler stops
- App stops running
- Terminal returns to prompt

---

## Visual Comparison

### Before Mobile View
```
┌──────────────────────────────────────────────────────┐
│ Chrome - http://localhost:19006                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Your App (Full Width)                              │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Content stretched across entire screen       │ │
│  │  Looks like desktop website                   │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### After Mobile View
```
┌──────────────────────────────────────────────────────┐
│ Chrome - http://localhost:19006                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│              ┌──────────────────┐                    │
│              │                  │                    │
│              │   Your App       │                    │
│              │   (Mobile Size)  │                    │
│              │                  │                    │
│              │   Looks like     │                    │
│              │   real phone     │                    │
│              │                  │                    │
│              └──────────────────┘                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### After Fullscreen
```
┌──────────────────────────────────────────────────────┐
│              ┌──────────────────┐                    │
│              │                  │                    │
│              │   Your App       │                    │
│              │   (Fullscreen)   │                    │
│              │                  │                    │
│              │   No browser UI  │                    │
│              │   Looks amazing! │                    │
│              │                  │                    │
│              └──────────────────┘                    │
└──────────────────────────────────────────────────────┘
```

---

## Tips for Best Results

### 1. Zoom Level

**Set to 100%:**
- Press `Ctrl + 0` (zero)
- Or adjust with `Ctrl + Plus/Minus`

**Why:** Ensures proper sizing and layout

### 2. Hide Bookmarks Bar

**Press `Ctrl + Shift + B`**

**Why:** Cleaner look, more space

### 3. Use Chrome or Edge

**Why:** Best Expo support, better DevTools

### 4. Clear Cache

**Before demo:**
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"

**Why:** Ensures latest version loads

### 5. Test Before Demo

**Run through demo 3-5 times:**
- Check all screens load
- Test navigation
- Verify features work
- Time your demo

---

## Common Issues & Solutions

### Issue: App Not Loading

**What you see:**
```
Loading...
(Stuck on loading screen)
```

**Solution:**
```bash
# In terminal, press Ctrl+C to stop
# Then restart:
npm start -- --clear
# Press 'w' again
```

### Issue: Layout Looks Wrong

**What you see:**
- Text too small/large
- Elements overlapping
- Weird spacing

**Solution:**
```bash
# Check zoom level
Press Ctrl + 0 (reset to 100%)

# Check device selection
F12 → Ensure correct device selected

# Refresh page
Press Ctrl + R or F5
```

### Issue: Can't See Full App

**What you see:**
- App cut off at bottom
- Can't scroll to see all content

**Solution:**
```bash
# Zoom out
Press Ctrl + Minus (-)

# Or change device
F12 → Select smaller device

# Or scroll within mobile view
Use mouse wheel or trackpad
```

### Issue: Fullscreen Not Working

**What you see:**
- F11 doesn't do anything
- Browser UI still visible

**Solution:**
```bash
# Try alternative:
Click ⋮ (three dots) → Fullscreen
Or press F11 multiple times

# Or use presentation mode:
Click ⋮ → Cast, save and share → Present
```

---

## Recording Your Demo

### Windows Game Bar (Built-in)

**Start Recording:**
1. Press `Win + G`
2. Click record button (⚫)
3. Demo your app
4. Press `Win + G` again
5. Click stop button (⏹)

**Find Recording:**
- Videos → Captures folder
- File name: "Sanaathana Aalaya Charithra - [date].mp4"

### OBS Studio (Professional)

**Setup:**
1. Download from obsproject.com
2. Install and open
3. Click "+" under Sources
4. Select "Display Capture"
5. Click OK

**Record:**
1. Click "Start Recording"
2. Demo your app
3. Click "Stop Recording"

**Find Recording:**
- Videos folder (default)
- Or check Settings → Output → Recording Path

---

## Presentation Checklist

### Before Presentation (10 minutes)

- [ ] Start backend server (if needed)
- [ ] `cd mobile-app && npm start`
- [ ] Press 'w' for web
- [ ] F12 → device icon → iPhone 12 Pro
- [ ] Test all screens work
- [ ] Close unnecessary windows
- [ ] Hide desktop icons
- [ ] Disable notifications
- [ ] Charge laptop
- [ ] Test audio/video

### During Presentation (5-7 minutes)

- [ ] Press F11 for fullscreen
- [ ] Show splash screen
- [ ] Demo login/signup
- [ ] Browse temples
- [ ] View temple details
- [ ] Show artifacts
- [ ] Explain QR scanning
- [ ] Show content (audio/video)
- [ ] Demo payment flow
- [ ] Highlight key features
- [ ] Press F11 to exit
- [ ] Answer questions

### After Presentation

- [ ] Thank audience
- [ ] Share contact info
- [ ] Offer to show more
- [ ] Collect feedback
- [ ] Stop Expo (Ctrl+C)

---

## Summary

**Setup Time:** 5 minutes
**Result:** Professional mobile app demo on laptop
**Perfect For:** Hackathon presentations, testing, demos

**Quick Steps:**
1. `npm start` → Press 'w'
2. F12 → device icon → iPhone 12 Pro
3. F11 for fullscreen
4. Demo! 🎉

**Looks:** Like a real phone on your laptop
**Works:** Perfectly for presentations
**Easy:** Anyone can do it

---

**You're ready to impress the judges! 🏆**

