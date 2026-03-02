# How to Change Welcome Screen Background Image

## Your Images

You have 2 images in the `assets/` folder:

1. ✅ **Sahaja_Shila_Thoranam_Tirumala.jpg** (Shilathoranam - Option 1)
2. ✅ **Nandi_Lepakshi_Temple_Hindupur.jpg** (Lepakshi Nandi - Option 4)

## Currently Using

**Option 1**: Sahaja_Shila_Thoranam_Tirumala.jpg (Shilathoranam)

## How to Switch Images

### File to Edit
**Location**: `mobile-app/src/screens/WelcomeScreen.tsx`

### Step 1: Change the Image Source

Find **line 12** in WelcomeScreen.tsx:

**Current (Option 1 - Shilathoranam)**:
```tsx
source={require('../assets/Sahaja_Shila_Thoranam_Tirumala.jpg')}
```

**To Switch to Option 4 (Lepakshi Nandi)**:
```tsx
source={require('../assets/Nandi_Lepakshi_Temple_Hindupur.jpg')}
```

### Step 2: Update the Image Credit

Find **line 58** in WelcomeScreen.tsx:

**Current**:
```tsx
<Text style={styles.imageCredit}>
  Shilathoranam, Tirumala
</Text>
```

**For Lepakshi Nandi**:
```tsx
<Text style={styles.imageCredit}>
  Monolithic Nandi, Lepakshi Temple
</Text>
```

### Step 3: Save and Reload

1. Save the file (Ctrl+S or Cmd+S)
2. The app will automatically reload if Metro bundler is running
3. If not, restart the app:
   ```bash
   npm start
   ```

## Quick Switch Reference

### Option 1: Shilathoranam (Current)
```tsx
// Line 12
source={require('../assets/Sahaja_Shila_Thoranam_Tirumala.jpg')}

// Line 58
<Text style={styles.imageCredit}>
  Shilathoranam, Tirumala
</Text>
```

### Option 4: Lepakshi Nandi
```tsx
// Line 12
source={require('../assets/Nandi_Lepakshi_Temple_Hindupur.jpg')}

// Line 58
<Text style={styles.imageCredit}>
  Monolithic Nandi, Lepakshi Temple
</Text>
```

## Visual Comparison

After switching, compare:
- Which image looks better?
- Which has better text readability?
- Which represents the app better?
- Which is more recognizable?

## Adjusting Overlay (Optional)

If text is hard to read on one image, adjust the overlay opacity:

**File**: `mobile-app/src/screens/WelcomeScreen.tsx`
**Line**: ~18

```tsx
// Current (75% opacity)
backgroundColor: 'rgba(255, 107, 53, 0.75)',

// More transparent (image more visible)
backgroundColor: 'rgba(255, 107, 53, 0.6)',

// More opaque (text more readable)
backgroundColor: 'rgba(255, 107, 53, 0.85)',

// Dark overlay for better contrast
backgroundColor: 'rgba(0, 0, 0, 0.5)',
```

## Testing Both Images

1. **Test Option 1 (Shilathoranam)** - Already set
   - Run the app
   - Check how it looks
   - Note text readability

2. **Test Option 4 (Lepakshi Nandi)**
   - Change line 12 to use `Nandi_Lepakshi_Temple_Hindupur.jpg`
   - Change line 58 to "Monolithic Nandi, Lepakshi Temple"
   - Save and reload
   - Compare with Option 1

3. **Choose the Best**
   - Pick the one that looks better
   - Keep that configuration

## Adding More Images (Future)

If you want to add Options 2 and 3:

1. Add images to `assets/` folder:
   - `garuda-hill.jpg` (Option 2)
   - `venkateshwara-hill.jpg` (Option 3)

2. Use the same pattern to switch:
   ```tsx
   source={require('../assets/garuda-hill.jpg')}
   ```

## Troubleshooting

### Image Not Showing
1. Check filename matches exactly (case-sensitive)
2. Ensure image is in `mobile-app/assets/` folder
3. Restart Metro bundler:
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   # or
   expo start -c  # Clear cache
   ```

### Text Hard to Read
1. Increase overlay opacity (0.75 → 0.85)
2. Or use dark overlay: `rgba(0, 0, 0, 0.6)`
3. Increase text shadow radius

### Image Quality Issues
1. Check original image resolution
2. Ensure image is not over-compressed
3. Try PNG format for better quality

## My Recommendation

Based on the two images you have:

1. **Try Shilathoranam first** (currently set)
   - Unique natural formation
   - Good composition for background
   - Culturally significant

2. **Then try Lepakshi Nandi**
   - Very recognizable landmark
   - Strong visual impact
   - Iconic sculpture

3. **Compare and choose** the one that:
   - Looks more impressive
   - Has better text readability
   - Better represents your app

---

*Quick Reference Guide*
*Last Updated: 2026-02-27*
*Current: Option 1 - Shilathoranam*
