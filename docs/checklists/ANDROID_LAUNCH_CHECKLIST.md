# Android Launch Checklist
## Sanaathana Aalaya Charithra - Google Play Store with Razorpay

---

## 🎯 Goal

Launch your temple heritage app on Google Play Store with Razorpay payment integration.

---

## 📋 Complete Checklist

### ✅ Phase 1: Razorpay Setup (Days 1-2)

- [x] Create Razorpay account at https://razorpay.com ✅
- [x] Verify email and phone number ✅
- [x] Select business type (Unregistered) ✅
- [x] Select business category (Tours and travels) ✅
- [x] Submit application ✅
- [ ] Receive OTP and verify ⏳ IN PROGRESS
- [ ] Generate Test API keys ⏳ WAITING FOR OTP
- [ ] Complete KYC (PAN, bank details)
- [ ] Generate Live API keys (after KYC approval)
- [ ] Save keys securely

**Cost:** Free  
**Time:** 1-2 days (KYC approval)  
**Current Status:** Waiting for OTP to generate test keys

---

### ✅ Phase 2: Code Implementation (Days 3-5)

#### Mobile App

- [x] Install Razorpay SDK dependency ✅
- [x] Create `razorpay.service.ts` ✅
- [x] Create `PaymentScreen.tsx` ✅
- [ ] Receive OTP and get test API keys ⏳
- [ ] Update API keys in razorpay.service.ts
- [ ] Install dependencies: `npm install`
- [ ] Add Payment screen to navigation
- [ ] Test payment flow with test keys

#### Backend

- [x] Install Razorpay Node SDK dependency ✅
- [x] Create payment Lambda handler ✅
- [ ] Create purchases DynamoDB table
- [ ] Update CDK stack with payment resources
- [ ] Add environment variables for API keys
- [ ] Deploy backend to AWS

**Cost:** Free (development)  
**Time:** 2-3 days  
**Current Status:** Code ready, waiting for API keys to test

---

### ✅ Phase 3: Google Play Console (Day 6)

- [ ] Go to https://play.google.com/console
- [ ] Create developer account
- [ ] Pay $25 registration fee
- [ ] Wait for account verification (24-48 hours)
- [ ] Create new app
- [ ] Fill app details
- [ ] Set up store listing
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Set content rating
- [ ] Set target audience
- [ ] Add privacy policy URL

**Cost:** $25 (₹2,075) one-time  
**Time:** 1 day + 24-48 hours verification

---

### ✅ Phase 4: App Build (Day 7-8)

- [ ] Update app version in package.json
- [ ] Generate app icon and splash screen
- [ ] Build Android APK/AAB
- [ ] Test on physical device
- [ ] Test payment flow end-to-end
- [ ] Fix any bugs
- [ ] Generate signed APK/AAB for release

**Cost:** Free  
**Time:** 1-2 days

---

### ✅ Phase 5: Publishing (Day 9-10)

- [ ] Upload APK/AAB to Play Console
- [ ] Fill release notes
- [ ] Submit for review
- [ ] Wait for Google review (1-7 days)
- [ ] App published! 🎉

**Cost:** Free  
**Time:** 1-2 days + review time

---

## 💰 Total Costs

| Item | Cost | When |
|------|------|------|
| Razorpay Account | Free | Day 1 |
| Google Play Registration | $25 (₹2,075) | Day 6 |
| Development | Free | Days 3-8 |
| **Total** | **₹2,075** | **One-time** |

**Ongoing Costs:**
- Razorpay: 2% per transaction
- AWS: ₹3,500-4,000/month
- Domain: ₹500/month

---

## 📱 Files Created for You

### Mobile App
✅ `mobile-app/src/services/razorpay.service.ts` - Payment service  
✅ `mobile-app/src/screens/PaymentScreen.tsx` - Payment UI

### Documentation
✅ `docs/setup/ANDROID_RAZORPAY_SETUP_GUIDE.md` - Overview  
✅ `docs/setup/RAZORPAY_COMPLETE_SETUP.md` - Detailed setup  
✅ `docs/business/PAYMENT_MODELS_EXPLAINED.md` - Payment models  
✅ `docs/business/APP_STORE_PUBLISHING_COSTS.md` - Cost analysis

---

## 🚀 Quick Start Commands

### 1. Install Dependencies

