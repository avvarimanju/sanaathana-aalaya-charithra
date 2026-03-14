# Expo Tunnel - Share Mobile App for Testing

## What is Expo Tunnel?

Expo Tunnel creates a public URL for your app so anyone can test it, even if they're not on your WiFi.

---

## Quick Start

### Step 1: Start with Tunnel

```bash
cd mobile-app
npx expo start --tunnel
```

### Step 2: Wait for Tunnel to Start

You'll see:
```
› Metro waiting on exp://192.168.1.100:8081
› Tunnel ready.
› Tunnel URL: https://abc123.ngrok.io
```

### Step 3: Share the QR Code

- Take a screenshot of the QR code
- Send to anyone you want to test
- They scan with Expo Go app

---

## Who Can Test?

### ✅ Anyone Can Test If:
- They have Expo Go installed
- They scan your QR code
- They have internet connection (WiFi or mobile data)

### ❌ Limitations:
- Backend must be accessible (see below)
- Slower than local development
- Requires Expo account (free)

---

## Backend Accessibility Issue

### Problem:
Your backend is on `localhost:4000` which is NOT accessible from the internet.

### Solution Options:

#### Option A: Use ngrok for Backend (Quick)

**Terminal 1: Start Backend**
```bash
.\scripts\start-local-backend.ps1
```

**Terminal 2: Expose Backend**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 4000
```

**Result:**
```
Forwarding: https://xyz789.ngrok.io -> http://localhost:4000
```

**Update Mobile App:**
```typescript
// mobile-app/src/config.ts
export const API_BASE_URL = 'https://xyz789.ngrok.io';
```

#### Option B: Deploy Backend to Cloud (Better)

Deploy your backend to:
- AWS (Staging environment)
- Railway: https://railway.app
- Render: https://render.com
- Heroku: https://heroku.com

Then update API URL in mobile app.

---

## Step-by-Step: Full Setup

### 1. Expose Backend with ngrok

```bash
# Terminal 1: Start backend
cd Sanaathana-Aalaya-Charithra
.\scripts\start-local-backend.ps1

# Terminal 2: Expose with ngrok
ngrok http 4000
```

Copy the ngrok URL: `https://xyz789.ngrok.io`

### 2. Update Mobile App API URL

**File: `mobile-app/src/config.ts`** (create if doesn't exist)

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'https://xyz789.ngrok.io'  // Your ngrok URL
  : 'https://api.charithra.org';  // Production URL
```

**Update API calls to use this:**

```typescript
import { API_BASE_URL } from './config';

// Instead of:
fetch('http://localhost:4000/api/temples')

// Use:
fetch(`${API_BASE_URL}/api/temples`)
```

### 3. Start Expo with Tunnel

```bash
cd mobile-app
npx expo start --tunnel
```

### 4. Share QR Code

- Screenshot the QR code
- Send via WhatsApp, Email, etc.
- Recipients scan with Expo Go

---

## Testing Checklist

### Before Sharing:

- [ ] Backend is running
- [ ] ngrok is exposing backend (if using)
- [ ] Mobile app API URL is updated
- [ ] Expo tunnel is running
- [ ] You tested it on your phone first

### Share With Testers:

1. **Send them:**
   - QR code screenshot
   - Instructions to install Expo Go
   - What to test

2. **They need:**
   - Expo Go app installed
   - Internet connection
   - Camera to scan QR code

---

## Troubleshooting

### "Cannot connect to backend"

**Check:**
- Is backend running?
- Is ngrok running?
- Is API URL correct in mobile app?
- Is ngrok URL still valid? (changes on restart)

### "QR code doesn't work"

**Try:**
- Make sure they have Expo Go installed
- Try typing the URL manually in Expo Go
- Check if tunnel is still running

### "App is very slow"

**This is normal with tunnel:**
- Tunnel adds latency
- Use for testing only
- For development, use local network

---

## Costs

### Free:
- ✅ Expo Tunnel (free tier)
- ✅ ngrok (free tier, with limitations)

### Paid (Optional):
- Expo Tunnel Pro: $29/month (faster, custom domains)
- ngrok Pro: $8/month (custom domains, more connections)

---

## Alternatives

### Option 1: Local Network Only

**Pros:** Fast, free  
**Cons:** Only works on same WiFi

```bash
# Find your laptop IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Use that IP in mobile app
# Example: http://192.168.1.100:4000
```

### Option 2: Deploy to Cloud

**Pros:** Fast, reliable, works everywhere  
**Cons:** Requires deployment

Deploy backend to AWS, Railway, or Render.

---

## Summary

### For Quick Testing (Anyone, Anywhere):
1. Start backend: `.\scripts\start-local-backend.ps1`
2. Expose backend: `ngrok http 4000`
3. Update mobile app API URL
4. Start tunnel: `npx expo start --tunnel`
5. Share QR code

### For Local Testing (Same WiFi Only):
1. Start backend
2. Use laptop's local IP in mobile app
3. Start Expo: `npx expo start`
4. Share QR code with people on same WiFi

### For Production Testing:
1. Deploy backend to AWS/cloud
2. Update mobile app API URL
3. Build and publish app
4. Share via App Store/Play Store

---

**Created:** 2026-02-27  
**Use Case:** Share mobile app for testing with anyone
