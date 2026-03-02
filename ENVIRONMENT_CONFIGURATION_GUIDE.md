# Environment Configuration Guide

## Overview

This guide explains how environment variables are configured across different deployment environments (Local, Staging, Production) and how the application adapts to each environment.

## Environment Detection

The application automatically detects its environment and configures AWS services accordingly:

| Environment | AWS_ENDPOINT_URL | DynamoDB Target | Configuration Method |
|-------------|------------------|-----------------|---------------------|
| **Local** | `http://localhost:4566` | LocalStack | PowerShell scripts |
| **Staging** | Not set | AWS DynamoDB | Lambda environment variables |
| **Production** | Not set | AWS DynamoDB | Lambda environment variables |

## How It Works

### AWS SDK Behavior

The AWS SDK (v3) automatically detects the environment:

```typescript
// src/utils/aws-clients.ts
const clientConfig = {
  region: AWS_REGION,
  maxAttempts: 3,
  // NO endpoint property - SDK auto-detects!
};

export const dynamoDBClient = new DynamoDBClient(clientConfig);
```

**Key Point**: We do NOT hardcode the endpoint URL in the code. Instead:
- If `AWS_ENDPOINT_URL` environment variable is set → SDK uses that endpoint (LocalStack)
- If `AWS_ENDPOINT_URL` is NOT set → SDK uses default AWS endpoints (real DynamoDB)

### Environment Variables by Environment

## 1. Local Development

**Set by**: `scripts/start-local-integration.ps1` and `scripts/init-db-simple.ps1`

```powershell
$env:AWS_ENDPOINT_URL = "http://localhost:4566"
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:AWS_DEFAULT_REGION = "ap-south-1"
```

**Purpose**: Routes all AWS SDK calls to LocalStack running in Docker

**Backend Server** (`src/local-server/server.ts`):
- Reads environment variables set by the startup script
- No hardcoded endpoints
- Automatically connects to LocalStack when `AWS_ENDPOINT_URL` is set

## 2. Staging Environment (AWS)

**Set by**: AWS Lambda environment variables (configured in CloudFormation/SAM)

```yaml
# Example CloudFormation configuration
Environment:
  Variables:
    AWS_REGION: ap-south-1
    HERITAGE_SITES_TABLE: Staging-HeritageSites
    ARTIFACTS_TABLE: Staging-Artifacts
    # NO AWS_ENDPOINT_URL - uses real AWS DynamoDB
```

**Purpose**: Lambda functions automatically use AWS DynamoDB in the same region

## 3. Production Environment (AWS)

**Set by**: AWS Lambda environment variables (configured in CloudFormation/SAM)

```yaml
# Example CloudFormation configuration
Environment:
  Variables:
    AWS_REGION: ap-south-1
    HERITAGE_SITES_TABLE: Prod-HeritageSites
    ARTIFACTS_TABLE: Prod-Artifacts
    # NO AWS_ENDPOINT_URL - uses real AWS DynamoDB
```

**Purpose**: Lambda functions automatically use AWS DynamoDB in the same region

## Frontend Environment Variables

### Admin Portal (Vite)

**Local** (`.env.development`):
```bash
VITE_API_URL=http://localhost:4000
```

**Staging** (`.env.staging`):
```bash
VITE_API_URL=https://api-staging.sanaathana.org
```

**Production** (`.env.production`):
```bash
VITE_API_URL=https://api.sanaathana.org
```

### Mobile App (Expo)

