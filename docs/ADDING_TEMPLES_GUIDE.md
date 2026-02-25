# Guide: Adding/Removing Temples and Artifacts

This guide shows you how to easily add new temples or artifacts to your app.

## Architecture Overview

Your app uses a flexible seed data structure that makes it easy to:
- ✅ Add new temples
- ✅ Add new artifacts to existing temples
- ✅ Remove temples or artifacts
- ✅ Update temple/artifact information

## File Location

All temple and artifact data is in:
```
scripts/seed-data.ts
```

---

## How to Add a New Temple

### Step 1: Add Heritage Site

Find the `sites` array and add your new temple:

```typescript
const sites: Omit<HeritageSite, 'createdAt' | 'updatedAt'>[] = [
  // ... existing temples ...
  {
    siteId: 'your-new-temple-id',  // Unique ID in kebab-case
    name: 'Your New Temple Name',
    location: {
      address: 'Full address',
      city: 'City Name',
      state: 'State Name',
      country: 'India',
      coordinates: {
        latitude: 12.3456,  // Get from Google Maps
        longitude: 78.9012,
      },
    },
    description: 'Brief description of the temple',
    historicalContext: 'Historical background',
    culturalSignificance: 'Why this temple is important',
    visitingHours: {
      monday: { open: '06:00', close: '18:00' },
      // ... other days ...
    },
    entryFee: {
      indian: 25,
      foreign: 300,
      currency: 'INR',
    },
    supportedLanguages: [
      Language.ENGLISH,
      Language.TELUGU,
      Language.HINDI,
    ],
    amenities: ['parking', 'restrooms', 'guided_tours'],
    contactInfo: {
      phone: '+91-XXXX-XXXXXX',
      email: 'temple@example.com',
      website: 'https://temple-website.com',
    },
    isActive: true,
  },
];
```

### Step 2: Add Artifacts for the Temple

Create a new artifact array:

```typescript
// Seed Artifacts for Your New Temple
const yourNewTempleArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
  {
    artifactId: 'unique-artifact-id',
    siteId: 'your-new-temple-id',  // Must match temple siteId
    name: 'Artifact Name',
    type: ArtifactType.TEMPLE,  // or SCULPTURE, PAINTING, ARCHITECTURE
    description: 'Description of the artifact',
    historicalContext: 'Historical background',
    culturalSignificance: 'Cultural importance',
    location: {
      floor: 'Ground',
      section: 'Main Hall',
      coordinates: {
        latitude: 12.3456,
        longitude: 78.9012,
      },
    },
    qrCode: 'TEMPLE-CODE-001',  // Unique QR code
    images: [],
    audioGuides: [],
    videos: [],
    infographics: [],
    tags: ['tag1', 'tag2', 'tag3'],
    isActive: true,
  },
  // Add more artifacts...
];
```

### Step 3: Add to allArtifacts Array

Find the `allArtifacts` array and add your new artifacts:

```typescript
const allArtifacts = [
  ...lepakshiArtifacts,
  ...tirupatiArtifacts,
  // ... other temples ...
  ...yourNewTempleArtifacts,  // Add your new temple here
];
```

### Step 4: Update Summary Output

Update the console log at the end:

```typescript
console.log(`\n🕉️  Hindu Temples Added:`);
console.log(`   1. Lepakshi Temple (Andhra Pradesh) - 7 artifacts`);
// ... other temples ...
console.log(`   15. Your New Temple (State) - X artifacts`);  // Add your temple
```

---

## How to Add Artifacts to Existing Temple

### Example: Adding 4 New Artifacts to Lepakshi

Find the `lepakshiArtifacts` array and add new artifacts:

