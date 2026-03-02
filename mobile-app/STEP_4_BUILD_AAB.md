# Step 4: Build Production AAB for Play Store

This is the exciting part - building your app for the Play Store!

---

## What We're Building

An Android App Bundle (AAB) file that you'll upload to Google Play Console for internal testing.

**Build Profile**: `internal-testing` (already configured in `eas.json`)

---

## Quick Build Command

```powershell
cd mobile-app
eas build --platform android --profile internal-testing
```

That's it! EAS will build your app in the cloud.

---

## What Happens During Build

1. **Code Upload**: Your code is uploaded to Expo's build servers
2. **Dependencies Install**: All npm packages are installed
3. **Native Build**: Android native code is compiled
4. **AAB Generation**: App bundle is created and signed with your keystore
5. **Download Link**: You get a link to download the AAB (takes 15-30 minutes)

---

## Build Process Details

When you run the command, EAS will:

1. Ask if you want to use the existing credentials (your keystore from Step 1)
   - Answer: **Yes** (use existing)

2. Show build progress in real-time
   - You can close the terminal and check status later at: https://expo.dev/accounts/avvarimanju/projects/sanaathana-aalaya-charithra-mobile/builds

3. Send you an email when build completes

4. Provide download link for the AAB file

---

## Expected Output

```
✔ Build finished.

🤖 Android app:
https://expo.dev/artifacts/eas/[build-id].aab

Build details: https://expo.dev/accounts/avvarimanju/projects/sanaathana-aalaya-charithra-mobile/builds/[build-id]
```

---

## Download Your AAB

Once build completes:

1. Click the artifact link or go to the build details page
2. Download the `.aab` file
3. Save it somewhere safe (you'll upload this to Play Console in Step 5)

**File name will be something like**: `build-[build-id].aab`

---

## Troubleshooting

### Build Fails with "Credentials not found"

Run this first:
```powershell
eas credentials
```

Select:
- Platform: Android
- Action: Set up credentials
- Use existing keystore: Yes
- Point to: `sanaathana-release-key.keystore`

### Build Takes Too Long

Normal build time: 15-30 minutes
If it takes longer than 45 minutes, check the build logs at expo.dev

### Build Succeeds but Download Link Expired

Go to: https://expo.dev/accounts/avvarimanju/projects/sanaathana-aalaya-charithra-mobile/builds
Find your build and download from there

---

## Verify Your AAB

After downloading, verify the file:

**Check file size**: Should be 30-80 MB (typical for Expo apps)

**Check file extension**: Must be `.aab` (not `.apk`)

---

## What's in the AAB?

Your AAB contains:
- ✅ All your React Native code
- ✅ All assets (images, fonts)
- ✅ Native Android code
- ✅ App icon and splash screen
- ✅ Signed with your release keystore
- ✅ Optimized for Play Store distribution

---

## Next Step

Once you have your AAB file downloaded:

**Proceed to Step 5: Create App in Play Console**

See: `PLAY_STORE_INTERNAL_TESTING_GUIDE.md` - Step 5

---

**Time to Complete**: 15-30 minutes (mostly waiting for build)  
**Status**: Ready to build!

---

## Quick Reference

**Start Build:**
```powershell
cd mobile-app
eas build --platform android --profile internal-testing
```

**Check Build Status:**
```powershell
eas build:list
```

**View Build Logs:**
Go to: https://expo.dev/accounts/avvarimanju/projects/sanaathana-aalaya-charithra-mobile/builds

**Download AAB:**
Click the artifact link from build output or go to expo.dev builds page
