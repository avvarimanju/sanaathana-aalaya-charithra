# Defect Tracking API Client

This document describes the Defect Tracking API client for the Sanaathana Aalaya Charithra mobile app.

## Overview

The Defect API Service (`defect-api.service.ts`) provides a clean interface for the mobile app to interact with the defect tracking backend. It handles:

- Defect submission
- Viewing user's defects
- Getting defect details with status updates
- Managing notifications
- Authentication token management
- Error handling

## Installation

The service is already included in the mobile app. Simply import it:

```typescript
import { defectApiService } from './services/defect-api.service';
```

## Authentication

Before making API calls, set the authentication token:

```typescript
// After user logs in
defectApiService.setAuthToken(userAuthToken);

// When user logs out
defectApiService.clearAuthToken();
```

## API Methods

### 1. Submit Defect

Submit a new defect report to the backend.

```typescript
const response = await defectApiService.submitDefect({
  userId: 'user-123',
  title: 'App crashes when viewing temple details',
  description: 'The app crashes immediately when I try to view details',
  stepsToReproduce: '1. Open app\n2. Scan QR\n3. Tap details\n4. Crash',
  expectedBehavior: 'Should show temple details',
  actualBehavior: 'App crashes',
  deviceInfo: {
    platform: 'android',
    osVersion: '13.0',
    appVersion: '1.0.0',
    deviceModel: 'Samsung Galaxy S21',
  },
});

if (response.success) {
  console.log('Defect ID:', response.data.defectId);
  console.log('Status:', response.data.status); // "New"
}
```

**Required Fields:**
- `userId`: User identifier
- `title`: Defect title (min 5 characters)
- `description`: Defect description (min 10 characters)

**Optional Fields:**
- `stepsToReproduce`: Steps to reproduce the issue
- `expectedBehavior`: What should happen
- `actualBehavior`: What actually happens
- `deviceInfo`: Device information

### 2. Get User Defects

Retrieve all defects submitted by a user.

```typescript
const response = await defectApiService.getUserDefects('user-123');

if (response.success) {
  response.data.defects.forEach(defect => {
    console.log(defect.title, defect.status);
  });
}
```

**With Filters:**

```typescript
const response = await defectApiService.getUserDefects('user-123', {
  status: 'In_Progress',  // Filter by status
  limit: 10,              // Limit results
  lastEvaluatedKey: 'key' // For pagination
});
```

**Available Status Values:**
- `New`
- `Acknowledged`
- `In_Progress`
- `Resolved`
- `Closed`

### 3. Get Defect Details

Get detailed information about a specific defect, including all status updates.

```typescript
const response = await defectApiService.getDefectDetails('defect-123');

if (response.success) {
  const defect = response.data;
  console.log('Title:', defect.title);
  console.log('Status:', defect.status);
  console.log('Updates:', defect.statusUpdates.length);
  
  // Display status updates
  defect.statusUpdates.forEach(update => {
    console.log(`${update.adminName}: ${update.message}`);
  });
}
```

### 4. Get Notifications

Retrieve notifications for a user.

```typescript
// Get all notifications
const response = await defectApiService.getNotifications('user-123');

// Get only unread notifications
const unreadResponse = await defectApiService.getNotifications('user-123', true);

if (response.success) {
  response.data.notifications.forEach(notification => {
    console.log(notification.message);
    console.log('Read:', notification.isRead);
  });
}
```

### 5. Mark Notification as Read

Mark a notification as read.

```typescript
const response = await defectApiService.markNotificationRead('notification-123');

if (response.success) {
  console.log('Notification marked as read');
}
```

### 6. Get Unread Count

Get the count of unread notifications (useful for badge display).

```typescript
const count = await defectApiService.getUnreadNotificationCount('user-123');
console.log('Unread notifications:', count);
```

## Response Format

All API methods return a response in this format:

```typescript
{
  success: boolean;
  data?: T;           // Response data if successful
  error?: {           // Error details if failed
    error: string;    // Error code
    message: string;  // Error message
    details?: any;    // Additional error details
  };
}
```

## Error Handling

Always check the `success` field before accessing data:

