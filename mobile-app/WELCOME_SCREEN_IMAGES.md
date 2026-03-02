# Welcome Screen Background Images - Quick Switch Guide

## Current Status

The Welcome Screen has been updated to use a background image instead of a solid color.

**Current Image**: Option 1 - Shilathoranam, Tirumala

## Quick Switch Instructions

### Option 1: Shilathoranam, Tirumala (CURRENT)
```tsx
// In src/screens/WelcomeScreen.tsx, line ~12
source={require('../assets/shilathoranam.jpg')}

// Update image credit, line ~58
<Text style={styles.imageCredit}>
  Shilathoranam, Tirumala
</Text>
```

### Option 2: Garuda Hill
```tsx
// In src/screens/WelcomeScreen.tsx, line ~12
source={require('../assets/garuda-hill.jpg')}

// Update image credit, line ~58
<Text style={styles.imageCredit}>
  Garuda Hill, Tirumala
</Text>
```

### Option 3: Venkateshwara Swamy Hill
```tsx
// In src/screens/WelcomeScreen.tsx, line ~12
source={require('../assets/venkateshwara-hill.jpg')}

// Update image credit, line ~58
<Text style={styles.imageCredit}>
  Venkateshwara Swamy Hill, Tirumala
</Text>
```

### Option 4: Lepakshi Nandi
```tsx
// In src/screens/WelcomeScreen.tsx, line ~12
source={require('../assets/lepakshi-nandi.jpg')}

// Update image credit, line ~58
<Text style={styles.imageCredit}>
  Monolithic Nandi, Lepakshi Temple
</Text>
```

## Before Testing

1. **Add the image file** to `mobile-app/assets/` folder
   - Filename must match exactly (e.g., `shilathoranam.jpg`)
   - Recommended size: 1080 x 1920 pixels
   - Format: JPG or PNG
   - File size: < 500 KB

2. **Restart the Metro bundler** after adding new images
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm start
   # or
   expo start
   ```

## Visual Customization

### Adjust Overlay Opacity
In `WelcomeScreen.tsx`, line ~18:
```tsx
backgroundColor: 'rgba(255, 107, 53, 0.75)', // Last number is opacity (0.0-1.0)

// Examples:
// More transparent (image more visible): 0.5
// More opaque (text more readable): 0.85
// No overlay: 0.0
```

### Adjust Overlay Color
```tsx
// Current: Orange brand color
backgroundColor: 'rgba(255, 107, 53, 0.75)',

// Dark overlay for better contrast:
backgroundColor: 'rgba(0, 0, 0, 0.5)',

// Blue overlay:
backgroundColor: 'rgba(33, 150, 243, 0.7)',
```

### Adjust Text Shadow
In `WelcomeScreen.tsx`, styles section:
```tsx
textShadowColor: 'rgba(0, 0, 0, 0.75)',  // Shadow color
textShadowOffset: { width: -1, height: 1 },  // Shadow position
textShadowRadius: 10,  // Shadow blur radius
```

## Testing Checklist

After switching images:
- [ ] Image loads without errors
- [ ] Text is readable over the image
- [ ] Image credit is correct
- [ ] App performance is good (no lag)
- [ ] Image looks good on different screen sizes
- [ ] Overlay provides good contrast
- [ ] "Get Started" button is visible

## Troubleshooting

### Image Not Loading
1. Check filename matches exactly (case-sensitive)
2. Ensure image is in `mobile-app/assets/` folder
3. Restart Metro bundler
4. Clear cache: `expo start -c`

### Text Not Readable
1. Increase overlay opacity (0.75 → 0.85)
2. Darken overlay color
3. Increase text shadow radius
4. Use darker overlay: `rgba(0, 0, 0, 0.6)`

### Image Quality Issues
1. Use higher resolution source image
2. Ensure image is not over-compressed
3. Use PNG for better quality (but larger file size)

## Recommendation

After testing all 4 options, choose based on:
1. **Visual Appeal**: Which image looks most impressive?
2. **Text Readability**: Which provides best contrast for text?
3. **Brand Alignment**: Which best represents the app's purpose?
4. **Cultural Significance**: Which landmark is most recognizable?

My suggestion: Start with **Option 1 (Shilathoranam)** as it's unique and iconic, then try **Option 4 (Lepakshi Nandi)** as it's very recognizable.

---

*Created: 2026-02-27*
*Status: Ready for image testing*
