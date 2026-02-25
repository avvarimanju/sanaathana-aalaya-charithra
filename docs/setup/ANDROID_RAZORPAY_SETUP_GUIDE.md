# Android + Razorpay Setup Guide
## Complete Implementation Guide

---

## 🎯 Goal

Publish your temple heritage app on Google Play Store with Razorpay payment integration.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Account (for Play Console)
- [ ] $25 USD (₹2,075) for Play Store registration
- [ ] Credit/Debit card for payment
- [ ] Business details (for Razorpay KYC)
- [ ] Bank account details
- [ ] PAN card (for Razorpay)
- [ ] Business registration (optional but recommended)

---

## 🚀 Implementation Phases

### Phase 1: Razorpay Account Setup (1-2 days)
### Phase 2: Razorpay Integration (2-3 days)
### Phase 3: Google Play Console Setup (1 day)
### Phase 4: App Preparation (2-3 days)
### Phase 5: Publishing (1-2 days)

**Total Time: 7-11 days**

---

## 📱 Phase 1: Razorpay Account Setup

### Step 1.1: Create Razorpay Account

1. Go to https://razorpay.com
2. Click "Sign Up"
3. Enter business details
4. Verify email and phone

### Step 1.2: Complete KYC

Required documents:
- PAN card
- Bank account details
- Business proof (optional)
- Address proof

### Step 1.3: Get API Keys

1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Test Keys (for development)
4. Generate Live Keys (for production)

Save these securely:
```
Test Key ID: rzp_test_xxxxxxxxxxxxx
Test Key Secret: xxxxxxxxxxxxxxxxxxxxx

Live Key ID: rzp_live_xxxxxxxxxxxxx
Live Key Secret: xxxxxxxxxxxxxxxxxxxxx
```

---

## 💻 Phase 2: Razorpay Integration

See separate implementation files:
- `RAZORPAY_INTEGRATION.md` - Complete code implementation
- `RAZORPAY_BACKEND.md` - Backend verification setup

---

## 🎮 Phase 3: Google Play Console Setup

### Step 3.1: Create Developer Account

1. Go to https://play.google.com/console
2. Sign in with Google Account
3. Accept Developer Agreement
4. Pay $25 registration fee
5. Wait 24-48 hours for verification

### Step 3.2: Create App

1. Click "Create App"
2. Enter app details:
   - App name: Sanaathana Aalaya Charithra
   - Default language: English
   - App type: App
   - Free or Paid: Free

3. Complete declarations:
   - Privacy Policy URL (required)
   - App access (all features available)
   - Ads (select if you have ads)
   - Content rating questionnaire
   - Target audience

---

## 📦 Phase 4: App Preparation

See `ANDROID_BUILD_GUIDE.md` for complete build instructions.

---

## 🚀 Phase 5: Publishing

See `PLAY_STORE_PUBLISHING.md` for step-by-step publishing guide.

---

**Next Steps:** Follow the detailed implementation guides in this folder.
