# User Management Handler

## Overview

The User Management Handler provides comprehensive CRUD operations for admin users in the Sanaathana Aalaya Charithra Admin Backend Application. It handles user creation, updates, activation/deactivation, and activity tracking.

## Features

### 1. User Listing
- **Endpoint**: `GET /admin/users`
- **Query Parameters**:
  - `page` (default: 1): Page number for pagination
  - `limit` (default: 50): Number of users per page
  - `search`: Search by email or name
  - `role`: Filter by role (SUPER_ADMIN, CONTENT_ADMIN, ANALYTICS_VIEWER, SUPPORT_ADMIN)
  - `status`: Filter by status (ACTIVE, DEACTIVATED, PENDING_ACTIVATION)
- **Response**: Paginated list of admin users

### 2. Get User Details
- **Endpoint**: `GET /admin/users/{userId}`
- **Response**: User details with recent activity log (last 10 activities)

### 3. Create User
- **Endpoint**: `POST /admin/users`
- **Required Fields**:
  - `email`: User email (must be unique)
  - `name`: User full name
  - `role`: User role (SUPER_ADMIN, CONTENT_ADMIN, ANALYTICS_VIEWER, SUPPORT_ADMIN)
- **Features**:
  - Validates email uniqueness
  - Automatically assigns permissions based on role
  - Sends activation email via AWS SES
  - Sets initial status to PENDING_ACTIVATION
- **Response**: Created user with activation email status

### 4. Update User
- **Endpoint**: `PUT /admin/users/{userId}`
- **Updatable Fields**:
  - `name`: User full name
  - `role`: User role (automatically updates permissions)
  - `permissions`: Custom permissions (optional)
  - `mfaEnabled`: MFA status
- **Response**: Updated user data

### 5. Deactivate User
- **Endpoint**: `POST /admin/users/{userId}/deactivate`
- **Features**:
  - Sets user status to DEACTIVATED
  - Terminates all active sessions
  - Records deactivation timestamp and deactivator
- **Response**: Success message with terminated sessions count

### 6. Activate User
- **Endpoint**: `POST /admin/users/{userId}/activate`
- **Features**:
  - Sets user status to ACTIVE
  - Records activation timestamp and activator
- **Response**: Success message

### 7. Get User Activity
- **Endpoint**: `GET /admin/users/{userId}/activity`
- **Query Parameters**:
  - `page` (default: 1): Page number
  - `limit` (default: 50): Activities per page
- **Response**: Paginated user activity log from audit trail

## Role-Based Permissions

### SUPER_ADMIN
- MANAGE_TEMPLES
- MANAGE_ARTIFACTS
- MANAGE_USERS
- VIEW_ANALYTICS
- MANAGE_PAYMENTS
- MANAGE_SYSTEM_CONFIG
- VIEW_LOGS
- MODERATE_CONTENT

### CONTENT_ADMIN
- MANAGE_TEMPLES
- MANAGE_ARTIFACTS
- VIEW_ANALYTICS
- MODERATE_CONTENT

### ANALYTICS_VIEWER
- VIEW_ANALYTICS
- VIEW_LOGS

### SUPPORT_ADMIN
- VIEW_ANALYTICS
- VIEW_LOGS
- MANAGE_PAYMENTS

## Email Activation

When a new user is created, an activation email is sent via AWS SES containing:
- Welcome message
- Activation link with userId parameter
- Instructions for setting password

**Email Configuration**:
- Sender: Configured via `SES_SENDER_EMAIL` environment variable
- Default: `admin@sanaathana-aalaya-charithra.com`
- Template: HTML and plain text versions

## Audit Logging

All user management actions are automatically logged to the audit trail:
- User creation
- User updates
- User activation/deactivation
- Includes timestamp, performing user, and action details

## Session Management

When a user is deactivated:
1. User status is set to DEACTIVATED
2. All active sessions are terminated via `terminate_user_sessions()`
3. User cannot log in until reactivated

## Data Model

### AdminUser Schema
```python
{
    "userId": str,              # UUID
    "email": str,               # Unique email address
    "name": str,                # Full name
    "role": str,                # User role
    "permissions": List[str],   # List of permissions
    "status": str,              # ACTIVE, DEACTIVATED, PENDING_ACTIVATION
    "createdAt": str,           # ISO timestamp
    "createdBy": str,           # Creator userId
    "mfaEnabled": bool,         # MFA status
    "lastLogin": str,           # ISO timestamp (optional)
    "updatedAt": str,           # ISO timestamp (optional)
    "updatedBy": str,           # Updater userId (optional)
    "deactivatedAt": str,       # ISO timestamp (optional)
    "deactivatedBy": str,       # Deactivator userId (optional)
    "activatedAt": str,         # ISO timestamp (optional)
    "activatedBy": str,         # Activator userId (optional)
}
```

## DynamoDB Tables

### AdminUsers Table
- **Partition Key**: `userId`
- **GSI**: `EmailIndex` on `email` for uniqueness checks

### AuditLog Table
- **Partition Key**: `auditId`
- **Sort Key**: `timestamp`
- **GSI**: `UserIdIndex` on `userId` for activity queries

## Error Handling

The handler provides specific error messages for:
- Missing required fields
- Invalid email format
- Duplicate email addresses
- Invalid roles
- User not found
- Already deactivated/activated users

## Testing

Comprehensive unit tests are provided in `test_user_handler.py`:
- List users with filters
- Get user details
- Create user with validation
- Update user
- Activate/deactivate user
- Get user activity
- Role-based permissions

Run tests:
```bash
pytest test_user_handler.py -v
```

## Integration

The user handler is integrated into the main admin API via `admin_api.py`:

```python
from handlers.user_handler import handle_user_request

# In route_request():
if path.startswith("/admin/users"):
    return handle_user_request(method, path, body, query_params, user_id)
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:
- **Requirement 6.1**: Create new administrator accounts
- **Requirement 6.2**: Assign permissions based on roles
- **Requirement 6.3**: Update administrator account information
- **Requirement 6.4**: Deactivate administrator accounts
- **Requirement 6.5**: Display list of administrator accounts
- **Requirement 6.6**: Enforce unique email addresses
- **Requirement 6.7**: Send account activation emails
- **Requirement 6.8**: Terminate sessions on deactivation
- **Requirement 6.9**: Log all account management actions

## Future Enhancements

1. **Password Management**: Integration with AWS Cognito for password reset
2. **MFA Configuration**: Enable/disable MFA for users
3. **Session Management**: Enhanced session tracking and management
4. **Bulk Operations**: Bulk user activation/deactivation
5. **Advanced Filtering**: More sophisticated search and filter options
6. **Email Templates**: Customizable email templates via SES
