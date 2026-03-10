# System Configuration Handler

## Overview

The System Configuration Handler provides backend APIs for managing system-wide settings and configurations for the Sanaathana Aalaya Charithra admin application. It supports configuration management for languages, AWS Bedrock, AWS Polly, payment settings, session settings, and QR code settings.

## Features

### 1. Configuration Management
- **List Configurations**: Retrieve all configurations or filter by category
- **Get Configuration**: Retrieve a single configuration by ID
- **Update Configuration**: Update configuration settings with validation
- **Configuration History**: View change history for configurations
- **Configuration Validation**: Validate configuration values before saving

### 2. Configuration Categories

#### LANGUAGES
Manages supported languages for the platform.

**Settings Structure:**
```json
{
  "supportedLanguages": [
    {
      "code": "en",
      "name": "English",
      "enabled": true
    },
    {
      "code": "hi",
      "name": "Hindi",
      "enabled": true
    }
  ]
}
```

**Validation Rules:**
- `supportedLanguages` must be a non-empty list
- Each language must have `code`, `name`, and `enabled` fields
- `code` must be a string
- `enabled` must be a boolean

#### BEDROCK
Manages AWS Bedrock AI model configuration.

**Settings Structure:**
```json
{
  "modelId": "anthropic.claude-v2",
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 0.9,
  "stopSequences": ["Human:", "Assistant:"]
}
```

**Validation Rules:**
- `modelId`, `temperature`, and `maxTokens` are required
- `temperature` must be between 0 and 1
- `maxTokens` must be between 1 and 100,000
- `topP` (if provided) must be between 0 and 1

#### POLLY
Manages AWS Polly text-to-speech configuration.

**Settings Structure:**
```json
{
  "voicesByLanguage": {
    "en": {
      "voiceId": "Joanna",
      "engine": "neural"
    },
    "hi": {
      "voiceId": "Aditi",
      "engine": "standard"
    }
  },
  "outputFormat": "mp3",
  "sampleRate": "22050"
}
```

**Validation Rules:**
- `voicesByLanguage` is required and must be an object
- Each voice config must have `voiceId`
- `engine` (if provided) must be "standard" or "neural"
- `outputFormat` (if provided) must be "mp3", "ogg_vorbis", or "pcm"

#### PAYMENT
Manages Razorpay payment gateway configuration.

**Settings Structure:**
```json
{
  "razorpayKeyId": "rzp_test_123",
  "webhookSecret": "secret_123",
  "currency": "INR",
  "subscriptionPlans": [
    {
      "planId": "plan_1",
      "name": "Basic",
      "price": 99,
      "duration": 30
    }
  ]
}
```

**Validation Rules:**
- `razorpayKeyId` and `currency` are required
- `currency` must be a 3-letter ISO code
- Each subscription plan must have `planId`, `name`, `price`, and `duration`
- `price` must be a number
- `duration` must be an integer (days)

#### SESSION
Manages session timeout and MFA settings.

**Settings Structure:**
```json
{
  "timeoutMinutes": 480,
  "mfaRequired": true
}
```

**Validation Rules:**
- `timeoutMinutes` (if provided) must be between 5 and 1440 (24 hours)
- `mfaRequired` (if provided) must be a boolean

#### QR
Manages QR code generation settings.

**Settings Structure:**
```json
{
  "expirationDays": 365,
  "errorCorrectionLevel": "H"
}
```

**Validation Rules:**
- `expirationDays` (if provided) must be a non-negative integer
- `errorCorrectionLevel` (if provided) must be "L", "M", "Q", or "H"

### 3. Configuration Notifications

When a configuration is updated, the handler automatically:
1. Validates the new settings
2. Increments the version number
3. Logs the change to the audit trail
4. Sends an EventBridge notification to affected Lambda functions

**EventBridge Event Structure:**
```json
{
  "Source": "admin.config",
  "DetailType": "ConfigurationUpdated",
  "Detail": {
    "configId": "LANGUAGES#supported",
    "category": "LANGUAGES",
    "settings": { ... },
    "timestamp": "2024-01-01T00:00:00"
  }
}
```

### 4. Audit Logging

All configuration updates are logged to the AuditLog table with:
- User ID and timestamp
- Action performed (UPDATE_CONFIG)
- Resource type and ID
- Before and after values
- 365-day retention period (TTL)

## API Endpoints

### List Configurations
```
GET /admin/config?category={category}
```

**Query Parameters:**
- `category` (optional): Filter by configuration category

**Response:**
```json
{
  "configurations": [
    {
      "configId": "LANGUAGES#supported",
      "category": "LANGUAGES",
      "settings": { ... },
      "updatedAt": "2024-01-01T00:00:00",
      "updatedBy": "admin-123",
      "version": 1
    }
  ]
}
```

### Get Configuration
```
GET /admin/config/{configId}
```

