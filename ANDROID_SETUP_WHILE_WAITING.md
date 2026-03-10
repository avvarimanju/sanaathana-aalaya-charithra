# Android Setup - Get Started Now!

**Status**: Apple Developer enrollment pending (24-48 hours)  
**Action**: Set up Android Universal Links while waiting  
**Date**: March 9, 2026

---

## What's Happening

✅ Domain `charithra.org` is LIVE  
✅ Landing page deployed on Cloudflare Pages  
✅ Apple Developer enrollment submitted (waiting for approval)  
⏳ iOS verification file has placeholder (will update after approval)  
🚀 Android can be set up RIGHT NOW!

---

## Android Setup (No Waiting Required!)

You can complete the Android setup immediately without any approvals.

### Step 1: Generate Android Keystore (5 minutes)

You need a keystore to get the SHA256 fingerprint for Android App Links.

**Option A: For Testing (Debug Keystore)**

If you just want to test, Android Studio creates a debug keystore automatically:

```powershell
# Get SHA256 from debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Option B: For Production (Release Keystore)**

For the Play Store, generate a release keystore:

```powershell
# Navigate to your project
cd Sanaathana-Aalaya-Charithra

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 `
  -keystore charithra-release.keystore `
  -alias charithra-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -keypass YOUR_KEY_PASSWORD `
  -storepass YOUR_STORE_PASSWORD `
  -dname "CN=Charithra, OU=Mobile, O=Charithra, L=City, ST=State, C=IN"

# Get SHA256 fingerprint
keytool -list -v -keystore charithra-release.keystore -alias charithra-key
```

**What You'll See**:
```
Certificate fingerprints:
         SHA1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD
         SHA256: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56
```

**Copy the SHA256 line** (with colons)

---

### Step 2: Update Android Verification File (2 minutes)

Once you have the SHA256 fingerprint, tell me:

**"My Android SHA256 is: [YOUR_SHA256_HERE]"**

I'll update the `assetlinks.json` file for you!

Or you can update it manually:

**File**: `landing-page/.well-known/assetlinks.json`

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.charithra.app",
      "sha256_cert_fingerprints": [
        "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56"
      ]
    }
  }
]
```

---

### Step 3: Deploy Updated File (1 minute)

Push to GitHub for automatic deployment:

```powershell
cd Sanaathana-Aalaya-Charithra

git add landing-page/.well-known/assetlinks.json
git commit -m "Add Android SHA256 fingerprint for App Links"
git push origin main
```

Cloudflare will automatically deploy in 1-2 minutes!

---

### Step 4: Verify Android App Links (2 minutes)

Test that your file is accessible:

```powershell
# Check file is live
curl https://charithra.org/.well-known/assetlinks.json

# Should return your JSON with SHA256 fingerprint
```

**Validate with Google's Tool**:
1. Go to: https://developers.google.com/digital-asset-links/tools/generator
2. Enter:
   - Domain: `charithra.org`
   - Package name: `com.charithra.app`
   - SHA256 fingerprint: (your fingerprint)
3. Click "Generate Statement"
4. Click "Test Statement" to verify

---

## Timeline

### Now (Android)
- ✅ Generate keystore (5 min)
- ✅ Get SHA256 fingerprint (1 min)
- ✅ Update assetlinks.json (2 min)
- ✅ Deploy to Cloudflare (1 min)
- ✅ Verify with Google's tool (2 min)
- **Total: 11 minutes**

### After Apple Approval (iOS)
- ⏳ Wait for Apple Developer approval (24-48 hours)
- ⏳ Get Team ID from Apple Developer account
- ⏳ Update apple-app-site-association file
- ⏳ Deploy to Cloudflare
- ⏳ Verify with Apple's tool
- **Total: 10 minutes after approval**

---

## What You Can Do Right Now

### Option 1: Set Up Android (Recommended!)
Get Android Universal Links working today while waiting for Apple approval.

### Option 2: Configure Mobile App for Android
Update your React Native/Expo app to handle Android App Links:

**File**: `mobile-app/app.json`
```json
{
  "expo": {
    "android": {
      "package": "com.charithra.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "charithra.org",
              "pathPrefix": "/artifact"
            },
            {
              "scheme": "https",
              "host": "charithra.org",
              "pathPrefix": "/temple"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Option 3: Test Landing Page
Your landing page is already live! Test it:
```
https://charithra.org
```

---

## Quick Commands

```powershell
# Generate release keystore
cd Sanaathana-Aalaya-Charithra
keytool -genkeypair -v -storetype PKCS12 -keystore charithra-release.keystore -alias charithra-key -keyalg RSA -keysize 2048 -validity 10000

# Get SHA256 fingerprint
keytool -list -v -keystore charithra-release.keystore -alias charithra-key

# Update and deploy
git add landing-page/.well-known/assetlinks.json
git commit -m "Add Android SHA256 fingerprint"
git push origin main

# Test
curl https://charithra.org/.well-known/assetlinks.json
```

---

## Summary

**What's Done**:
- ✅ Domain purchased and live
- ✅ Landing page deployed
- ✅ Cloudflare Pages with auto-deployment
- ✅ Apple Developer enrollment submitted

**What's Next**:
1. Generate Android keystore (do this now!)
2. Get SHA256 fingerprint (do this now!)
3. Update assetlinks.json (do this now!)
4. Wait for Apple approval (24-48 hours)
5. Update iOS verification file (after approval)

**Your site is LIVE**: https://charithra.org 🎉

---

## Need Help?

Just tell me:
- "Generate Android keystore" - I'll guide you through it
- "My SHA256 is: [fingerprint]" - I'll update the file
- "How do I test Android App Links?" - I'll show you

**Let's get Android working while we wait for Apple!** 🚀
