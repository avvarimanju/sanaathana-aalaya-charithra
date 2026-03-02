# Admin Portal - API Integration Summary

## What Was Created

I've created a complete API integration layer to connect your Admin Portal to the local backend server.

### New Files Created

1. **`src/api/client.ts`** - Base API client with HTTP methods
2. **`src/api/templeApi.ts`** - Temple and artifact management APIs
3. **`src/api/pricingApi.ts`** - Pricing configuration and history APIs
4. **`src/api/calculatorApi.ts`** - Price calculator and formula APIs
5. **`src/api/index.ts`** - Central export point for all APIs
6. **`src/pages/ApiTestPage.tsx`** - Test page to verify API connectivity
7. **`src/pages/TempleListPage.example-with-api.tsx`** - Example integration

### Documentation Created

1. **`CONNECT_TO_LOCAL_BACKEND.md`** - Complete integration guide
2. **`TEST_LOCAL_INTEGRATION.md`** - Quick testing guide
3. **`API_INTEGRATION_SUMMARY.md`** - This file

---

## How to Use

### Step 1: Start the Backend

```bash
# Terminal 1: Start LocalStack
cd Sanaathana-Aalaya-Charithra
docker-compose up -d

# Terminal 2: Initialize database (first time only)
.\scripts\init-local-db.ps1

# Terminal 3: Start backend server
.\scripts\start-local-backend.ps1
```

### Step 2: Start the Dashboard

```bash
# Terminal 4: Start Admin Portal
cd admin-portal
npm run dev
```

### Step 3: Test the Connection

**Option A: Use the Test Page**

1. Add route to `App.tsx`:
```typescript
import ApiTestPage from './pages/ApiTestPage';

// In routes:
<Route path="/api-test" element={<ApiTestPage />} />
```

2. Navigate to: http://localhost:5173/api-test
3. Click test buttons to verify APIs work

**Option B: Use Browser Console**

Open http://localhost:5173 and run in console:
```javascript
// Test health check
const health = await fetch('http://localhost:4000/health').then(r => r.json());
console.log(health);
```

### Step 4: Update Your Pages

Replace mock data with real API calls. Example:

**Before:**
```typescript
const [temples, setTemples] = useState([
  { templeId: '1', name: 'Mock Temple', ... }
]);
```

**After:**
```typescript
import { templeApi } from '../api';

const [temples, setTemples] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadTemples() {
    try {
      const result = await templeApi.listTemples({ limit: 50 });
      setTemples(result.items);
    } catch (error) {
      console.error('Failed to load temples:', error);
    } finally {
      setLoading(false);
    }
  }
  loadTemples();
}, []);
```

---

## API Reference

### Temple API

```typescript
import { templeApi } from '../api';

// Create temple
const temple = await templeApi.createTemple({
  name: 'Temple Name',
  description: 'Description',
  location: { state: 'State', city: 'City', address: 'Address' },
  accessMode: 'HYBRID'
});

// List temples
const { items, total } = await templeApi.listTemples({ limit: 20 });

// Get temple
const temple = await templeApi.getTemple(templeId);

// Update temple
const updated = await templeApi.updateTemple(templeId, { name: 'New Name' });

// Delete temple
await templeApi.deleteTemple(templeId);

// Create artifact
const artifact = await templeApi.createArtifact({
  templeId: 'temple-id',
  name: 'Artifact Name',
  description: 'Description'
});

// List artifacts
const { items } = await templeApi.listArtifacts(templeId);
```

### Pricing API

```typescript
import { pricingApi } from '../api';

// Set price
const priceConfig = await pricingApi.setPriceConfiguration({
  entityId: 'temple-id',
  entityType: 'TEMPLE',
  priceAmount: 150,
  overrideReason: 'Optional reason'
});

// Get price
const price = await pricingApi.getPriceConfiguration('temple-id', 'TEMPLE');

// Get price history
const history = await pricingApi.getPriceHistory('temple-id', {
  entityType: 'TEMPLE',
  limit: 10
});

// Batch operations
const results = await pricingApi.batchSetPrices([
  { entityId: 'temple-1', entityType: 'TEMPLE', priceAmount: 100 },
  { entityId: 'temple-2', entityType: 'TEMPLE', priceAmount: 150 }
]);
```

### Calculator API

```typescript
import { calculatorApi } from '../api';

// Set formula
const formula = await calculatorApi.setPricingFormula({
  category: 'DEFAULT',
  basePrice: 50,
  perQRCodePrice: 15,
  roundingRule: { type: 'nearest10', direction: 'nearest' },
  discountFactor: 0.1
});

// Calculate suggested price
const result = await calculatorApi.calculateSuggestedPrice({
  entityId: 'temple-id',
  entityType: 'TEMPLE',
  qrCodeCount: 10
});

// Simulate formula change
const simulation = await calculatorApi.simulateFormulaChange({
  basePrice: 60,
  perQRCodePrice: 20,
  roundingRule: { type: 'nearest10', direction: 'up' },
  discountFactor: 0.15,
  entities: [
    { entityId: 'temple-1', entityType: 'TEMPLE', qrCodeCount: 5 },
    { entityId: 'temple-2', entityType: 'TEMPLE', qrCodeCount: 15 }
  ]
});
```

