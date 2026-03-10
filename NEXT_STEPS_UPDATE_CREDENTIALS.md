# Next Steps: Update Universal Links Credentials

**Status**: Domain is LIVE at https://charithra.org ✅  
**Date**: March 9, 2026

---

## What's Working Now

✅ Domain `charithra.org` is live and accessible  
✅ Landing page deployed to Cloudflare Pages  
✅ SSL certificate active (HTTPS working)  
✅ Verification files deployed (but need real credentials)

---

## What You Need to Update

### 1. iOS Universal Links (Apple Team ID)

**File**: `landing-page/.well-known/apple-app-site-association`

**Current Status**: Contains placeholder `TEAM_ID`

**What You Need**:
- Your Apple Developer Team ID (10 characters)
- Your app's Bundle Identifier

**How to Get It**:
1. Go to: https://developer.apple.com/account
2. Sign in with your Apple Developer account
3. Click "Membership" in the sidebar
4. Copy your "Team ID" (looks like: `ABC123XYZ`)

**Update the File**:
Replace `TEAM_ID` with your actual Team ID:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.charithra.app",
        "paths": [
          "/artifact/*",
          "/temple/*"
        ]
      }
    ]
  }
}
```

---

### 2. Android App Links (SHA256 Fingerprint)

**File**: `landing-page/.well-known/assetlinks.json`

**Current Status**: Contains placeholder `YOUR_SHA256_FINGERPRINT_HERE`

**What You Need**:
- SHA256 certificate fingerprint from your Android keystore

**How to Get It**:

For DEBUG builds (testing):
```powershell
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For RELEASE builds (production):
```powershell
keytool -list -v -keystore path/to/your/release.keystore -alias your-key-alias
```

**Find the SHA256 Line**:
Look for output like:
```
SHA256: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56
```

**Update the File**:
Replace `YOUR_SHA256_FINGERPRINT_HERE` with your fingerprint (keep the colons):
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

## How to Deploy Updates

### Option 1: Git Push (Automatic Deployment)

Since you're using GitHub integration with Cloudflare Pages:

```powershell
cd Sanaathana-Aalaya-Charithra

# Make your changes to the verification files
# Then commit and push:

git add landing-page/.well-known/
git commit -m "Update Universal Links credentials"
git push origin main
```

Cloudflare will automatically deploy your changes in 1-2 minutes!

---

### Option 2: Cloudflare Dashboard (Manual Upload)

1. Go to: https://dash.cloudflare.com
2. Click "Workers & Pages"
3. Click on your project: `sac`
4. Click "Create deployment"
5. Upload the updated files
6. Click "Deploy"

---

## Testing After Update

### Test iOS Verification

```powershell
# Check file is accessible
curl https://charithra.org/.well-known/apple-app-site-association

# Validate with Apple's tool
# Go to: https://branch.io/resources/aasa-validator/
# Enter: https://charithra.org/.well-known/apple-app-site-association
```

### Test Android Verification

```powershell
# Check file is accessible
curl https://charithra.org/.well-known/assetlinks.json

# Validate with Google's tool
# Go to: https://developers.google.com/digital-asset-links/tools/generator
# Enter your domain and package name
```

---

## Don't Have Apple Developer Account Yet?

**No problem!** You can:

1. **Skip iOS for now** - Focus on Android first
2. **Sign up for Apple Developer** - $99/year
   - Go to: https://developer.apple.com/programs/
   - Enroll in Apple Developer Program
   - Get your Team ID after approval (1-2 days)

---

## Don't Have Android Keystore Yet?

**No problem!** You can generate one:

```powershell
# Generate a new keystore
keytool -genkeypair -v -storetype PKCS12 `
  -keystore charithra-release.keystore `
  -alias charithra-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

# Then get the SHA256 fingerprint
keytool -list -v -keystore charithra-release.keystore -alias charithra-key
```

---

## Current File Locations

```
Sanaathana-Aalaya-Charithra/
└── landing-page/
    ├── .well-known/
    │   ├── apple-app-site-association  ← Update this (iOS)
    │   └── assetlinks.json             ← Update this (Android)
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── _headers
    └── wrangler.toml
```

---

## Summary

**What's Done**:
- ✅ Domain purchased and active
- ✅ Cloudflare Pages deployed
- ✅ Landing page live at https://charithra.org
- ✅ Verification files created (with placeholders)

**What's Next**:
1. Get Apple Team ID (if you have Apple Developer account)
2. Get Android SHA256 fingerprint (from your keystore)
3. Update the two verification files
4. Push to GitHub (automatic deployment)
5. Test with validation tools

**Time Required**: 15-30 minutes (if you have credentials)

---

## Questions?

- **Don't have Apple Developer account?** → You can skip iOS and do Android only
- **Don't have Android keystore?** → Generate one using the command above
- **Want to test without credentials?** → The landing page works fine, just Universal Links won't work yet

---

**Your site is LIVE**: https://charithra.org 🎉

The verification files can be updated anytime when you're ready!
