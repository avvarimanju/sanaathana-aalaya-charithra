# Mobile App Testing Options - Who Can Test?

## Quick Answer

**Current Setup (Local Backend):**
- ❌ Others CANNOT test by just scanning QR code
- ✅ Only YOU can test (on same WiFi)
- 🔧 Need additional setup for others to test

---

## Comparison Table

| Method | Who Can Test? | Setup Difficulty | Cost | Speed |
|--------|---------------|------------------|------|-------|
| **Local Only** | Only you | Easy | Free | Fast |
| **Same WiFi** | People on your WiFi | Easy | Free | Fast |
| **Expo Tunnel** | Anyone, anywhere | Medium | Free | Slow |
| **ngrok + Tunnel** | Anyone, anywhere | Medium | Free | Medium |
| **Cloud Backend** | Anyone, anywhere | Hard | $55/month | Fast |

---

## Option 1: Local Only (Current)

### Who Can Test?
- ✅ Only you
- ✅ Your phone must be on same WiFi as laptop

### Setup:
```bash
# Start backend
.\scripts\start-local-backend.ps1

# Start mobile app
cd mobile-app
npm start
```

### Pros:
- Fast development
- No setup needed
- Free

### Cons:
- Only you can test
- Must be on same WiFi

---

## Option 2: Same WiFi Network

### Who Can Test?
- ✅ You
- ✅ Family members at home
- ✅ Colleagues in office
- ❌ People outside your network

### Setup:

**Step 1: Find Your Laptop IP**
```bash
# Windows
ipconfig
# Look for: IPv4 Address: 192.168.1.100

# Mac/Linux
ifconfig
# Look for: inet 192.168.1.100
```

**Step 2: Update Mobile App**

Create `mobile-app/src/config.ts`:
```typescript
export const API_BASE_URL = 'http://192.168.1.100:4000';  // Your laptop IP
```

**Step 3: Start Everything**
```bash
# Terminal 1: Backend
.\scripts\start-local-backend.ps1

# Terminal 2: Mobile app
cd mobile-app
npm start
```

**Step 4: Share QR Code**
- Screenshot the QR code
- Send to people on same WiFi
- They scan with Expo Go

### Pros:
- Fast
- Free
- Multiple testers on same network

### Cons:
- Only works on same WiFi
- Need to update IP if it changes

---

## Option 3: Expo Tunnel

### Who Can Test?
- ✅ Anyone, anywhere
- ✅ Works on WiFi or mobile data
- ✅ No network restrictions

### Setup:

**Step 1: Start with Tunnel**
```bash
cd mobile-app
npx expo start --tunnel
```

**Step 2: Wait for Tunnel**
```
› Tunnel ready.
› Tunnel URL: https://abc123.ngrok.io
```

**Step 3: Share QR Code**
- Anyone can scan and test

### Pros:
- Works anywhere
- Easy to share
- Free

### Cons:
- Slow (adds latency)
- Backend still needs to be accessible
- Requires Expo account

### ⚠️ Backend Issue:
Your backend is on `localhost` which tunnel can't access. See Option 4.

---

## Option 4: Expo Tunnel + ngrok (Best for Testing)

### Who Can Test?
- ✅ Anyone, anywhere
- ✅ Full functionality
- ✅ Backend accessible

### Setup:

**Step 1: Expose Backend**
```bash
# Terminal 1: Start backend
.\scripts\start-local-backend.ps1

# Terminal 2: Expose with ngrok
# Download from: https://ngrok.com/download
ngrok http 4000
```

**Result:**
```
Forwarding: https://xyz789.ngrok.io -> http://localhost:4000
```

**Step 2: Update Mobile App**

Create `mobile-app/src/config.ts`:
```typescript
export const API_BASE_URL = 'https://xyz789.ngrok.io';  // Your ngrok URL
```

Update all API calls to use this URL.