```typescript
const response = await defectApiService.submitDefect(request);

if (response.success && response.data) {
  // Handle success
  console.log('Defect submitted:', response.data.defectId);
} else if (response.error) {
  // Handle error
  console.error('Error:', response.error.message);
  
  // Handle validation errors
  if (response.error.error === 'VALIDATION_ERROR') {
    response.error.details?.forEach((err: any) => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
  
  // Handle network errors
  if (response.error.error === 'NETWORK_ERROR') {
    // Show offline message to user
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NETWORK_ERROR`: Network request failed
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `INTERNAL_SERVER_ERROR`: Server error

## Pagination

For large result sets, use pagination:

```typescript
let allDefects = [];
let lastKey = undefined;

do {
  const response = await defectApiService.getUserDefects('user-123', {
    limit: 20,
    lastEvaluatedKey: lastKey,
  });
  
  if (response.success && response.data) {
    allDefects = allDefects.concat(response.data.defects);
    lastKey = response.data.lastEvaluatedKey;
  } else {
    break;
  }
} while (lastKey);
```

## Device Information Helper

Use the static helper to get device information:

```typescript
import { DefectAPIService } from './services/defect-api.service';

const deviceInfo = DefectAPIService.getDeviceInfo();
```

**Note:** The current implementation returns placeholder values. In a real implementation, you would use React Native's `Platform` API and a library like `react-native-device-info`:

```typescript
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const deviceInfo = {
  platform: Platform.OS,
  osVersion: Platform.Version.toString(),
  appVersion: DeviceInfo.getVersion(),
  deviceModel: DeviceInfo.getModel(),
};
```

## Integration with React Components

### Example: Submit Defect Screen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { defectApiService } from '../services/defect-api.service';

export function SubmitDefectScreen({ userId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    
    const response = await defectApiService.submitDefect({
      userId,
      title,
      description,
      deviceInfo: DefectAPIService.getDeviceInfo(),
    });
    
    setLoading(false);
    
    if (response.success) {
      Alert.alert('Success', 'Defect submitted successfully!');
      // Navigate back or clear form
    } else {
      Alert.alert('Error', response.error?.message || 'Failed to submit defect');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button
        title="Submit"
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}
```

### Example: Defect List Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { defectApiService, DefectSummary } from '../services/defect-api.service';

export function DefectListScreen({ userId }) {
  const [defects, setDefects] = useState<DefectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefects();
  }, []);

  const loadDefects = async () => {
    const response = await defectApiService.getUserDefects(userId);
    
    if (response.success && response.data) {
      setDefects(response.data.defects);
    }
    
    setLoading(false);
  };

  return (
    <FlatList
      data={defects}
      keyExtractor={(item) => item.defectId}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>Status: {item.status}</Text>
        </View>
      )}
      refreshing={loading}
      onRefresh={loadDefects}
    />
  );
}
```

### Example: Notification Badge

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { defectApiService } from '../services/defect-api.service';

export function NotificationBadge({ userId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const unreadCount = await defectApiService.getUnreadNotificationCount(userId);
      setCount(unreadCount);
    };

    loadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(loadCount, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  if (count === 0) return null;

  return (
    <View style={{ backgroundColor: 'red', borderRadius: 10 }}>
      <Text style={{ color: 'white' }}>{count}</Text>
    </View>
  );
}
```

## Testing

See `defect-api.example.ts` for comprehensive usage examples and test scenarios.

## Configuration

The API base URL is configured in `config/api.ts`. Make sure to update it with your actual API Gateway URL after deployment:

```typescript
export const API_BASE_URL = 'https://your-api-gateway-url.execute-api.region.amazonaws.com/prod';
```

## Requirements Validation

This API client implements the following requirements:

- **Requirement 1.1**: Submit defect reports ✓
- **Requirement 2.1**: View submitted defects ✓
- **Requirement 8.3**: Get notifications ✓
- **Requirement 8.4**: Mark notifications as read ✓

## Next Steps

After implementing the API client, you can:

1. Create the DefectReportScreen component (Task 12.2)
2. Create the MyDefectsScreen component (Task 12.3)
3. Create the DefectDetailsScreen component (Task 12.4)
4. Create the NotificationsScreen component (Task 12.5)
5. Add state management for defects (Task 12.6)

## Support

For issues or questions about the defect tracking API, refer to:
- Design document: `.kiro/specs/defect-tracking/design.md`
- Requirements: `.kiro/specs/defect-tracking/requirements.md`
- Backend implementation: `src/defect-tracking/`
