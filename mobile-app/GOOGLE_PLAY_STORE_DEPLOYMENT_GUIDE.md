# Google Play Store Deployment Guide

## Current Status

✅ **Identity Verified** - Great first step!

However, you still need to complete several requirements before publishing.

---

## What You Still Need to Do

### 1. Complete Developer Account Setup

**Remaining Tasks in Google Play Console:**

✅ Verify Android mobile device access (if not done)
✅ Verify contact phone number

**Additional Requirements:**

- [ ] Pay one-time registration fee: **$25 USD**
- [ ] Complete account verification (can take 1-2 days)
- [ ] Accept Developer Distribution Agreement
- [ ] Set up payment profile (for paid apps or in-app purchases)

---

## 2. Prepare Your App for Production

### A. Build Production APK/AAB

Your app is currently in development mode (Expo). You need to build a production version.

**Option 1: Build with EAS (Expo Application Services)** ⭐ RECOMMENDED

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
cd mobile-app
eas build:configure

# Build for Android
eas build --platform android --profile production
```

**Option 2: Build Locally**

```bash
cd mobile-app

# Create production build
expo prebuild
cd android
./gradlew bundleRelease

# APK will be at: android/app/build/outputs/bundle/release/app-release.aab
```

### B. Generate Signing Key

Google Play requires your app to be signed:

```bash
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore sanaathana-release-key.keystore -alias sanaathana-key -keyalg RSA -keysize 2048 -validity 10000

# You'll be asked for:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your name, organization, etc.
```

**IMPORTANT:** Store these credentials securely! You'll need them for all future updates.

---

## 3. Create App Listing

### Required Information

**App Details:**
- App name: Sanaathana Aalaya Charithra
- Short description (80 chars): Digital heritage preservation for Indian temples
- Full description (4000 chars): [See template below]
- Category: Education or Travel & Local
- Content rating: Everyone
- Privacy policy URL: [You need to create this]

**Graphics Assets Required:**

1. **App Icon**
   - Size: 512×512 px
   - Format: PNG (32-bit)
   - No transparency

2. **Feature Graphic**
   - Size: 1024×500 px
   - Format: PNG or JPEG
   - Showcases your app

3. **Screenshots** (minimum 2, maximum 8)
   - Phone: 16:9 or 9:16 ratio
   - Minimum: 320px
   - Maximum: 3840px
   - Show key features

4. **Promo Video** (optional but recommended)
   - YouTube URL
   - 30 seconds to 2 minutes

### App Description Template

```
Discover India's rich temple heritage with Sanaathana Aalaya Charithra!

🛕 EXPLORE ANCIENT TEMPLES
Scan QR codes at temple artifacts to unlock rich historical content, stories, and significance.

🎧 MULTI-LANGUAGE AUDIO GUIDES
Listen to professional audio guides in 5 languages:
• English
• Hindi
• Telugu
• Kannada
• Tamil

📱 FEATURES
• QR code scanning for instant artifact information
• High-quality audio and video content
• Detailed historical descriptions
• Offline access to purchased content
• Beautiful image galleries
• Interactive temple maps

💰 FLEXIBLE PRICING
• Single artifact: ₹50
• Temple package: ₹150 (all artifacts)
• Group packages available

🌟 PERFECT FOR
• Temple visitors and pilgrims
• History enthusiasts
• Students and researchers
• Tourists exploring Indian heritage
• Families learning about culture

📚 EDUCATIONAL & CULTURAL
Preserve and share India's 10,000+ years of temple heritage. Learn about architecture, deities, rituals, and historical significance.

🔒 SECURE PAYMENTS
Safe and secure payment processing through Razorpay.

Download now and start your spiritual and cultural journey!

---
For support: [your-email]
Website: [your-website]
```

---

## 4. Privacy Policy (REQUIRED)

You MUST have a privacy policy URL. Here's what to include:

### Privacy Policy Requirements

**Must cover:**
- What data you collect (user info, location, payment data)
- How you use the data
- How you protect the data
- Third-party services (Razorpay, AWS, Google TTS)
- User rights (access, deletion, opt-out)
- Contact information

**Quick Solution:**

Use a privacy policy generator:
- https://www.privacypolicygenerator.info/
- https://www.freeprivacypolicy.com/

Then host it on:
- Your website
- GitHub Pages (free)
- Google Sites (free)

---

## 5. Content Rating Questionnaire

Google requires you to complete a content rating questionnaire.

**For your app:**
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- Gambling: None
- User interaction: Yes (users can interact)
- Shares location: Optional
- Unrestricted internet access: Yes

**Expected Rating:** Everyone (suitable for all ages)

---

## 6. App Release Process

### Step-by-Step Release

**1. Create App in Play Console**
```
1. Go to Google Play Console
2. Click "Create app"
3. Fill in app details
4. Select default language: English
5. Choose app type: App
6. Choose free or paid: Free (with in-app purchases)
```

**2. Set Up Store Listing**
```
1. Add app name, description
2. Upload graphics (icon, screenshots, feature graphic)
3. Select category
4. Add contact details
5. Add privacy policy URL
```

**3. Complete Content Rating**
```
1. Fill out questionnaire
2. Get rating certificate
3. Apply to your app
```

**4. Set Up Pricing & Distribution**
```
1. Select countries (India + others)
2. Set pricing (Free)
3. Enable in-app purchases
4. Accept content guidelines
```

**5. Upload App Bundle**
```
1. Go to "Production" → "Create new release"
2. Upload AAB file
3. Add release notes
4. Review and rollout
```

**6. Submit for Review**
```
1. Review all sections (must be complete)
2. Click "Submit for review"
3. Wait for approval (1-7 days typically)
```

---

## 7. Testing Before Production

### Internal Testing (Recommended First)

```bash
# Create internal test track
1. Go to "Testing" → "Internal testing"
2. Create new release
3. Upload AAB
4. Add testers (email addresses)
5. Share test link with testers
```

### Closed Testing (Beta)

```bash
# After internal testing
1. Go to "Testing" → "Closed testing"
2. Create new release
3. Add beta testers
4. Get feedback
5. Fix issues
```

### Open Testing (Optional)

```bash
# Public beta before production
1. Go to "Testing" → "Open testing"
2. Anyone can join
3. Get wider feedback
```

---

## 8. In-App Purchases Setup

Since your app has paid content, you need to set up in-app purchases:

**1. Create Products**
```
1. Go to "Monetize" → "Products" → "In-app products"
2. Create products:
   - Single Artifact (₹50)
   - Temple Package (₹150)
   - Group Package (₹500)
