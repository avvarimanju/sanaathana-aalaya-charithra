# Admin Defect API Client

This directory contains the API client for the Admin Portal to interact with the defect tracking backend.

## Overview

The `adminDefectApi.ts` file provides a TypeScript client for making authenticated API calls to the defect tracking system's admin endpoints.

## Features

- **Admin Authentication**: All requests include admin authentication headers
- **Type Safety**: Full TypeScript type definitions for requests and responses
- **Error Handling**: Comprehensive error handling with typed error responses
- **Timeout Support**: Configurable request timeouts (default 30 seconds)
- **Pagination**: Support for paginated defect lists
- **Filtering**: Filter defects by status and search by ID/title
- **Status Workflow**: Client-side validation for status transitions

## Usage

### Basic Setup

```typescript
import { adminDefectApi } from './api/adminDefectApi';

// Set admin authentication token
adminDefectApi.setAdminToken('your-admin-jwt-token');
```

### Get All Defects

```typescript
// Get all defects
const response = await adminDefectApi.getAllDefects();

if (response.success) {
  console.log('Defects:', response.data.defects);
  console.log('Total count:', response.data.totalCount);
}

// Get defects with filters
const filteredResponse = await adminDefectApi.getAllDefects({
  status: 'New',
  limit: 20,
  search: 'login bug'
});
```

### Get Defect Details

```typescript
const response = await adminDefectApi.getDefectDetails('defect-id-123');

if (response.success) {
  const defect = response.data;
  console.log('Title:', defect.title);
  console.log('Status:', defect.status);
  console.log('Updates:', defect.statusUpdates);
}
```

### Update Defect Status

```typescript
const response = await adminDefectApi.updateDefectStatus('defect-id-123', {
  newStatus: 'Acknowledged',
  comment: 'We have received your report and are investigating'
});

if (response.success) {
  console.log('Status updated:', response.data.newStatus);
} else {
  // Handle invalid transition error
  if (response.error?.error === 'INVALID_STATUS_TRANSITION') {
    console.error('Invalid transition from', response.error.currentStatus);
    console.error('Allowed transitions:', response.error.allowedTransitions);
  }
}
```

### Add Status Update

```typescript
const response = await adminDefectApi.addStatusUpdate('defect-id-123', {
  message: 'We have identified the root cause and are working on a fix'
});

if (response.success) {
  console.log('Update added:', response.data.updateId);
}
```

### Client-Side Validation

```typescript
// Check if a status transition is valid before making the API call
const isValid = adminDefectApi.isValidStatusTransition('New', 'Acknowledged');

if (isValid) {
  // Proceed with status update
  await adminDefectApi.updateDefectStatus(defectId, { newStatus: 'Acknowledged' });
}

// Get allowed transitions for a status
const allowedTransitions = adminDefectApi.getAllowedTransitions('Resolved');
console.log('Can transition to:', allowedTransitions); // ['Closed', 'In_Progress']
```

### Get Statistics

```typescript
const response = await adminDefectApi.getDefectStatistics();

if (response.success) {
  console.log('Total defects:', response.data.total);
  console.log('By status:', response.data.byStatus);
  // Output: { New: 5, Acknowledged: 3, In_Progress: 2, Resolved: 1, Closed: 10 }
}
```

## Configuration

### Environment Variables

Create a `.env` file in the admin-portal root:

```env
REACT_APP_API_BASE_URL=https://api.your-domain.com
```

### Custom Configuration

```typescript
import { createAdminDefectAPIClient } from './api/adminDefectApi';

const customClient = createAdminDefectAPIClient({
  baseUrl: 'https://staging-api.your-domain.com',
  timeout: 60000 // 60 seconds
});

customClient.setAdminToken('admin-token');
```

## API Endpoints

### GET /admin/defects

Get all defects with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by defect status
- `search` (optional): Search by defect ID or title
- `limit` (optional): Number of results per page (default: 20)
- `lastEvaluatedKey` (optional): Pagination token

**Response:**
```typescript
{
  defects: DefectSummary[];
  lastEvaluatedKey?: string;
  totalCount: number;
}
```

### GET /admin/defects/{defectId}

Get detailed information about a specific defect.

