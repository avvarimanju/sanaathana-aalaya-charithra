# Entry Fee Management UI Design

## CURRENT PROBLEM
The TempleFormPage has `accessMode` field in the data but NO UI to edit it!

## PROPOSED UI SOLUTION

### UI Component: Entry Fee Manager
A dynamic section in the temple form where admin can add/edit/delete multiple entry fee options.

```
┌─────────────────────────────────────────────────────────┐
│ Entry Fee Options                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ Entry Option 1 ─────────────────────────────── [×] │
│ │                                                       │
│ │ Type: [Free ▼]                                       │
│ │ Name: [General Darshan                            ]  │
│ │ Price: [0                ] INR                       │
│ │ Description: [Free entry with queue waiting       ]  │
│ │ Waiting Time: [4-8 hours                         ]  │
│ │ Availability: [24/7                              ]  │
│ │ ☐ Booking Required                                   │
│ └─────────────────────────────────────────────────────┘
│                                                         │
│ ┌─ Entry Option 2 ─────────────────────────────── [×] │
│ │                                                       │
│ │ Type: [Paid ▼]                                       │
│ │ Name: [Special Darshan                           ]  │
│ │ Price: [300              ] INR                       │
│ │ Description: [Faster darshan with shorter queue  ]  │
│ │ Waiting Time: [1-2 hours                         ]  │
│ │ Availability: [6 AM - 10 PM                      ]  │
│ │ ☑ Booking Required                                   │
│ └─────────────────────────────────────────────────────┘
│                                                         │
│ [+ Add Entry Option]                                    │
│                                                         │
│ Quick Summary: Free & Paid options available            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Type Dropdown Options
- **Free**: No entry fee
- **Paid**: Standard paid entry
- **Seva**: Special pooja/seva services
- **VIP**: Premium/VIP darshan
- **Custom**: Other custom options

### Features
1. **Add Multiple Options**: Click "+ Add Entry Option" to add more
2. **Remove Options**: Click [×] button to remove an option
3. **Drag to Reorder**: (Future enhancement) Drag options to reorder
4. **Auto-Summary**: Automatically generates summary text
5. **Validation**: Ensures at least one option exists

### Mobile-Friendly Collapsible Version
```
┌─────────────────────────────────────────┐
│ Entry Fee Options (2)          [Expand] │
├─────────────────────────────────────────┤
│ Summary: Free & Paid options available  │
│                                         │
│ [Edit Entry Options]                    │
└─────────────────────────────────────────┘
```

## IMPLEMENTATION APPROACH

### Phase 1: Simple Text Input (Quick Fix)
Add a simple text field for now:
```tsx
<div className="form-group">
  <label htmlFor="entryFee">Entry Fee</label>
  <input
    type="text"
    id="entryFee"
    name="entryFee"
    value={formData.entryFee}
    onChange={handleChange}
    placeholder="e.g., Free, ₹300, Free & Paid options"
  />
  <small>Enter entry fee information (e.g., "Free", "₹300", "Free & Paid options available")</small>
</div>
```

### Phase 2: Dynamic Entry Fee Manager (Full Solution)
Implement the full dynamic UI with add/remove functionality.

## CODE STRUCTURE

### New State for Entry Fee Options
```typescript
interface EntryFeeOption {
  id: string;
  type: 'FREE' | 'PAID' | 'SEVA' | 'VIP' | 'CUSTOM';
  name: string;
  price: number;
  currency: string;
  description: string;
  waitingTime?: string;
  availability?: string;
  bookingRequired: boolean;
  duration?: string;
}

const [entryFeeOptions, setEntryFeeOptions] = useState<EntryFeeOption[]>([
  {
    id: '1',
    type: 'FREE',
    name: 'General Darshan',
    price: 0,
    currency: 'INR',
    description: '',
    bookingRequired: false
  }
]);
```

### Add/Remove Functions
```typescript
const handleAddEntryOption = () => {
  const newOption: EntryFeeOption = {
    id: Date.now().toString(),
    type: 'FREE',
    name: '',
    price: 0,
    currency: 'INR',
    description: '',
    bookingRequired: false
  };
  setEntryFeeOptions([...entryFeeOptions, newOption]);
};

const handleRemoveEntryOption = (id: string) => {
  if (entryFeeOptions.length > 1) {
    setEntryFeeOptions(entryFeeOptions.filter(opt => opt.id !== id));
  }
};

const handleEntryOptionChange = (id: string, field: string, value: any) => {
  setEntryFeeOptions(entryFeeOptions.map(opt =>
    opt.id === id ? { ...opt, [field]: value } : opt
  ));
};
```

## BACKWARD COMPATIBILITY

### Migration from accessMode
```typescript
// Convert old accessMode to new entryFeeOptions
const migrateAccessMode = (accessMode: string) => {
  switch (accessMode) {
    case 'FREE':
      return [{
        id: '1',
        type: 'FREE',
        name: 'General Entry',
        price: 0,
        currency: 'INR',
        description: 'Free entry',
        bookingRequired: false
      }];
    case 'PAID':
      return [{
        id: '1',
        type: 'PAID',
        name: 'Entry Fee',
        price: 0,
        currency: 'INR',
        description: 'Paid entry',
        bookingRequired: false
      }];
    case 'HYBRID':
      return [
        {
          id: '1',
          type: 'FREE',
          name: 'General Entry',
          price: 0,
          currency: 'INR',
          description: 'Free entry',
          bookingRequired: false
        },
        {
          id: '2',
          type: 'PAID',
          name: 'Special Entry',
          price: 0,
          currency: 'INR',
          description: 'Paid entry',
          bookingRequired: false
        }
      ];
    default:
      return [];
  }
};
```

## NEXT STEPS

1. **Quick Fix**: Add simple text input for entry fee (5 minutes)
2. **Full Implementation**: Build dynamic entry fee manager (2-3 hours)
3. **Backend Update**: Update API to accept entryFeeOptions array
4. **Mobile App Update**: Display entry fee options in mobile app

Which approach would you like me to implement first?
