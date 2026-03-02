# Mobile App MVP UI Cleanup

## Summary

Cleaned up the mobile app UI by hiding non-functional or deferred features to provide a focused MVP experience.

## Changes Made

### 1. Hidden "Download All" Button
**Location**: `src/screens/TempleDetailsScreen.tsx`

**Reason**: 
- Offline download feature deferred to Phase 2 (Tasks 10-13)
- High AWS costs ($0.01 - $8,500/month)
- Implementation complexity (12-18 hours)

**Impact**: Users will not see the download button, avoiding confusion about unavailable functionality.

### 2. Hidden "Add to Favorites" Button
**Location**: `src/screens/TempleDetailsScreen.tsx`

**Reason**:
- Feature was not implemented (UI placeholder only)
- No backend service or storage exists
- No FavoritesScreen to view saved items
- Better to hide than show non-functional features

**Impact**: Users will not see a button that does nothing, improving UX.

## Current Action Buttons Section

**Before**:
```tsx
<View style={styles.actionButtons}>
  <TouchableOpacity>
    <Text>📥 Download All</Text>
  </TouchableOpacity>
  <TouchableOpacity>
    <Text>⭐ Add to Favorites</Text>
  </TouchableOpacity>
</View>
```

**After**:
```tsx
{/* Action Buttons - HIDDEN FOR MVP */}
{/* All action buttons deferred to Phase 2 for proper implementation */}
{/* ... commented out ... */}
```

## Benefits

1. **Cleaner UI**: No non-functional buttons cluttering the interface
2. **Better UX**: Users won't click buttons that do nothing
3. **Clear Expectations**: Users understand what features are available
4. **Easier Maintenance**: Clear comments explain why features are hidden
5. **Future-Ready**: Easy to uncomment and implement when ready

## Phase 1 (MVP) User Flow

1. User opens app → Splash → Welcome → Login
2. User selects language
3. User browses temples in Explore screen
4. User views temple details
5. User purchases temple (₹99 for 30-day access)
6. User scans QR codes to access content
7. User views content (audio, video, infographics, Q&A)

**No offline features, no favorites - just core functionality.**

## Phase 2 Implementation Checklist

When ready to implement deferred features:

### Offline Download
- [ ] Implement Content Package Service (Tasks 10-13)
- [ ] Set up S3 buckets and CloudFront
- [ ] Implement download tracking
- [ ] Add local storage for offline content
- [ ] Uncomment download button in TempleDetailsScreen
- [ ] Test offline access

### Favorites
- [ ] Design favorites data model
- [ ] Create FavoritesScreen.tsx
- [ ] Implement favorites service (AsyncStorage or API)
- [ ] Add favorites state management
- [ ] Add navigation to Favorites screen
- [ ] Uncomment favorites button in TempleDetailsScreen
- [ ] Implement add/remove toggle functionality
- [ ] Add favorites icon to navigation bar

## Documentation

See `DEFERRED_FEATURES.md` for detailed information about:
- Why features were deferred
- Current vs future user experience
- Implementation requirements for Phase 2
- Code locations and re-enabling instructions

---

*Updated: 2026-02-27*  
*Status: MVP UI Cleanup Complete*  
*Focus: Core functionality only*
