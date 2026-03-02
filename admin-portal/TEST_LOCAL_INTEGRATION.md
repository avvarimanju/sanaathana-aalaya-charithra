# Test Local Integration - Quick Guide

This is a quick guide to test the Admin Portal with the local backend.

## Quick Start (5 Minutes)

### 1. Start Everything

Open 3 terminals:

**Terminal 1 - LocalStack:**
```bash
cd Sanaathana-Aalaya-Charithra
docker-compose up
```

**Terminal 2 - Backend Server:**
```bash
cd Sanaathana-Aalaya-Charithra
.\scripts\start-local-backend.ps1
```

**Terminal 3 - Admin Portal:**
```bash
cd Sanaathana-Aalaya-Charithra/admin-portal
npm run dev
```

### 2. Initialize Database (First Time Only)

In a new terminal:
```bash
cd Sanaathana-Aalaya-Charithra
.\scripts\init-local-db.ps1
```

### 3. Test the APIs

Open browser console at http://localhost:5173 and run:

```javascript
// Test temple API
const response = await fetch('http://localhost:4000/api/temples');
const data = await response.json();
console.log('Temples:', data);

// Create a test temple
const createResponse = await fetch('http://localhost:4000/api/temples', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Temple',
    description: 'A test temple',
    location: {
      state: 'Karnataka',
      city: 'Bangalore',
      address: '123 Test Street'
    },
    accessMode: 'HYBRID'
  })
});
const temple = await createResponse.json();
console.log('Created temple:', temple);
```

---

## Integration Checklist

### ✅ Backend Ready
- [ ] LocalStack running (port 4566)
- [ ] Database tables created
- [ ] Backend server running (port 4000)
- [ ] Health check passes: `curl http://localhost:4000/health`

### ✅ Frontend Ready
- [ ] Admin Portal running (port 5173)
- [ ] Can access dashboard in browser
- [ ] No console errors

### ✅ API Integration
- [ ] Can fetch temples from API
- [ ] Can create a temple
- [ ] Can update a temple
- [ ] Can delete a temple
- [ ] Can set prices
- [ ] Can calculate suggested prices

---

## Test Scenarios

### Scenario 1: Create and Manage Temple

1. **Create Temple:**
   - Go to Temple Management
   - Click "Add Temple"
   - Fill in form
   - Submit
   - Verify it appears in list

2. **Add Artifacts:**
   - Click on temple
   - Add artifact
   - Verify QR code is generated

3. **Set Price:**
   - Go to Pricing Management
   - Select temple
   - Set price (e.g., ₹150)
   - Save
   - Verify price is saved

### Scenario 2: Price Calculator

1. **Set Formula:**
   - Go to Price Calculator
   - Set base price: ₹50
   - Set per-QR price: ₹15
   - Set discount: 10%
   - Save formula

2. **Calculate Price:**
   - Select a temple
   - Enter QR count
   - Click "Calculate"
   - Verify suggested price

3. **Simulate Changes:**
   - Change formula parameters
   - Select multiple temples
   - Run simulation
   - View impact analysis

### Scenario 3: Price History

1. **Change Price Multiple Times:**
   - Set price to ₹100
   - Wait a moment
   - Set price to ₹150
   - Wait a moment
   - Set price to ₹200

2. **View History:**
   - Go to Pricing Management
   - Click "Price History" tab
   - Select temple
   - Verify all price changes are shown

---

## Common Issues

### Issue: Backend not responding

**Check:**
```bash
curl http://localhost:4000/health
```

**Fix:**
```bash
# Restart backend
cd Sanaathana-Aalaya-Charithra
.\scripts\start-local-backend.ps1
```

### Issue: No data showing

**Check:**
```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:4566

# Scan temples table
aws dynamodb scan --table-name Temples --endpoint-url http://localhost:4566
```

**Fix:**
```bash
# Re-initialize database
.\scripts\init-local-db.ps1
```

### Issue: CORS errors

**Check:**
- Backend is running on port 4000
- Dashboard is running on port 5173
- No other services using these ports

**Fix:**
- Restart both backend and dashboard

### Issue: LocalStack not starting

**Check:**
```bash
docker ps
docker logs temple-localstack
```

**Fix:**
```bash
# Stop and remove
docker-compose down

# Start fresh
docker-compose up -d
```

---

## API Testing with curl

### Create Temple
```bash
curl -X POST http://localhost:4000/api/temples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Golden Temple",
    "description": "Historic Sikh temple",
    "location": {
      "state": "Punjab",
      "city": "Amritsar",
      "address": "Golden Temple Road"
    },
    "accessMode": "FREE"
  }'
```

### List Temples
```bash
curl http://localhost:4000/api/temples
```

### Set Price
```bash
curl -X POST http://localhost:4000/api/pricing/configure \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "TEMPLE_ID_HERE",
    "entityType": "TEMPLE",
    "priceAmount": 150
  }'
```

### Calculate Suggested Price
```bash
curl -X POST http://localhost:4000/api/calculator/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "TEMPLE_ID_HERE",
    "entityType": "TEMPLE",
    "qrCodeCount": 10
  }'
```

---

## Next Steps

Once basic integration is working:

1. **Update all pages** to use real APIs
2. **Add loading states** for better UX
3. **Add error handling** with user-friendly messages
4. **Add form validation** before API calls
5. **Add success notifications** after operations
6. **Test all workflows** end-to-end

---

## Architecture Overview

```
Browser (localhost:5173)
    ↓ HTTP requests
Backend API (localhost:4000)
    ↓ AWS SDK calls
LocalStack (localhost:4566)
    └── DynamoDB tables
```

---

## Useful Commands

```bash
# Check what's running
netstat -ano | findstr "4000 4566 5173"

# Stop everything
docker-compose down
# Ctrl+C in backend terminal
# Ctrl+C in dashboard terminal

# Start everything
docker-compose up -d
.\scripts\start-local-backend.ps1
cd admin-portal && npm run dev

# View logs
docker logs temple-localstack
# Backend logs in terminal
# Dashboard logs in terminal
```

---

**Status**: API clients ready, integration in progress
**Last Updated**: 2026-02-27
