# Admin Backend Application

This directory contains the backend implementation for the Admin Backend Application.

## Structure

```
admin/
├── lambdas/              # Lambda function handlers
│   ├── authorizer.py     # Custom authorizer for API Gateway
│   ├── admin_api.py      # Main API handler
│   └── requirements.txt  # Python dependencies
├── services/             # Business logic services (to be created)
├── repositories/         # Data access layer (to be created)
├── models/               # Data models (to be created)
└── utils/                # Utility functions (to be created)
```

## Lambda Functions

### Authorizer Lambda
- **File**: `lambdas/authorizer.py`
- **Purpose**: Validates JWT tokens from AWS Cognito and checks user permissions
- **Runtime**: Python 3.11
- **Timeout**: 30 seconds
- **Memory**: 256 MB

### Admin API Lambda
- **File**: `lambdas/admin_api.py`
- **Purpose**: Handles all admin API requests and routes to appropriate handlers
- **Runtime**: Python 3.11
- **Timeout**: 30 seconds
- **Memory**: 512 MB

## Infrastructure

The infrastructure is defined in `infrastructure/stacks/AdminApplicationStack.py` using AWS CDK with Python.

### Resources Created:
- AWS Cognito User Pool with MFA
- Cognito Identity Pool
- 5 DynamoDB tables (AdminUsers, SystemConfiguration, AuditLog, Notifications, ContentModeration)
- Lambda functions
- API Gateway with custom authorizer
- IAM roles and policies

## Deployment

### Prerequisites
- Python 3.11+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install Python dependencies
pip install -r requirements.txt

# Deploy the stack
cdk deploy SanaathanaAalayaCharithra-AdminApp
```

### Deploy Lambda Functions

Lambda functions are automatically deployed with the CDK stack. To update just the Lambda code:

```bash
# Package Lambda dependencies
cd src/admin/lambdas
pip install -r requirements.txt -t .

# Deploy via CDK
cd ../../../infrastructure
cdk deploy SanaathanaAalayaCharithra-AdminApp
```

## Environment Variables

The Lambda functions use the following environment variables (automatically set by CDK):

- `USER_POOL_ID`: Cognito User Pool ID
- `ADMIN_USERS_TABLE`: DynamoDB table for admin users
- `SYSTEM_CONFIG_TABLE`: DynamoDB table for system configuration
- `AUDIT_LOG_TABLE`: DynamoDB table for audit logs
- `NOTIFICATIONS_TABLE`: DynamoDB table for notifications
- `CONTENT_MODERATION_TABLE`: DynamoDB table for content moderation
- `AWS_REGION`: AWS region

## Testing

```bash
# Run unit tests
pytest tests/admin/

# Run property-based tests
pytest tests/admin/properties/

# Run with coverage
pytest --cov=src/admin tests/admin/
```

## API Endpoints

All endpoints require authentication via AWS Cognito JWT token in the `Authorization` header.

### Health Check
- `GET /admin/health` - Check API health status

### Temple Management
- `GET /admin/temples` - List temples
- `GET /admin/temples/{siteId}` - Get temple details
- `POST /admin/temples` - Create temple
- `PUT /admin/temples/{siteId}` - Update temple
- `DELETE /admin/temples/{siteId}` - Delete temple (soft delete)

(More endpoints to be documented as they are implemented)

## Security

- All API endpoints require authentication via AWS Cognito
- MFA is required for all admin users
- All administrative actions are logged to the audit trail
- Session timeout is 8 hours
- Rate limiting: 100 requests/minute per user

## Development

### Adding New Endpoints

1. Add handler function in `admin_api.py` or create a new handler file
2. Update routing logic in `route_request()` function
3. Add tests in `tests/admin/`
4. Update API documentation

### Adding New Lambda Functions

1. Create new Lambda function file in `lambdas/`
2. Add Lambda resource in `AdminApplicationStack.py`
3. Grant necessary IAM permissions
4. Add environment variables
5. Update this README

## Monitoring

- CloudWatch Logs: `/aws/lambda/SanaathanaAalayaCharithra-Admin*`
- CloudWatch Metrics: Lambda invocations, duration, errors
- X-Ray Tracing: Enabled for performance monitoring

## Support

For issues or questions, contact the development team.