```typescript
const lepakshiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
  // ... existing artifacts ...
  {
    artifactId: 'veerabhadra-main-sanctum',
    siteId: 'lepakshi-temple-andhra',
    name: 'Sri Veerabhadra Swamy (Main Sanctum)',
    type: ArtifactType.SCULPTURE,
    description: 'Main deity of the temple',
    historicalContext: 'Installed in 16th century',
    culturalSignificance: 'Represents Shiva\'s fierce aspect',
    location: {
      floor: 'Ground',
      section: 'Main Sanctum',
      coordinates: {
        latitude: 13.8283,
        longitude: 77.6033,
      },
    },
    qrCode: 'LP-VEERABHADRA-004',  // Unique QR code
    images: [],
    audioGuides: [],
    videos: [],
    infographics: [],
    tags: ['deity', 'veerabhadra', 'shiva'],
    isActive: true,
  },
  {
    artifactId: 'nagalinga',
    siteId: 'lepakshi-temple-andhra',
    name: 'Nagalinga (Shivalingam under Nagapadaga)',
    type: ArtifactType.SCULPTURE,
    description: 'Sacred Shivalingam protected by seven-hooded serpent',
    historicalContext: 'Carved in 16th century',
    culturalSignificance: 'Symbolizes kundalini energy',
    location: {
      floor: 'Ground',
      section: 'Temple Courtyard',
      coordinates: {
        latitude: 13.8284,
        longitude: 77.6034,
      },
    },
    qrCode: 'LP-NAGALINGA-005',
    images: [],
    audioGuides: [],
    videos: [],
    infographics: [],
    tags: ['shivalingam', 'naga', 'serpent'],
    isActive: true,
  },
  {
    artifactId: 'kalyana-mandapa',
    siteId: 'lepakshi-temple-andhra',
    name: 'The Unfinished Kalyana Mandapa',
    type: ArtifactType.ARCHITECTURE,
    description: 'Incomplete marriage hall with intricate carvings',
    historicalContext: 'Construction stopped in 16th century',
    culturalSignificance: 'Legend of Virupanna\'s sacrifice',
    location: {
          floor: 'Ground',
          section: 'Temple Complex',
          coordinates: {
            latitude: 13.8282,
            longitude: 77.6032,
          },
        },
        qrCode: 'LP-MANDAPA-006',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['mandapa', 'unfinished', 'legend'],
        isActive: true,
      },
      {
        artifactId: 'sita-footprint',
        siteId: 'lepakshi-temple-andhra',
        name: 'Sita\'s Footprint',
        type: ArtifactType.SCULPTURE,
        description: 'Sacred footprint believed to be of Goddess Sita',
        historicalContext: 'From Ramayana legend',
        culturalSignificance: 'Where Sita dropped her jewelry',
        location: {
          floor: 'Ground',
          section: 'Near Temple Entrance',
          coordinates: {
            latitude: 13.8286,
            longitude: 77.6036,
          },
        },
        qrCode: 'LP-SITA-007',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['footprint', 'sita', 'ramayana'],
        isActive: true,
      },
    ];
```

---

## How to Remove a Temple

### Step 1: Remove from sites array
Comment out or delete the temple entry

### Step 2: Remove artifact array
Comment out or delete the entire artifact array

### Step 3: Remove from allArtifacts
Remove the line from the allArtifacts array

### Step 4: Update summary
Remove the line from console.log output

---

## How to Remove an Artifact

Simply comment out or delete the artifact object from its array.

---

## QR Code Naming Convention

Use a consistent pattern for QR codes:

```
[TEMPLE-CODE]-[ARTIFACT-TYPE]-[NUMBER]
```

Examples:
- `LP-PILLAR-001` = Lepakshi-Pillar-001
- `TT-VENKATESWARA-001` = Tirumala Tirupati-Venkateswara-001
- `TPL-PADMAVATHI-001` = Tirupati Local-Padmavathi-001
- `TPS-VENUGOPALA-001` = Tirupati Surrounding-Venugopala-001

---

## Artifact Types

Available types:
- `ArtifactType.TEMPLE` - Temple buildings
- `ArtifactType.SCULPTURE` - Statues, idols, carvings
- `ArtifactType.PAINTING` - Frescoes, murals, paintings
- `ArtifactType.ARCHITECTURE` - Pillars, gopurams, structures

---

## After Making Changes

### 1. Deploy to AWS
```bash
cd Sanaathana-Aalaya-Charithra
npm run build
npm run bundle
npm run deploy
npm run seed  # This runs the seed script
```