---

## Features

### ✅ Type Safety
- Full TypeScript support
- Type-safe interfaces for all API calls
- Auto-completion in IDE

### ✅ Error Handling
- Automatic error parsing
- Consistent error format
- Easy to catch and display errors

### ✅ Batch Operations
- Batch set prices for multiple entities
- Batch get prices
- Batch calculate suggested prices

### ✅ User Context
- Automatic user ID tracking
- Set once, used in all requests
```typescript
import { apiClient } from '../api';
apiClient.setUserId('admin-123');
```

### ✅ Environment Configuration
- Configurable API base URL
- Uses `VITE_API_BASE_URL` environment variable
- Defaults to `http://localhost:4000`

---

## Pages to Update

Here are the pages that need API integration:

### 1. TempleListPage.tsx
- Replace mock temples with `templeApi.listTemples()`
- Add loading state
- Add error handling
- See: `TempleListPage.example-with-api.tsx`

### 2. PricingManagementPage.tsx
- Load temples with `templeApi.listTemples()`
- Load prices with `pricingApi.batchGetPrices()`
- Update prices with `pricingApi.setPriceConfiguration()`
- Load history with `pricingApi.getPriceHistory()`

### 3. PriceCalculatorPage.tsx
- Set formula with `calculatorApi.setPricingFormula()`
- Calculate prices with `calculatorApi.calculateSuggestedPrice()`
- Simulate with `calculatorApi.simulateFormulaChange()`

### 4. ArtifactListPage.tsx
- Load artifacts with `templeApi.listArtifacts()`
- Create artifacts with `templeApi.createArtifact()`

### 5. DashboardPage.tsx
- Load statistics from APIs
- Show real counts and metrics

---

## Testing Checklist

- [ ] Backend server is running (port 4000)
- [ ] LocalStack is running (port 4566)
- [ ] Database tables are initialized
- [ ] Dashboard can reach backend (no CORS errors)
- [ ] Can create a temple
- [ ] Can list temples
- [ ] Can update a temple
- [ ] Can delete a temple
- [ ] Can create an artifact
- [ ] Can set a price
- [ ] Can view price history
- [ ] Can calculate suggested price
- [ ] Can simulate formula changes

---

## Troubleshooting

### Backend not responding
```bash
# Check if running
curl http://localhost:4000/health

# Restart
.\scripts\start-local-backend.ps1
```

### CORS errors
- Verify backend is on port 4000
- Verify dashboard is on port 5173
- Backend has CORS enabled for all origins

### Data not persisting
- LocalStack stores data in memory
- Data is lost when LocalStack restarts
- Re-run `.\scripts\init-local-db.ps1` after restart

### TypeScript errors
```bash
cd admin-portal
npm install
```

---

## Next Steps

1. **Test the APIs** using ApiTestPage
2. **Update TempleListPage** first (simplest)
3. **Update PricingManagementPage** next
4. **Update PriceCalculatorPage** last
5. **Add loading states** to all pages
6. **Add error handling** with user-friendly messages
7. **Test all workflows** end-to-end

---

## Architecture

```
┌─────────────────────────────────────────┐
│    Admin Portal (localhost:5173)      │
│                                          │
│  Pages (React Components)                │
│    ↓                                     │
│  API Clients (src/api/)                  │
│    - templeApi                           │
│    - pricingApi                          │
│    - calculatorApi                       │
│    ↓                                     │
│  HTTP Client (fetch)                     │
└─────────────────────────────────────────┘
                    ↓ HTTP
┌─────────────────────────────────────────┐
│   Backend Server (localhost:4000)        │
│                                          │
│  Express.js REST API                     │
│    ↓                                     │
│  Lambda Service Functions                │
└─────────────────────────────────────────┘
                    ↓ AWS SDK
┌─────────────────────────────────────────┐
│    LocalStack (localhost:4566)           │
│                                          │
│  DynamoDB Tables (10 tables)             │
└─────────────────────────────────────────┘
```

---

## Summary

You now have:
- ✅ Complete API client layer
- ✅ Type-safe interfaces
- ✅ Error handling
- ✅ Batch operations
- ✅ Test page for verification
- ✅ Example integration
- ✅ Comprehensive documentation

**Ready to integrate!** Start with the test page to verify everything works, then update your pages one by one.

---

**Created**: 2026-02-27
**Status**: API clients ready, pages need integration
**Next**: Test APIs and update pages
