# Deferred Features - Phase 2

## Status: DEFERRED

The following features have been deferred to Phase 2 to focus on core MVP functionality:
1. Offline Download functionality
2. Favorites feature

## Changes Made

### Mobile App UI Updates

**File**: `mobile-app/src/screens/TempleDetailsScreen.tsx`

1. **Hidden "Download All" Button**
   - Commented out the download button in the action buttons section
   - Added clear comment: `All action buttons deferred to Phase 2 for proper implementation`
   - Button will not be visible to users in the current release

2. **Hidden "Add to Favorites" Button**
   - Commented out the favorites button (non-functional placeholder)
   - No backend service or storage implementation exists
   - Will be properly implemented in Phase 2 with:
     - Local storage (AsyncStorage) or backend API
     - FavoritesScreen to view saved temples
     - Add/remove favorites functionality
     - Navigation to favorites list

3. **Commented Out Related Code**
   - `isDownloaded` state variable (line ~33)
   - `handleDownload()` function (line ~103)
   - Entire action buttons section (line ~268-285)

### Reason for Deferral

**Offline Download (Tasks 10-13)**:
- High AWS costs: $0.01/month (small scale) to $8,500/month (large scale)
- Implementation complexity: 12-18 hours
- Strategy: Focus on core pricing functionality first, validate with real users before adding offline features

**Favorites Feature**:
- Not implemented - was a UI placeholder with no functionality
- Requires proper backend API or local storage implementation
- Requires FavoritesScreen and navigation
- Better to hide non-functional features than confuse users

### Affected Features (Deferred)

The following features are NOT available in Phase 1:

1. **Content Package Generation** (Task 10)
   - Automatic generation of downloadable content packages
   - Content compression and optimization
   - Package versioning and updates

2. **Content Package Service** (Task 11)
   - Download URL generation
   - Package retrieval and versioning
   - Download tracking and analytics

3. **Mobile App Offline Functionality** (Task 12)
   - Offline content storage
   - Offline content loading
   - Artifact list browsing without QR scanning
   - Content deletion management

4. **Mobile Offline Verification** (Task 13)
   - Testing and validation of offline features

### Current User Experience

**Phase 1 (Current - MVP)**:
- Users can browse temples in the Explore screen
- Users can view temple details and artifact information
- Users can purchase temples/temple groups
- Users can scan QR codes to access content
- All content requires internet connection
- Clean, focused UI without non-functional features

**Phase 2 (Future)**:
- Users will see "Download All" button after purchase
- Users can download content packages for offline access
- Users can browse artifact lists without QR scanning (HYBRID mode)
- Users can access content without internet connection
- Users can add temples to favorites
- Users can view their favorites list

### Access Modes

The system supports three access modes (defined in backend, not exposed in UI yet):

1. **QR_CODE_SCAN**: Requires QR code scanning for each artifact
2. **OFFLINE_DOWNLOAD**: All content available as downloadable package
3. **HYBRID** (Default): Both QR scanning and offline download available

In Phase 1, all temples effectively operate in QR_CODE_SCAN mode from the user's perspective, even though the backend supports all three modes.

### Re-enabling Features (Phase 2)

When ready to implement Phase 2, uncomment and implement the following in `TempleDetailsScreen.tsx`:

**For Offline Download:**
1. Line ~33: `const [isDownloaded, setIsDownloaded] = useState(false);`
2. Lines ~103-108: `handleDownload()` function
3. Lines ~268-285: Action buttons section with download button
4. Implement backend services (Tasks 10-13) as documented in the spec

**For Favorites:**
1. Create `FavoritesScreen.tsx` to display saved temples
2. Create favorites service (local storage or backend API):
   - `addToFavorites(templeId: string)`
   - `removeFromFavorites(templeId: string)`
   - `getFavorites(): Promise<Temple[]>`
   - `isFavorite(templeId: string): boolean`
3. Add favorites state management (Context or Redux)
4. Add navigation to Favorites screen in App.tsx
5. Uncomment favorites button in action buttons section
6. Implement proper add/remove toggle functionality

### Related Documentation

- `.kiro/specs/temple-pricing-management/tasks.md` - Task definitions
- `.kiro/specs/temple-pricing-management/requirements.md` - Requirements 25-40 (offline features)
- `src/temple-pricing/types/index.ts` - AccessMode type definition

---

*Updated: 2026-02-27*  
*Status: Deferred to Phase 2*  
*Reason: Cost optimization and MVP focus*