### 2. The seed script will:
- Create all heritage sites in DynamoDB
- Create all artifacts in DynamoDB
- Link artifacts to their temples
- Generate QR codes (you'll need to print these)

---

## Example: Complete New Temple Addition

```typescript
// 1. Add to sites array
{
  siteId: 'somnath-temple-gujarat',
  name: 'Somnath Temple',
  location: {
    address: 'Veraval, Gir Somnath District, Gujarat 362268',
    city: 'Veraval',
    state: 'Gujarat',
    country: 'India',
    coordinates: {
      latitude: 20.8880,
      longitude: 70.4013,
    },
  },
  description: 'First among the twelve Jyotirlinga shrines of Shiva',
  historicalContext: 'Destroyed and rebuilt multiple times, current structure from 1951',
  culturalSignificance: 'One of the most sacred pilgrimage sites in India',
  visitingHours: {
    monday: { open: '06:00', close: '21:00' },
    tuesday: { open: '06:00', close: '21:00' },
    wednesday: { open: '06:00', close: '21:00' },
    thursday: { open: '06:00', close: '21:00' },
    friday: { open: '06:00', close: '21:00' },
    saturday: { open: '06:00', close: '21:00' },
    sunday: { open: '06:00', close: '21:00' },
  },
  entryFee: {
    indian: 0,
    foreign: 0,
    currency: 'INR',
  },
  supportedLanguages: [
    Language.ENGLISH,
    Language.HINDI,
    Language.GUJARATI,
  ],
  amenities: ['parking', 'restrooms', 'guided_tours', 'prasadam_counter'],
  contactInfo: {
    phone: '+91-2876-231-247',
    email: 'somnath@gujarat.gov.in',
    website: 'https://www.somnath.org',
  },
  isActive: true,
},

// 2. Create artifacts array
const somnathArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
  {
    artifactId: 'somnath-jyotirlinga',
    siteId: 'somnath-temple-gujarat',
    name: 'Somnath Jyotirlinga',
    type: ArtifactType.SCULPTURE,
    description: 'First of the twelve Jyotirlingas',
    historicalContext: 'Ancient Jyotirlinga, temple rebuilt in 1951',
    culturalSignificance: 'Most sacred Shiva shrine, mentioned in Rig Veda',
    location: {
      floor: 'Ground',
      section: 'Main Sanctum',
      coordinates: {
        latitude: 20.8880,
        longitude: 70.4013,
      },
    },
    qrCode: 'SM-JYOTIRLINGA-001',
    images: [],
    audioGuides: [],
    videos: [],
    infographics: [],
    tags: ['jyotirlinga', 'shiva', 'sacred', 'first'],
    isActive: true,
  },
  {
    artifactId: 'somnath-temple-flag',
    siteId: 'somnath-temple-gujarat',
    name: 'Temple Flag (Dhwaja)',
    type: ArtifactType.ARCHITECTURE,
    description: 'Sacred flag changed three times daily',
    historicalContext: 'Traditional practice maintained for centuries',
    culturalSignificance: 'Symbolizes divine presence and protection',
    location: {
      floor: 'Ground',
      section: 'Temple Entrance',
      coordinates: {
        latitude: 20.8881,
        longitude: 70.4014,
      },
    },
    qrCode: 'SM-FLAG-002',
    images: [],
    audioGuides: [],
    videos: [],
    infographics: [],
    tags: ['flag', 'dhwaja', 'tradition'],
    isActive: true,
  },
];

// 3. Add to allArtifacts
const allArtifacts = [
  ...lepakshiArtifacts,
  ...tirupatiArtifacts,
  ...tirupathiLocalArtifacts,
  ...tirupathiSurroundingArtifacts,
  ...kalahastArtifacts,
  ...srisailamArtifacts,
  ...vidurashwathaArtifacts,
  ...hampiArtifacts,
  ...halebiduArtifacts,
  ...belurArtifacts,
  ...thanjavurArtifacts,
  ...elloraArtifacts,
  ...meenakshiArtifacts,
  ...khajurahoArtifacts,
  ...somnathArtifacts,  // Add new temple
];

// 4. Update summary
console.log(`   15. Somnath Temple (Gujarat) - 2 artifacts`);
```

---

## Tips

1. **Unique IDs**: Always use unique `artifactId` and `siteId`
2. **QR Codes**: Keep QR codes unique and follow naming convention
3. **Coordinates**: Get accurate GPS coordinates from Google Maps
4. **Test**: After adding, run `npm run seed` to test
5. **Backup**: Keep a backup of seed-data.ts before major changes

---

## Current Temple Count: 14 temples, 45 artifacts

You can easily scale to 50, 100, or 1000 temples using this same structure!
