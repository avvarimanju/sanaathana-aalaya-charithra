# MyDefectsScreen Component

## Overview

The `MyDefectsScreen` component displays a list of all defects submitted by the current user. It provides filtering by status, pull-to-refresh functionality, and navigation to detailed defect views.

## Features

### 1. Defect List Display
- Shows all defects submitted by the user
- Displays defect title, description preview, creation date, and update count
- Each defect card is tappable to view full details

### 2. Status Badges
Color-coded status badges for quick visual identification:
- **New**: Blue (`#1976D2` on `#E3F2FD`)
- **Acknowledged**: Yellow (`#F57F17` on `#FFF9C4`)
- **In Progress**: Orange (`#E65100` on `#FFE0B2`)
- **Resolved**: Green (`#2E7D32` on `#C8E6C9`)
- **Closed**: Gray (`#616161` on `#E0E0E0`)

### 3. Status Filtering
- Horizontal scrollable filter chips
- Filter by specific status or view all defects
- Active filter is highlighted with status color
- Defect count updates based on selected filter

### 4. Pull-to-Refresh
- Swipe down to refresh the defect list
- Shows refresh indicator while loading
- Updates defect data from the API

### 5. Empty States
- **No defects**: Shows when user hasn't reported any defects
  - Includes a "Report a Defect" button
- **No filtered results**: Shows when filter returns no results
  - Suggests trying a different filter

### 6. Error Handling
- Loading state with spinner
- Error state with retry button
- Alert dialogs for API errors

### 7. Floating Action Button (FAB)
- Quick access to report new defects
- Only visible when defects exist
- Positioned at bottom-right corner

## Props

```typescript
interface MyDefectsScreenProps {
  route: any;           // React Navigation route object
  navigation: any;      // React Navigation navigation object
}
```

### Route Parameters
- `userId` (string): The ID of the current user (defaults to 'demo-user-123')

## Navigation

### Incoming Navigation
```typescript
navigation.navigate('MyDefects', { userId: 'user-123' });
```

### Outgoing Navigation
- **DefectDetails**: Navigates to detailed defect view
  ```typescript
  navigation.navigate('DefectDetails', { defectId, userId });
  ```
- **DefectReport**: Navigates to defect submission form
  ```typescript
  navigation.navigate('DefectReport', { userId });
  ```

## API Integration

Uses `defectApiService` to fetch user defects:

```typescript
const response = await defectApiService.getUserDefects(userId, {
  status: selectedStatus || undefined,
  limit: 50,
});
```

## State Management

### Local State
- `defects`: All defects fetched from API
- `filteredDefects`: Defects filtered by selected status
- `selectedStatus`: Currently selected status filter (null = all)
- `isLoading`: Initial loading state
- `isRefreshing`: Pull-to-refresh loading state
- `error`: Error message if API call fails

## Component Structure

```
MyDefectsScreen
├── Header
│   ├── Title: "📋 My Defects"
│   └── Subtitle: Defect count
├── Status Filter Section
│   ├── Filter Label
│   └── Horizontal Filter Chips (All, New, Acknowledged, etc.)
├── Defects List (FlatList)
│   ├── Defect Cards
│   │   ├── Header (Title + Status Badge)
│   │   ├── Description Preview
│   │   └── Footer (Date + Update Count)
│   ├── Empty State (if no defects)
│   └── Pull-to-Refresh
└── Floating Action Button (if defects exist)
```

## Styling

Follows the existing mobile app design patterns:
- Primary color: `#FF6B35` (orange)
- Background: `#f5f5f5` (light gray)
- Card style: White background with subtle shadow
- Typography: System fonts with appropriate weights

## Usage Example

```typescript
// In your navigation stack
<Stack.Screen 
  name="MyDefects" 
  component={MyDefectsScreen}
  options={{ headerShown: false }}
/>

// Navigate to screen
navigation.navigate('MyDefects', { 
  userId: currentUser.id 
});
```

## Requirements Validation

This component satisfies the following requirements:

### Requirement 2.1: View Submitted Defects
✅ Provides an interface for end users to view their submitted defect reports

### Requirement 2.2: Display Current Status
✅ Displays the current defect status with color-coded badges

## Future Enhancements

1. **Search Functionality**: Add search bar to filter by title/description
2. **Sorting Options**: Sort by date, status, or update count
3. **Pagination**: Load more defects as user scrolls
4. **Offline Support**: Cache defects for offline viewing
5. **Swipe Actions**: Swipe to delete or mark as resolved
6. **Notification Badge**: Show unread update count on defect cards

## Testing Considerations

### Unit Tests
- Test status filter logic
- Test empty state rendering
- Test error handling
- Test navigation calls

### Integration Tests
- Test API integration with mock service
- Test pull-to-refresh functionality
- Test defect card tap navigation

### Manual Testing Checklist
- [ ] Defects load correctly on screen mount
- [ ] Status filters work correctly
- [ ] Pull-to-refresh updates the list
- [ ] Tapping a defect navigates to details
- [ ] Empty state shows when no defects
- [ ] Error state shows on API failure
- [ ] FAB navigates to report screen
- [ ] Status badges display correct colors
- [ ] Loading states display correctly

## Dependencies

- React Native core components
- Expo Status Bar
- defectApiService (API client)
- React Navigation (for navigation)

## Related Components

- `DefectReportScreen`: For submitting new defects
- `DefectDetailsScreen`: For viewing defect details (to be implemented)
- `NotificationsScreen`: For viewing defect notifications (to be implemented)