3. Set product IDs, prices, descriptions
```

**2. Integrate with App**
```typescript
// Already done in your app with Razorpay
// But you may need Google Play Billing for Play Store
```

---

## 9. Timeline & Costs

### Costs

| Item | Cost |
|------|------|
| Google Play Developer Account | $25 (one-time) |
| App development | Already done ✅ |
| Graphics design | Free (DIY) or ₹2,000-5,000 |
| Privacy policy hosting | Free (GitHub Pages) |
| **Total** | **$25 + optional design costs** |

### Timeline

| Task | Time |
|------|------|
| Complete developer account | 1-2 days |
| Prepare graphics | 1-2 days |
| Build production APK | 1 hour |
| Create store listing | 2-3 hours |
| Privacy policy | 1-2 hours |
| Submit for review | 5 minutes |
| Google review | 1-7 days |
| **Total** | **3-12 days** |

---

## 10. Quick Checklist

### Before Submitting

- [ ] Developer account fully verified
- [ ] $25 registration fee paid
- [ ] Production APK/AAB built and signed
- [ ] App icon (512×512) ready
- [ ] Feature graphic (1024×500) ready
- [ ] At least 2 screenshots ready
- [ ] Privacy policy URL created
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] Pricing & distribution set
- [ ] In-app products created (if applicable)
- [ ] App tested on real devices
- [ ] All features working
- [ ] Backend APIs deployed (or use local for testing)

---

## 11. For Your Hackathon

### What You Can Do Now

**Option A: Internal Testing** ⭐ RECOMMENDED
- Upload to internal testing track
- Share with judges/testers
- No public review needed
- Faster (same day)

**Option B: Closed Testing**
- Create beta program
- Share link with specific people
- Still no public review
- Takes 1-2 days

**Option C: Demo with Expo**
- Use Expo Go for demo
- No Play Store needed
- Instant sharing via QR code
- Perfect for hackathon

### Recommended for Hackathon

**Use Expo Go for demo:**
```bash
cd mobile-app
npm start

# Share QR code with judges
# They install Expo Go and scan
# Instant access to your app!
```

**After hackathon, publish to Play Store:**
- Complete all requirements
- Build production version
- Submit for review
- Launch publicly!

---

## 12. Common Issues & Solutions

### Issue: "App not approved"

**Reasons:**
- Privacy policy missing or inadequate
- Misleading screenshots
- Broken functionality
- Policy violations

**Solution:**
- Read rejection reason carefully
- Fix issues
- Resubmit

### Issue: "Build failed"

**Reasons:**
- Missing dependencies
- Incorrect configuration
- Signing issues

**Solution:**
- Check build logs
- Verify all dependencies installed
- Ensure signing key is correct

### Issue: "Payment integration rejected"

**Reasons:**
- Not using Google Play Billing for in-app purchases
- Unclear pricing

**Solution:**
- For digital goods, must use Google Play Billing
- For physical goods/services, can use Razorpay
- Your temple content = digital goods = need Play Billing

---

## 13. Next Steps

### Immediate (For Hackathon)

1. **Use Expo Go for demo** - Fastest option
2. **Prepare screenshots** - For presentation
3. **Create demo video** - Show features

### Short-term (After Hackathon)

1. **Pay $25 registration fee**
2. **Complete account verification**
3. **Create privacy policy**
4. **Design graphics assets**
5. **Build production APK**

### Medium-term (Launch)

1. **Set up internal testing**
2. **Test with real users**
3. **Fix bugs**
4. **Submit for production review**
5. **Launch! 🚀**

---

## 14. Resources

### Official Documentation
- Google Play Console: https://play.google.com/console
- App signing: https://developer.android.com/studio/publish/app-signing
- Store listing: https://support.google.com/googleplay/android-developer/answer/9859152

### Tools
- EAS Build: https://docs.expo.dev/build/introduction/
- Privacy Policy Generator: https://www.privacypolicygenerator.info/
- Screenshot Generator: https://www.appmockup.com/

### Support
- Google Play Support: https://support.google.com/googleplay/android-developer
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: https://stackoverflow.com/questions/tagged/google-play

---

## Summary

**Can you publish now?** Not yet, but you're close!

**What's done:**
✅ Identity verified
✅ App developed
✅ Features working

**What's needed:**
- [ ] Pay $25 fee
- [ ] Complete account setup
- [ ] Create privacy policy
- [ ] Prepare graphics
- [ ] Build production version
- [ ] Submit for review

**For hackathon:** Use Expo Go for instant demo!

**After hackathon:** Complete requirements and publish to Play Store.

---

**Estimated time to publish:** 3-12 days after completing all requirements

**Good luck with your hackathon! 🏆**

