# Environment Setup Guide

Configure development, staging, and production environments.

## Environment Overview

| Environment | Purpose | Infrastructure | Cost |
|-------------|---------|----------------|------|
| Development | Local development | LocalStack + Docker | $0/month |
| Staging | Testing & QA | AWS (reduced capacity) | $55/month |
| Production | Live application | AWS (full capacity) | $350/month |

## Development Environment

### Prerequisites

- Docker Desktop
- Node.js 18+
- AWS CLI (for LocalStack)

### Setup

1. **Start LocalStack:**
```powershell
docker-compose up -d
```

2. **Initialize database:**
```powershell
.\scripts\init-local-db.ps1
```

3. **Configure environment:**

**Backend (.env):**
```env
# AWS region loaded from global config (.env.global)
AWS_REGION=${AWS_REGION}
DYNAMODB_ENDPOINT=http://localhost:4566
S3_ENDPOINT=http://localhost:4566
LOG_LEVEL=debug
ENVIRONMENT=development
```

**Admin Portal (.env.development):**
```env
VITE_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
VITE_AWS_REGION=${AWS_REGION}
VITE_ENVIRONMENT=development
VITE_ENABLE_ANALYTICS=false
```

**Mobile App (.env.development):**
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
# AWS region loaded from global config (.env.global)
EXPO_PUBLIC_AWS_REGION=${AWS_REGION}
EXPO_PUBLIC_ENVIRONMENT=development
```

### Optional Features

#### Redis Caching (Local)

```powershell
# Start Redis container
docker run -d -p 6379:6379 redis:alpine

# Update .env
REDIS_ENDPOINT=localhost:6379
ENABLE_CACHING=true
```

#### CloudWatch Logging (Local)

```env
ENABLE_CLOUDWATCH=false  # Use console logging instead
LOG_LEVEL=debug
```

#### Authentication (Local)

```env
ENABLE_AUTH=false  # Disable for local development
JWT_SECRET=local-dev-secret
```

## Staging Environment

### AWS Infrastructure

Deploy with reduced capacity for cost optimization:

```powershell
cd infrastructure
cdk deploy --profile staging --context environment=staging
```

### Configuration

**Backend (AWS Lambda environment variables):**
```env
# AWS region loaded from global config (.env.global)
AWS_REGION=${AWS_REGION}
ENVIRONMENT=staging
LOG_LEVEL=info
ENABLE_CACHING=true
REDIS_ENDPOINT=staging-redis.xxxxx.cache.amazonaws.com:6379
ENABLE_AUTH=true
JWT_SECRET=<staging-secret>
```

**Admin Portal (.env.staging):**
```env
# API URL and AWS region loaded from global config (.env.global)
VITE_API_BASE_URL=https://api-staging.${DOMAIN_ROOT}
VITE_AWS_REGION=${AWS_REGION}
VITE_ENVIRONMENT=staging
VITE_ENABLE_ANALYTICS=true
```

**Mobile App (.env.staging):**
```env
# API URL and AWS region loaded from global config (.env.global)
EXPO_PUBLIC_API_BASE_URL=https://api-staging.${DOMAIN_ROOT}
EXPO_PUBLIC_AWS_REGION=${AWS_REGION}
EXPO_PUBLIC_ENVIRONMENT=staging
```

### Build and Deploy

**Admin Portal:**
```powershell
cd admin-portal
npm run build -- --mode staging
aws s3 sync dist/ s3://staging-admin-portal --profile staging
```

**Mobile App:**
```powershell
cd mobile-app
eas build --platform all --profile staging
```

### AWS Resources (Staging)

- **Lambda:** 512MB memory, 30s timeout
- **DynamoDB:** On-demand pricing
- **ElastiCache:** cache.t3.micro (1 node)
- **API Gateway:** Standard tier
- **CloudWatch:** 7-day retention

**Estimated Cost:** $55/month

## Production Environment

### AWS Infrastructure

Deploy with full capacity and monitoring:

```powershell
cd infrastructure
cdk deploy --profile production --context environment=production
```

### Configuration

**Backend (AWS Lambda environment variables):**
```env
# AWS region loaded from global config (.env.global)
AWS_REGION=${AWS_REGION}
ENVIRONMENT=production
LOG_LEVEL=warn
ENABLE_CACHING=true
REDIS_ENDPOINT=prod-redis.xxxxx.cache.amazonaws.com:6379
ENABLE_AUTH=true
JWT_SECRET=<production-secret>
ENABLE_XRAY=true
ENABLE_ALARMS=true
```

**Admin Portal (.env.production):**
```env
# API URL and AWS region loaded from global config (.env.global)
VITE_API_BASE_URL=https://api.${DOMAIN_ROOT}
VITE_AWS_REGION=${AWS_REGION}
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=<sentry-dsn>
```

**Mobile App (.env.production):**
```env
# API URL and AWS region loaded from global config (.env.global)
EXPO_PUBLIC_API_BASE_URL=https://api.${DOMAIN_ROOT}
EXPO_PUBLIC_AWS_REGION=${AWS_REGION}
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_DSN=<sentry-dsn>
```

### Build and Deploy

**Admin Portal:**
```powershell
cd admin-portal
npm run build -- --mode production
aws s3 sync dist/ s3://prod-admin-portal --profile production
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

