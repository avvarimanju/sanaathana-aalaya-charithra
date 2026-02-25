# Razorpay API Keys Setup Guide

## 🔑 Where to Add Your API Keys

Once you receive the OTP and generate your Razorpay API keys, follow these steps:

---

## Step 1: Get Your API Keys from Razorpay

1. Complete OTP verification in Razorpay Dashboard
2. Your keys will be displayed:
   ```
   Key ID: rzp_test_XXXXXXXXXXXX
   Key Secret: XXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Copy both keys securely

---

## Step 2: Update Mobile App

### File: `mobile-app/src/services/razorpay.service.ts`

Find this line (around line 20):
```typescript
this.razorpayKeyId = __DEV__ 
  ? 'rzp_test_PLACEHOLDER_KEY' // ⚠️ REPLACE with your test key
  : 'rzp_live_PLACEHOLDER_KEY';
```

Replace with your actual key:
```typescript
this.razorpayKeyId = __DEV__ 
  ? 'rzp_test_YOUR_ACTUAL_KEY_HERE' // Paste your test key here
  : 'rzp_live_PLACEHOLDER_KEY';
```

---

## Step 3: Update Backend (Coming Next)

We'll create backend Lambda functions that need the Key Secret:
- `src/lambdas/payment-handler.ts` - Will use Key Secret for verification
- Environment variables in AWS Lambda

---

## Step 4: Install Dependencies

Run this command in the mobile-app folder:
```bash
cd mobile-app
npm install
```

This will install `react-native-razorpay` package.

---

## Step 5: Test Payment Flow

After adding keys:
1. Run the app: `npm start`
2. Navigate to a temple
3. Click "Unlock Temple"
4. Test with Razorpay test card:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

---

## 🔒 Security Notes

- ✅ Key ID (rzp_test_xxx) - Safe to use in mobile app
- ❌ Key Secret - NEVER put in mobile app, only in backend
- ✅ Test keys - Use for development
- ✅ Live keys - Use only after KYC approval

---

## Next Steps After Getting Keys

1. ✅ Update mobile app with Key ID
2. ⏳ Create backend payment handler (we'll do this next)
3. ⏳ Create DynamoDB table for purchases
4. ⏳ Test payment flow
5. ⏳ Wait for KYC approval (3-4 days)
6. ⏳ Switch to live keys

---

**Current Status:** Waiting for OTP to generate test keys
