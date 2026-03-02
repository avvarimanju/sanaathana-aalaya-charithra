# Defect Tracking System

This module implements a comprehensive defect tracking system for the Sanaathana-Aalaya-Charithra temple history application. It enables end users to submit bug reports through the mobile app and allows administrators to manage, track, and communicate status updates.

## Overview

The defect tracking system provides:
- **User Defect Submission**: End users can submit detailed bug reports with device information
- **Admin Management**: Administrators can view, filter, and manage all defect reports
- **Status Workflow**: Enforced state machine for defect lifecycle (New → Acknowledged → In_Progress → Resolved → Closed)
- **Status Updates**: Administrators can add comments and updates to defects
- **Notifications**: Users receive notifications when their defects are updated
- **Validation**: Comprehensive input validation using Zod schemas

## Architecture

### Technology Stack
- **Backend**: AWS Lambda (Node.js 18.x with TypeScript)
- **Database**: Amazon DynamoDB with Global Secondary Indexes
- **API**: AWS API Gateway (REST API)
- **Notifications**: Amazon SNS (optional)
- **Validation**: Zod schema validation
- **Testing**: Jest + fast-check (property-based testing)

### Data Models

#### Defect
- Primary Key: `defectId` (UUID)
- Contains: title, description, status, timestamps, device info
- GSIs: `userId-createdAt-index`, `status-createdAt-index`

#### StatusUpdate
- Primary Key: `updateId` (UUID)
- Contains: message, status changes, admin info, timestamp
- GSI: `defectId-timestamp-index`

#### Notification
- Primary Key: `notificationId` (UUID)
- Contains: message, type, read status, TTL (90 days)
- GSI: `userId-createdAt-index`

## Directory Structure

```
src/defect-tracking/
├── types/
│   └── index.ts              # TypeScript type definitions
├── validation/
│   └── schemas.ts            # Zod validation schemas
├── repositories/             # (To be implemented in Task 2)
│   ├── DefectRepository.ts
│   ├── StatusUpdateRepository.ts
│   └── NotificationRepository.ts
├── services/                 # (To be implemented in Tasks 3-7)
│   ├── StatusWorkflowService.ts
│   ├── NotificationService.ts
│   └── DefectService.ts
└── lambdas/                  # (To be implemented in Task 9)
    ├── submit-defect.ts
    ├── get-user-defects.ts
    ├── get-defect-details.ts
    ├── get-all-defects.ts
    ├── update-defect-status.ts
    ├── add-status-update.ts
    ├── get-notifications.ts
    └── mark-notification-read.ts
```

## Status Workflow

The defect lifecycle follows a strict state machine:

```
New → Acknowledged → In_Progress → Resolved → Closed
                                      ↓
                                  In_Progress (reopening)
```

Valid transitions:
- **New** → Acknowledged
- **Acknowledged** → In_Progress
- **In_Progress** → Resolved
- **Resolved** → Closed or In_Progress (reopening)
- **Closed** → (terminal state, no transitions)

## Validation Rules

### Defect Submission
- **Title**: 5-200 characters (required)
- **Description**: 10-5000 characters (required)
- **Steps to Reproduce**: 0-5000 characters (optional)
- **Expected Behavior**: 0-2000 characters (optional)
- **Actual Behavior**: 0-2000 characters (optional)
- **User ID**: Valid UUID (required)
- **Device Platform**: 'android' or 'ios' (optional)

### Status Updates
- **New Status**: Valid DefectStatus enum value (required)
- **Comment**: 0-2000 characters (optional)

### Status Update Messages
- **Message**: 1-2000 characters (required)

## Infrastructure

### DynamoDB Tables

#### Defects Table
- **Table Name**: `{environment}-defect-tracking-defects`
- **Billing**: On-Demand
- **Encryption**: AWS Managed
- **Point-in-Time Recovery**: Enabled for production
- **GSIs**:
  - `userId-createdAt-index`: Query user's defects
  - `status-createdAt-index`: Filter by status

#### StatusUpdates Table
- **Table Name**: `{environment}-defect-tracking-status-updates`
- **Billing**: On-Demand
- **Encryption**: AWS Managed
- **GSI**: `defectId-timestamp-index`: Query defect's update history

#### Notifications Table
- **Table Name**: `{environment}-defect-tracking-notifications`
- **Billing**: On-Demand
- **Encryption**: AWS Managed
- **TTL**: 90 days (automatic cleanup)
- **GSI**: `userId-createdAt-index`: Query user's notifications

## Usage

### Type Definitions

```typescript
import {
  Defect,
  DefectStatus,
  StatusUpdate,
  Notification,
  SubmitDefectRequest
} from './types';
```

### Validation

```typescript
import { validateDefectSubmission } from './validation/schemas';

const result = validateDefectSubmission({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'App crashes on startup',
  description: 'The app crashes immediately after opening on Android 13',
  deviceInfo: {
    platform: 'android',
    osVersion: '13.0',
    appVersion: '1.0.0'
  }
});

if (result.valid) {
  // Proceed with submission
  console.log('Valid data:', result.data);
} else {
  // Handle validation errors
  console.error('Validation errors:', result.errors);
}
```

## Testing

### Run Tests

```bash
# Run all defect tracking tests
npm test -- tests/defect-tracking

# Run with coverage
npm test -- tests/defect-tracking --coverage

# Run specific test file
npm test -- tests/defect-tracking/validation.test.ts
```

### Test Coverage

- **Infrastructure Tests**: CDK stack configuration, DynamoDB tables, GSIs
- **Validation Tests**: Zod schema validation for all input types
- **Property-Based Tests**: (To be implemented in subsequent tasks)
- **Integration Tests**: (To be implemented in subsequent tasks)

## Requirements Mapping

This implementation satisfies the following requirements from the design document:

### Task 1 (Current)
- **Requirement 9.1**: Defect persistence to DynamoDB
- **Requirement 9.2**: Status change persistence
- **Requirement 9.3**: Status update persistence
- **Requirement 9.4**: Referential integrity (via GSIs)
- **Requirement 7.1-7.4**: Input validation

## Next Steps

1. **Task 2**: Implement repository layer (DefectRepository, StatusUpdateRepository, NotificationRepository)
2. **Task 3**: Implement status workflow service with state machine logic
3. **Task 4**: Implement validation service
4. **Task 5**: Implement notification service
5. **Task 7**: Implement core defect service
6. **Task 8**: Implement authorization and access control
7. **Task 9**: Implement Lambda function handlers
8. **Task 11**: Configure API Gateway routes
9. **Task 12**: Implement mobile app integration
10. **Task 13**: Implement Admin Portal

## API Endpoints (To be implemented)

### User Endpoints
- `POST /defects` - Submit new defect
- `GET /defects/user/{userId}` - Get user's defects
- `GET /defects/{defectId}` - Get defect details
- `GET /notifications/user/{userId}` - Get user notifications
- `PUT /notifications/{notificationId}/read` - Mark notification as read

### Admin Endpoints
- `GET /admin/defects` - Get all defects (with filters)
- `PUT /admin/defects/{defectId}/status` - Update defect status
- `POST /admin/defects/{defectId}/updates` - Add status update

## Contributing

When adding new features to the defect tracking system:

1. Update type definitions in `types/index.ts`
2. Add validation schemas in `validation/schemas.ts`
3. Write tests before implementation
4. Follow the existing patterns for repositories and services
5. Update this README with new functionality

## License

MIT
