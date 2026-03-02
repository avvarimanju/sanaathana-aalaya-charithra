# Quick Fix: Build Failure - Missing Icon & Splash Screen

## Problem Identified

Your EAS build failed because `app.json` doesn't specify required assets:
- ❌ No `icon` field
- ❌ No `splash.image` field

EAS requires these for Android builds.

---

## Solution: Two Options

### Option A: Use Expo's Default Assets (FASTEST)

Let Expo generate default assets automatically:

1. **Update app.json** - Add these fields:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B35"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF6B35"
      }
    }
  }
}
```

2. **Generate default assets**:

```powershell
cd mobile-app
npx expo prebuild --clean
```

This will create default icon.png, splash.png, and adaptive-icon.png files.

3. **Rebuild**:

```powershell
eas build --platform android --profile internal-testing
```

---

### Option B: Create Simple Placeholder Assets (RECOMMENDED)

Create minimal valid assets manually:

**Required files:**
- `assets/icon.png` - 1024x1024 PNG
- `assets/splash.png` - 1284x2778 PNG (or any size)
- `assets/adaptive-icon.png` - 1024x1024 PNG

**Quick creation options:**

1. **Use online tool**: https://www.appicon.co/
   - Upload any image
   - Download the generated icons
   - Rename and place in assets folder

2. **Use existing temple image**:
   - Take one of your temple images
   - Resize to 1024x1024 for icon
   - Resize to 1284x2778 for splash
   - Use online tool like: https://www.iloveimg.com/resize-image

3. **Create solid color placeholders** (simplest):
   - Use any image editor
   - Create 1024x1024 orange (#FF6B35) square → save as icon.png
   - Create 1284x2778 orange (#FF6B35) rectangle → save as splash.png
   - Copy icon.png as adaptive-icon.png

---

## Step-by-Step Fix (Option B)

### Step 1: Create Placeholder Assets

I'll help you create simple placeholders. You can replace them later with proper designs.

**For now, use one of your existing temple images:**

```powershell
cd mobile-app/assets

# Copy existing image as temporary icon
# (You'll need to resize it to 1024x1024 using an online tool)
```

### Step 2: Update app.json

Add the icon and splash fields (I'll do this for you).

### Step 3: Rebuild

```powershell
eas build --platform android --profile internal-testing
```

---

## What I'll Do Now

1. Update your app.json to add icon/splash references
2. Create a guide for generating the actual image files
3. You'll need to create the 3 image files before rebuilding

---

## After Fix

Once you have the 3 image files in place:
- icon.png (1024x1024)
- splash.png (any size, portrait recommended)
- adaptive-icon.png (1024x1024)

Run the build command again and it should succeed!
