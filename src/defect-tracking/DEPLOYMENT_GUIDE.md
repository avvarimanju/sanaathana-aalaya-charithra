# Defect Tracking System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Defect Tracking System to AWS staging environment.

## Prerequisites

### 1. AWS Credentials

Ensure you have AWS credentials configured with appropriate permissions:

```bash
# Check if credentials are configured
aws sts get-caller-identity

# If not configured, set up credentials
aws configure
```

Required IAM permissions:
- DynamoDB: CreateTable, DescribeTable, UpdateTable
- Lambda: CreateFunction, UpdateFunctionCode, UpdateFunctionConfiguration
- API Gateway: CreateRestApi, CreateResource, CreateMethod
- IAM: CreateRole, AttachRolePolicy
- CloudFormation: CreateStack, UpdateStack, DescribeStacks

### 2. CDK Bootstrap

If this is your first CDK deployment in this account/region:

```bash
cd Sanaathana-Aalaya-Charithra
npm run bootstrap
```

### 3. Build the Project

```bash
# Install dependencies
npm install

# Build TypeScript code
npm run build

# Run tests to ensure everything works
npm test -- --testPathPattern="defect-tracking"
```

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# For staging deployment
export ENVIRONMENT=staging
export CDK_DEFAULT_ACCOUNT=<your-aws-account-id>
export CDK_DEFAULT_REGION=ap-south-1  # Mumbai region for Indian users
```

### Step 2: Synthesize CloudFormation Template

Preview what will be deployed:

```bash
npm run synth -- DefectTrackingStack-staging
```

This generates the CloudFormation template in `cdk.out/` directory.

### Step 3: Review Changes

See what changes will be made:

```bash
npm run diff -- DefectTrackingStack-staging
```

### Step 4: Deploy to Staging

Deploy the stack:

```bash
npm run cdk -- deploy DefectTrackingStack-staging --require-approval never
```

Or with approval prompts:

```bash
npm run cdk -- deploy DefectTrackingStack-staging
```

### Step 5: Verify Deployment

After deployment completes, you'll see outputs like:

```
Outputs:
DefectTrackingStack-staging.ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/staging/
DefectTrackingStack-staging.DefectsTableName = staging-defect-tracking-defects
DefectTrackingStack-staging.StatusUpdatesTableName = staging-defect-tracking-status-updates
DefectTrackingStack-staging.NotificationsTableName = staging-defect-tracking-notifications
```

Save these values for testing.

## Verification Steps

### 1. Verify DynamoDB Tables

```bash
# Check Defects table
aws dynamodb describe-table --table-name staging-defect-tracking-defects

# Check StatusUpdates table
aws dynamodb describe-table --table-name staging-defect-tracking-status-updates

# Check Notifications table
aws dynamodb describe-table --table-name staging-defect-tracking-notifications
```

Verify:
- ✅ Tables are ACTIVE
- ✅ GSIs are ACTIVE
- ✅ TTL is enabled on Notifications table
- ✅ Encryption is enabled

### 2. Verify Lambda Functions

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `defect-tracking`)].FunctionName'
```

Expected functions:
- staging-defect-tracking-submit-defect
- staging-defect-tracking-get-user-defects
- staging-defect-tracking-get-defect-details
- staging-defect-tracking-get-all-defects
- staging-defect-tracking-update-status
- staging-defect-tracking-add-status-update
- staging-defect-tracking-get-notifications
- staging-defect-tracking-mark-notification-read

### 3. Verify API Gateway

```bash
# Get API details
aws apigateway get-rest-apis --query 'items[?name==`staging-defect-tracking-api`]'
```

## Manual Testing

### Test 1: Submit Defect

```bash
API_URL="<your-api-url-from-outputs>"

curl -X POST "${API_URL}/defects" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "Test defect from deployment",
    "description": "This is a test defect to verify the deployment works correctly",
    "stepsToReproduce": "1. Deploy stack\n2. Run this curl command",
    "expectedBehavior": "Defect should be created successfully",
    "actualBehavior": "Testing the actual behavior",
    "deviceInfo": {
      "platform": "ios",
      "osVersion": "17.0",
      "appVersion": "1.0.0"
    }
  }'
```

Expected response (201 Created):
```json
{
  "success": true,
  "data": {
    "defectId": "uuid-here",
    "status": "New",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Test 2: Get User Defects

```bash
curl -X GET "${API_URL}/defects/user/test-user-123"
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "defects": [
      {
        "defectId": "uuid-here",
        "title": "Test defect from deployment",
        "status": "New",
        "createdAt": "2024-01-01T00:00:00.000Z",
        ...
      }
    ]
  }
}
```

### Test 3: Get Defect Details

```bash
DEFECT_ID="<defect-id-from-previous-response>"
curl -X GET "${API_URL}/defects/${DEFECT_ID}"
```

### Test 4: Admin - Get All Defects

```bash
curl -X GET "${API_URL}/admin/defects"
```

### Test 5: Admin - Update Status

```bash
curl -X PUT "${API_URL}/admin/defects/${DEFECT_ID}/status" \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "Acknowledged",
    "comment": "We have received your defect report and will investigate"
  }'