**Local** (`.env.development`):
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_DEMO_MODE=false
```

**Staging** (`.env.staging`):
```bash
EXPO_PUBLIC_API_URL=https://api-staging.sanaathana.org
EXPO_PUBLIC_DEMO_MODE=false
```

**Production** (`.env.production`):
```bash
EXPO_PUBLIC_API_URL=https://api.sanaathana.org
EXPO_PUBLIC_DEMO_MODE=false
```

## Deployment Checklist

### Promoting from Local to Staging

1. **Backend**:
   - Deploy Lambda functions to AWS
   - Set environment variables in Lambda configuration (NO `AWS_ENDPOINT_URL`)
   - Verify DynamoDB tables exist in Staging account
   - Update API Gateway endpoints

2. **Admin Portal**:
   - Update `.env.staging` with Staging API URL
   - Build: `npm run build -- --mode staging`
   - Deploy to S3/CloudFront

3. **Mobile App**:
   - Update `.env.staging` with Staging API URL
   - Build: `eas build --profile staging`
   - Test with Expo Go or internal distribution

### Promoting from Staging to Production

1. **Backend**:
   - Deploy Lambda functions to Production AWS account
   - Set environment variables in Lambda configuration (NO `AWS_ENDPOINT_URL`)
   - Verify DynamoDB tables exist in Production account
   - Update API Gateway endpoints
   - Enable CloudWatch monitoring

2. **Admin Portal**:
   - Update `.env.production` with Production API URL
   - Build: `npm run build -- --mode production`
   - Deploy to S3/CloudFront
   - Enable CloudFront caching

3. **Mobile App**:
   - Update `.env.production` with Production API URL
   - Build: `eas build --profile production`
   - Submit to Google Play Store / Apple App Store

## Common Pitfalls

### ❌ DON'T: Hardcode endpoint URLs in code

```typescript
// BAD - Don't do this!
const client = new DynamoDBClient({
  endpoint: 'http://localhost:4566', // Hardcoded!
  region: 'ap-south-1'
});
```

### ✅ DO: Let the SDK auto-detect from environment

```typescript
// GOOD - SDK auto-detects from AWS_ENDPOINT_URL
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});
```

### ❌ DON'T: Set AWS_ENDPOINT_URL in Lambda environment variables

```yaml
# BAD - Don't do this in Staging/Production!
Environment:
  Variables:
    AWS_ENDPOINT_URL: http://localhost:4566  # This will break!
```

### ✅ DO: Only set AWS_ENDPOINT_URL locally

```powershell
# GOOD - Only in local development scripts
$env:AWS_ENDPOINT_URL = "http://localhost:4566"
```

## Verification Commands

### Local Development

```powershell
# Check environment variables
echo $env:AWS_ENDPOINT_URL  # Should be http://localhost:4566
echo $env:AWS_REGION        # Should be ap-south-1

# Test LocalStack connection
aws dynamodb list-tables --endpoint-url http://localhost:4566

# Test backend health
curl http://localhost:4000/health
```

### Staging/Production

```bash
# Check Lambda environment variables (AWS CLI)
aws lambda get-function-configuration --function-name MyFunction

# Verify NO AWS_ENDPOINT_URL is set
# Should only see: AWS_REGION, table names, etc.

# Test API Gateway
curl https://api-staging.sanaathana.org/health
```

## Troubleshooting

### Issue: "Connection refused" in Lambda

**Cause**: `AWS_ENDPOINT_URL` is set in Lambda environment variables

**Solution**: Remove `AWS_ENDPOINT_URL` from Lambda configuration

### Issue: "Table not found" in Lambda

**Cause**: Table names don't match between environments

**Solution**: Verify table name environment variables match actual DynamoDB tables

### Issue: Local backend can't connect to LocalStack

**Cause**: `AWS_ENDPOINT_URL` not set or LocalStack not running

**Solution**: 
1. Verify LocalStack is running: `docker ps | grep localstack`
2. Verify environment variable: `echo $env:AWS_ENDPOINT_URL`
3. Restart integration script: `.\scripts\start-local-integration.ps1`

## Best Practices

1. **Never hardcode endpoints** - Always use environment variables
2. **Use different table names** per environment (e.g., `Dev-Temples`, `Staging-Temples`, `Prod-Temples`)
3. **Document all environment variables** in `.env.example` files
4. **Test environment detection** before deploying to Staging/Production
5. **Use infrastructure as code** (CloudFormation/SAM) to manage environment variables
6. **Monitor environment variables** in CloudWatch Logs to verify correct configuration

## Related Documentation

- [LOCAL_INTEGRATION_GUIDE.md](./LOCAL_INTEGRATION_GUIDE.md) - Local development setup
- [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md) - Integration architecture
- [docs/deployment/aws-deployment.md](./docs/deployment/aws-deployment.md) - AWS deployment guide