**Mobile App:**
```powershell
cd mobile-app
eas build --platform all --profile production
eas submit --platform all --profile production
```

### AWS Resources (Production)

- **Lambda:** 1024MB memory, 30s timeout, provisioned concurrency
- **DynamoDB:** Provisioned capacity with auto-scaling
- **ElastiCache:** cache.t3.medium (2 nodes, Multi-AZ)
- **API Gateway:** Standard tier with rate limiting (100 req/min)
- **CloudWatch:** 30-day retention, alarms enabled
- **X-Ray:** Tracing enabled
- **WAF:** Optional, for DDoS protection

**Estimated Cost:** $350/month

## Environment Comparison

### Feature Matrix

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Infrastructure** |
| AWS Services | LocalStack | AWS | AWS |
| Database | Local DynamoDB | DynamoDB On-Demand | DynamoDB Provisioned |
| Caching | Optional Redis | ElastiCache (1 node) | ElastiCache (2 nodes) |
| CDN | None | CloudFront | CloudFront |
| **Security** |
| Authentication | Disabled | JWT | JWT + MFA |
| HTTPS | No | Yes | Yes |
| WAF | No | No | Optional |
| **Monitoring** |
| Logging | Console | CloudWatch (7 days) | CloudWatch (30 days) |
| Tracing | No | No | X-Ray |
| Alarms | No | Basic | Comprehensive |
| Error Tracking | Console | Sentry | Sentry |
| **Performance** |
| Lambda Memory | N/A | 512MB | 1024MB |
| Lambda Concurrency | N/A | Default | Provisioned |
| API Rate Limit | None | 50 req/min | 100 req/min |
| Cache TTL | N/A | 5 minutes | 15 minutes |

## Switching Environments

### Admin Portal

```powershell
# Development
npm run dev

# Staging
npm run build -- --mode staging
npm run preview

# Production
npm run build -- --mode production
npm run preview
```

### Mobile App

```powershell
# Development
npx expo start

# Staging
eas build --profile staging

# Production
eas build --profile production
```

### Backend

Development uses local server, staging/production use AWS Lambda.

## Environment Variables Management

### Secrets Management

**Development:**
- Store in `.env` files (gitignored)
- Use `.env.example` as template

**Staging/Production:**
- Store in AWS Systems Manager Parameter Store
- Reference in CDK/CloudFormation
- Never commit secrets to git

### Loading Secrets

**Backend (Lambda):**
```typescript
import { SSM } from 'aws-sdk';

const ssm = new SSM();
const secret = await ssm.getParameter({
  Name: '/app/production/jwt-secret',
  WithDecryption: true
}).promise();
```

**Frontend:**
- Build-time: Use .env files
- Runtime: Fetch from backend API

## Monitoring and Logging

### Development

**Console logging:**
```typescript
console.log('Debug info:', data);
console.error('Error:', error);
```

### Staging/Production

**CloudWatch Logs:**
```typescript
import { Logger } from './shared/logger';

const logger = new Logger('TempleService');
logger.info('Temple created', { templeId });
logger.error('Failed to create temple', { error });
```

**Metrics:**
```typescript
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();
await cloudwatch.putMetricData({
  Namespace: 'TempleApp',
  MetricData: [{
    MetricName: 'TempleCreated',
    Value: 1,
    Unit: 'Count'
  }]
}).promise();
```

## Cost Optimization

### Development

- Use LocalStack (free)
- No AWS costs
- Run only when developing

### Staging

- Use on-demand pricing
- Single-node cache
- Shorter log retention
- No provisioned concurrency
- Stop resources when not testing

### Production

- Use reserved instances for predictable workloads
- Enable auto-scaling
- Set up cost alerts
- Review CloudWatch metrics monthly
- Delete unused resources

## Health Checks

### Development

```powershell
curl http://localhost:4000/health
```

### Staging/Production

```powershell
# Health check URLs using global config
curl https://api-staging.${DOMAIN_ROOT}/health
curl https://api.${DOMAIN_ROOT}/health
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

## Troubleshooting

### Environment not loading

Check `.env` file exists and is properly formatted:
```powershell
# List environment variables
Get-Content .env
```

### API calls failing

Verify API_BASE_URL:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

### AWS credentials issues

```powershell
# Check AWS profile
aws sts get-caller-identity --profile staging

# Configure profile
aws configure --profile staging
```

## Next Steps

- [Quick Start](./quick-start.md) - Get started quickly
- [Local Development](./local-development.md) - Development workflow
- [Deployment Guide](../deployment/aws-deployment.md) - Deploy to AWS
- [API Reference](../api/backend-api.md) - Backend API documentation
