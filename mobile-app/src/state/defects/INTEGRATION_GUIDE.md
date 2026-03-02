# State Management Integration Guide

This guide shows how to integrate the defect state management into your mobile app.

## Step 1: Wrap App with Providers

Add the providers to your app's root component (typically `App.tsx` or where you set up navigation):

```tsx
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DefectProvider, NotificationProvider } from './src/state/defects';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <DefectProvider>
      <NotificationProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </DefectProvider>
  );
}
```

## Step 2: Update MyDefectsScreen

Replace local state management with context:

```tsx
// Before (with local state)
import React, { useState, useEffect } from 'react';
import { defectApiService } from '../services/defect-api.service';

export default function MyDefectsScreen({ route }) {
  const { userId } = route.params;
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadDefects = async () => {
    setIsLoading(true);
    const response = await defectApiService.getUserDefects(userId);
    if (response.success) {
      setDefects(response.data.defects);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadDefects();
  }, [userId]);
  
  // ... rest of component
}

// After (with context)
import React, { useEffect } from 'react';
import { useDefects } from '../state/defects';

export default function MyDefectsScreen({ route }) {
  const { userId } = route.params;
  const {
    defects,
    isLoading,
    isRefreshing,
    error,
    loadDefects,
    refreshDefects,
    statusFilter,
    setStatusFilter,
  } = useDefects();
  
  useEffect(() => {
    loadDefects(userId, { status: statusFilter || undefined });
  }, [userId, statusFilter]);
  
  const handleRefresh = () => {
    refreshDefects(userId, { status: statusFilter || undefined });
  };
  
  // ... rest of component uses context state
}
```

## Step 3: Update DefectDetailsScreen

```tsx
// Before
import React, { useState, useEffect } from 'react';
import { defectApiService } from '../services/defect-api.service';

export default function DefectDetailsScreen({ route }) {
  const { defectId } = route.params;
  const [defect, setDefect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadDefectDetails = async () => {
    setIsLoading(true);
    const response = await defectApiService.getDefectDetails(defectId);
    if (response.success) {
      setDefect(response.data);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadDefectDetails();
  }, [defectId]);
  
  // ... rest of component
}

// After
import React, { useEffect } from 'react';
import { useDefects } from '../state/defects';

export default function DefectDetailsScreen({ route }) {
  const { defectId } = route.params;
  const {
    selectedDefect,
    isLoading,
    error,
    loadDefectDetails,
  } = useDefects();
  
  useEffect(() => {
    loadDefectDetails(defectId);
  }, [defectId]);
  
  // Use selectedDefect instead of local defect state
  // ... rest of component
}
```

## Step 4: Update NotificationsScreen

```tsx
// Before
import React, { useState, useEffect } from 'react';
import { defectApiService } from '../services/defect-api.service';

export default function NotificationsScreen({ route }) {
  const { userId } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadNotifications = async () => {
    setIsLoading(true);
    const response = await defectApiService.getNotifications(userId);
    if (response.success) {
      setNotifications(response.data.notifications);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadNotifications();
    
    // Manual polling
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);
  
  // ... rest of component
}

// After
import React, { useEffect } from 'react';
import { useNotifications } from '../state/defects';

export default function NotificationsScreen({ route }) {
  const { userId } = route.params;
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    startPolling,
    stopPolling,
  } = useNotifications();
  
  useEffect(() => {
    // Start automatic polling
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
  
  // ... rest of component uses context state
}
```

## Step 5: Add Notification Badge to Tab Navigator

Show unread count in the tab bar:

```tsx
// navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNotifications } from '../state/defects';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
        }}
      />
      {/* Other tabs */}
    </Tab.Navigator>
  );
}
```

## Step 6: Handle User Authentication

Clear state on logout:

```tsx
// screens/ProfileScreen.tsx or wherever logout is handled
import { useDefects, useNotifications } from '../state/defects';

function ProfileScreen() {
  const { clearState: clearDefectState } = useDefects();
  const { clearState: clearNotificationState } = useNotifications();
  
  const handleLogout = async () => {
    // Clear defect and notification state
    clearDefectState();
    clearNotificationState();
    
    // Perform logout
    await authService.logout();
    
    // Navigate to login screen
    navigation.navigate('Login');
  };
  
  return (
    <Button title="Logout" onPress={handleLogout} />
  );
}
```

## Benefits of Migration

After migrating to state management:

1. **Shared State**: Defects and notifications are accessible across all screens
2. **Automatic Polling**: Notifications update automatically every 30 seconds
3. **Reduced Duplication**: No need to duplicate API calls in each screen
4. **Better Performance**: Cached data reduces unnecessary API calls
5. **Consistent UX**: Loading and error states are handled consistently
6. **Easier Testing**: Components can be tested with mock context values

## Testing with State Management

```tsx
// __tests__/MyDefectsScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DefectProvider } from '../state/defects';
import MyDefectsScreen from '../screens/MyDefectsScreen';

describe('MyDefectsScreen', () => {
  it('renders defects list', () => {
    const { getByText } = render(
      <DefectProvider>
        <MyDefectsScreen route={{ params: { userId: 'test-user' } }} />
      </DefectProvider>
    );
    
    // Test assertions
  });
});
```

## Troubleshooting

### Error: "useDefects must be used within a DefectProvider"

**Solution**: Ensure your component is wrapped with `DefectProvider`:

```tsx
<DefectProvider>
  <YourComponent />
</DefectProvider>
```

### Notifications not updating automatically

**Solution**: Make sure you call `startPolling(userId)` in your component:

```tsx
useEffect(() => {
  startPolling(userId);
  return () => stopPolling();
}, [userId]);
```

### State not persisting between screens

**Solution**: Ensure providers are at the root level, above navigation:

```tsx
<DefectProvider>
  <NotificationProvider>
    <NavigationContainer>
      {/* Navigation */}
    </NavigationContainer>
  </NotificationProvider>
</DefectProvider>
```

## Next Steps

1. Wrap your app with providers
2. Update one screen at a time
3. Test each screen after migration
4. Remove unused local state and API calls
5. Add notification badge to tab navigator
6. Implement logout state clearing
