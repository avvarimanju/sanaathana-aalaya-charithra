# Immediate Actions Checklist
## What to Do Right Now to Launch

**Current Status:** 74% Complete | 10 Launch Blockers Remaining

---

## 🔴 CRITICAL - DO FIRST (Blocks Everything)

### 1. Complete Razorpay Setup
- [ ] Check phone/email for Razorpay OTP
- [ ] Enter OTP in Razorpay dashboard
- [ ] Click "Generate Key" button
- [ ] Copy Key ID (starts with `rzp_test_`)
- [ ] Copy Key Secret
- [ ] Save both keys securely

**Time:** 5 minutes  
**Blocks:** Payment testing, backend deployment

---

## 🟠 HIGH PRIORITY - DO TODAY

### 2. Update Mobile App with API Keys
**File:** `mobile-app/src/services/razorpay.service.ts`

Find line 20:
```typescript
this.razorpayKeyId = __DEV__ 
  ? 'rzp_test_PLACEHOLDER_KEY' // ⚠️ REPLACE THIS
  : 'rzp_live_PLACEHOLDER_KEY';
```

Replace with:
```typescript
this.razorpayKeyId = __DEV__ 
  ? 'rzp_test_YOUR_ACTUAL_KEY_HERE' // Paste your test key
  : 'rzp_live_PLACEHOLDER_KEY';
```

- [ ] Open file
- [ ] Replace placeholder with actual key
- [ ] Save file

**Time:** 2 minutes  
**Depends on:** #1

---

### 3. Install Dependencies

Run these commands:

```bash
# Backend dependencies
npm install

# Mobile app dependencies
cd mobile-app
npm install
cd ..
```

- [ ] Run backend npm install
- [ ] Run mobile app npm install
- [ ] Verify no errors

**Time:** 5-10 minutes  
**Blocks:** Building and running the app

---

### 4. Update App.tsx Navigation

**File:** `mobile-app/App.tsx`

Add these imports at the top (after existing imports):
```typescript
import ExploreScreen from './src/screens/ExploreScreen';
import TempleDetailsScreen from './src/screens/TempleDetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
```

Add these routes inside `<Stack.Navigator>` (after QAChat screen):
```typescript
<Stack.Screen 
  name="Explore" 
  component={ExploreScreen}
  options={{ title: 'Explore Temples' }}
/>
<Stack.Screen 
  name="TempleDetails" 
  component={TempleDetailsScreen}
  options={{ title: 'Temple Details' }}
/>
<Stack.Screen 
  name="Payment" 
  component={PaymentScreen}
  options={{ title: 'Unlock Temple' }}
/>
```

- [ ] Add imports
- [ ] Add routes
- [ ] Save file

**Time:** 3 minutes  
**Blocks:** Accessing new screens in app

---

### 5. Update CDK Stack with Payment Resources

**File:** `infrastructure/stacks/sanaathana-aalaya-charithra-stack.ts`

This is complex - I'll create the complete updated file for you.

- [ ] Review updated CDK stack file
- [ ] Understand changes
- [ ] Ready to deploy

**Time:** 10 minutes (review)  
**Blocks:** Payment backend deployment

---

### 6. Deploy Backend

Run these commands:

```bash
# Build TypeScript
npm run build

# Bundle Lambda functions
npm run bundle

# Deploy to AWS
npm run deploy
```

- [ ] Run build
- [ ] Run bundle
- [ ] Run deploy
- [ ] Wait for deployment (5-10 minutes)
- [ ] Note API Gateway URL from output

**Time:** 15-20 minutes  
**Depends on:** #3, #5  
**Blocks:** Testing payment flow

---

### 7. Test Payment Flow

1. Start mobile app:
```bash
cd mobile-app
npm start
```

2. Test on Android device/emulator
3. Navigate to Explore → Select Temple → Click "Unlock"
4. Payment screen should appear
5. Use test card: 4111 1111 1111 1111
6. CVV: 123, Expiry: 12/25
7. Complete payment
8. Verify content unlocks

- [ ] App starts successfully
- [ ] Can navigate to Explore
- [ ] Can see temples list
- [ ] Can open temple details
- [ ] Payment screen appears
- [ ] Test payment succeeds
- [ ] Content unlocks

**Time:** 15 minutes  
**Depends on:** #1, #2, #3, #4, #6

---

## 🟡 MEDIUM PRIORITY - DO TOMORROW

### 8. Create App Icon

