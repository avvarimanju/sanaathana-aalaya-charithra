# Environment Architecture Guide

## Overview

The API client layer works for ALL environments. Only the backend changes.

---

## Development Environment (Current Setup)

### Architecture
```
Admin Portal (localhost:5173)
    ↓ HTTP
    VITE_API_BASE_URL=http://localhost:4000
    ↓
Express.js Server (localhost:4000)
    ↓
Lambda Service Functions (imported as modules)
    ↓
LocalStack DynamoDB (localhost:4566)
```

### Components
- **Frontend**: React app with API clients
- **Backend**: Express.js wrapper (`src/local-server/server.ts`)
- **Database**: LocalStack DynamoDB
- **Storage**: LocalStack S3

### Pros
- ✅ Fast development cycle
- ✅ No AWS costs
- ✅ Easy debugging
- ✅ Works offline

### Cons
- ⚠️ Data doesn't persist (LocalStack restarts)
- ⚠️ Not production-ready
- ⚠️ Single developer only

### Configuration
```env
# .env.development
VITE_API_BASE_URL=http://localhost:4000
```

---

## Staging Environment (To Be Deployed)

### Architecture
```
Admin Portal (admin-staging.charithra.org)
    ↓ HTTPS
    VITE_API_BASE_URL=https://api-staging.charithra.org
    ↓
AWS API Gateway (REST API)
    ↓
Lambda Functions (deployed)
    ↓
AWS DynamoDB (staging tables)
AWS S3 (staging bucket)
```

### Components
- **Frontend**: React app deployed to S3 + CloudFront
- **Backend**: API Gateway + Lambda functions
- **Database**: AWS DynamoDB (on-demand billing)
- **Storage**: AWS S3
- **Auth**: AWS Cognito (optional)

### Pros
- ✅ Production-like environment
- ✅ Persistent data
- ✅ Team can test together
- ✅ Real AWS services

### Cons
- ⚠️ Costs ~$55/month
- ⚠️ Slower deployment cycle
- ⚠️ Requires AWS setup

### Configuration
```env
# .env.staging - References global configuration
# AWS region is loaded from .env.global (currently: ap-south-1)
VITE_API_BASE_URL=https://api-staging.charithra.org
VITE_AWS_REGION=${AWS_REGION:-ap-south-1}
VITE_COGNITO_USER_POOL_ID=${AWS_REGION:-ap-south-1}_xxxxx
```

---

## Production Environment (To Be Deployed)

### Architecture
```
Admin Portal (admin.charithra.org)
    ↓ HTTPS
    VITE_API_BASE_URL=https://api.charithra.org
    ↓
AWS API Gateway (REST API)
    ├── Rate Limiting (100 req/min)
    ├── JWT Authorizer
    └── Request Validation
    ↓
Lambda Functions (deployed)
    ├── Auto-scaling
    ├── X-Ray Tracing
    └── CloudWatch Logs
    ↓
AWS DynamoDB (provisioned capacity)
AWS ElastiCache Redis (caching)
AWS S3 (production bucket)
```

### Components
- **Frontend**: React app on CloudFront CDN
- **Backend**: API Gateway + Lambda (production config)
- **Database**: AWS DynamoDB (provisioned capacity)
- **Cache**: ElastiCache Redis
- **Storage**: AWS S3 with CloudFront
- **Auth**: AWS Cognito with MFA
- **Monitoring**: CloudWatch + X-Ray

### Pros
- ✅ Highly available
- ✅ Auto-scaling
- ✅ Secure
- ✅ Monitored
- ✅ Fast (caching + CDN)

### Cons
- ⚠️ Costs ~$350/month
- ⚠️ Complex setup
- ⚠️ Requires DevOps knowledge

### Configuration
```env
# .env.production - References global configuration
# AWS region is loaded from .env.global (currently: ap-south-1)
VITE_API_BASE_URL=https://api.charithra.org
VITE_AWS_REGION=${AWS_REGION:-ap-south-1}
VITE_COGNITO_USER_POOL_ID=${AWS_REGION:-ap-south-1}_xxxxx
VITE_ENABLE_ANALYTICS=true
```

---

## API Client Layer - Same for All Environments ✅

The API clients you have work everywhere:

```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export class ApiClient {
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  // ... rest of implementation
}
```

### Key Features
- ✅ Environment-agnostic
- ✅ Configurable via environment variables
- ✅ Same code for all environments
- ✅ Type-safe interfaces
- ✅ Error handling built-in

### Usage (Same Everywhere)
```typescript
import { templeApi } from '../api';

// Works in dev, staging, and production
const temples = await templeApi.listTemples();
```

---

## What Changes Per Environment?

### Frontend (Admin Portal)
| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| API Clients | ✅ Same | ✅ Same | ✅ Same |
| API Base URL | localhost:4000 | api-staging.charithra.org | api.charithra.org |
| Deployment | Local (npm run dev) | S3 + CloudFront | S3 + CloudFront |
| Domain | localhost:5173 | admin-staging.charithra.org | admin.charithra.org |

