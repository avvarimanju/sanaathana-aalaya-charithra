# Razorpay Complete Setup Guide
## Step-by-Step Implementation

---

## 📦 What You'll Create

1. Razorpay account and API keys
2. Mobile app payment integration
3. Backend payment verification
4. Database for tracking purchases
5. Complete payment flow

---

## 🚀 Step 1: Install Dependencies

### Mobile App

```bash
cd mobile-app

# Install Razorpay React Native SDK
npm install react-native-razorpay

# For Expo (if using Expo)
expo install react-native-razorpay

# Link native modules (React Native CLI only)
npx react-native link react-native-razorpay
```

### Backend

```bash
cd Sanaathana-Aalaya-Charithra

# Install Razorpay Node SDK
npm install razorpay

# Install crypto for signature verification
npm install crypto
```

---

## 🔑 Step 2: Get Razorpay API Keys

### 2.1 Create Razorpay Account

1. Go to https://razorpay.com
2. Click "Sign Up" → "Get Started for Free"
3. Enter business details
4. Verify email and phone number

### 2.2 Complete KYC

Required documents:
- PAN card
- Bank account details (account number, IFSC)
- Business details (optional for testing)

### 2.3: Get API Keys

1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Click "Generate Test Key" (for development)
4. Save both Key ID and Key Secret

```
Test Mode:
Key ID: rzp_test_xxxxxxxxxxxxx
Key Secret: xxxxxxxxxxxxxxxxxxxxx

Live Mode (after KYC approval):
Key ID: rzp_live_xxxxxxxxxxxxx
Key Secret: xxxxxxxxxxxxxxxxxxxxx
```

---

## 📱 Step 3: Update Mobile App

### 3.1 Update package.json

File: `mobile-app/package.json`

Add dependency:
```json
{
  "dependencies": {
    "react-native-razorpay": "^2.3.0"
  }
}
```

### 3.2 Update Razorpay Service

File: `mobile-app/src/services/razorpay.service.ts`

Replace API keys:
```typescript
this.razorpayKeyId = __DEV__ 
  ? 'rzp_test_YOUR_TEST_KEY' // Your test key
  : 'rzp_live_YOUR_LIVE_KEY'; // Your live key
```

### 3.3 Add Payment Screen to Navigation

File: `mobile-app/App.tsx`

```typescript
import { PaymentScreen } from './src/screens/PaymentScreen';

// Add to navigation
<Stack.Screen name="Payment" component={PaymentScreen} />
```

---

## 🔧 Step 4: Create Backend Payment Handler

See files created:
- `src/lambdas/payment-handler.ts`
- `src/repositories/purchases-repository.ts`

---

## 💾 Step 5: Create DynamoDB Table

Table name: `SanaathanaAalayaCharithra-Purchases`

Attributes:
- `userId` (String) - Partition Key
- `purchaseId` (String) - Sort Key
- `templeId` (String)
- `amount` (Number)
- `paymentId` (String)
- `orderId` (String)
- `status` (String)
- `purchaseDate` (String)
- `expiryDate` (String)

---

## 🧪 Step 6: Testing

### Test Mode Flow:

1. Use test API keys
2. Use test card numbers:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

3. Test payment flow:
   - Open app
   - Select temple
   - Click "Unlock"
   - Pay with test card
   - Verify content unlocks

---

## 🚀 Step 7: Go Live

### 7.1 Complete Razorpay KYC

Submit:
- PAN card
- Bank account proof
- Business registration (if applicable)

Wait for approval (1-3 days)

### 7.2 Switch to Live Keys

Update mobile app:
```typescript
this.razorpayKeyId = 'rzp_live_YOUR_LIVE_KEY';
```

Update backend:
```typescript
const razorpay = new Razorpay({
  key_id: 'rzp_live_YOUR_LIVE_KEY',
  key_secret: 'YOUR_LIVE_SECRET',
});
```

### 7.3 Deploy

```bash
# Deploy backend
npm run deploy

# Build mobile app
cd mobile-app
npm run build:android
```

---

## ✅ Verification Checklist

- [ ] Razorpay account created
- [ ] KYC completed
- [ ] API keys obtained
- [ ] Dependencies installed
- [ ] Payment service implemented
- [ ] Payment screen created
- [ ] Backend handler created
- [ ] DynamoDB table created
- [ ] Test payment successful
- [ ] Live keys configured
- [ ] App deployed

---

**Next:** Follow detailed implementation in separate files.
