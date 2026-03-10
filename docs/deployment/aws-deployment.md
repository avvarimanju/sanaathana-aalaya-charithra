# AWS Deployment Guide

Complete guide for deploying Sanaathana Aalaya Charithra to AWS.

## Deployment Overview

The application consists of three main components:
1. **Backend** - Lambda functions + API Gateway + DynamoDB
2. **Admin Portal** - React SPA hosted on S3 + CloudFront
3. **Mobile App** - React Native app distributed via App Stores

## Prerequisites

### Required Tools

- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Node.js 18+
- Docker (for Lambda bundling)

### AWS Account Setup

1. **Create AWS Account** (if not exists)
2. **Configure IAM User** with permissions:
   - Lambda full access
   - DynamoDB full access
   - API Gateway full access
   - S3 full access
   - CloudFront full access
   - CloudWatch full access
   - IAM role creation

3. **Configure AWS CLI:**
```powershell
aws configure --profile production
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

## Backend Deployment

### Step 1: Install Dependencies

```powershell
cd infrastructure
npm install
```

### Step 2: Bootstrap CDK (First time only)

```powershell
cdk bootstrap aws://ACCOUNT-ID/us-east-1 --profile production
```

### Step 3: Review Infrastructure

```powershell
# See what will be created
cdk diff --profile production --context environment=production
```

### Step 4: Deploy Backend

```powershell
# Deploy all stacks
cdk deploy --all --profile production --context environment=production

# Or deploy specific stack
cdk deploy TemplePricingStack --profile production --context environment=production
```

This creates:
- **Lambda Functions** - All backend services
- **API Gateway** - REST API endpoints
- **DynamoDB Tables** - Database tables
- **IAM Roles** - Execution roles
- **CloudWatch Logs** - Log groups

### Step 5: Note API Gateway URL

After deployment, CDK outputs the API Gateway URL:
```
Outputs:
TemplePricingStack.ApiEndpoint = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Save this URL for frontend configuration.

## Admin Portal Deployment

### Step 1: Configure Environment

Create `admin-portal/.env.production`:

```env
VITE_API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
```

### Step 2: Build Application

```powershell
cd admin-portal
npm install
npm run build -- --mode production
```

This creates optimized production build in `dist/`.

### Step 3: Create S3 Bucket

```powershell
# Create bucket
aws s3 mb s3://temple-admin-portal-prod --profile production

# Enable static website hosting
aws s3 website s3://temple-admin-portal-prod --index-document index.html --error-document index.html --profile production

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket temple-admin-portal-prod --policy file://bucket-policy.json --profile production
```

**bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::temple-admin-portal-prod/*"
  }]
}
```

### Step 4: Deploy to S3

```powershell
aws s3 sync dist/ s3://temple-admin-portal-prod --delete --profile production
```

### Step 5: Create CloudFront Distribution

```powershell
aws cloudfront create-distribution --origin-domain-name temple-admin-portal-prod.s3.amazonaws.com --default-root-object index.html --profile production
```

Or use CDK to create CloudFront distribution (recommended).

### Step 6: Configure Custom Domain (Optional)

1. **Register domain** in Route 53
2. **Create SSL certificate** in ACM (us-east-1 region)
3. **Add CNAME** to CloudFront distribution
4. **Update Route 53** with CloudFront alias

## Mobile App Deployment

### Step 1: Configure EAS

```powershell
cd mobile-app
npm install -g eas-cli
eas login
eas build:configure
```

### Step 2: Configure Environment

Create `mobile-app/.env.production`:

```env
EXPO_PUBLIC_API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_ENVIRONMENT=production
```

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
      }
    }
  }
}
```

### Step 3: Build for App Stores

```powershell
# Build for both platforms
eas build --platform all --profile production

# Or build separately
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Step 4: Submit to App Stores

**Google Play Store:**
```powershell
eas submit --platform android --profile production
```

**Apple App Store:**
```powershell
eas submit --platform ios --profile production
```

See [Mobile App Deployment](../../mobile-app/deployment.md) for detailed app store submission process.

## Database Migration

### Initial Data Load

```powershell
# Export from LocalStack
aws dynamodb scan --table-name Temples --endpoint-url http://localhost:4566 > temples.json

# Import to AWS
aws dynamodb batch-write-item --request-items file://temples-batch.json --profile production
```

### Backup Strategy

**Enable Point-in-Time Recovery:**
```powershell
aws dynamodb update-continuous-backups --table-name Temples --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true --profile production
```

**Create On-Demand Backup:**
```powershell
aws dynamodb create-backup --table-name Temples --backup-name temples-backup-$(date +%Y%m%d) --profile production
```

## Monitoring Setup

### CloudWatch Alarms

Create alarms for critical metrics:

```powershell
# Lambda errors
aws cloudwatch put-metric-alarm --alarm-name temple-lambda-errors --metric-name Errors --namespace AWS/Lambda --statistic Sum --period 300 --threshold 10 --comparison-operator GreaterThanThreshold --profile production

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm --alarm-name temple-api-5xx --metric-name 5XXError --namespace AWS/ApiGateway --statistic Sum --period 300 --threshold 5 --comparison-operator GreaterThanThreshold --profile production

# DynamoDB throttles
aws cloudwatch put-metric-alarm --alarm-name temple-dynamodb-throttles --metric-name UserErrors --namespace AWS/DynamoDB --statistic Sum --period 300 --threshold 10 --comparison-operator GreaterThanThreshold --profile production
```

### X-Ray Tracing

Enable X-Ray for Lambda functions:

```typescript
// In CDK stack
import * as lambda from 'aws-cdk-lib/aws-lambda';

new lambda.Function(this, 'TempleFunction', {
  // ... other props
  tracing: lambda.Tracing.ACTIVE
});
```

### Log Aggregation

CloudWatch Logs are automatically created for Lambda functions. Set retention:

```powershell
aws logs put-retention-policy --log-group-name /aws/lambda/temple-create --retention-in-days 30 --profile production
```

## Security Configuration

### API Gateway Authentication

**Enable JWT authorizer:**

```typescript
// In CDK stack
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
  cognitoUserPools: [userPool]
});

api.root.addMethod('GET', integration, {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
});
```

### CORS Configuration

```typescript
// In CDK stack
api.root.addCorsPreflight({
  allowOrigins: ['https://admin.yourapp.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
});
```

### Rate Limiting

```typescript
// In CDK stack
const plan = api.addUsagePlan('UsagePlan', {
  throttle: {
    rateLimit: 100,
    burstLimit: 200
  }
});
```

## CI/CD Pipeline (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd infrastructure && npm install
      - name: Deploy to AWS
        run: cd infrastructure && cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1

  deploy-admin-portal:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Build
        run: cd admin-portal && npm install && npm run build -- --mode production
      - name: Deploy to S3
        run: aws s3 sync admin-portal/dist/ s3://temple-admin-portal-prod --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## Cost Optimization

### Lambda

- Use ARM64 architecture (20% cheaper)
- Right-size memory allocation
- Enable provisioned concurrency only for critical functions
- Use Lambda layers for shared dependencies

### DynamoDB

- Use on-demand pricing for unpredictable workloads
- Use provisioned capacity with auto-scaling for predictable workloads
- Enable TTL for temporary data
- Use DynamoDB Streams only when needed

### API Gateway

- Use REST API (cheaper than HTTP API for this use case)
- Enable caching for read-heavy endpoints
- Use regional endpoints (cheaper than edge-optimized)

### S3 + CloudFront

- Use S3 Intelligent-Tiering for infrequent access
- Enable CloudFront compression
- Set appropriate cache TTLs
- Use CloudFront functions for simple redirects

## Rollback Strategy

### Backend Rollback

```powershell
# List previous versions
aws lambda list-versions-by-function --function-name temple-create --profile production

# Rollback to previous version
aws lambda update-alias --function-name temple-create --name prod --function-version 2 --profile production
```

### Frontend Rollback

```powershell
# List previous S3 versions (if versioning enabled)
aws s3api list-object-versions --bucket temple-admin-portal-prod --profile production

# Restore previous version
aws s3api copy-object --bucket temple-admin-portal-prod --copy-source temple-admin-portal-prod/index.html?versionId=xxx --key index.html --profile production
```

## Health Checks

### Backend Health

```powershell
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/health
```

**Expected response:**
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "timestamp": "2026-03-01T12:00:00Z"
}
```

### Frontend Health

```powershell
curl https://admin.yourapp.com
# Should return 200 OK
```

### Database Health

```powershell
aws dynamodb describe-table --table-name Temples --profile production
# Check TableStatus: ACTIVE
```

## Troubleshooting

### Lambda function errors

```powershell
# View logs
aws logs tail /aws/lambda/temple-create --follow --profile production

# View metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=temple-create --start-time 2026-03-01T00:00:00Z --end-time 2026-03-01T23:59:59Z --period 3600 --statistics Sum --profile production
```

### API Gateway errors

```powershell
# Enable detailed CloudWatch logs
aws apigateway update-stage --rest-api-id xxxxx --stage-name prod --patch-operations op=replace,path=/logging/loglevel,value=INFO --profile production
```

### DynamoDB throttling

```powershell
# Check throttle metrics
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB --metric-name UserErrors --dimensions Name=TableName,Value=Temples --start-time 2026-03-01T00:00:00Z --end-time 2026-03-01T23:59:59Z --period 3600 --statistics Sum --profile production

# Increase provisioned capacity
aws dynamodb update-table --table-name Temples --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 --profile production
```

## Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] API Gateway URL accessible
- [ ] Admin Portal deployed to S3
- [ ] CloudFront distribution created
- [ ] Custom domain configured (if applicable)
- [ ] Mobile app built and submitted
- [ ] Database tables created
- [ ] Initial data migrated
- [ ] CloudWatch alarms configured
- [ ] X-Ray tracing enabled
- [ ] Backup strategy implemented
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security review completed
- [ ] Documentation updated

## Cost Estimates

### Staging Environment

- Lambda: $4/month
- DynamoDB: $13/month
- API Gateway: $2/month
- ElastiCache: $25/month
- S3 + CloudFront: $5/month
- CloudWatch: $6/month

**Total: ~$55/month**

### Production Environment

- Lambda: $50/month
- DynamoDB: $45/month
- API Gateway: $11/month
- ElastiCache: $99/month
- S3 + CloudFront: $69/month
- CloudWatch: $25/month
- Cognito: $28/month
- Monitoring: $23/month

**Total: ~$350/month**

## Next Steps

- [Environment Setup](../getting-started/environment-setup.md) - Configure environments
- [Monitoring Guide](./monitoring.md) - Set up monitoring
- [CI/CD Guide](./ci-cd.md) - Automate deployments
- [Security Best Practices](./security.md) - Secure your application
