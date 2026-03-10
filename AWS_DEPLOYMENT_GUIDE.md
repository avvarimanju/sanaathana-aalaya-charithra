# AWS Deployment Guide - Mumbai Region (ap-south-1)

## ⚠️ IMPORTANT: Read Before Deploying

This guide is for deploying to **REAL AWS INFRASTRUCTURE**. Do NOT deploy until:

1. ✅ Mobile app works perfectly on localhost
2. ✅ Admin portal works perfectly on localhost  
3. ✅ Backend API works perfectly on localhost
4. ✅ All local integration tests pass
5. ✅ You have explicitly decided to deploy to AWS

## Prerequisites

- AWS CLI configured with credentials
- AWS account with appropriate permissions
- Node.js and npm installed
- CDK CLI installed: `npm install -g aws-cdk`
- All local development working perfectly

## Region Configuration

**ALWAYS deploy to ap-south-1 (Mumbai) for Indian users.**

This provides:
- Lower latency for Indian users
- Better compliance with data residency requirements
- Optimal performance for target audience

## Deployment Steps

### 1. Set Environment Variables

```powershell
# Windows PowerShell
$env:CDK_DEFAULT_REGION='ap-south-1'  # Mumbai region - REQUIRED
$env:ENVIRONMENT='dev'                 # or 'staging' or 'prod'
$env:CDK_DEFAULT_ACCOUNT='YOUR_AWS_ACCOUNT_ID'
```

```bash
# Linux/Mac
export CDK_DEFAULT_REGION='ap-south-1'  # Mumbai region - REQUIRED
export ENVIRONMENT='dev'                 # or 'staging' or 'prod'
export CDK_DEFAULT_ACCOUNT='YOUR_AWS_ACCOUNT_ID'
```

### 2. Navigate to Backend Directory

```powershell
cd Sanaathana-Aalaya-Charithra/backend
```

### 3. Install Dependencies

```powershell
npm install
```

### 4. Bundle Lambda Functions

```powershell
npm run bundle
```

This compiles TypeScript Lambda functions and bundles them with dependencies.

### 5. Bootstrap CDK (First Time Only)

```powershell
npx cdk bootstrap
```

This creates the CDK toolkit stack in your AWS account (only needed once per region).

### 6. Review Changes (Optional but Recommended)

```powershell
npx cdk diff --all
```

This shows what resources will be created/modified.

### 7. Deploy All Stacks

```powershell
# Deploy with approval prompts
npx cdk deploy --all

# OR deploy without approval prompts (use with caution)
npx cdk deploy --all --require-approval never
```

### 8. Save Outputs

After deployment, save the outputs:
- API Gateway URLs
- CloudFront distribution domain
- S3 bucket names
- DynamoDB table names

## Deployed Resources

### Main Stack (SanaathanaAalayaCharithraStack-{env})

**DynamoDB Tables:**
- HeritageSitesTable
- ArtifactsTable
- UserSessionsTable
- ContentCacheTable
- AnalyticsTable
- PurchasesTable
- PreGenerationProgressTable

**Lambda Functions:**
- QRProcessingLambda
- ContentGenerationLambda
- QAProcessingLambda
- AnalyticsLambda
- PaymentHandlerLambda
- PreGenerationLambda

**Other Resources:**
- S3 bucket for content storage
- CloudFront distribution for global CDN
- API Gateway REST API
- IAM roles with appropriate permissions

### Defect Tracking Stack (DefectTrackingStack-{env})

**DynamoDB Tables:**
- DefectsTable
- StatusUpdatesTable
- NotificationsTable

**Lambda Functions:**
- 8 Lambda functions for defect tracking operations

**Other Resources:**
- API Gateway REST API for defect tracking

## Cost Estimates

### Development Environment (Minimal Usage)
- DynamoDB: $0-5/month (pay per request)
- Lambda: $0-2/month (free tier covers most)
- S3: $0-1/month (minimal storage)
- CloudFront: $0-2/month (minimal traffic)
- API Gateway: $0-1/month (minimal requests)

**Total: ~$0.50-10/month** (mostly within free tier)

### Production Environment (Moderate Usage)
- DynamoDB: $10-50/month
- Lambda: $5-20/month
- S3: $5-15/month
- CloudFront: $10-30/month
- API Gateway: $5-15/month

**Total: ~$35-130/month**

## Post-Deployment Configuration

### 1. Update Frontend Environment Variables

Update `.env.production` files in mobile-app and admin-portal:

```env
REACT_APP_API_URL=https://YOUR_API_GATEWAY_URL/prod
REACT_APP_CLOUDFRONT_DOMAIN=YOUR_CLOUDFRONT_DOMAIN
```

### 2. Configure Razorpay

Update Lambda environment variables with real Razorpay credentials:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

### 3. Set Up Monitoring

- Configure CloudWatch alarms
- Set up billing alerts
- Enable AWS Cost Explorer

### 4. Test Deployment

Test all endpoints:
```powershell
# Health check
curl https://YOUR_API_GATEWAY_URL/prod/health

# Test QR processing
curl -X POST https://YOUR_API_GATEWAY_URL/prod/qr -H "Content-Type: application/json" -d '{"qrCode":"test"}'
```

## Destroying Deployment

To destroy all resources (e.g., to save costs or redeploy):

```powershell
$env:CDK_DEFAULT_REGION='ap-south-1'
$env:ENVIRONMENT='dev'

npx cdk destroy --all --force
```

**Warning:** This will delete all data in DynamoDB tables (except those with RETAIN policy).

## Troubleshooting

### Issue: Deployment fails with "Region not specified"
**Solution:** Set `$env:CDK_DEFAULT_REGION='ap-south-1'` before deployment

### Issue: Lambda functions fail to bundle
**Solution:** Run `npm run bundle` and check for TypeScript errors

### Issue: DynamoDB tables already exist
**Solution:** Either destroy existing tables or use different environment name

### Issue: IAM permissions denied
**Solution:** Ensure your AWS credentials have sufficient permissions for CDK deployment

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** with least privilege principle
3. **Enable CloudTrail** for audit logging
4. **Use AWS Secrets Manager** for sensitive data
5. **Enable encryption** for all data at rest
6. **Use VPC** for Lambda functions (if needed)
7. **Set up WAF** for API Gateway (production)

## Monitoring and Maintenance

### CloudWatch Dashboards
- Lambda execution metrics
- API Gateway request metrics
- DynamoDB read/write capacity
- Error rates and latency

### Regular Tasks
- Review CloudWatch logs weekly
- Check AWS billing monthly
- Update Lambda runtime versions
- Review and rotate credentials quarterly

## Rollback Strategy

If deployment fails or causes issues:

1. **Immediate rollback:** `npx cdk destroy --all --force`
2. **Partial rollback:** Destroy specific stack: `npx cdk destroy StackName`
3. **Data recovery:** Restore from DynamoDB point-in-time recovery
4. **Redeploy:** Fix issues and redeploy with `npx cdk deploy --all`

## Support and Resources

- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- AWS Mumbai Region: https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
- Project Documentation: See `docs/` directory
- Local Development: See `LOCAL_INTEGRATION_GUIDE.md`
