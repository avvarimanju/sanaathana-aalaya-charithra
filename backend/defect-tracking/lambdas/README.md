# Defect Tracking Lambda Handlers

This directory contains all AWS Lambda function handlers for the defect tracking system API endpoints.

## Lambda Functions

### 1. Submit Defect (`submit-defect.ts`)
- **Endpoint**: `POST /defects`
- **Purpose**: Allows end users to submit new defect reports
- **Authentication**: User authentication required
- **Authorization**: Any authenticated user
- **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10

**Request Body**:
```json
{
  "userId": "string",
  "title": "string (min 5 chars)",
  "description": "string (min 10 chars)",
  "stepsToReproduce": "string (optional)",
  "expectedBehavior": "string (optional)",
  "actualBehavior": "string (optional)",
  "deviceInfo": {
    "platform": "android | ios",
    "osVersion": "string",
    "appVersion": "string",
    "deviceModel": "string (optional)"
  }
}
```

**Response (201)**:
```json
{
  "defectId": "string",
  "status": "New",
  "createdAt": "ISO 8601 timestamp"
}
```

### 2. Get User Defects (`get-user-defects.ts`)
- **Endpoint**: `GET /defects/user/{userId}`
- **Purpose**: Retrieves all defects submitted by a specific user
- **Authentication**: User authentication required
- **Authorization**: Any authenticated user
- **Requirements**: 2.1, 2.2, 2.3, 2.4

**Query Parameters**:
- `status`: Filter by status (optional)
- `limit`: Number of results (optional, default: 20)
- `lastEvaluatedKey`: Pagination token (optional)

**Response (200)**:
```json
{
  "defects": [
    {
      "defectId": "string",
      "title": "string",
      "description": "string",
      "status": "DefectStatus",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "updateCount": "number"
    }
  ],
  "lastEvaluatedKey": "string (optional)",
  "totalCount": "number (optional)"
}
```

### 3. Get Defect Details (`get-defect-details.ts`)
- **Endpoint**: `GET /defects/{defectId}`
- **Purpose**: Retrieves detailed information about a specific defect including status updates
- **Authentication**: User authentication required
- **Authorization**: User can only view their own defects
- **Requirements**: 2.2, 2.3, 2.4, 3.4, 3.5, 10.5

**Response (200)**:
```json
{
  "defectId": "string",
  "userId": "string",
  "title": "string",
  "description": "string",
  "stepsToReproduce": "string (optional)",
  "expectedBehavior": "string (optional)",
  "actualBehavior": "string (optional)",
  "status": "DefectStatus",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "deviceInfo": "object (optional)",
  "updateCount": "number",
  "statusUpdates": [
    {
      "updateId": "string",
      "message": "string",
      "adminId": "string",
      "adminName": "string",
      "timestamp": "ISO 8601 timestamp",
      "previousStatus": "DefectStatus (optional)",
      "newStatus": "DefectStatus (optional)"
    }
  ]
}
```

### 4. Get All Defects - Admin (`get-all-defects.ts`)
- **Endpoint**: `GET /admin/defects`
- **Purpose**: Retrieves all defects with filtering and search capabilities
- **Authentication**: Admin authentication required
- **Authorization**: Admin only
- **Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.6

**Query Parameters**:
- `status`: Filter by status (optional)
- `search`: Search by defect ID or title (optional)
- `limit`: Number of results (optional, default: 20)
- `lastEvaluatedKey`: Pagination token (optional)

**Response (200)**: Same as Get User Defects

### 5. Update Defect Status - Admin (`update-defect-status.ts`)
- **Endpoint**: `PUT /admin/defects/{defectId}/status`
- **Purpose**: Updates the status of a defect with workflow validation
- **Authentication**: Admin authentication required
- **Authorization**: Admin only
- **Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 8.1, 10.1

**Request Body**:
```json
{
  "newStatus": "DefectStatus",
  "comment": "string (optional)"
}
```

