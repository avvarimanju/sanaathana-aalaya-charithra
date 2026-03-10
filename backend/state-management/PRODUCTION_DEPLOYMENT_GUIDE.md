# State Visibility Management - Production Deployment Guide

## Overview

This is a production-grade enterprise feature for managing which Indian states are visible in the mobile application. The system uses AWS DynamoDB for storage, Lambda functions for business logic, and API Gateway for HTTP endpoints.

## Architecture

### Components

1. **DynamoDB Table**: `StateVisibilitySettings-{env}`
   - Stores state visibility configuration
   - Point-in-time recovery enabled
   - Encryption at rest enabled
   - Pay-per-request billing

2. **Lambda Functions**:
   - `GetStateVisibility`: Public endpoint for mobile apps
   - `UpdateStateVisibility`: Admin endpoint for configuration

3. **API Gateway**:
   - `/api/public/states/visible` (GET) - Public, cached
   - `/api/states/visibility` (GET/PUT) - Admin, authenticated

4. **CloudFront**: Caches public endpoint responses (5 minutes TTL)

### Data Flow

```
Mobile App → CloudFront → API Gateway → GetStateVisibility Lambda → DynamoDB
Admin Portal → API Gateway → UpdateStateVisibility Lambda → DynamoDB
```

## Prerequisites

- AWS CLI configured
- Node.js 18.x or later
- AWS account with appropriate permissions
- Cognito User Pool for admin authentication

## Deployment Steps

### Step 1: Deploy CloudFormation Stack

```bash
cd src/state-management/cloudformation

# Deploy to development
aws cloudformation deploy \
  --template-file state-visibility-stack.yaml \
  --stack-name state-visibility-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy to production
aws cloudformation deploy \
  --template-file state-visibility-stack.yaml \
  --stack-name state-visibility-prod \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 2: Build and Deploy Lambda Functions

```bash
cd src/state-management/lambdas

# Install dependencies
npm install

# Build TypeScript
npm run build

# Package Lambda functions
zip -r getStateVisibility.zip dist/getStateVisibility.js node_modules/
zip -r updateStateVisibility.zip dist/updateStateVisibility.js node_modules/

# Deploy to AWS
aws lambda update-function-code \
  --function-name GetStateVisibility-prod \
  --zip-file fileb://getStateVisibility.zip \
  --region us-east-1

aws lambda update-function-code \
  --function-name UpdateStateVisibility-prod \
  --zip-file fileb://updateStateVisibility.zip \
  --region us-east-1
```

### Step 3: Configure API Gateway

```bash
# Get Lambda function ARNs
GET_FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name state-visibility-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`GetStateVisibilityFunctionArn`].OutputValue' \
  --output text)

UPDATE_FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name state-visibility-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`UpdateStateVisibilityFunctionArn`].OutputValue' \
  --output text)

# Create API Gateway resources and methods
# (Use AWS Console or Terraform for complex API Gateway setup)
```

### Step 4: Configure CloudFront

```bash
# Add CloudFront distribution for caching
# Cache policy: 5 minutes TTL for /api/public/states/visible
# Origin: API Gateway
```

### Step 5: Initialize Default Settings

```bash
# Run initialization script
node scripts/initialize-state-visibility.js --environment prod
```

### Step 6: Update Environment Variables

**Admin Portal** (`.env.production`):
```env
REACT_APP_API_URL=https://api.sanaathana-aalaya.com
```

**Mobile App** (`.env.production`):
```env
EXPO_PUBLIC_API_URL=https://api.sanaathana-aalaya.com
```

### Step 7: Deploy Applications

```bash
# Deploy Admin Portal
cd admin-portal
npm run build
aws s3 sync build/ s3://admin-portal-prod/

