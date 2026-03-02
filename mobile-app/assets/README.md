# Mobile App Assets - Temple Images

## Welcome Screen Background Images

The Welcome Screen uses a background image to showcase iconic temple landmarks. We have 4 options to choose from:

### Current Image: Option 1
**File**: `shilathoranam.jpg`
**Location**: Shilathoranam, Tirumala
**Description**: Natural rock arch formation near Tirumala, considered sacred

### Alternative Options

**Option 2**: `garuda-hill.jpg`
- Garuda resemblance hill on Tirumala hills
- Natural rock formation resembling Garuda (eagle)

**Option 3**: `venkateshwara-hill.jpg`
- Venkateshwara Swamy resemblance hills
- Natural formation displaying the face of Lord Venkateshwara

**Option 4**: `lepakshi-nandi.jpg`
- Lepakshi Nandi
- Monolithic Nandi bull sculpture at Lepakshi Temple

## Image Requirements

### Technical Specifications
- **Format**: JPG or PNG
- **Dimensions**: 1080 x 1920 pixels (portrait, 9:16 aspect ratio)
- **File Size**: < 500 KB (optimized for mobile)
- **Quality**: High resolution but compressed for performance

### Image Guidelines
1. **Composition**: Ensure main subject is centered or follows rule of thirds
2. **Lighting**: Good natural lighting, avoid harsh shadows
3. **Clarity**: Sharp focus on the main subject
4. **Colors**: Vibrant but natural colors
5. **Orientation**: Portrait mode (vertical)

## How to Add Images

### Step 1: Prepare Images
1. Download or capture high-quality images of the temple landmarks
2. Resize to 1080 x 1920 pixels
3. Optimize file size (use tools like TinyPNG or ImageOptim)
4. Save with appropriate filename

### Step 2: Add to Assets Folder
Place the image files in this directory:
```
mobile-app/assets/
├── shilathoranam.jpg       (Option 1 - Current)
├── garuda-hill.jpg         (Option 2)
├── venkateshwara-hill.jpg  (Option 3)
└── lepakshi-nandi.jpg      (Option 4)
```

### Step 3: Switch Between Options
To change the background image, edit `src/screens/WelcomeScreen.tsx`:

```tsx
// Option 1: Shilathoranam (Current)
source={require('../assets/shilathoranam.jpg')}

// Option 2: Garuda Hill
source={require('../assets/garuda-hill.jpg')}

// Option 3: Venkateshwara Hill
source={require('../assets/venkateshwara-hill.jpg')}

// Option 4: Lepakshi Nandi
source={require('../assets/lepakshi-nandi.jpg')}
```

Also update the image credit text:
```tsx
<Text style={styles.imageCredit}>
  Shilathoranam, Tirumala  // Change this to match the image
</Text>
```

## Current Implementation

The WelcomeScreen now uses:
- **ImageBackground** component for full-screen background
- **Orange overlay** (75% opacity) for brand consistency and text readability
- **Text shadows** for better contrast against the image
- **Image credit** at the bottom to acknowledge the landmark

## Testing

After adding images:
1. Run the app: `npm start` or `expo start`
2. Check image loads correctly
3. Verify text is readable over the image
4. Test on both iOS and Android
5. Check performance (loading time)

## Fallback

If images are not available, the app will show an error. To add a fallback:
1. Use a solid color background
2. Or use the temple emoji (🏛️) as before
3. Or use a gradient background

## Image Sources

When sourcing images, ensure:
- You have rights to use the images
- Images are not copyrighted
- Proper attribution is provided if required
- Images are culturally respectful

## Notes

- The overlay color can be adjusted in `WelcomeScreen.tsx` (currently `rgba(255, 107, 53, 0.75)`)
- Overlay opacity can be changed (0.0 = transparent, 1.0 = opaque)
- Text shadow intensity can be adjusted for better readability
- Consider different images for different times of day or festivals

---

*Last Updated: 2026-02-27*