**Response:**
```json
{
  "configuration": {
    "configId": "LANGUAGES#supported",
    "category": "LANGUAGES",
    "settings": { ... },
    "updatedAt": "2024-01-01T00:00:00",
    "updatedBy": "admin-123",
    "version": 1
  }
}
```

### Update Configuration
```
PUT /admin/config/{configId}
```

**Request Body:**
```json
{
  "settings": {
    "supportedLanguages": [
      {
        "code": "en",
        "name": "English",
        "enabled": true
      }
    ]
  }
}
```

**Response:**
```json
{
  "configuration": {
    "configId": "LANGUAGES#supported",
    "category": "LANGUAGES",
    "settings": { ... },
    "updatedAt": "2024-01-01T00:00:00",
    "updatedBy": "admin-456",
    "version": 2
  },
  "message": "Configuration updated successfully"
}
```

### Get Configuration History
```
GET /admin/config/{configId}/history?page={page}&limit={limit}
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page

**Response:**
```json
{
  "history": [
    {
      "auditId": "123-admin",
      "timestamp": "2024-01-01T00:00:00",
      "userId": "admin-123",
      "action": "UPDATE_CONFIG",
      "resource": "SystemConfiguration",
      "resourceId": "LANGUAGES#supported",
      "before": { ... },
      "after": { ... }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

### Validate Configuration
```
POST /admin/config/validate
```

**Request Body:**
```json
{
  "category": "LANGUAGES",
  "settings": {
    "supportedLanguages": [
      {
        "code": "en",
        "name": "English",
        "enabled": true
      }
    ]
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": null
}
```

Or if invalid:
```json
{
  "valid": false,
  "errors": [
    "supportedLanguages must be a list",
    "At least one language must be supported"
  ]
}
```

## Usage Example

### Updating Language Configuration

```python
# Update supported languages
result = update_config(
    config_id="LANGUAGES#supported",
    body={
        "settings": {
            "supportedLanguages": [
                {"code": "en", "name": "English", "enabled": True},
                {"code": "hi", "name": "Hindi", "enabled": True},
                {"code": "ta", "name": "Tamil", "enabled": True},
                {"code": "kn", "name": "Kannada", "enabled": False}
            ]
        }
    },
    updater_id="admin-123"
)

print(f"Configuration updated to version {result['configuration']['version']}")
```

### Validating Configuration Before Update

```python
# Validate configuration before updating
validation = validate_config({
    "category": "BEDROCK",
    "settings": {
        "modelId": "anthropic.claude-v2",
        "temperature": 0.7,
        "maxTokens": 4096
    }
})

if validation["valid"]:
    # Proceed with update
    update_config(...)
else:
    print(f"Validation errors: {validation['errors']}")
```

## Error Handling

The handler raises `ValueError` exceptions for:
- Missing required fields
- Invalid configuration values
- Non-existent configuration IDs
- Validation failures

All errors are caught by the API Gateway and returned as appropriate HTTP error responses.

## Testing

Run the test suite:
```bash
cd src/admin/handlers
python -m pytest test_config_handler.py -v
```

**Test Coverage:**
- Request routing
- Configuration listing and filtering
- Configuration retrieval
- Configuration updates
- Configuration validation (all categories)
- Configuration history
- EventBridge notifications
- Audit logging

## Dependencies

- **boto3**: AWS SDK for DynamoDB and EventBridge
- **Python 3.11+**: Required for type hints and modern Python features

## Environment Variables

- `EVENT_BUS_NAME`: EventBridge event bus name (default: "SanaathanaAalayaCharithra-EventBus")

## DynamoDB Tables

### SystemConfiguration Table
- **Partition Key**: `configId` (String) - Format: `{category}#{key}`
- **Attributes**:
  - `category` (String): Configuration category
  - `settings` (Map): Configuration settings
  - `updatedAt` (String): ISO timestamp
  - `updatedBy` (String): User ID
  - `version` (Number): Version number

### AuditLog Table
- **Partition Key**: `auditId` (String)
- **Sort Key**: `timestamp` (String)
- **GSI**: `ResourceIndex` (resource, timestamp)
- **TTL**: 365 days

## Integration with Lambda Functions

Lambda functions can subscribe to configuration change events via EventBridge:

```python
# Lambda function handler
def handler(event, context):
    if event['detail-type'] == 'ConfigurationUpdated':
        config_id = event['detail']['configId']
        category = event['detail']['category']
        settings = event['detail']['settings']
        
        # Update function configuration
        update_function_config(category, settings)
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token from AWS Cognito
2. **Authorization**: Users must have `MANAGE_SYSTEM_CONFIG` permission
3. **Validation**: All configuration values are validated before saving
4. **Audit Trail**: All changes are logged with user ID and timestamp
5. **Graceful Failures**: Notification and audit logging failures don't block updates

## Future Enhancements

1. Configuration rollback functionality
2. Configuration templates and presets
3. Configuration diff visualization
4. Real-time configuration sync to Lambda functions
5. Configuration approval workflow for critical settings
6. Configuration export/import functionality
