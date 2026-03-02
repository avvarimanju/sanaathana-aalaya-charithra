# Google Play Store Internal Testing - Quick Deployment Guide

**Date**: March 1, 2026  
**Status**: ✅ $25 Fee Paid - Ready to Deploy!  
**Target**: Internal Testing Track  
**Timeline**: 4-6 hours

---

## Why Internal Testing is Perfect for You

✅ **No Review Required** - Upload and test immediately  
✅ **Private** - Only people you invite can access  
✅ **Fast** - Available within minutes of upload  
✅ **Flexible** - Update as many times as you want  
✅ **Perfect for Hackathon** - Share with judges/testers instantly

---

## What You Still Need (Quick Checklist)

### Critical (Must Have):
- [x] $25 registration fee paid ✅
- [ ] Production APK/AAB built (1-2 hours)
- [ ] App signing key generated (15 minutes)
- [ ] Basic app listing created (30 minutes)
- [ ] Privacy policy URL (30 minutes)

### Optional (Can Skip for Internal Testing):
- [ ] Feature graphic (can add later)
- [ ] Screenshots (can add later)
- [ ] Full description (can be minimal)
- [ ] Content rating (not required for internal testing)

**Total Time**: 4-6 hours to internal testing!

---

## Step-by-Step Deployment

### Step 1: Generate App Signing Key (15 minutes)

```powershell
# Navigate to mobile app directory
cd mobile-app

# Generate signing key
keytool -genkeypair -v -storetype PKCS12 `
  -keystore sanaathana-release-key.keystore `
  -alias sanaathana-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

# You'll be prompted for:
# - Keystore password: [CREATE A STRONG PASSWORD]
# - Re-enter password: [SAME PASSWORD]
# - First and last name: [Your Name]
# - Organizational unit: [Your Team/Company]
# - Organization: Sanaathana Aalaya Charithra
# - City: [Your City]
# - State: [Your State]
# - Country code: IN
# - Confirm: yes
# - Key password: [PRESS ENTER to use same as keystore]
```

**CRITICAL**: Save these passwords securely! You'll need them for all future updates.

**Store credentials in a safe place:**
```
Keystore Password: [YOUR_PASSWORD]
Key Alias: sanaathana-key
Key Password: [SAME_AS_KEYSTORE]
Keystore File: sanaathana-release-key.keystore
```

---

### Step 2: Configure EAS Build (30 minutes)

**Install EAS CLI:**
```powershell
npm install -g eas-cli
```

**Login to Expo:**
```powershell
eas login
# Enter your Expo account credentials
```

**Configure EAS:**
```powershell
cd mobile-app
eas build:configure
```