**Response (200)**:
```json
{
  "defectId": "string",
  "previousStatus": "DefectStatus",
  "newStatus": "DefectStatus",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Response (400)** - Invalid Transition:
```json
{
  "error": "INVALID_STATUS_TRANSITION",
  "message": "Cannot transition from Resolved to Acknowledged",
  "currentStatus": "Resolved",
  "attemptedStatus": "Acknowledged",
  "allowedTransitions": ["Closed", "In_Progress"]
}
```

### 6. Add Status Update - Admin (`add-status-update.ts`)
- **Endpoint**: `POST /admin/defects/{defectId}/updates`
- **Purpose**: Adds a comment/status update to a defect
- **Authentication**: Admin authentication required
- **Authorization**: Admin only
- **Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 10.2

**Request Body**:
```json
{
  "message": "string"
}
```

**Response (201)**:
```json
{
  "updateId": "string",
  "defectId": "string",
  "message": "string",
  "adminId": "string",
  "adminName": "string",
  "timestamp": "ISO 8601 timestamp"
}
```

### 7. Get Notifications (`get-notifications.ts`)
- **Endpoint**: `GET /notifications/user/{userId}`
- **Purpose**: Retrieves notifications for a specific user
- **Authentication**: User authentication required
- **Authorization**: Any authenticated user
- **Requirements**: 8.3

**Query Parameters**:
- `unreadOnly`: Return only unread notifications (optional, default: false)

**Response (200)**:
```json
{
  "notifications": [
    {
      "notificationId": "string",
      "defectId": "string",
      "defectTitle": "string",
      "message": "string",
      "type": "STATUS_CHANGE | COMMENT_ADDED",
      "isRead": "boolean",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

### 8. Mark Notification as Read (`mark-notification-read.ts`)
- **Endpoint**: `PUT /notifications/{notificationId}/read`
- **Purpose**: Marks a notification as read
- **Authentication**: User authentication required
- **Authorization**: Any authenticated user
- **Requirements**: 8.4

**Response (200)**:
```json
{
  "notificationId": "string",
  "isRead": true
}
```

## Environment Variables

All Lambda functions require the following environment variables:

- `DEFECTS_TABLE_NAME`: Name of the DynamoDB Defects table (default: "Defects")
- `STATUS_UPDATES_TABLE_NAME`: Name of the DynamoDB StatusUpdates table (default: "StatusUpdates")
- `NOTIFICATIONS_TABLE_NAME`: Name of the DynamoDB Notifications table (default: "Notifications")
- `AWS_REGION`: AWS region for DynamoDB client

## Error Handling

All Lambda handlers implement consistent error handling:

### Error Response Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)",
  "requestId": "AWS request ID for debugging"
}
```

### HTTP Status Codes
- `200`: Success (GET, PUT)
- `201`: Created (POST)
- `400`: Bad Request (validation errors, invalid transitions)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (unexpected errors)

### Error Types
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Requested resource not found
- `INVALID_STATUS_TRANSITION`: Status transition not allowed
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Authorization

### User Authentication
User authentication is extracted from:
1. API Gateway authorizer context (`event.requestContext.authorizer.claims`)
2. Custom headers (`x-user-id`, `x-user-role`, `x-user-name`)

### Admin Authorization
Admin endpoints verify the user role:
- User role must be `"admin"` (from authorizer claims or `x-user-role` header)
- Non-admin users receive `403 Forbidden` response

### Access Control
- Users can only view their own defects (enforced in `get-defect-details`)
- Admins can view all defects (enforced in `get-all-defects`)
- Only admins can update defect status or add status updates

## CORS Configuration

All Lambda handlers include CORS headers:
```typescript
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
}
```

For production, configure specific origins in API Gateway.

## Deployment

These Lambda functions are deployed via AWS CDK in the `DefectTrackingStack`. Each function:
- Uses Node.js 18.x runtime
- Has appropriate IAM permissions for DynamoDB access
- Is integrated with API Gateway REST API
- Has CloudWatch Logs enabled for monitoring

## Testing

Lambda handlers can be tested:
1. **Unit Tests**: Mock DynamoDB and test handler logic
2. **Integration Tests**: Use DynamoDB Local or test tables
3. **Manual Testing**: Use API Gateway test console or Postman

Example test invocation:
```typescript
import { handler } from './submit-defect';

const event = {
  body: JSON.stringify({
    userId: 'test-user',
    title: 'Test Bug',
    description: 'This is a test bug description'
  }),
  requestContext: { requestId: 'test-123' }
};

const result = await handler(event);
console.log(result);
```

## Monitoring

Monitor Lambda functions using:
- **CloudWatch Logs**: View execution logs and errors
- **CloudWatch Metrics**: Track invocations, duration, errors
- **X-Ray**: Distributed tracing for debugging
- **Custom Metrics**: Track business metrics (defect submissions, status changes)

## Future Enhancements

1. **Rate Limiting**: Add per-user rate limiting for defect submissions
2. **Caching**: Cache frequently accessed defects using ElastiCache
3. **Batch Operations**: Support bulk status updates for admins
4. **WebSocket Support**: Real-time notifications via WebSocket API
5. **File Attachments**: Support image/file uploads with defects