**Response:**
```typescript
{
  defectId: string;
  userId: string;
  title: string;
  description: string;
  status: DefectStatus;
  statusUpdates: StatusUpdate[];
  // ... more fields
}
```

### PUT /admin/defects/{defectId}/status

Update the status of a defect.

**Request Body:**
```typescript
{
  newStatus: DefectStatus;
  comment?: string;
}
```

**Response:**
```typescript
{
  defectId: string;
  previousStatus: DefectStatus;
  newStatus: DefectStatus;
  updatedAt: string;
}
```

### POST /admin/defects/{defectId}/updates

Add a status update comment to a defect.

**Request Body:**
```typescript
{
  message: string;
}
```

**Response:**
```typescript
{
  updateId: string;
  defectId: string;
  message: string;
  timestamp: string;
}
```

## Error Handling

All API methods return a response object with a `success` boolean:

```typescript
const response = await adminDefectApi.getAllDefects();

if (response.success) {
  // Handle success
  const defects = response.data.defects;
} else {
  // Handle error
  const error = response.error;
  console.error('Error:', error.error);
  console.error('Message:', error.message);
  
  // Check for specific error types
  switch (error.error) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'FORBIDDEN':
      // Show permission denied message
      break;
    case 'INVALID_STATUS_TRANSITION':
      // Show allowed transitions
      console.log('Allowed:', error.allowedTransitions);
      break;
    case 'NETWORK_ERROR':
      // Show network error message
      break;
    case 'TIMEOUT_ERROR':
      // Show timeout message
      break;
  }
}
```

## Status Workflow

The defect tracking system enforces a strict status workflow:

```
New → Acknowledged → In_Progress → Resolved → Closed
                                      ↓
                                  In_Progress (reopen)
```

**Valid Transitions:**
- `New` → `Acknowledged`
- `Acknowledged` → `In_Progress`
- `In_Progress` → `Resolved`
- `Resolved` → `Closed` or `In_Progress`
- `Closed` → (terminal state, no transitions)

Use the `isValidStatusTransition()` method to validate transitions before making API calls.

## Type Definitions

### DefectStatus

```typescript
type DefectStatus = 
  | 'New'
  | 'Acknowledged'
  | 'In_Progress'
  | 'Resolved'
  | 'Closed';
```

### DefectSummary

```typescript
interface DefectSummary {
  defectId: string;
  userId: string;
  title: string;
  description: string;
  status: DefectStatus;
  createdAt: string;
  updatedAt: string;
  updateCount: number;
}
```

### DefectDetails

```typescript
interface DefectDetails extends DefectSummary {
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  deviceInfo?: DeviceInfo;
  statusUpdates: StatusUpdate[];
}
```

### StatusUpdate

```typescript
interface StatusUpdate {
  updateId: string;
  message: string;
  previousStatus?: DefectStatus;
  newStatus?: DefectStatus;
  adminId: string;
  adminName: string;
  timestamp: string;
}
```

## Testing

Example test using the API client:

```typescript
import { createAdminDefectAPIClient } from './adminDefectApi';

describe('Admin Defect API Client', () => {
  let client: AdminDefectAPIClient;

  beforeEach(() => {
    client = createAdminDefectAPIClient({
      baseUrl: 'https://test-api.example.com'
    });
    client.setAdminToken('test-admin-token');
  });

  it('should get all defects', async () => {
    const response = await client.getAllDefects();
    expect(response.success).toBe(true);
    expect(response.data?.defects).toBeDefined();
  });

  it('should validate status transitions', () => {
    expect(client.isValidStatusTransition('New', 'Acknowledged')).toBe(true);
    expect(client.isValidStatusTransition('New', 'Closed')).toBe(false);
  });
});
```

## Requirements Validation

This API client implements the following requirements:

- **Requirement 3.1**: Admin interface to view all defects
- **Requirement 4.1**: Admin ability to update defect status
- **Requirement 5.1**: Admin ability to add status updates
- **Requirement 10.1**: Admin authentication for privileged operations
- **Requirement 10.2**: Admin authorization for status updates

## Related Files

- `../../mobile-app/src/services/defect-api.service.ts` - Mobile app API client
- `src/defect-tracking/services/DefectService.ts` - Backend service implementation
- `infrastructure/stacks/DefectTrackingStack.ts` - Infrastructure definition
