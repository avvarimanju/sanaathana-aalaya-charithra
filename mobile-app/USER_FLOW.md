# Mobile App User Flow

## Updated Navigation Structure

The app now follows a logical hierarchy that makes it easy for users to discover temples and their artifacts.

### Flow Diagram

```
1. Welcome Screen
   ↓ (Get Started)
2. Language Selection
   ↓ (Continue)
3. Explore Temples (Browse all temples)
   ↓ (Select a temple)
4. Temple Details (View temple info + artifacts list)
   ↓ (Select artifact OR scan QR)
5. Audio Guide / Content (Learn about specific artifact)
```

## Detailed User Journey

### 1. Welcome Screen
- **Purpose**: Introduction to the app
- **Actions**: 
  - Click "Get Started" → Go to Language Selection
- **Features**:
  - App branding
  - Key features showcase
  - Demo mode indicator

### 2. Language Selection
- **Purpose**: Choose preferred language for content
- **Actions**:
  - Select from 10+ Indian languages
  - Click "Continue" → Go to Explore Temples
- **Languages**: English, Hindi, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Tamil

### 3. Explore Temples (NEW!)
- **Purpose**: Browse all available temples
- **Features**:
  - Search temples by name or location
  - Filter by state (Andhra Pradesh, Karnataka, etc.)
  - View temple cards with:
    - Temple name
    - Location (city, state)
    - Number of artifacts
    - Rating
  - Quick actions:
    - "Explore" button → Temple Details
    - "Download" button → Offline access
  - "📷 Scan QR" button in header → Direct QR scanning
- **Why This Helps**:
  - Users can browse temples before visiting
  - Easy to find temples by location
  - See what artifacts are available
  - Plan temple visits

### 4. Temple Details (ENHANCED!)
- **Purpose**: View detailed information about a specific temple
- **Features**:
  - Temple information:
    - Name, location, description
    - Historical context
    - Visiting hours
    - Entry fees
  - **Artifacts List** (Main Feature):
    - All artifacts in this temple
    - Each artifact shows:
      - Name (e.g., "Hanging Pillar")
      - Type (Architecture/Sculpture/Painting)
      - Description
      - QR code identifier
      - Lock/unlock status
    - "📷 Scan" button → QR Scanner
    - Hint: "Visit the temple and scan QR codes at each artifact"
  - Unlock options:
    - Unlock entire temple (₹99 for 30 days)
    - Or scan individual QR codes at temple
  - Actions:
    - Download all content
    - Add to favorites
- **Why This Helps**:
  - Users know exactly what artifacts are in the temple
  - Can plan which artifacts to visit
  - Clear QR codes for each artifact
  - Option to unlock all or scan individually

### 5. QR Scanner
- **Purpose**: Scan QR codes at physical artifact locations
- **Access Points**:
  - From Explore screen header
  - From Temple Details "Scan" button
  - From any artifact card
- **Flow**:
  - Scan QR code → Content Loading → Audio Guide
- **Demo Mode**:
  - Shows list of artifacts to simulate scanning

### 6. Audio Guide / Content
- **Purpose**: Experience the artifact content
- **Features**:
  - Audio narration
  - Video content
  - Infographics
  - Q&A chat
  - Historical information

## Key Improvements

### Before (Confusing)
```
Welcome → Language → QR Scanner (shows all artifacts mixed together)
❌ Problem: Users don't know which temple has which artifact
❌ Problem: Artifacts from different temples mixed together
❌ Problem: No way to browse temples
```

### After (Clear Hierarchy)
```
Welcome → Language → Explore Temples → Temple Details → Artifacts List → Scan/Play
✅ Solution: Clear temple-to-artifact relationship
✅ Solution: Browse temples by location
✅ Solution: See all artifacts in a temple before visiting
✅ Solution: Know exactly what to scan at the temple
```

## Use Cases

### Use Case 1: Planning a Temple Visit
1. User opens app
2. Selects language
3. Browses temples in "Andhra Pradesh"
4. Finds "Lepakshi Temple"
5. Views temple details
6. Sees 3 artifacts: Hanging Pillar, Nandi, Ceiling Paintings
7. Plans to visit and scan all 3

### Use Case 2: At the Temple
1. User is at Lepakshi Temple
2. Opens app → Explore → Lepakshi Temple
3. Sees artifact list
4. Walks to Hanging Pillar
5. Clicks "📷 Scan" button
6. Scans QR code on pillar
7. Listens to audio guide about the pillar
8. Repeats for other artifacts

### Use Case 3: Discovering New Temples
1. User wants to explore Karnataka temples
2. Opens app → Explore
3. Filters by "Karnataka"
4. Discovers Hampi Ruins
5. Views 15 artifacts available
6. Downloads content for offline use
7. Plans visit

## Technical Implementation

### Navigation Stack
```typescript
- Welcome (headerShown: false)
- LanguageSelection
- Explore (with QR button in header)
- TempleDetails (headerShown: false, custom back button)
- QRScanner
- ContentLoading
- AudioGuide
- VideoPlayer
- Infographic
- QAChat
```

### Data Structure
```typescript
Temple {
  siteId: string
  name: string
  location: { city, state }
  artifacts: Artifact[]
}

Artifact {
  artifactId: string
  name: string
  type: string
  templeId: string  // Links to parent temple
  qrCode: string
  isUnlocked: boolean
}
```

## Benefits of New Flow

1. **Discoverability**: Users can browse all temples
2. **Context**: Clear temple-artifact relationship
3. **Planning**: See artifacts before visiting
4. **Scalability**: Works with 100s of temples and 1000s of artifacts
5. **Intuitive**: Follows natural hierarchy (Temple → Artifacts)
6. **Flexible**: Can browse OR scan directly
7. **Educational**: Learn about temple before visiting

## Future Enhancements

- Map view of temples
- Nearby temples based on GPS
- Virtual tours for remote users
- Artifact collections/favorites
- Share artifacts with friends
- Temple visit history
- Achievements/badges for visiting temples