This creates `eas.json`. Update it:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    },
    "internal-testing": {
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://YOUR_LOCAL_IP:4000"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Update app.json:**
```json
{
  "expo": {
    "name": "Sanaathana Aalaya Charithra",
    "slug": "sanaathana-aalaya-charithra",
    "version": "1.0.0",
    "android": {
      "package": "com.sanaathana.aalayacharithra",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

---

### Step 3: Create Quick Privacy Policy (30 minutes)

**Option A: Use Privacy Policy Generator (Fastest)**

1. Go to: https://www.privacypolicygenerator.info/
2. Fill in:
   - Website/App Name: Sanaathana Aalaya Charithra
   - Website/App URL: [Your website or GitHub]
   - Country: India
   - Email: [Your email]
3. Select:
   - ✅ Mobile App
   - ✅ Collects personal information
   - ✅ Uses cookies
   - ✅ Third-party services (Razorpay, AWS)
4. Generate and download

**Option B: Use This Template**

Create `privacy-policy.md`:

```markdown
# Privacy Policy for Sanaathana Aalaya Charithra

Last updated: March 1, 2026

## Information We Collect

We collect information you provide directly:
- Name and email address (for account creation)
- Payment information (processed securely by Razorpay)
- Usage data (temples visited, QR codes scanned)

## How We Use Your Information

- Provide access to temple content
- Process payments for premium content
- Improve app functionality
- Send important updates

## Data Security

We use industry-standard security measures to protect your data.
Payment information is processed securely by Razorpay.

## Third-Party Services

We use:
- AWS (hosting and storage)
- Razorpay (payment processing)
- Google Analytics (usage statistics)

## Your Rights

You can:
- Access your data
- Delete your account
- Opt out of marketing emails

## Contact Us

Email: [your-email@example.com]

## Changes to This Policy

We may update this policy. Check this page for updates.
```

**Host Privacy Policy:**

**Option 1: GitHub Pages (Free, Recommended)**
```powershell
# Create a new repository: sanaathana-privacy-policy
# Upload privacy-policy.md
# Enable GitHub Pages in repository settings
# URL will be: https://[username].github.io/sanaathana-privacy-policy/
```

**Option 2: Google Sites (Free)**
1. Go to https://sites.google.com/
2. Create new site
3. Paste privacy policy
4. Publish
5. Get URL

**Option 3: Netlify (Free)**
```powershell
# Create index.html with privacy policy
# Deploy to Netlify
# Get URL
```

---

### Step 4: Build Production APK/AAB (1-2 hours)

**Important**: For internal testing, you need your local backend running and accessible.

**Get Your Local IP Address:**
```powershell
# On Windows
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

**Update .env file:**
```env
# mobile-app/.env.production
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:4000
EXPO_PUBLIC_ENVIRONMENT=internal-testing
```

**Build for Internal Testing:**
```powershell
cd mobile-app

# Build AAB for Play Store
eas build --platform android --profile internal-testing

# This will:
# 1. Upload your code to Expo servers
# 2. Build the app in the cloud
# 3. Give you a download link when done (15-30 minutes)
```

**Alternative: Build Locally (Faster but more complex)**
```powershell
# Only if you have Android Studio installed
npx expo prebuild
cd android
./gradlew bundleRelease

# AAB will be at: android/app/build/outputs/bundle/release/app-release.aab
```

---

### Step 5: Create App in Play Console (30 minutes)

**Go to Google Play Console:**
https://play.google.com/console

**Create New App:**
1. Click "Create app"
2. Fill in:
   - App name: **Sanaathana Aalaya Charithra**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
   - Declarations:
     - ✅ I confirm this app complies with Google Play policies
     - ✅ I confirm this app complies with US export laws
3. Click "Create app"

---

### Step 6: Complete Minimal Store Listing (30 minutes)

**Navigate to: Dashboard → Store presence → Main store listing**

**Required Fields (Minimal for Internal Testing):**

**App details:**
- Short description (80 chars):
  ```
  Discover India's temple heritage through QR codes and audio guides
  ```

- Full description (500 chars minimum):
  ```
  Sanaathana Aalaya Charithra brings India's rich temple heritage to your fingertips.

  Features:
  • Scan QR codes at temple artifacts
  • Access detailed historical information
  • Listen to audio guides in multiple languages
  • Explore temples across India
  • Learn about architecture and significance

  Perfect for temple visitors, history enthusiasts, and cultural explorers.
  ```

**App icon:**
- Upload your app icon (512×512 px)
- If you don't have one, use your existing app icon from `mobile-app/assets/icon.png`
- Resize to 512×512 if needed

**Feature graphic:**
- For internal testing, you can skip this initially
- Or create a simple one: 1024×500 px with app name and tagline

**Screenshots:**
- Minimum 2 screenshots required
- Take screenshots from your app:
  ```powershell
  # Run app in Expo
  npm start
  # Open in Android emulator
  # Take screenshots of:
  # 1. Home/Explore screen
  # 2. Temple detail screen
  # 3. QR scanner screen (optional)
  ```

**Category:**
- Primary: **Education** or **Travel & Local**

**Contact details:**
- Email: [your-email@example.com]
- Phone: [optional]
- Website: [optional]

**Privacy policy:**
- URL: [Your privacy policy URL from Step 3]

**Click "Save"**

---

### Step 7: Set Up Internal Testing Track (15 minutes)

**Navigate to: Testing → Internal testing**

**Create Internal Testing Release:**
1. Click "Create new release"
2. Upload your AAB file (from Step 4)
3. Release name: "Internal Testing v1.0.0"
4. Release notes:
   ```
   Initial internal testing release
   
   Features:
   - Temple browsing
   - QR code scanning
   - State selection with India map
   - Artifact viewing
   
   Note: Requires local backend running on same network
   ```
5. Click "Save"
6. Click "Review release"
7. Click "Start rollout to Internal testing"

---

### Step 8: Add Testers (5 minutes)

**Create Tester List:**
1. Go to "Testing → Internal testing → Testers"
2. Click "Create email list"
3. List name: "Hackathon Judges"
4. Add email addresses:
   ```
   judge1@example.com
   judge2@example.com
   your-email@example.com
   ```
5. Click "Save changes"

**Get Testing Link:**
1. Copy the "Copy link" URL
2. Share this link with testers
3. They'll need to:
   - Accept the invitation
   - Download the app from Play Store
   - Install and test

---

### Step 9: Start Local Backend (5 minutes)

**Before testers can use the app, start your backend:**

```powershell
# Terminal 1: Start LocalStack (if using)
docker-compose up

# Terminal 2: Start backend
cd Sanaathana-Aalaya-Charithra
npm run dev:backend

# Backend will run on http://192.168.1.100:4000
```

**Important**: Your computer and testers' phones must be on the same WiFi network!

---

### Step 10: Test the App (15 minutes)

**On Your Phone:**
1. Open the testing link
2. Accept invitation
3. Download app from Play Store
4. Install and open
5. Test key features:
   - ✅ App opens
   - ✅ Can browse temples
   - ✅ Can scan QR codes
   - ✅ Can view artifact details
   - ✅ India map works
   - ✅ State selection works

**If Issues:**
- Check backend is running
- Check phone is on same WiFi
- Check firewall allows port 4000
- Check API URL in app is correct

---

## Timeline Summary

| Step | Time | Status |
|------|------|--------|
| 1. Generate signing key | 15 min | ⏳ |
| 2. Configure EAS | 30 min | ⏳ |
| 3. Create privacy policy | 30 min | ⏳ |
| 4. Build APK/AAB | 1-2 hours | ⏳ |
| 5. Create app in Play Console | 30 min | ⏳ |
| 6. Complete store listing | 30 min | ⏳ |
| 7. Set up internal testing | 15 min | ⏳ |
| 8. Add testers | 5 min | ⏳ |
| 9. Start backend | 5 min | ⏳ |
| 10. Test app | 15 min | ⏳ |
| **TOTAL** | **4-6 hours** | |

---

## Quick Commands Reference

```powershell
# 1. Generate signing key
cd mobile-app
keytool -genkeypair -v -storetype PKCS12 -keystore sanaathana-release-key.keystore -alias sanaathana-key -keyalg RSA -keysize 2048 -validity 10000

# 2. Install EAS CLI
npm install -g eas-cli

# 3. Login to Expo
eas login

# 4. Configure EAS
eas build:configure

# 5. Get local IP
ipconfig

# 6. Build for internal testing
eas build --platform android --profile internal-testing

# 7. Start backend
cd ..
npm run dev:backend
```

---

## Troubleshooting

### Issue: Build fails

**Solution:**
```powershell
# Clear cache and rebuild
eas build --platform android --profile internal-testing --clear-cache
```

### Issue: App can't connect to backend

**Solutions:**
1. Check backend is running: `curl http://192.168.1.100:4000/health`
2. Check firewall allows port 4000
3. Check phone is on same WiFi network
4. Try using your computer's IP address instead of localhost

### Issue: "App not available in your country"

**Solution:**
- Go to Play Console → Setup → Advanced settings
- Add "India" to available countries
- Save changes

### Issue: Testers can't find app

**Solution:**
- Make sure they accepted the invitation email
- Make sure they're using the same Google account
- Share the direct testing link again

---

## After Internal Testing

### Collect Feedback

**Ask testers:**
- Does the app open successfully?
- Can you browse temples?
- Does QR scanning work?
- Is the UI intuitive?
- Any crashes or bugs?
- Performance issues?

### Fix Issues

1. Note all bugs and issues
2. Fix in your code
3. Build new version
4. Upload to internal testing
5. Test again

### Move to Closed Testing (Optional)

When ready for more testers:
1. Go to "Testing → Closed testing"
2. Create new release
3. Add more testers (up to 100)
4. Get wider feedback

### Move to Production (Later)

When fully tested and ready:
1. Complete all store listing requirements
2. Add all graphics
3. Complete content rating
4. Submit for production review
5. Wait 1-7 days for approval
6. Launch! 🚀

---

## Important Notes

### Backend Limitation

⚠️ **Your app currently requires local backend running**

**For internal testing, this means:**
- Testers must be on same WiFi network as your computer
- Your computer must be running the backend
- Not ideal for remote testers

**Solutions:**

**Option 1: Use ngrok (Quick, for demo)**
```powershell
# Install ngrok
choco install ngrok

# Expose local backend
ngrok http 4000

# Use ngrok URL in app
# Example: https://abc123.ngrok.io
```

**Option 2: Deploy minimal AWS backend (Better)**
- Deploy just the essential APIs
- Use AWS Lambda + API Gateway
- Update app to use AWS URL
- See AWS deployment guide

**Option 3: Use Expo tunnel (Easiest for testing)**
```powershell
# In mobile app
npm start -- --tunnel

# This creates a public URL for your app
# Testers can access without being on same network
```

---

## Cost Summary

| Item | Cost |
|------|------|
| Google Play Developer Account | $25 (✅ Paid) |
| EAS Build (free tier) | $0 (100 builds/month) |
| Privacy policy hosting | $0 (GitHub Pages) |
| Internal testing | $0 |
| **Total** | **$0** |

---

## Next Steps

### Today (4-6 hours):
1. ✅ Generate signing key
2. ✅ Build APK/AAB
3. ✅ Create privacy policy
4. ✅ Set up internal testing
5. ✅ Invite testers

### This Week:
1. Collect feedback from testers
2. Fix bugs and issues
3. Upload new version
4. Test again

### Next Week:
1. Consider deploying backend to AWS
2. Move to closed testing (more testers)
3. Prepare for production release

---

## Ready to Start?

**Let's deploy to internal testing!**

Follow the steps above, and you'll have your app in testers' hands within 4-6 hours.

**Need help?** Check the troubleshooting section or refer to:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

**Good luck! 🚀**

---

**Last Updated**: March 1, 2026  
**Status**: Ready to deploy to internal testing!