**Step 3: Start Expo Tunnel**
```bash
cd mobile-app
npx expo start --tunnel
```

**Step 4: Share QR Code**
- Anyone can scan and test
- Full functionality works

### Pros:
- Works anywhere
- Full functionality
- Free (with limits)

### Cons:
- Slower than local
- ngrok URL changes on restart
- Need to update mobile app when URL changes

---

## Option 5: Cloud Backend (Production-Ready)

### Who Can Test?
- ✅ Anyone, anywhere
- ✅ Fast and reliable
- ✅ Permanent URL

### Setup:

**Step 1: Deploy Backend to Cloud**

Choose a platform:
- AWS (Staging): $55/month
- Railway: Free tier available
- Render: Free tier available
- Heroku: $7/month

**Step 2: Update Mobile App**
```typescript
export const API_BASE_URL = 'https://api-staging.yourapp.com';
```

**Step 3: Start Expo**
```bash
cd mobile-app
npm start  # No tunnel needed!
```

### Pros:
- Fast
- Reliable
- Permanent URL
- Production-ready

### Cons:
- Costs money
- Requires deployment
- More complex setup

---

## Recommendations

### For Solo Development (Now):
**Use Option 1: Local Only**
- Fast and simple
- No setup needed

### For Testing with Family/Friends (Same Location):
**Use Option 2: Same WiFi**
- Easy setup
- Fast
- Free

### For Testing with Remote Testers:
**Use Option 4: Expo Tunnel + ngrok**
- Anyone can test
- Full functionality
- Free

### For Production/Staging:
**Use Option 5: Cloud Backend**
- Professional
- Fast
- Reliable

---

## Step-by-Step: Share with Anyone

### Quick Setup (15 minutes):

**1. Install ngrok**
```bash
# Download from: https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

**2. Start Backend**
```bash
.\scripts\start-local-backend.ps1
```

**3. Expose Backend**
```bash
ngrok http 4000
# Copy the https URL: https://xyz789.ngrok.io
```

**4. Update Mobile App**

Create `mobile-app/src/config.ts`:
```typescript
export const API_BASE_URL = 'https://xyz789.ngrok.io';
```

Update API calls:
```typescript
import { API_BASE_URL } from './config';

fetch(`${API_BASE_URL}/api/temples`)
```

**5. Start Expo Tunnel**
```bash
cd mobile-app
npx expo start --tunnel
```

**6. Share QR Code**
- Screenshot and send via WhatsApp/Email
- Recipients install Expo Go and scan

---

## Testing Checklist

### Before Sharing:

- [ ] Backend is running
- [ ] ngrok is running (if using)
- [ ] Mobile app API URL is updated
- [ ] Expo is running (with or without tunnel)
- [ ] You tested it yourself first

### What to Send Testers:

1. **QR Code** (screenshot)
2. **Instructions:**
   ```
   1. Install "Expo Go" app from App Store/Play Store
   2. Open Expo Go
   3. Scan this QR code
   4. App will load and you can test!
   ```
3. **What to test** (specific features)

---

## Costs Summary

| Option | Free Tier | Paid |
|--------|-----------|------|
| Local Only | ✅ Free | N/A |
| Same WiFi | ✅ Free | N/A |
| Expo Tunnel | ✅ Free | $29/month (Pro) |
| ngrok | ✅ Free (limited) | $8/month |
| Cloud Backend | ⚠️ Some free tiers | $7-55/month |

---

## Summary

### Current Setup:
- ❌ Others cannot test by just scanning QR code
- ✅ Only works for you on same WiFi

### To Share with Anyone:
1. Use ngrok to expose backend
2. Update mobile app API URL
3. Use Expo tunnel
4. Share QR code

### For Production:
1. Deploy backend to cloud
2. Build and publish app
3. Share via App Store/Play Store

---

**Created:** 2026-02-27  
**Recommended:** Option 4 (Expo Tunnel + ngrok) for testing with others
