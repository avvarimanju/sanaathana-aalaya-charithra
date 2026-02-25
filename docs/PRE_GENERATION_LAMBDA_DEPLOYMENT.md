# Pre-Generation Lambda Deployment Guide

This guide explains how to deploy the Pre-Generation Lambda function to AWS for batch processing of content generation.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Verification](#verification)
- [Invoking the Lambda Function](#invoking-the-lambda-function)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)

## Overview

The Pre-Generation Lambda function is designed to run as a serverless batch processor that generates multimedia content (audio guides, videos, infographics, and Q&A knowledge bases) for all artifacts in the heritage platform. It handles Lambda timeout limits through batch processing and can recursively invoke itself to process large workloads.

### Key Features

- **Batch Processing**: Processes items in configurable batches (default: 10 items per invocation)
- **Timeout Handling**: Automatically invokes next Lambda before timeout
- **Progress Tracking**: Persists progress in DynamoDB for resumption
- **Cost Efficient**: Only runs when needed, scales automatically
- **Idempotent**: Can be safely re-run without duplicating work

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Invocation                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Load Progress from DynamoDB                      │   │
│  │  2. Get Next Batch (10 items)                        │   │
│  │  3. Generate Content (Bedrock/Polly)                 │   │
│  │  4. Upload to S3                                     │   │
│  │  5. Update DynamoDB Cache                            │   │
│  │  6. Update Progress                                  │   │
│  │  7. Invoke Next Lambda if more items remain          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before deploying the Lambda function, ensure you have:

### Required Software

1. **Node.js 18+** with npm
   ```bash
   node --version  # Should be v18.x or higher
   npm --version
   ```

2. **AWS CLI** configured with credentials
   ```bash
   aws --version
   aws sts get-caller-identity  # Verify credentials
   ```

3. **AWS CDK CLI** installed globally
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS Permissions

Your AWS IAM user/role must have permissions to:
- Create and manage Lambda functions
- Create and manage IAM roles and policies
- Create and manage DynamoDB tables
- Create and manage S3 buckets
- Create and manage CloudFormation stacks
- Invoke Bedrock and Polly services

### AWS Resources

The following resources must exist (created by the main CDK stack):
- S3 bucket for content storage
- DynamoDB table: `SanaathanaAalayaCharithra-PreGenerationProgress`
- DynamoDB table: `SanaathanaAalayaCharithra-ContentCache`

## Deployment Methods

There are three ways to deploy the Lambda function:

### Method 1: Using npm Scripts (Recommended)

```bash
# Full deployment (build + bundle + deploy)
npm run deploy:pre-generation

# Verify existing deployment
npm run deploy:pre-generation:verify
```

### Method 2: Using Deployment Scripts Directly

**Linux/macOS:**
```bash
# Make script executable
chmod +x scripts/deploy-pre-generation-lambda.sh

# Run deployment
./scripts/deploy-pre-generation-lambda.sh

# With options
./scripts/deploy-pre-generation-lambda.sh --skip-build
./scripts/deploy-pre-generation-lambda.sh --verify-only
```

**Windows (PowerShell):**
```powershell
# Run deployment
.\scripts\deploy-pre-generation-lambda.ps1

# With options
.\scripts\deploy-pre-generation-lambda.ps1 -SkipBuild
.\scripts\deploy-pre-generation-lambda.ps1 -VerifyOnly
```

### Method 3: Manual Deployment

```bash
# 1. Build TypeScript
npm run build

# 2. Bundle Lambda code
npm run bundle

# 3. Deploy with CDK
npm run deploy
```

## Quick Start

For first-time deployment:

```bash
# 1. Install dependencies
npm install

# 2. Configure AWS credentials (if not already done)
aws configure

# 3. Bootstrap CDK (one-time setup per region)
cdk bootstrap

# 4. Deploy the Lambda function
npm run deploy:pre-generation
```

The script will:
1. ✅ Check prerequisites
2. ✅ Build TypeScript code
3. ✅ Bundle Lambda code with dependencies
4. ✅ Deploy using AWS CDK
5. ✅ Verify deployment success
6. ✅ Display function details and next steps

## Detailed Deployment Steps

### Step 1: Build TypeScript Code

The TypeScript source code must be compiled to JavaScript:

```bash
npm run build
```

This compiles all TypeScript files in `src/` to JavaScript in the `dist/` directory.

**Skip this step** if you've already built recently and haven't changed the code:
```bash
./scripts/deploy-pre-generation-lambda.sh --skip-build
```

### Step 2: Bundle Lambda Code

The Lambda code must be bundled with all dependencies into a single file:

```bash
npm run bundle
```

This uses `esbuild` to create optimized bundles in `dist/lambdas/`. The pre-generation Lambda bundle includes:
- Lambda handler code
- All pre-generation system components
- AWS SDK clients
- Required dependencies

**Bundle size**: Typically 200-500 KB (compressed)

**Skip this step** if you've already bundled recently:
```bash
./scripts/deploy-pre-generation-lambda.sh --skip-bundle
```

### Step 3: Deploy with CDK

The AWS CDK deploys the Lambda function and all related resources:

```bash
cdk deploy
```

This creates/updates:
- Lambda function: `SanaathanaAalayaCharithra-PreGeneration`
- IAM role with necessary permissions
- CloudWatch log group
- Environment variables configuration

**Deployment time**: 2-5 minutes

### Step 4: Verify Deployment

After deployment, verify the function is working:

```bash
npm run deploy:pre-generation:verify
```

This checks:
- ✅ Lambda function exists
- ✅ Function configuration (runtime, memory, timeout)
- ✅ Environment variables are set correctly
- ✅ IAM role has necessary permissions

## Verification

### Check Function Configuration

```bash
aws lambda get-function-configuration \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --region us-east-1
```

Expected configuration:
- **Runtime**: nodejs18.x
- **Memory**: 1024 MB
- **Timeout**: 300 seconds (5 minutes)
- **Handler**: pre-generation.handler

### Check Environment Variables

```bash
aws lambda get-function-configuration \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --region us-east-1 \
  --query 'Environment.Variables'
```

Required environment variables:
- `S3_BUCKET`: Content storage bucket name
- `DYNAMODB_PROGRESS_TABLE`: Progress tracking table name
- `DYNAMODB_CACHE_TABLE`: Content cache table name
- `BATCH_SIZE`: Items per invocation (default: 10)

### Check IAM Permissions

The Lambda function's IAM role should have permissions for:
- **Bedrock**: `bedrock:InvokeModel`
- **Polly**: `polly:SynthesizeSpeech`
- **S3**: `s3:GetObject`, `s3:PutObject`, `s3:HeadObject`
- **DynamoDB**: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`
- **Lambda**: `lambda:InvokeFunction` (for recursive invocation)
- **CloudWatch Logs**: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

## Invoking the Lambda Function

### Test Invocation

Test the Lambda function with a small batch:

```bash
aws lambda invoke \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --payload '{"mode":"batch","jobId":"test-job-001","batchSize":5}' \
  --region us-east-1 \
  response.json

# View response
cat response.json
```

### Production Invocation

Start a full pre-generation job:

```bash
aws lambda invoke \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --payload '{
    "mode": "batch",
    "jobId": "prod-job-'$(date +%Y%m%d-%H%M%S)'",
    "batchSize": 10,
    "forceRegenerate": false,
    "languages": ["en", "hi", "ta"],
    "contentTypes": ["audio_guide", "video", "infographic", "qa_knowledge_base"]
  }' \
  --region us-east-1 \
  response.json
```

### Event Payload Schema

```typescript
{
  mode: "batch",              // Execution mode (always "batch" for Lambda)
  jobId: string,              // Unique job identifier
  batchSize?: number,         // Items per invocation (default: 10)
  forceRegenerate?: boolean,  // Force regeneration of cached content
  languages?: string[],       // Filter by languages (optional)
  contentTypes?: string[],    // Filter by content types (optional)
  templeGroups?: string[],    // Filter by temple groups (optional)
  artifactIds?: string[]      // Filter by artifact IDs (optional)
}
```

### Response Schema

```typescript
{
  statusCode: 200,
  body: {
    jobId: string,
    itemsProcessed: number,
    itemsSucceeded: number,
    itemsFailed: number,
    itemsSkipped: number,
    hasMoreItems: boolean,
    nextInvocationScheduled: boolean,
    duration: number,
    message: string
  }
}
```

## Monitoring and Logs

### CloudWatch Logs

View real-time logs:

```bash
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-PreGeneration \
  --follow \
  --region us-east-1
```

View logs for specific time range:

```bash
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-PreGeneration \
  --since 1h \
  --region us-east-1
```

### CloudWatch Metrics

Monitor Lambda metrics in the AWS Console:
- **Invocations**: Number of times the function was invoked
- **Duration**: Execution time per invocation
- **Errors**: Number of failed invocations
- **Throttles**: Number of throttled invocations
- **Concurrent Executions**: Number of concurrent invocations

### Progress Tracking

Check progress in DynamoDB:

```bash
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress \
  --key-condition-expression "jobId = :jobId" \
  --expression-attribute-values '{":jobId":{"S":"your-job-id"}}' \
  --region us-east-1
```

### Cost Monitoring

Track costs in AWS Cost Explorer:
- Filter by service: Lambda, Bedrock, Polly, S3, DynamoDB
- Group by: Service, Usage Type
- Time range: Last 7 days

## Troubleshooting

### Common Issues

#### 1. Deployment Fails: "CDK not bootstrapped"

**Error**: `This stack uses assets, so the toolkit stack must be deployed to the environment`

**Solution**:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

#### 2. Lambda Invocation Fails: "Missing environment variable"

**Error**: `Missing required environment variable: S3_BUCKET`

**Solution**: Redeploy the stack to ensure environment variables are set:
```bash
npm run deploy:pre-generation
```

#### 3. Lambda Timeout

**Error**: `Task timed out after 300.00 seconds`

**Solution**: Reduce batch size in the event payload:
```json
{
  "batchSize": 5
}
```

#### 4. Bedrock Throttling

**Error**: `ThrottlingException: Rate exceeded`

**Solution**: The rate limiter should handle this automatically. If it persists, reduce batch size or increase delays in the configuration.

#### 5. S3 Upload Fails

**Error**: `AccessDenied: Access Denied`

**Solution**: Check IAM role permissions. Ensure the Lambda role has `s3:PutObject` permission for the content bucket.

#### 6. DynamoDB Write Fails

**Error**: `ProvisionedThroughputExceededException`

**Solution**: The tables use on-demand billing mode, so this shouldn't occur. If it does, check if the table was manually changed to provisioned mode.

### Debug Mode

Enable debug logging by setting the `LOG_LEVEL` environment variable:

```bash
aws lambda update-function-configuration \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --environment Variables={LOG_LEVEL=DEBUG,...} \
  --region us-east-1
```

### Manual Testing

Test individual components locally before deploying:

```bash
# Test artifact loading
npm run pre-generate -- --dry-run

# Test with filters
npm run pre-generate -- --languages en --content-types audio_guide --dry-run
```

## Cost Considerations

### Lambda Costs

- **Compute**: $0.0000166667 per GB-second
- **Requests**: $0.20 per 1M requests
- **Estimated cost per invocation**: ~$0.01 (1024 MB, 300 seconds)

### Service Costs

For 49 artifacts × 10 languages × 4 content types = 1,960 items:

| Service | Cost per Item | Total Cost |
|---------|---------------|------------|
| Lambda | $0.01 | $19.60 |
| Bedrock | $0.03 | $58.80 |
| Polly | $0.016 | $7.84 |
| S3 Storage | $0.023/GB/month | $0.09/month |
| DynamoDB | $0.000001 per write | $0.002 |
| **Total** | | **~$86.33** |

### Cost Optimization Tips

1. **Use batch processing**: Process multiple items per invocation to reduce Lambda invocations
2. **Enable caching**: Skip regeneration of existing content (saves 80-90% on subsequent runs)
3. **Use filters**: Generate content only for specific languages or content types when testing
4. **Monitor usage**: Set up AWS Budgets to alert on unexpected costs
5. **Clean up old data**: Set TTL on DynamoDB progress table to auto-delete old records

## Next Steps

After successful deployment:

1. **Test with a small batch**: Invoke the Lambda with `batchSize: 5` to test the full workflow
2. **Monitor the first run**: Watch CloudWatch logs to ensure everything works correctly
3. **Run full generation**: Invoke with default batch size for production workload
4. **Set up monitoring**: Create CloudWatch alarms for errors and throttling
5. **Document costs**: Track actual costs in AWS Cost Explorer
6. **Schedule regular runs**: Use EventBridge to schedule periodic content updates

## Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)
- [Pre-Generation System Design](../design.md)
- [Pre-Generation CLI Guide](../src/pre-generation/CLI_README.md)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs for error details
3. Check the [GitHub Issues](https://github.com/your-repo/issues)
4. Contact the development team

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0
