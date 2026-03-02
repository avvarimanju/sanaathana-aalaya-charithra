# MVP Deployment Guide - 2 Environment Setup

## 🎯 Quick Start

Deploy the MVP in 3 commands:

```bash
# 1. Deploy to staging
npm run deploy:staging

# 2. Test staging
npm run test:e2e:staging

# 3. Deploy to production
npm run deploy:prod
```

**Estimated Time**: 15-20 minutes per environment

---

## 📋 Prerequisites

### AWS Region Selection

This project is configured for **ap-south-1 (Mumbai)** by default, optimized for Indian users:

**Latency Comparison:**
- Mumbai (ap-south-1): 5-20ms for Indian users ✅ Recommended
- Hyderabad (ap-south-2): 10-30ms (newer region, some services unavailable)
- Singapore (ap-southeast-1): 50-80ms
- Virginia (us-east-1): 200-300ms (cheapest but slow)

**Cost Difference:** Mumbai is only ~10% more expensive than Virginia ($2-5/month extra), but provides 10-15x faster response times.

**To use a different region:**
```bash
# Option 1: Set environment variable
export CDK_DEFAULT_REGION=ap-south-1

# Option 2: Configure AWS CLI default
aws configure set region ap-south-1

# Option 3: Modify infrastructure/app.ts
```

### Required Software

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **AWS CLI**
   ```bash
   aws --version
   ```

3. **AWS CDK**
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

4. **Git**
   ```bash
   git --version
   ```

### AWS Account Setup

1. **Create AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com/
   - Sign up for free tier

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `ap-south-1` (Mumbai - recommended for Indian users)
   - Default output format: `json`

3. **Verify Credentials**
   ```bash
   aws sts get-caller-identity
   ```

### Cost Considerations

- **Staging**: ~$15-20/month (can be torn down when not testing)
- **Production**: ~$13-186/month (scales with usage)
- **First Month**: Likely $20-30 total with AWS Free Tier

---

## 🚀 Deployment Steps

### Step 1: Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd Sanaathana-Aalaya-Charithra

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Step 2: Bootstrap CDK (One-time)

```bash
# Bootstrap CDK in your AWS account
cdk bootstrap

# Verify bootstrap
aws cloudformation describe-stacks --stack-name CDKToolkit
```

### Step 3: Deploy to Staging

```bash
# Deploy staging environment
npm run deploy:staging

# Or use the script directly
bash scripts/deploy-mvp.sh staging
```

**What Gets Deployed:**
- 6 DynamoDB tables (HeritageSites, Artifacts, TempleGroups, etc.)
- 6 Lambda functions (temple-api, artifact-api, qr-processing, etc.)
- 2 API Gateways (mobile API + admin API)
- 3 S3 buckets (images, QR codes, content)
- 1 CloudFront distribution
- 1 Cognito User Pool

**Expected Output:**
```
✓ TempleApp-staging: deployed
Outputs:
  ApiUrl: https://abc123.execute-api.ap-south-1.amazonaws.com/staging
  UserPoolId: ap-south-1_ABC123
  UserPoolClientId: 1a2b3c4d5e6f7g8h9i0j
```

### Step 4: Test Staging

```bash
# Run E2E tests
npm run test:e2e:staging

# Test API manually
curl https://your-staging-api-url/health

# View logs
npm run logs:staging
```

### Step 5: Deploy to Production

```bash
# Deploy production environment
npm run deploy:prod

# Or use the script directly
bash scripts/deploy-mvp.sh prod
```

**Production Deployment Checklist:**
- [ ] All staging tests passed
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] Razorpay production keys ready
- [ ] Monitoring alerts configured

### Step 6: Verify Production

```bash
# Run smoke tests
npm run test:smoke:prod

# Check health endpoint
curl https://your-prod-api-url/health

# Monitor logs
npm run logs:prod
```

---

## 📱 Mobile App Configuration

After deployment, update your mobile app with the stack outputs:

### React Native Configuration

```typescript
// config/aws-config.ts
export const AWS_CONFIG = {
  staging: {
    apiUrl: 'https://abc123.execute-api.ap-south-1.amazonaws.com/staging',
    userPoolId: 'ap-south-1_ABC123',
    userPoolClientId: '1a2b3c4d5e6f7g8h9i0j',
    region: 'ap-south-1',  // Mumbai region for low latency in India
  },
  prod: {
    apiUrl: 'https://xyz789.execute-api.ap-south-1.amazonaws.com/prod',
    userPoolId: 'ap-south-1_XYZ789',
    userPoolClientId: '9i8h7g6f5e4d3c2b1a0',
    region: 'ap-south-1',  // Mumbai region for low latency in India
  },
};

// Use based on build configuration
const config = __DEV__ ? AWS_CONFIG.staging : AWS_CONFIG.prod;
```

### Flutter Configuration

