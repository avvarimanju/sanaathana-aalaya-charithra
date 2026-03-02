# Connect Admin Portal to Local Backend

This guide shows you how to connect the Admin Portal to the local backend API for full integration testing.

## Prerequisites

1. **LocalStack running** (Docker container)
2. **Database initialized** (DynamoDB tables created)
3. **Local backend server running** (Port 4000)
4. **Admin Portal running** (Port 5173)

---

## Step 1: Start LocalStack

```bash
cd Sanaathana-Aalaya-Charithra

# Start LocalStack with Docker
docker-compose up -d

# Verify it's running
docker ps
# Should show: temple-localstack container with status "Up"
```

---

## Step 2: Initialize Database

```bash
# Run the database initialization script
.\scripts\init-local-db.ps1

# Verify tables were created
aws dynamodb list-tables --endpoint-url http://localhost:4566
```

Expected output: List of 10 tables (Temples, TempleGroups, Artifacts, PriceConfigurations, etc.)

---

## Step 3: Start Local Backend Server

```bash
# Start the backend API server
.\scripts\start-local-backend.ps1

# Or manually:
cd src/local-server
npm install
npm run dev
```

You should see:
```
🚀 Local Backend Server Started!
================================
📍 Server URL: http://localhost:4000
🔧 LocalStack: http://localhost:4566
📊 Admin Portal: http://localhost:5173
```

**Test the backend:**
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "local",
  "localstack": "http://localhost:4566",
  "timestamp": "2026-02-27T..."
}
```

---

## Step 4: Configure Admin Portal

The Admin Portal is already configured to use the local backend!

**Environment variables** (already set in `.env.development`):
```env
VITE_API_BASE_URL=http://localhost:4000
```

If you need to change it, edit `admin-portal/.env.development`:
```bash
cd admin-portal
# Edit .env.development if needed
```

---

## Step 5: Start Admin Portal

```bash
cd admin-portal
npm install
npm run dev
```

Dashboard will open at: **http://localhost:5173**

---

## Step 6: Update Pages to Use Real APIs

The API clients are ready! Now you need to update the pages to use them instead of mock data.

### Example: Update TempleListPage

**Before (Mock Data):**
```typescript
// Mock data
const [temples, setTemples] = useState([
  { templeId: '1', name: 'Mock Temple', ... }
]);
```

**After (Real API):**
```typescript
import { templeApi } from '../api';

const [temples, setTemples] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadTemples() {
    try {
      setLoading(true);
      const result = await templeApi.listTemples({ limit: 50 });
      setTemples(result.items);
    } catch (error) {
      console.error('Failed to load temples:', error);
      alert('Failed to load temples');
    } finally {
      setLoading(false);
    }
  }
  loadTemples();
}, []);
```

---

## Available API Clients

All API clients are in `src/api/`:

### 1. Temple API (`templeApi`)
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

### 2. Pricing API (`pricingApi`)
```typescript
import { pricingApi } from '../api';

// Set price
const priceConfig = await pricingApi.setPriceConfiguration({
  entityId: 'temple-id',
  entityType: 'TEMPLE',
  priceAmount: 150,
  overrideReason: 'Special pricing'
});

// Get price
const price = await pricingApi.getPriceConfiguration('temple-id', 'TEMPLE');

// Get price history
const history = await pricingApi.getPriceHistory('temple-id', {
  entityType: 'TEMPLE',
  limit: 10
});

// Batch set prices
const results = await pricingApi.batchSetPrices([
  { entityId: 'temple-1', entityType: 'TEMPLE', priceAmount: 100 },
  { entityId: 'temple-2', entityType: 'TEMPLE', priceAmount: 150 }
]);
```

### 3. Calculator API (`calculatorApi`)
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

## Quick Integration Example

Here's a complete example of updating `PricingManagementPage.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { templeApi, pricingApi } from '../api';
import './PricingManagementPage.css';

