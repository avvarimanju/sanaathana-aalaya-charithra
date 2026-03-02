# Windows Subsystem for Android (WSA) Setup Guide

## ⚠️ Important Notice

**Before you proceed:** WSA setup takes 60+ minutes and requires Windows 11. 

**For your hackathon demo, I strongly recommend using the web browser method instead (5 minutes):**
```bash
cd mobile-app
npm start
Press 'w'
F12 → device icon → iPhone 12 Pro → F11
```

**Only proceed with WSA if:**
- You have Windows 11
- You have 60+ minutes available
- You need full Android features (camera, QR scanner, etc.)
- You're not in a hurry for the hackathon

---

## Prerequisites Check

### 1. Windows Version

**Required:** Windows 11 (Build 22000 or higher)

**Check your version:**
```powershell
# Press Win + R, type: winver
# Or run in PowerShell:
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
```

**What you need to see:**
- Windows 11 (any edition)
- Build 22000 or higher

**If you have Windows 10:** WSA is NOT available. Use Android Emulator or web browser instead.

### 2. System Requirements

**Minimum:**
- RAM: 8 GB (16 GB recommended)
- Storage: 10 GB free space
- Processor: Intel Core i3 8th Gen or AMD Ryzen 3000 or better
- Virtualization: Enabled in BIOS

**Check RAM:**
```powershell
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum | ForEach-Object {"{0:N2} GB" -f ($_.sum / 1GB)}
```

**Check virtualization:**
```powershell
# Open Task Manager (Ctrl+Shift+Esc)
# Go to Performance tab → CPU
# Look for "Virtualization: Enabled"
```

**If virtualization is disabled:**
1. Restart computer
2. Enter BIOS (usually F2, F10, or Del during boot)
3. Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
4. Enable it
5. Save and exit

### 3. Region Settings

**WSA is available in these regions:**
- United States
- Japan
- And a few others

**If you're in India:** You may need to change your region temporarily.

**Change region:**
1. Settings → Time & Language → Language & Region
2. Change "Country or region" to "United States"
3. Restart computer

---

## Installation Steps

### Step 1: Enable Virtual Machine Platform

**Open PowerShell as Administrator:**
```powershell
# Right-click Start → Windows Terminal (Admin)
# Or search "PowerShell", right-click, "Run as administrator"
```

**Run this command:**
```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

**Expected output:**
```
Deployment Image Servicing and Management tool
Version: 10.0.22000.1

Image Version: 10.0.22000.1455

Enabling feature(s)
[==========================100.0%==========================]
The operation completed successfully.
```

### Step 2: Install Windows Subsystem for Android

**Method 1: Microsoft Store (Recommended)**

1. Open Microsoft Store
2. Search for "Windows Subsystem for Android"
3. Click "Get" or "Install"
4. Wait for download (1-2 GB)
5. Installation takes 10-20 minutes

**Method 2: PowerShell (Alternative)**

```powershell
# Run as Administrator
winget install "Windows Subsystem for Android"
```

**Expected output:**
```
Found Windows Subsystem for Android [9P3395VX91NR]
This application is licensed to you by its owner.
Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.
Downloading...
Successfully installed
```

### Step 3: Restart Computer

**Important:** You MUST restart after installation.

```powershell
# Save all work, then:
Restart-Computer
```

### Step 4: Launch WSA

**After restart:**

1. Press Win key
2. Search for "Windows Subsystem for Android"
3. Click to open
4. Wait for initialization (5-10 minutes first time)

**What you'll see:**
```
Windows Subsystem for Android™ Settings

Subsystem resources
○ Continuous (Recommended)
○ As needed

Developer
☐ Developer mode

Advanced settings
...
```

### Step 5: Enable Developer Mode

**In WSA Settings:**

1. Scroll down to "Developer" section
2. Toggle "Developer mode" to ON
3. Note the IP address shown (e.g., 127.0.0.1:58526)

**What you'll see:**
```
Developer
☑ Developer mode

Connect to:
127.0.0.1:58526

Use this IP address to connect debugging tools
```

### Step 6: Install ADB (Android Debug Bridge)

**Download Platform Tools:**

1. Go to: https://developer.android.com/studio/releases/platform-tools
2. Download "SDK Platform-Tools for Windows"
3. Extract ZIP to: `C:\platform-tools`

**Add to PATH:**

```powershell
# Run as Administrator
$env:Path += ";C:\platform-tools"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
```

**Verify installation:**

```powershell
adb version
```

**Expected output:**
```
Android Debug Bridge version 1.0.41
Version 34.0.5-10900879
```

### Step 7: Connect ADB to WSA

**Connect:**

```powershell
adb connect 127.0.0.1:58526
```

**Expected output:**
```
connected to 127.0.0.1:58526
```

**Verify connection:**

```powershell
adb devices
```

**Expected output:**
```
List of devices attached
127.0.0.1:58526    device
```

---

## Installing Your App on WSA

### Option 1: Install APK Directly

**Step 1: Build APK**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
cd mobile-app
eas build:configure

# Build APK
eas build --platform android --profile preview
```

**Wait for build to complete (10-20 minutes)**

**Step 2: Download APK**

- EAS will provide download link
- Download APK to your computer
- Save to: `C:\Users\avvar\Downloads\app.apk`

**Step 3: Install APK**

```powershell
cd C:\Users\avvar\Downloads
adb install app.apk
```

