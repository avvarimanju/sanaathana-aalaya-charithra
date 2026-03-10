# Emulator Crash Fix - "Process has terminated"

## What Happened?
The error "The emulator process for AVD Pixel_9_Pro_XL has terminated" means the virtual phone crashed while starting.

## Common Causes & Solutions

### Solution 1: Enable Virtualization in BIOS (Most Common)
Your laptop needs hardware virtualization enabled.

**Check if enabled:**
```powershell
# Run in PowerShell as Administrator
Get-ComputerInfo | Select-Object HyperVisorPresent, HyperVRequirementVirtualizationFirmwareEnabled
```

**If FALSE, enable in BIOS:**
1. Restart laptop
2. Press F2, F10, Del, or Esc during boot (depends on laptop brand)
3. Find "Virtualization Technology" or "VT-x" or "AMD-V"
4. Enable it
5. Save and exit BIOS
6. Restart laptop
7. Try emulator again

### Solution 2: Enable Windows Hypervisor Platform
```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
```

Then restart your computer.

### Solution 3: Reduce Emulator RAM
The emulator might need too much RAM.

1. Open Android Studio → Device Manager
2. Click ⋮ (three dots) next to Pixel 9 Pro XL
3. Click "Edit"
4. Click "Show Advanced Settings"
5. Change RAM to: 2048 MB (instead of 4096)
6. Change Internal Storage to: 2048 MB
7. Click "Finish"
8. Try starting again

### Solution 4: Use a Simpler Device
Pixel 9 Pro XL might be too demanding. Try a lighter device:

1. Device Manager → Create Device
2. Select: Pixel 5 (not Pro, not XL)
3. Android: API 33 (Android 13)
4. RAM: 2048 MB
5. Storage: 2048 MB
6. Graphics: Hardware - GLES 2.0
7. Try this one instead

### Solution 5: Cold Boot
Sometimes emulator just needs a fresh start:

1. Device Manager → Find your emulator
2. Click ⋮ → "Cold Boot Now"
3. Wait 2-3 minutes for full boot

### Solution 6: Wipe Data
Corrupted data can cause crashes:

1. Device Manager → Find your emulator
2. Click ⋮ → "Wipe Data"
3. Confirm
4. Start emulator again

### Solution 7: Update Graphics Driver
Outdated graphics drivers cause crashes:

1. Right-click Start → Device Manager
2. Display Adapters → Right-click your GPU
3. Update Driver
4. Restart laptop
5. Try emulator again

### Solution 8: Change Graphics Mode
1. Device Manager → Edit emulator
2. Show Advanced Settings
3. Graphics: Try "Software - GLES 2.0" (slower but more compatible)
4. Save and try again

## Quick Fix Checklist

Try these in order:

1. ✅ Reduce RAM to 2048 MB
2. ✅ Try Pixel 5 instead of Pixel 9 Pro XL
3. ✅ Cold Boot emulator
4. ✅ Enable Virtualization in BIOS
5. ✅ Enable Windows Hypervisor Platform
6. ✅ Update graphics driver
7. ✅ Change graphics to Software mode

## Recommended Setup for Your Laptop

**Best Performance + Stability:**
- Device: Pixel 5 or Pixel 6
- Android: API 33 (Android 13)
- RAM: 2048 MB
- Storage: 2048 MB
- Graphics: Hardware - GLES 2.0

This works on most laptops without issues.

## Alternative: Use Web Browser Instead

If emulator keeps crashing, use web browser for testing:

```powershell
cd Sanaathana-Aalaya-Charithra/mobile-app
npx expo start --clear
```

Press `w` for web browser - works perfectly and no crashes!

## Check Your Laptop Specs

```powershell
# Check RAM
Get-ComputerInfo | Select-Object CsTotalPhysicalMemory

# Check CPU
Get-ComputerInfo | Select-Object CsProcessors
```

**Minimum for emulator:**
- 8 GB RAM (16 GB recommended)
- 4-core CPU
- Virtualization support

## Still Not Working?

Try these commands:

```powershell
# Kill all emulator processes
taskkill /F /IM qemu-system-x86_64.exe
taskkill /F /IM emulator.exe

# Clear Android Studio cache
cd %USERPROFILE%\.android\avd
# Delete .lock files if any

# Restart Android Studio
```

Then try creating a new, simpler emulator.
