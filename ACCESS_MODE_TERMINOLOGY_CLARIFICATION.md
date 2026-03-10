# Access Mode Terminology Clarification

## CURRENT ISSUE
The field name "accessMode" is confusing because it has two different meanings in the codebase:

### 1. Temple Entry Type (What you're seeing in the UI)
- **FREE**: Temple entry is free for all visitors
- **PAID**: Temple charges an entry fee
- **HYBRID**: Temple has both free and paid entry options

### 2. Mobile App Access Type (Backend pricing logic)
- **QR_CODE_SCAN**: Users scan QR codes at the temple
- **OFFLINE_DOWNLOAD**: Users download content before visiting
- **HYBRID**: Both QR scan and offline download available

## RECOMMENDATION: Rename Fields for Clarity

### Option A: Separate Fields (RECOMMENDED)
```typescript
{
  // Temple entry fee status
  "entryType": "FREE" | "PAID" | "HYBRID",
  
  // Mobile app content access method
  "contentAccessMode": "QR_CODE_SCAN" | "OFFLINE_DOWNLOAD" | "HYBRID"
}
```

### Option B: Better Field Names
```typescript
{
  // Temple entry fee status
  "entryFeeType": "FREE" | "PAID" | "HYBRID",
  
  // Mobile app access method
  "appAccessMode": "QR_CODE_SCAN" | "OFFLINE_DOWNLOAD" | "HYBRID"
}
```

### Option C: Most Descriptive
```typescript
{
  // Temple entry fee status
  "templeEntryFee": "FREE" | "PAID" | "HYBRID",
  
  // Mobile app content delivery method
  "contentDeliveryMode": "QR_CODE_SCAN" | "OFFLINE_DOWNLOAD" | "HYBRID"
}
```

## CURRENT STATE IN VERIFIED TEMPLES
The verified-temples-seed.json currently uses "accessMode" to mean "Temple Entry Type":
- Tirumala Venkateswara: FREE
- Meenakshi Amman: PAID (₹50 for Indians, ₹500 for foreigners)
- Kashi Vishwanath: FREE
- Jagannath Temple: FREE
- Somnath Temple: FREE

## UI DISPLAY SUGGESTION
Instead of showing "Access Mode: FREE", show:
- **Entry Fee: Free** (with 🆓 icon)
- **Entry Fee: ₹50** (with 💰 icon)
- **Entry Fee: Varies** (with 🔀 icon for HYBRID)

## NEXT STEPS
1. Decide on terminology (Option A, B, or C)
2. Update TypeScript types
3. Update database schema
4. Update UI labels
5. Migrate existing data

## YOUR FEEDBACK NEEDED
Which option do you prefer? Or do you have a better naming suggestion?