```dart
// lib/config/aws_config.dart
class AWSConfig {
  static const staging = {
    'apiUrl': 'https://abc123.execute-api.ap-south-1.amazonaws.com/staging',
    'userPoolId': 'ap-south-1_ABC123',
    'userPoolClientId': '1a2b3c4d5e6f7g8h9i0j',
    'region': 'ap-south-1',  // Mumbai region for low latency in India
  };

  static const prod = {
    'apiUrl': 'https://xyz789.execute-api.ap-south-1.amazonaws.com/prod',
    'userPoolId': 'ap-south-1_XYZ789',
    'userPoolClientId': '9i8h7g6f5e4d3c2b1a0',
    'region': 'ap-south-1',  // Mumbai region for low latency in India
  };

  static Map<String, String> get config {
    return kDebugMode ? staging : prod;
  }
}
```

---

## 🔧 Environment Management

### View Current Deployments

```bash
# List all stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Get staging outputs
aws cloudformation describe-stacks --stack-name TempleApp-staging

# Get production outputs
aws cloudformation describe-stacks --stack-name TempleApp-prod
```

### Update Existing Deployment

```bash
# Make code changes
# ...

# Rebuild
npm run build

# Deploy updates to staging
npm run deploy:staging

# Test
npm run test:e2e:staging

# Deploy updates to production
npm run deploy:prod
```

### Tear Down Staging (Save Costs)

```bash
# Destroy staging environment
npm run destroy:staging

# Or use CDK directly
cdk destroy --context environment=staging

# Redeploy when needed
npm run deploy:staging
```

**Warning**: Never destroy production without backup!

---

## 💰 Cost Monitoring

### Set Up Budget Alerts

```bash
# Create a $50/month budget
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**budget.json**:
```json
{
  "BudgetName": "TempleApp-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### Check Current Costs

```bash
# Current month costs
npm run cost:check

# Or use AWS CLI
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Cost by Service

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 📊 Monitoring

### CloudWatch Logs

```bash
# View staging logs
npm run logs:staging

# View production logs
npm run logs:prod

# Tail specific Lambda function
aws logs tail /aws/lambda/prod-temple-api --follow
```

### CloudWatch Metrics

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=prod-temple-api \
  --start-time 2026-02-26T00:00:00Z \
  --end-time 2026-02-26T23:59:59Z \
  --period 3600 \
  --statistics Sum

# API Gateway requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=prod-temple-api \
  --start-time 2026-02-26T00:00:00Z \
  --end-time 2026-02-26T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Set Up Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name prod-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔒 Security

### Secrets Management

Store sensitive data in AWS Secrets Manager:

```bash
# Store Razorpay keys
aws secretsmanager create-secret \
  --name prod/razorpay/keys \
  --secret-string '{"key_id":"rzp_live_xxx","key_secret":"xxx"}'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id prod/razorpay/keys
```

### IAM Permissions

Ensure your deployment user has these permissions:
- CloudFormation (full)
- Lambda (full)
- DynamoDB (full)
- S3 (full)
- API Gateway (full)
- Cognito (full)
- CloudWatch (full)
- IAM (limited to role creation)

### Enable MFA for Production

```bash
# Enable MFA for Cognito user pool
aws cognito-idp set-user-pool-mfa-config \
  --user-pool-id ap-south-1_XYZ789 \
  --mfa-configuration OPTIONAL
```

---

## 🆘 Troubleshooting

### Deployment Fails

**Error**: "Stack already exists"
```bash
# Check existing stack
aws cloudformation describe-stacks --stack-name TempleApp-staging

# Update instead of create
cdk deploy --context environment=staging
```

**Error**: "Insufficient permissions"
```bash
# Check your IAM permissions
aws iam get-user

# Attach required policies
aws iam attach-user-policy \
  --user-name your-username \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

**Error**: "CDK not bootstrapped"
```bash
# Bootstrap CDK
cdk bootstrap

# Verify
aws cloudformation describe-stacks --stack-name CDKToolkit
```

### Lambda Function Errors

```bash
# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/prod-temple-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check function configuration
aws lambda get-function-configuration \
  --function-name prod-temple-api
```

### DynamoDB Issues

```bash
# Check table status
aws dynamodb describe-table --table-name prod-HeritageSites

# Check for throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=prod-HeritageSites \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --period 300 \
  --statistics Sum
```

---

## 🔄 Rollback

### Rollback to Previous Version

```bash
# List stack events
aws cloudformation describe-stack-events \
  --stack-name TempleApp-prod \
  --max-items 50

# Rollback (if deployment failed)
aws cloudformation cancel-update-stack \
  --stack-name TempleApp-prod

# Or redeploy previous version
git checkout <previous-commit>
npm run deploy:prod
```

---

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Cognito Documentation](https://docs.aws.amazon.com/cognito/)

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] API Gateway endpoints responding
- [ ] DynamoDB tables created
- [ ] Lambda functions deployed
- [ ] S3 buckets created
- [ ] CloudFront distribution active
- [ ] Cognito user pool configured
- [ ] Mobile app can connect to API
- [ ] Test user can sign up/login
- [ ] QR code scanning works
- [ ] Content generation works
- [ ] Payments work (test mode)
- [ ] CloudWatch logs visible
- [ ] Cost alerts configured

---

**Last Updated**: 2026-02-26
**Version**: 1.0.0