```bash
# Mobile app
cd mobile-app
npm install react-native-razorpay

# Backend
cd ..
npm install razorpay crypto
```

### 2. Update API Keys

Edit `mobile-app/src/services/razorpay.service.ts`:
```typescript
this.razorpayKeyId = 'rzp_test_YOUR_KEY_HERE';
```

### 3. Test Payment

```bash
cd mobile-app
npm start
# Test on Android device/emulator
```

### 4. Build for Release

```bash
cd mobile-app
# Build Android APK
npm run build:android
```

### 5. Upload to Play Store

1. Go to Play Console
2. Upload APK/AAB
3. Submit for review

---

## 🧪 Testing Checklist

### Test Mode (Before Launch)

- [ ] Download app
- [ ] Browse temples
- [ ] Scan QR code (or simulate)
- [ ] See preview content
- [ ] Click "Unlock" button
- [ ] Payment screen appears
- [ ] Enter test card: 4111 1111 1111 1111
- [ ] Payment succeeds
- [ ] Content unlocks
- [ ] Verify in database
- [ ] Test offline access

### Live Mode (After Launch)

- [ ] Switch to live API keys
- [ ] Test with real card (small amount)
- [ ] Verify money received in bank
- [ ] Test refund process
- [ ] Monitor for errors

---

## 📞 Support Resources

### Razorpay
- Dashboard: https://dashboard.razorpay.com
- Docs: https://razorpay.com/docs
- Support: support@razorpay.com

### Google Play
- Console: https://play.google.com/console
- Help: https://support.google.com/googleplay/android-developer

### AWS
- Console: https://console.aws.amazon.com
- Docs: https://docs.aws.amazon.com

---

## ⚠️ Important Notes

### Razorpay

1. **Test Mode:**
   - Use test keys for development
   - Use test cards (4111 1111 1111 1111)
   - No real money involved

2. **Live Mode:**
   - Complete KYC first
   - Switch to live keys
   - Real money transactions
   - 2% fee applies

3. **Payouts:**
   - T+2 days (2 business days)
   - Automatic to your bank account
   - Minimum payout: ₹100

### Google Play

1. **Review Time:**
   - Usually 1-3 days
   - Can take up to 7 days
   - Be patient!

2. **Policies:**
   - Follow Google's policies
   - No misleading content
   - Proper privacy policy
   - Age-appropriate content

3. **Updates:**
   - Can update anytime
   - Each update reviewed
   - Usually faster than initial review

---

## 🎉 Launch Day Checklist

### Before Launch

- [ ] All features tested
- [ ] Payment flow working
- [ ] No critical bugs
- [ ] Privacy policy published
- [ ] Screenshots ready
- [ ] App description written
- [ ] Content rating done

### Launch Day

- [ ] Switch to live Razorpay keys
- [ ] Deploy backend with live keys
- [ ] Upload final APK to Play Store
- [ ] Submit for review
- [ ] Announce on social media (after approval)
- [ ] Monitor for issues

### After Launch

- [ ] Monitor crash reports
- [ ] Check payment success rate
- [ ] Respond to user reviews
- [ ] Fix bugs quickly
- [ ] Plan updates

---

## 📈 Success Metrics to Track

### Week 1
- Downloads: Target 100+
- Active users: Target 50+
- Payments: Target 10+
- Revenue: Target ₹1,000+

### Month 1
- Downloads: Target 1,000+
- Active users: Target 500+
- Payments: Target 100+
- Revenue: Target ₹10,000+

### Month 3
- Downloads: Target 5,000+
- Active users: Target 2,500+
- Payments: Target 500+
- Revenue: Target ₹50,000+

---

## 🚀 Next Steps

1. **Today:** Create Razorpay account
2. **Tomorrow:** Complete KYC, get API keys
3. **Day 3-5:** Implement payment code
4. **Day 6:** Register Google Play account
5. **Day 7-8:** Build and test app
6. **Day 9-10:** Submit to Play Store
7. **Day 11-17:** Wait for approval
8. **Day 18:** Launch! 🎉

---

## ✅ You're Ready!

All the code and documentation is ready. Just follow this checklist step by step, and you'll have your app live on Google Play Store with Razorpay payments in 10-18 days!

**Good luck with your launch! 🚀**

---

**Questions?** Refer to the detailed guides in `docs/setup/` folder.
