# Android Emulator Setup Guide

## What is an Emulator?
An emulator is a virtual Android phone that runs on your laptop. It lets you test your mobile app without needing a real phone.

## Step-by-Step Setup in Android Studio

### Step 1: Open Device Manager
1. Open Android Studio
2. Click on the three dots (⋮) in the top-right toolbar
3. Select "Device Manager" (or "AVD Manager")
   - Alternative: Go to `Tools` → `Device Manager`

### Step 2: Create Virtual Device
1. Click "Create Device" button
2. Select a phone model:
   - **Best for Testing**: Pixel 8 or Pixel 8 Pro (latest features, most realistic)
   - **Alternative**: Pixel 6 or Pixel 7 (good balance)
   - **Why Pixel?** Most popular Android devices, well-supported, represent real user experience
   - Category: Phone
   - Click "Next"

### Step 3: Select System Image (Android Version)
1. Choose an Android version:
   - **Latest**: Android 15 (API 35) - Released October 2024 ✅ RECOMMENDED
   - **Previous**: Android 14 (API 34) - Still widely used
   - **Older**: Android 13 (API 33) - For compatibility testing
   - If not downloaded, click "Download" next to it (takes 5-10 minutes)
2. **Why test on latest?**
   - Most users update to latest Android within 6-12 months
   - Catches new API changes and deprecations early
   - Google Play Store recommends targeting latest API
3. Click "Next"

### Step 4: Configure Virtual Device
1. Give it a name: "Pixel_8_API_35" (or similar)
2. **Important Settings**:
   - Graphics: Hardware - GLES 2.0 (faster)
   - RAM: 4096 MB (recommended for Android 15)
   - Internal Storage: 4096 MB (recommended)
3. Click "Finish"

### Step 5: Start the Emulator
1. In Device Manager, find your new virtual device
2. Click the ▶️ (Play) button
3. Wait 1-2 minutes for it to boot up
4. You'll see a virtual phone screen appear!

## Quick Commands

### Start Emulator from Command Line (Optional)
```powershell
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_8_API_35
```

## Android Version History (March 2026)

| Version | API Level | Release Date | Market Share | Should You Test? |
|---------|-----------|--------------|--------------|------------------|
| Android 15 | 35 | Oct 2024 | ~25% | ✅ YES - Latest |
| Android 14 | 34 | Oct 2023 | ~35% | ✅ YES - Most popular |
| Android 13 | 33 | Aug 2022 | ~25% | ✅ YES - Still common |
| Android 12 | 31-32 | Oct 2021 | ~10% | Optional |
| Android 11 | 30 | Sep 2020 | ~3% | Only if targeting old devices |

**Recommendation**: Create 2 emulators:
1. **Primary**: Pixel 8 with Android 15 (API 35) - for daily development
2. **Secondary**: Pixel 6 with Android 13 (API 33) - for compatibility testing

## Run Your App on Emulator

### Method 1: Using Expo (Easiest)
```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npx expo start --clear
```
Then press `a` to open on Android emulator

### Method 2: Direct Command
```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npx expo run:android
```

## Troubleshooting

### Emulator is Slow
- Close other applications
- Increase RAM in AVD settings (Device Manager → Edit → Advanced Settings)
- Enable Hardware Acceleration:
  - Windows: Enable Hyper-V or HAXM
  - Check: `Settings` → `Apps` → `Optional Features` → Enable "Windows Hypervisor Platform"

### Can't Find Device Manager
- Update Android Studio to latest version
- Try: `Tools` → `SDK Manager` → `SDK Tools` tab → Install "Android Emulator"

### Emulator Won't Start
- Check BIOS: Enable Virtualization (VT-x/AMD-V)
- Restart computer after enabling
- Try creating a new virtual device with lower specs

## Recommended Emulator Specs

### For Development (Primary - Latest Android)
- Device: Pixel 8
- Android: API 35 (Android 15) ✅
- RAM: 4096 MB
- Storage: 4096 MB
- Why: Latest features, best performance, catches new issues early

### For Compatibility Testing (Secondary)
- Device: Pixel 6
- Android: API 33 (Android 13)
- RAM: 2048 MB
- Storage: 2048 MB
- Why: Tests backward compatibility with older devices

## Why Test on Latest Android?

1. **User Adoption**: Most users update within 6-12 months
2. **Play Store Requirements**: Google requires targeting recent API levels
3. **Early Detection**: Catch breaking changes before they affect users
4. **New Features**: Access latest Android capabilities
5. **Performance**: Latest Android versions are faster and more efficient

## Why Pixel Devices?

1. **Market Leader**: Pixel represents "pure Android" experience
2. **Well Supported**: Best emulator performance in Android Studio
3. **Reference Device**: Google's official reference for Android development
4. **Real World**: Pixel 6/7/8 are popular among actual users

## Keyboard Shortcuts in Emulator
- `Ctrl + M`: Open React Native Dev Menu
- `R + R`: Reload app
- `Ctrl + Shift + R`: Rotate device
- `Ctrl + H`: Home button
- `Ctrl + B`: Back button

## Next Steps
1. Create emulator in Android Studio
2. Start the emulator
3. Run: `npx expo start --clear` in mobile-app folder
4. Press `a` to open app on emulator
5. Test your app!
