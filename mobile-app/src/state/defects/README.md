# Defect State Management

This directory contains the state management implementation for the defect tracking system in the mobile app. It uses React Context API with reducers for predictable state updates.

## Architecture

The state management is split into two main contexts:

1. **DefectContext**: Manages defect data (list, details, filters)
2. **NotificationContext**: Manages notifications with automatic polling

## Files

- `types.ts` - TypeScript interfaces and types
- `defectReducer.ts` - Reducer for defect state
- `notificationReducer.ts` - Reducer for notification state
- `DefectContext.tsx` - Defect context provider
- `NotificationContext.tsx` - Notification context provider with polling
- `hooks.ts` - Custom hooks for accessing contexts
- `index.ts` - Public exports

## Usage

### 1. Wrap your app with providers

```tsx
import { DefectProvider, NotificationProvider } from './state/defects';

function App() {
  return (
    <DefectProvider>
      <NotificationProvider>
        {/* Your app components */}
      </NotificationProvider>
    </DefectProvider>
  );
}
```

### 2. Use hooks in components

#### Defect Management

```tsx
import { useDefects } from '../state/defects';

function MyDefectsScreen() {
  const {
    defects,
    isLoading,
    error,
    loadDefects,
    refreshDefects,
    setStatusFilter,
  } = useDefects();

  useEffect(() => {
    loadDefects(userId);
  }, [userId]);

  return (
    <FlatList
      data={defects}
      onRefresh={() => refreshDefects(userId)}
      refreshing={isRefreshing}
    />
  );
}
```

#### Notification Management

```tsx
import { useNotifications } from '../state/defects';

function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    startPolling,
    stopPolling,
  } = useNotifications();

  useEffect(() => {
    // Start polling when component mounts
    startPolling(userId);

    // Stop polling when component unmounts
    return () => stopPolling();
  }, [userId]);

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    // Navigate to defect details
  };

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => (
        <NotificationItem
          notification={item}
          onPress={() => handleNotificationPress(item)}
        />
      )}
    />
  );
}
```

## Features

### Defect Context

- **Load defects**: Fetch user's defects with optional filters
- **Refresh defects**: Pull-to-refresh functionality
- **Load details**: Fetch detailed defect information
- **Status filtering**: Filter defects by status
- **Error handling**: Centralized error state
- **Loading states**: Separate loading and refreshing indicators

### Notification Context

- **Automatic polling**: Polls for new notifications every 30 seconds
- **Background pause**: Automatically pauses polling when app is in background
- **Foreground resume**: Resumes polling when app comes to foreground
- **Mark as read**: Update notification read status
- **Unread count**: Automatically calculated from notification list
- **Error handling**: Graceful error handling with retry capability

## State Structure

### DefectState

```typescript
{
  defects: DefectSummary[];           // List of user's defects
  selectedDefect: DefectDetails | null; // Currently selected defect
  isLoading: boolean;                  // Initial loading state
  isRefreshing: boolean;               // Pull-to-refresh state
  error: string | null;                // Error message
  statusFilter: DefectStatus | null;   // Current status filter
}
```

### NotificationState

```typescript
{
  notifications: Notification[];  // List of notifications
  unreadCount: number;           // Count of unread notifications
  isLoading: boolean;            // Loading state
  error: string | null;          // Error message
  lastPolled: Date | null;       // Last polling timestamp
}
```

## API Integration

The state management integrates with the defect API service:

- `defectApiService.getUserDefects()` - Load user's defects
- `defectApiService.getDefectDetails()` - Load defect details
- `defectApiService.getNotifications()` - Load notifications
- `defectApiService.markNotificationRead()` - Mark notification as read

## Polling Configuration

Notification polling is configured with:

- **Interval**: 30 seconds (configurable via `POLLING_INTERVAL`)
- **Auto-pause**: Pauses when app is in background
- **Auto-resume**: Resumes when app returns to foreground
- **Manual control**: Can be started/stopped programmatically

## Error Handling

Both contexts provide:

- Automatic error state management
- Error messages from API responses
- `clearError()` method to dismiss errors
- Graceful degradation on failures

## Performance Considerations

1. **Memoization**: All context methods are wrapped with `useCallback`
2. **Selective updates**: Reducers only update changed state
3. **Background optimization**: Polling pauses when app is inactive
4. **Efficient polling**: Only fetches when app is in foreground

## Testing

When testing components that use these contexts:

```tsx
import { DefectProvider, NotificationProvider } from '../state/defects';

function renderWithProviders(component) {
  return render(
    <DefectProvider>
      <NotificationProvider>
        {component}
      </NotificationProvider>
    </DefectProvider>
  );
}
```

## Migration Guide

To migrate existing screens to use state management:

1. Remove local state (`useState` for defects/notifications)
2. Remove API calls from components
3. Import and use the appropriate hook
4. Replace local state with context state
5. Replace API calls with context methods

Example:

```tsx
// Before
const [defects, setDefects] = useState([]);
const loadDefects = async () => {
  const response = await defectApiService.getUserDefects(userId);
  setDefects(response.data.defects);
};

// After
const { defects, loadDefects } = useDefects();
useEffect(() => {
  loadDefects(userId);
}, [userId]);
```

## Future Enhancements

Potential improvements:

1. **WebSocket support**: Replace polling with real-time WebSocket updates
2. **Offline support**: Cache defects locally with AsyncStorage
3. **Optimistic updates**: Update UI before API confirmation
4. **Pagination**: Support for loading more defects
5. **Search**: Add search functionality to defect list
6. **Push notifications**: Integrate with native push notification system