**Expected output:**
```
Performing Streamed Install
Success
```

**Step 4: Launch App**

- Open Start menu
- Look for your app icon
- Click to launch

### Option 2: Use Expo Go (Easier)

**Step 1: Install Expo Go on WSA**

```powershell
# Download Expo Go APK
# From: https://expo.dev/go

# Or use this direct link:
curl -o expo-go.apk https://d1ahtucjixef4r.cloudfront.net/Exponent-2.29.4.apk

# Install
adb install expo-go.apk
```

**Step 2: Start Your App**

```bash
cd mobile-app
npm start
```

**Step 3: Connect Expo Go**

1. Open Expo Go in WSA
2. Enter URL: `exp://192.168.x.x:19000` (from terminal)
3. Or scan QR code (if camera works)

---

## Troubleshooting

### Issue: "WSA not available in Microsoft Store"

**Cause:** Region restriction

**Solution:**
```powershell
# Change region to United States
Settings → Time & Language → Language & Region
Country or region: United States
Restart computer
```

### Issue: "Virtualization not enabled"

**Cause:** BIOS setting disabled

**Solution:**
1. Restart computer
2. Enter BIOS (F2, F10, or Del)
3. Find "Virtualization Technology"
4. Enable it
5. Save and exit

### Issue: "ADB cannot connect"

**Cause:** WSA not running or wrong IP

**Solution:**
```powershell
# Check WSA is running
# Open WSA Settings app

# Check IP address in Developer section
# Use that IP in adb connect command
adb connect 127.0.0.1:58526
```

### Issue: "App crashes on launch"

**Cause:** Compatibility issues

**Solution:**
```powershell
# Check logs
adb logcat

# Or try rebuilding with different settings
eas build --platform android --profile production
```

### Issue: "WSA is slow"

**Cause:** Insufficient resources

**Solution:**
1. Close other applications
2. Allocate more RAM to WSA:
   - WSA Settings → Subsystem resources
   - Select "Continuous"
3. Restart WSA

---

## Performance Optimization

### 1. Allocate More Resources

**In WSA Settings:**
- Subsystem resources: Select "Continuous"
- This keeps WSA running for better performance

### 2. Disable Unnecessary Features

**In WSA Settings:**
- Turn off features you don't need
- Reduces resource usage

### 3. Close Other Apps

**Before running WSA:**
- Close Chrome/Edge (if not needed)
- Close other heavy applications
- Free up RAM

---

## Comparison: WSA vs Other Options

| Feature | WSA | Android Emulator | Web Browser |
|---------|-----|------------------|-------------|
| Setup Time | 60+ min | 30-60 min | 5 min |
| Performance | Fast | Medium | Fast |
| Features | 100% | 100% | 80% |
| Windows Version | 11 only | 10/11 | Any |
| Resource Usage | Medium | High | Low |
| Best For | Win11 users | Full testing | Quick demo |

---

## My Recommendation

### For Hackathon Demo (Today/Tomorrow)

**Use Web Browser Method:**
```bash
cd mobile-app
npm start
Press 'w'
F12 → device icon → iPhone 12 Pro → F11
```

**Why:**
- 5-minute setup
- Works immediately
- Perfect for presentations
- No complex installation

### For Long-term Development

**Use Android Emulator:**
- Works on Windows 10 and 11
- Full Android features
- Better compatibility
- Easier to set up than WSA

### For Windows 11 Users (After Hackathon)

**Use WSA:**
- Native Android on Windows
- Better performance than emulator
- Seamless integration
- Worth the setup time

---

## Alternative: Android Emulator (Recommended)

If WSA is too complex, use Android Emulator instead:

### Quick Setup

**Step 1: Install Android Studio**
- Download: https://developer.android.com/studio
- Install (takes 20-30 minutes)

**Step 2: Create Virtual Device**
1. Open Android Studio
2. More Actions → Virtual Device Manager
3. Create Device → Pixel 5
4. Download system image (Android 13)
5. Finish

**Step 3: Start Emulator**
- Click ▶️ play button
- Wait for emulator to boot (2-3 minutes)

**Step 4: Run Your App**
```bash
cd mobile-app
npm start
Press 'a'
```

**Done!** Much easier than WSA.

---

## Summary

**Can I set up WSA for you?** No, you need to do it manually.

**Should you set up WSA now?** No, not for hackathon demo.

**What should you use instead?**

**For hackathon (today/tomorrow):**
→ Web browser method (5 minutes)

**For full testing (after hackathon):**
→ Android Emulator (30 minutes)

**For Windows 11 users (long-term):**
→ WSA (60+ minutes, but worth it)

---

## Quick Decision Guide

**Do you have Windows 11?**
- No → Use Android Emulator or Web Browser
- Yes → Continue

**Do you have 60+ minutes available?**
- No → Use Web Browser (5 min)
- Yes → Continue

**Do you need full Android features?**
- No → Use Web Browser (5 min)
- Yes → Set up WSA (follow this guide)

**Is this for hackathon demo?**
- Yes → Use Web Browser (5 min) ⭐
- No → Set up WSA or Android Emulator

---

**My strong recommendation: Use web browser for your hackathon demo. Set up WSA after the hackathon when you have more time.**

**Web browser setup:**
```bash
cd mobile-app
npm start
Press 'w'
F12 → 📱 → iPhone 12 Pro → F11
Done in 5 minutes! 🎉
```