### Backend
| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| API Layer | Express.js | API Gateway | API Gateway |
| Lambda Functions | Imported modules | Deployed | Deployed |
| Database | LocalStack | AWS DynamoDB | AWS DynamoDB |
| Caching | None | Optional | Redis |
| Auth | Mock | Cognito | Cognito + MFA |
| Monitoring | Console logs | CloudWatch | CloudWatch + X-Ray |

---

## Deployment Strategy

### Phase 1: Development (Current) ✅
```bash
# Start local backend
.\scripts\start-local-backend.ps1

# Start dashboard
cd admin-portal
npm run dev
```

### Phase 2: Deploy to Staging (Next)
```bash
# 1. Deploy infrastructure
cd infrastructure
cdk deploy TemplePricingStack --profile staging

# 2. Build and deploy dashboard
cd admin-portal
npm run build
aws s3 sync dist/ s3://staging-admin-portal

# 3. Update environment
# Set VITE_API_BASE_URL to API Gateway URL
```

### Phase 3: Deploy to Production (Later)
```bash
# 1. Deploy infrastructure
cd infrastructure
cdk deploy TemplePricingStack --profile production

# 2. Build and deploy dashboard
cd admin-portal
npm run build
aws s3 sync dist/ s3://prod-admin-portal

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

---

## Environment Configuration Files

### Development
```bash
admin-portal/.env.development
```
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_ENVIRONMENT=development
```

### Staging
```bash
admin-portal/.env.staging
```
```env
# Staging Environment Configuration - References global config
VITE_API_BASE_URL=https://api-staging.charithra.org
VITE_ENVIRONMENT=staging
VITE_AWS_REGION=${AWS_REGION:-ap-south-1}
VITE_COGNITO_USER_POOL_ID=${AWS_REGION:-ap-south-1}_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
```

### Production
```bash
admin-portal/.env.production
```
```env
# Production Environment Configuration - References global config
VITE_API_BASE_URL=https://api.charithra.org
VITE_ENVIRONMENT=production
VITE_AWS_REGION=${AWS_REGION:-ap-south-1}
VITE_COGNITO_USER_POOL_ID=${AWS_REGION:-ap-south-1}_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Building for Different Environments

### Development
```bash
npm run dev
# Uses .env.development
```

### Staging
```bash
npm run build -- --mode staging
# Uses .env.staging
```

### Production
```bash
npm run build -- --mode production
# Uses .env.production
```

---

## API Endpoint Mapping

### Development
```
POST http://localhost:4000/api/temples
GET  http://localhost:4000/api/temples
GET  http://localhost:4000/api/temples/:id
```

### Staging
```
POST https://api-staging.charithra.org/api/temples
GET  https://api-staging.charithra.org/api/temples
GET  https://api-staging.charithra.org/api/temples/:id
```

### Production
```
POST https://api.charithra.org/api/temples
GET  https://api.charithra.org/api/temples
GET  https://api.charithra.org/api/temples/:id
```

**Same API client code works for all!** Just change the base URL.

---

## What Needs to Be Done for Staging/Production?

### Backend (Tasks 15-20)
1. **API Gateway Setup** (Task 15)
   - Create REST API
   - Configure endpoints
   - Add JWT authorizer
   - Set up rate limiting

2. **Deploy Lambda Functions**
   - Package Lambda code
   - Deploy to AWS
   - Configure environment variables
   - Set up IAM roles

3. **Provision Infrastructure**
   - Create DynamoDB tables
   - Set up ElastiCache Redis
   - Configure S3 buckets
   - Set up CloudWatch alarms

4. **Configure Monitoring** (Task 16)
   - CloudWatch dashboards
   - X-Ray tracing
   - SNS alerts
   - Error tracking

### Frontend (Already Done) ✅
- API clients ready
- Environment configuration ready
- Build scripts ready
- Just need to set environment variables

---

## Cost Comparison

| Environment | Monthly Cost | Purpose |
|-------------|--------------|---------|
| Development | $0 | Local testing |
| Staging | $55 | Team testing |
| Production | $350 | Live users |

---

## Summary

### ✅ What Works for All Environments
- API client layer (`src/api/`)
- Type-safe interfaces
- Error handling
- Batch operations
- Admin Portal UI

### ⚠️ What's Environment-Specific
- Backend implementation (Express vs API Gateway)
- Database (LocalStack vs AWS DynamoDB)
- API base URL
- Authentication method
- Monitoring setup

### 🎯 Key Takeaway
**The API integration layer you have is production-ready!** You just need to:
1. Deploy the backend to AWS (Tasks 15-20)
2. Update environment variables
3. Build and deploy the dashboard

The same code works everywhere - that's the beauty of environment-based configuration!

---

**Created**: 2026-02-27
**Status**: API clients ready for all environments, backend needs AWS deployment