Use a design tool (Canva, Figma, or hire on Fiverr):
- Size: 1024x1024 pixels
- Theme: Hindu temple, heritage, cultural
- Colors: Orange (#FF6B35), white, gold
- Format: PNG with transparency

- [ ] Design or commission icon
- [ ] Export as 1024x1024 PNG
- [ ] Save as `mobile-app/assets/icon.png`
- [ ] Update `mobile-app/app.json` with icon path

**Time:** 1-2 hours (or $5-20 on Fiverr)  
**Blocks:** Play Store submission

---

### 9. Write Privacy Policy

Create a simple privacy policy covering:
- What data you collect (usage analytics, payment info)
- How you use it (improve app, process payments)
- Third parties (AWS, Razorpay, Google)
- User rights (access, deletion)
- Contact information

Use a template from:
- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

- [ ] Generate privacy policy
- [ ] Review and customize
- [ ] Host on GitHub Pages or simple website
- [ ] Get public URL
- [ ] Add URL to `mobile-app/app.json`

**Time:** 30 minutes  
**Blocks:** Play Store submission

---

### 10. Take Screenshots

Take screenshots of these screens:
1. Welcome screen
2. Language selection
3. Explore temples list
4. Temple details
5. QR scanner
6. Audio guide playing
7. Q&A chat
8. Payment screen

Requirements:
- Phone: 1080x1920 or higher
- Tablet: 1536x2048 or higher
- At least 2 screenshots required
- Maximum 8 screenshots

- [ ] Take phone screenshots (minimum 2)
- [ ] Take tablet screenshots (optional)
- [ ] Save in organized folder
- [ ] Ready for Play Store upload

**Time:** 30 minutes  
**Blocks:** Play Store submission

---

## 🟢 LOW PRIORITY - CAN DO LATER

### 11. Write App Description

**Short description (80 characters):**
"Explore Hindu temple heritage with AI-powered audio guides in 10+ languages"

**Full description (4000 characters max):**
- What the app does
- Key features
- Supported temples
- Languages available
- How it works

- [ ] Write short description
- [ ] Write full description
- [ ] Review for clarity
- [ ] Ready for Play Store

**Time:** 20 minutes  
**Can do during Play Store submission**

---

### 12. Register Google Play Console

1. Go to https://play.google.com/console
2. Click "Create Developer Account"
3. Pay $25 registration fee
4. Wait 24-48 hours for verification

- [ ] Create account
- [ ] Pay $25 fee
- [ ] Wait for verification email

**Time:** 10 minutes + 24-48 hours wait  
**Blocks:** Final submission

---

## 📊 PROGRESS TRACKER

### Today's Goals (Day 1)
- [ ] #1 - Razorpay OTP ⏳ WAITING
- [ ] #2 - Update API keys
- [ ] #3 - Install dependencies
- [ ] #4 - Update navigation
- [ ] #5 - Update CDK stack
- [ ] #6 - Deploy backend
- [ ] #7 - Test payment flow

**Target:** Complete 7/7 items today

### Tomorrow's Goals (Day 2)
- [ ] #8 - Create app icon
- [ ] #9 - Write privacy policy
- [ ] #10 - Take screenshots
- [ ] #11 - Write app description
- [ ] #12 - Register Play Console

**Target:** Complete 5/5 items tomorrow

---

## 🎯 COMPLETION CRITERIA

### Ready to Submit to Play Store When:
✅ All 12 items above are checked  
✅ App builds without errors  
✅ Payment flow works end-to-end  
✅ No critical bugs  
✅ Play Console account verified  

**Estimated Time to Ready:** 2-3 days

---

## 🚨 BLOCKERS & DEPENDENCIES

```
#1 (Razorpay OTP)
  ↓
#2 (Update API keys) → #7 (Test payment)
  ↓
#3 (Install deps) → #6 (Deploy) → #7 (Test payment)
  ↓
#4 (Navigation) → #7 (Test payment)
  ↓
#5 (CDK Stack) → #6 (Deploy)

#8, #9, #10, #11 → #12 (Play Store submission)
```

**Critical Path:** #1 → #2 → #3 → #5 → #6 → #7

---

## 💡 TIPS

1. **Don't skip #1-#7** - These are critical for functionality
2. **#8-#11 can be done in parallel** - Delegate if possible
3. **Test thoroughly after #7** - Catch bugs early
4. **Keep Razorpay keys secure** - Never commit to Git
5. **Document any issues** - Makes debugging easier

---

## 📞 HELP NEEDED?

If stuck on any item:
1. Check the detailed guides in `docs/` folder
2. Review `PROJECT_GAP_ANALYSIS.md` for context
3. Check `ANDROID_LAUNCH_CHECKLIST.md` for step-by-step
4. Ask for help with specific error messages

---

**Current Status:** Ready to start #1 (waiting for Razorpay OTP)

**Next Action:** Check phone/email for OTP, then proceed with checklist!