# Build mobile app
cd mobile-app
eas build --platform all --profile production
```

## Configuration

### DynamoDB Table Structure

```typescript
{
  PK: "SETTINGS",           // Partition key
  SK: "CURRENT",            // Sort key
  settings: {               // State visibility map
    "AP": true,
    "KA": true,
    "TN": false,
    // ... all 36 states
  },
  updatedAt: "2026-02-28T10:30:00Z",
  updatedBy: "admin@example.com",
  version: 1
}
```

### API Endpoints

#### GET /api/public/states/visible

**Purpose**: Mobile apps fetch visible states

**Authentication**: None (public endpoint)

**Caching**: 5 minutes via CloudFront

**Response**:
```json
{
  "visibleStates": ["AP", "KA"],
  "allVisible": false,
  "updatedAt": "2026-02-28T10:30:00Z",
  "version": 1
}
```

#### GET /api/states/visibility

**Purpose**: Admin Portal fetches current settings

**Authentication**: Required (Cognito JWT)

**Response**:
```json
{
  "settings": {
    "AP": true,
    "KA": true,
    "TN": false
  },
  "updatedAt": "2026-02-28T10:30:00Z",
  "updatedBy": "admin@example.com",
  "version": 1
}
```

#### PUT /api/states/visibility

**Purpose**: Admin updates state visibility

**Authentication**: Required (Cognito JWT)

**Request**:
```json
{
  "settings": {
    "AP": true,
    "KA": true,
    "TN": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": { ... },
  "updatedAt": "2026-02-28T10:30:00Z",
  "updatedBy": "admin@example.com",
  "version": 2,
  "statistics": {
    "total": 36,
    "visible": 2,
    "hidden": 34
  }
}
```

## Monitoring

### CloudWatch Metrics

- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB read/write capacity
- API Gateway 4xx/5xx errors

### CloudWatch Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name state-visibility-errors-prod \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=GetStateVisibility-prod
```

### Logging

- All Lambda functions log to CloudWatch Logs
- Retention: 30 days
- Log level: INFO in production

## Cost Estimation

### Monthly Costs (Production)

**DynamoDB**:
- Storage: ~1 KB = $0.00
- Reads: ~100,000/month = $0.03
- Writes: ~100/month = $0.00
- **Total**: ~$0.03/month

**Lambda**:
- Invocations: ~100,000/month = $0.02
- Duration: 256 MB, 100ms avg = $0.03
- **Total**: ~$0.05/month

**API Gateway**:
- Requests: ~100,000/month = $0.35
- **Total**: ~$0.35/month

**CloudFront**:
- Requests: ~100,000/month = $0.01
- Data transfer: ~1 GB = $0.09
- **Total**: ~$0.10/month

**Grand Total**: ~$0.53/month

## Security

### Authentication

- Admin endpoints require Cognito JWT tokens
- Public endpoint is rate-limited
- CORS configured for specific origins

### Authorization

- Only admin users can update settings
- Read-only access for mobile apps
- Audit trail in DynamoDB

### Encryption

- Data encrypted at rest (DynamoDB)
- Data encrypted in transit (HTTPS)
- Secrets stored in AWS Secrets Manager

## Disaster Recovery

### Backup Strategy

- DynamoDB Point-in-Time Recovery enabled
- Continuous backups for 35 days
- Manual snapshots before major changes

### Recovery Procedures

```bash
# Restore from point-in-time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name StateVisibilitySettings-prod \
  --target-table-name StateVisibilitySettings-prod-restored \
  --restore-date-time 2026-02-28T10:00:00Z
```

## Rollback Procedures

### Lambda Rollback

```bash
# List versions
aws lambda list-versions-by-function \
  --function-name GetStateVisibility-prod

# Rollback to previous version
aws lambda update-alias \
  --function-name GetStateVisibility-prod \
  --name prod \
  --function-version 2
```

### Settings Rollback

```bash
# Restore previous settings from audit log
node scripts/rollback-state-visibility.js --version 5
```

## Testing

### Integration Tests

```bash
cd src/state-management/tests
npm test
```

### Load Testing

```bash
# Test public endpoint
artillery run load-test-public.yml

# Test admin endpoint
artillery run load-test-admin.yml
```

### Smoke Tests

```bash
# Verify deployment
curl https://api.sanaathana-aalaya.com/api/public/states/visible
```

## Maintenance

### Regular Tasks

- Review CloudWatch logs weekly
- Check error rates daily
- Update Lambda runtime annually
- Review and optimize costs monthly

### Scaling Considerations

- DynamoDB: Auto-scales with pay-per-request
- Lambda: Auto-scales to 1000 concurrent executions
- API Gateway: No scaling needed
- CloudFront: Global distribution, auto-scales

## Troubleshooting

### Common Issues

**Issue**: Mobile app shows all states despite admin hiding some

**Solution**:
1. Check CloudFront cache (may take 5 minutes to update)
2. Verify Lambda function is returning correct data
3. Check DynamoDB table has correct settings

**Issue**: Admin Portal can't save settings

**Solution**:
1. Verify Cognito authentication token is valid
2. Check Lambda function logs for errors
3. Verify DynamoDB write permissions

**Issue**: High latency on public endpoint

**Solution**:
1. Check CloudFront cache hit rate
2. Optimize Lambda function code
3. Consider increasing Lambda memory

## Support

For issues or questions:
- Email: support@sanaathana-aalaya.com
- Slack: #state-visibility-support
- On-call: PagerDuty rotation

## Changelog

### Version 1.0.0 (2026-02-28)
- Initial production release
- DynamoDB table with encryption
- Lambda functions with proper error handling
- CloudFront caching
- Admin Portal integration
- Mobile app integration