```

### Test 6: Admin - Add Status Update

```bash
curl -X POST "${API_URL}/admin/defects/${DEFECT_ID}/updates" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "We are currently investigating this issue"
  }'
```

### Test 7: Get Notifications

```bash
curl -X GET "${API_URL}/notifications/user/test-user-123"
```

### Test 8: Mark Notification Read

```bash
NOTIFICATION_ID="<notification-id-from-previous-response>"
curl -X PUT "${API_URL}/notifications/${NOTIFICATION_ID}/read"
```

## Integration Testing

### Mobile App Integration

1. Update mobile app configuration with the API URL
2. Test defect submission from the mobile app
3. Verify data appears in DynamoDB
4. Test viewing defects and notifications

### Admin Portal Integration

1. Update Admin Portal configuration with the API URL
2. Test viewing all defects
3. Test filtering by status
4. Test updating defect status
5. Test adding status updates
6. Verify workflow validation (invalid transitions should be rejected)

## Monitoring

### CloudWatch Logs

View Lambda function logs:

```bash
# View logs for submit-defect function
aws logs tail /aws/lambda/staging-defect-tracking-submit-defect --follow

# View logs for all defect tracking functions
aws logs tail /aws/lambda/staging-defect-tracking --follow
```

### CloudWatch Metrics

Monitor API Gateway metrics:
- Request count
- Error rate (4xx, 5xx)
- Latency (p50, p90, p99)

Monitor DynamoDB metrics:
- Read/Write capacity units
- Throttled requests
- System errors

### CloudWatch Alarms

Consider setting up alarms for:
- High error rate (>5% 5xx errors)
- High latency (p99 > 3 seconds)
- DynamoDB throttling

## Troubleshooting

### Issue: Lambda function timeout

**Symptom**: 504 Gateway Timeout errors

**Solution**:
1. Check CloudWatch logs for the Lambda function
2. Increase timeout in DefectTrackingStack.ts if needed
3. Redeploy

### Issue: DynamoDB throttling

**Symptom**: ProvisionedThroughputExceededException

**Solution**:
- Tables use on-demand billing, so this shouldn't happen
- If it does, check for hot partitions
- Review access patterns

### Issue: CORS errors

**Symptom**: Browser console shows CORS errors

**Solution**:
1. Verify CORS configuration in DefectTrackingStack.ts
2. Ensure mobile app/Admin Portal URLs are in allowOrigins
3. Redeploy

### Issue: Validation errors

**Symptom**: 400 Bad Request with validation errors

**Solution**:
- Check request body matches the schema
- Verify required fields are present
- Check field length constraints

## Rollback

If deployment fails or issues are found:

```bash
# Rollback to previous version
npm run cdk -- deploy DefectTrackingStack-staging --rollback

# Or destroy the stack completely
npm run cdk -- destroy DefectTrackingStack-staging
```

## Production Deployment

Once staging is verified:

1. Set environment to production:
   ```bash
   export ENVIRONMENT=prod
   ```

2. Deploy to production:
   ```bash
   npm run cdk -- deploy DefectTrackingStack-prod
   ```

3. Production differences:
   - Point-in-time recovery enabled on DynamoDB tables
   - Tables have RETAIN removal policy (won't be deleted on stack destroy)
   - Stricter CORS origins (only production domains)
   - More aggressive throttling limits

## Cost Estimation

Estimated monthly costs for staging (low usage):

- DynamoDB (on-demand): $5-10
- Lambda (1M requests): $0.20
- API Gateway (1M requests): $3.50
- CloudWatch Logs: $1-2
- **Total**: ~$10-15/month

Production costs will scale with usage.

## Security Considerations

1. **API Authentication**: Currently no authentication is implemented. Consider adding:
   - Cognito User Pools for user authentication
   - API Gateway authorizers for admin endpoints
   - API keys for rate limiting

2. **Data Encryption**:
   - ✅ DynamoDB encryption at rest (AWS managed)
   - ✅ HTTPS for API Gateway (encryption in transit)

3. **IAM Permissions**:
   - Lambda functions have least-privilege IAM roles
   - Only necessary DynamoDB permissions granted

4. **Input Validation**:
   - ✅ API Gateway request validation
   - ✅ Zod schema validation in Lambda functions

## Next Steps

After successful deployment:

1. ✅ Verify all endpoints work correctly
2. ✅ Test mobile app integration
3. ✅ Test Admin Portal integration
4. ✅ Set up CloudWatch alarms
5. ✅ Configure authentication (if not already done)
6. ✅ Load testing (optional)
7. ✅ Deploy to production

## Support

For issues or questions:
- Check CloudWatch logs first
- Review this deployment guide
- Contact the development team