export default function PricingManagementPage() {
  const [temples, setTemples] = useState([]);
  const [prices, setPrices] = useState(new Map());
  const [loading, setLoading] = useState(true);

  // Load temples and their prices
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load temples
        const { items } = await templeApi.listTemples({ limit: 100 });
        setTemples(items);
        
        // Load prices for all temples
        const priceMap = await pricingApi.batchGetPrices(
          items.map(t => ({ entityId: t.templeId, entityType: 'TEMPLE' }))
        );
        setPrices(priceMap);
      } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle price update
  const handleSetPrice = async (templeId: string, priceAmount: number) => {
    try {
      await pricingApi.setPriceConfiguration({
        entityId: templeId,
        entityType: 'TEMPLE',
        priceAmount
      });
      
      // Reload price
      const updated = await pricingApi.getPriceConfiguration(templeId, 'TEMPLE');
      setPrices(prev => new Map(prev).set(templeId, updated));
      
      alert('Price updated successfully!');
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="pricing-management-page">
      <h1>Pricing Management</h1>
      
      <div className="temple-grid">
        {temples.map(temple => {
          const price = prices.get(temple.templeId);
          
          return (
            <div key={temple.templeId} className="temple-card">
              <h3>{temple.name}</h3>
              <p>{temple.location.state}</p>
              <p>QR Codes: {temple.qrCodeCount || 0}</p>
              
              <div className="price-section">
                <label>Price (₹):</label>
                <input
                  type="number"
                  defaultValue={price?.priceAmount || 0}
                  onBlur={(e) => handleSetPrice(temple.templeId, Number(e.target.value))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Testing the Integration

### 1. Create a Temple
1. Go to Temple Management page
2. Click "Add Temple"
3. Fill in the form
4. Submit
5. Verify it appears in the list

### 2. Set a Price
1. Go to Pricing Management page
2. Select a temple
3. Enter a price
4. Save
5. Verify it's saved (refresh page)

### 3. Calculate Suggested Price
1. Go to Price Calculator page
2. Set formula parameters
3. Select a temple
4. Click "Calculate"
5. Verify the suggested price

### 4. View Price History
1. Go to Pricing Management page
2. Click "Price History" tab
3. Select a temple
4. View historical prices

---

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:4000/health

# Check backend logs
# Look at the terminal where you started the backend
```

### LocalStack not running
```bash
# Check Docker container
docker ps

# Restart LocalStack
docker-compose restart

# View LocalStack logs
docker logs temple-localstack
```

### CORS errors
The backend has CORS enabled for all origins. If you still see CORS errors:
1. Check that backend is running on port 4000
2. Check that dashboard is using correct API URL
3. Clear browser cache

### Data not persisting
LocalStack stores data in memory. When you restart LocalStack, all data is lost.
To persist data, you need to:
1. Use LocalStack Pro (paid)
2. Or re-initialize data after each restart

---

## Next Steps

1. **Update all pages** to use real APIs instead of mock data
2. **Add error handling** for better user experience
3. **Add loading states** while data is being fetched
4. **Add form validation** before submitting to API
5. **Test all workflows** end-to-end

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Browser (localhost:5173)         │
│                                          │
│  Admin Portal (React)                 │
│    ↓                                     │
│  API Clients (src/api/)                  │
│    - templeApi                           │
│    - pricingApi                          │
│    - calculatorApi                       │
└─────────────────────────────────────────┘
                    ↓ HTTP
┌─────────────────────────────────────────┐
│    Backend Server (localhost:4000)       │
│                                          │
│  Express.js REST API                     │
│    ↓                                     │
│  Lambda Service Functions                │
│    - Temple Management                   │
│    - Pricing Service                     │
│    - Price Calculator                    │
└─────────────────────────────────────────┘
                    ↓ AWS SDK
┌─────────────────────────────────────────┐
│     LocalStack (localhost:4566)          │
│                                          │
│  - DynamoDB (10 tables)                  │
│  - S3 (QR code images)                   │
│  - CloudWatch Logs                       │
└─────────────────────────────────────────┘
```

---

## Summary

You now have:
- ✅ API client modules ready (`src/api/`)
- ✅ Type-safe interfaces for all API calls
- ✅ Error handling built-in
- ✅ Batch operations support
- ✅ Local backend server running
- ✅ LocalStack with DynamoDB

**To complete integration:**
1. Update each page component to use the API clients
2. Replace mock data with real API calls
3. Add loading and error states
4. Test all workflows

**Start with:** `TempleListPage.tsx` - it's the simplest to integrate!

---

**Last Updated**: 2026-02-27
**Status**: API clients ready, pages need integration
