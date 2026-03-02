# Create App Icon & Splash Screen Assets

## What You Need

3 image files in the `assets` folder:

1. **icon.png** - 1024x1024 pixels (app icon)
2. **splash.png** - 1284x2778 pixels (splash screen, portrait)
3. **adaptive-icon.png** - 1024x1024 pixels (Android adaptive icon)

---

## Easiest Method: Use Expo's Asset Generator

This is the FASTEST way - let Expo create default assets:

```powershell
cd mobile-app
npx expo prebuild --clean
```

This command will:
- Generate default icon.png, splash.png, and adaptive-icon.png
- Place them in the assets folder
- Use Expo's default blue icon (you can replace later)

After running this, you can immediately rebuild:

```powershell
eas build --platform android --profile internal-testing
```

---

## Alternative: Create Custom Assets Online

### Option 1: Use AppIcon.co (Recommended)

1. Go to: https://www.appicon.co/
2. Upload any image (temple photo, logo, or solid color)
3. Click "Generate"
4. Download the package
5. Extract and find:
   - `icon.png` (1024x1024)
   - `adaptive-icon.png` (1024x1024)
6. Copy these to `mobile-app/assets/`

### Option 2: Use Canva (Free)

1. Go to: https://www.canva.com/
2. Create new design:
   - For icon: 1024x1024 pixels
   - For splash: 1284x2778 pixels
3. Add your temple image or create simple design with orange background (#FF6B35)
4. Download as PNG
5. Rename and save to `mobile-app/assets/`

### Option 3: Use Existing Temple Image

1. Take one of your temple images
2. Go to: https://www.iloveimg.com/resize-image
3. Resize to:
   - 1024x1024 for icon.png
   - 1024x1024 for adaptive-icon.png (can be same as icon)
   - 1284x2778 for splash.png
4. Download and save to `mobile-app/assets/`

---

## Quick Placeholder (For Testing Only)

If you just want to test the build quickly, create simple solid color images:

### Using PowerShell + ImageMagick (if installed):

```powershell
cd mobile-app/assets

# Create orange square icons
magick -size 1024x1024 xc:"#FF6B35" icon.png
magick -size 1024x1024 xc:"#FF6B35" adaptive-icon.png

# Create orange splash screen
magick -size 1284x2778 xc:"#FF6B35" splash.png
```

### Using Online Tool:

1. Go to: https://placeholder.com/
2. Generate:
   - 1024x1024 orange image → save as icon.png
   - 1024x1024 orange image → save as adaptive-icon.png
   - 1284x2778 orange image → save as splash.png
3. Save all to `mobile-app/assets/`

---

## Verify Assets Are Created

After creating the files, verify they exist:

```powershell
cd mobile-app/assets
ls icon.png, splash.png, adaptive-icon.png
```

You should see all 3 files listed.

---

## Rebuild Your App

Once all 3 files are in place:

```powershell
cd mobile-app
eas build --platform android --profile internal-testing
```

The build should now succeed!

---

## Recommended Approach

**For fastest results:**

1. Run `npx expo prebuild --clean` to generate default assets
2. Build immediately with `eas build --platform android --profile internal-testing`
3. Replace the default assets with custom temple images later

**For custom assets from the start:**

1. Use one of your temple images (Nandi or Shilathoranam)
2. Resize using https://www.iloveimg.com/resize-image
3. Create all 3 required sizes
4. Save to assets folder
5. Build with `eas build --platform android --profile internal-testing`

---

## Next Steps

Choose one method above, create the 3 image files, then rebuild your app!
