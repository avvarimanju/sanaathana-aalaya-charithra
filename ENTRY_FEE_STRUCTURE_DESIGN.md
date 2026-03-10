# Temple Entry Fee Structure Design

## REAL-WORLD SCENARIO
Temples typically have multiple entry options:
- **Free Entry**: General darshan (queue)
- **Paid Entry**: Special darshan (₹300)
- **Seva Fees**: Various sevas (₹500, ₹1000, ₹5000)
- **VIP Darshan**: Premium access (₹10,000+)
- **Foreign Visitors**: Different pricing (₹500)

## PROPOSED DATA STRUCTURE

### Option 1: Flexible Entry Fee Array (RECOMMENDED)
```typescript
{
  "templeId": "temple-verified-001",
  "name": "Tirumala Venkateswara Temple",
  
  // Simple summary for quick display
  "entryFeeSummary": "Free & Paid options available",
  
  // Detailed entry fee options
  "entryFeeOptions": [
    {
      "type": "FREE",
      "name": "General Darshan",
      "description": "Free entry with queue waiting time",
      "price": 0,
      "currency": "INR",
      "waitingTime": "4-8 hours",
      "availability": "24/7"
    },
    {
      "type": "PAID",
      "name": "Special Darshan",
      "description": "Faster darshan with shorter queue",
      "price": 300,
      "currency": "INR",
      "waitingTime": "1-2 hours",
      "availability": "6 AM - 10 PM"
    },
    {
      "type": "SEVA",
      "name": "Archana Seva",
      "description": "Special pooja with prasadam",
      "price": 500,
      "currency": "INR",
      "duration": "30 minutes",
      "bookingRequired": true
    },
    {
      "type": "SEVA",
      "name": "Sahasranamarchana",
      "description": "1000 names chanting",
      "price": 1000,
      "currency": "INR",
      "duration": "1 hour",
      "bookingRequired": true
    },
    {
      "type": "VIP",
      "name": "VIP Break Darshan",
      "description": "Immediate darshan during break time",
      "price": 10000,
      "currency": "INR",
      "waitingTime": "15 minutes",
      "bookingRequired": true,
      "availability": "Limited slots"
    }
  ],
  
  // For foreign visitors
  "foreignVisitorFee": {
    "applicable": true,
    "price": 500,
    "currency": "INR",
    "description": "Special entry for foreign nationals"
  }
}
```

### Option 2: Categorized Structure
```typescript
{
  "entryFees": {
    "free": {
      "available": true,
      "options": [
        {
          "name": "General Darshan",
          "waitingTime": "4-8 hours"
        }
      ]
    },
    "paid": {
      "available": true,
      "options": [
        {
          "name": "Special Darshan",
          "price": 300,
          "waitingTime": "1-2 hours"
        }
      ]
    },
    "sevas": [
      {
        "name": "Archana Seva",
        "price": 500,
        "description": "Special pooja"
      }
    ],
    "vip": [
      {
        "name": "VIP Break Darshan",
        "price": 10000,
        "description": "Immediate darshan"
      }
    ]
  }
}
```

## UI DISPLAY EXAMPLES

### Mobile App - Temple Card
```
┌─────────────────────────────────┐
│ Tirumala Venkateswara Temple    │
│ Tirupati, Andhra Pradesh        │
│                                 │
│ 🎫 Entry: Free & Paid options   │
│    • Free: General Darshan      │
│    • ₹300: Special Darshan      │
│    • ₹500+: Seva options        │
│                                 │
│ [View All Options →]            │
└─────────────────────────────────┘
```

### Admin Portal - Entry Fee Management
```
Entry Fee Options
─────────────────────────────────────────
✓ Free Entry Available
  General Darshan (4-8 hours wait)

✓ Paid Entry Available
  ₹300 - Special Darshan (1-2 hours)
  ₹500 - Archana Seva (30 min)
  ₹1,000 - Sahasranamarchana (1 hour)
  ₹10,000 - VIP Break Darshan (15 min)

[+ Add Entry Option]  [Edit]  [Delete]
```

### Mobile App - Detailed View
```
┌─────────────────────────────────┐
│ Entry Fee Options               │
├─────────────────────────────────┤
│ 🆓 FREE ENTRY                   │
│ General Darshan                 │
│ Wait: 4-8 hours | 24/7          │
│                                 │
│ 💰 PAID ENTRY                   │
│ ₹300 - Special Darshan          │
│ Wait: 1-2 hours | 6 AM - 10 PM  │
│                                 │
│ 🙏 SEVA OPTIONS                 │
│ ₹500 - Archana Seva             │
│ ₹1,000 - Sahasranamarchana      │
│ (Booking required)              │
│                                 │
│ ⭐ VIP DARSHAN                  │
│ ₹10,000 - VIP Break Darshan     │
│ Wait: 15 min | Limited slots    │
└─────────────────────────────────┘
```

## BACKWARD COMPATIBILITY

For existing data with simple `accessMode`:
```typescript
// Old format
"accessMode": "FREE"

// Converts to new format
"entryFeeSummary": "Free Entry",
"entryFeeOptions": [
  {
    "type": "FREE",
    "name": "General Entry",
    "price": 0,
    "currency": "INR"
  }
]
```

## IMPLEMENTATION PLAN

1. **Phase 1**: Add new fields alongside existing `accessMode`
2. **Phase 2**: Update Admin Portal to manage entry fee options
3. **Phase 3**: Update Mobile App to display detailed options
4. **Phase 4**: Migrate existing data
5. **Phase 5**: Deprecate old `accessMode` field

## BENEFITS

✅ Handles complex pricing structures
✅ Shows waiting times for each option
✅ Supports booking requirements
✅ Flexible for different temple types
✅ Easy to display in UI
✅ Backward compatible

## YOUR FEEDBACK

Does this structure work for your use case? Any modifications needed?
