# NotificationsScreen Component

## Overview

The NotificationsScreen component displays all notifications for the user related to their defects. It shows status change notifications and comment notifications, with unread indicators. Users can mark notifications as read and tap to navigate to the related defect.

## Features

### Core Functionality
- **Notification List Display**: Shows all notifications for the user
- **Unread Indicators**: Visual indicators (badge and highlight) for unread notifications
- **Notification Types**: Displays different icons and colors for status changes vs comments
- **Mark as Read**: Automatically marks notifications as read when tapped
- **Navigation**: Taps navigate to DefectDetailsScreen for the related defect
- **Pull-to-Refresh**: Swipe down to refresh notifications
- **Empty State**: Friendly message when no notifications exist
- **Error Handling**: Graceful error states with retry functionality

### Notification Types

1. **Status Change Notifications** (🔄)
   - Orange color theme
   - Indicates when a defect status has changed
   - Shows the status transition in the message

2. **Comment Added Notifications** (💬)
   - Green color theme
   - Indicates when an administrator has added a comment
   - Shows the comment preview in the message

### Visual Design

- **Unread Notifications**:
  - Light orange background (#FFF9F5)
  - Orange left border (4px)
  - Orange dot indicator in top-right
  - Bold text for title and message

- **Read Notifications**:
  - White background
  - No border
  - No dot indicator
  - Regular text weight

## Props

```typescript
interface NotificationsScreenProps {
  route: any;           // React Navigation route object
  navigation: any;      // React Navigation navigation object
}
```

### Route Parameters

```typescript
{
  userId: string;       // User ID to fetch notifications for
}
```

## Usage

```typescript
// Navigation to NotificationsScreen
navigation.navigate('Notifications', {
  userId: 'user-123'
});
```

## API Integration

The component uses the following API methods from `defectApiService`:

1. **getNotifications(userId, unreadOnly)**
   - Fetches all notifications for the user
   - Called on mount and refresh

2. **markNotificationRead(notificationId)**
   - Marks a notification as read
   - Called when user taps a notification

## State Management

```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## Key Functions

### loadNotifications()
Fetches notifications from the API and updates state. Handles loading states and errors.

### handleNotificationPress(notification)
1. Marks the notification as read (if unread)
2. Updates local state to reflect read status
3. Navigates to DefectDetailsScreen with the defect ID

### formatTimeAgo(timestamp)
Formats timestamps into human-readable relative time:
- "Just now" (< 1 minute)
- "5m ago" (< 1 hour)
- "3h ago" (< 24 hours)
- "2d ago" (< 7 days)
- "Jan 15" (> 7 days)

## UI Components

### Header
- Orange background (#FF6B35)
- Shows "Notifications" title with bell icon
- Displays unread count or "All caught up!" message

### Notification Card
- Rounded corners (12px)
- Shadow/elevation for depth
- Icon with colored background
- Title, message, and timestamp
- Chevron indicator for navigation
- Unread styling when applicable

### Empty State
- Bell icon (🔔)
- "No notifications yet" message
- Helpful subtext explaining when notifications appear

### Loading State
- Centered spinner
- "Loading notifications..." text

### Error State
- Warning icon (⚠️)
- Error message
- Retry button

## Styling

The component uses StyleSheet for consistent styling:
- Primary color: #FF6B35 (orange)
- Background: #f5f5f5 (light gray)
- Card background: #fff (white)
- Unread background: #FFF9F5 (light orange)

## Accessibility

- TouchableOpacity with activeOpacity for visual feedback
- Descriptive text for all states
- Clear visual hierarchy
- Readable font sizes (12-28px)

## Error Handling

1. **Network Errors**: Shows error state with retry button
2. **API Errors**: Displays error message from API
3. **Mark as Read Failures**: Continues navigation even if marking fails
4. **Empty Data**: Shows friendly empty state

## Performance Considerations

- Uses FlatList for efficient rendering of large lists
- Implements pull-to-refresh for manual updates
- Optimistic UI updates for mark as read
- Memoized callbacks with useCallback

## Future Enhancements

1. **Real-time Updates**: WebSocket support for instant notifications
2. **Notification Filtering**: Filter by type (status change vs comment)
3. **Bulk Actions**: Mark all as read functionality
4. **Notification Settings**: User preferences for notification types
5. **Push Notifications**: Integration with device push notifications
6. **Notification Grouping**: Group notifications by defect

## Requirements Validation

This component validates the following requirements:

- **Requirement 8.3**: THE Defect_Tracking_System SHALL allow End_Users to view their notifications
- **Requirement 8.4**: WHEN an End_User views a notification, THE Defect_Tracking_System SHALL mark the notification as read

## Testing Considerations

When testing this component:

1. Test with empty notification list
2. Test with mix of read/unread notifications
3. Test with different notification types
4. Test mark as read functionality
5. Test navigation to defect details
6. Test pull-to-refresh
7. Test error states and retry
8. Test loading states
9. Test timestamp formatting for various dates
10. Test with long notification messages

## Dependencies

- React Native core components
- expo-status-bar
- defectApiService
- React Navigation

## Related Components

- **DefectDetailsScreen**: Navigation target when notification is tapped
- **MyDefectsScreen**: Related screen showing user's defects
- **DefectReportScreen**: Screen for creating new defects
