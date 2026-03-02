# Deployment Strategy: 2-Environment Setup

## Overview

This project uses a **2-environment strategy** to minimize costs while maintaining quality:

1. **Local Development** (Free) - Your computer with LocalStack
2. **Staging** (AWS) - Pre-production testing (~$15-20/month)
3. **Production** (AWS) - Live users (~$13-186/month based on usage)

**Total AWS Cost**: $28-206/month (vs $175/month for 3 environments)

---

## 🏗️ Architecture

### AWS Region: ap-south-1 (Mumbai)

This project is configured to deploy in the **Mumbai region (ap-south-1)** for optimal performance for Indian users:

**Why Mumbai?**
- **Low Latency**: 5-20ms for users in India (vs 200-300ms from us-east-1)
- **10-15x Faster**: Significantly better user experience
- **Mature Region**: Launched in 2016, all AWS services available
- **Cost**: Only ~10% more expensive than us-east-1 ($2-5/month difference)
- **Compliance**: Data stays in India (important for some regulations)

**Alternative Regions:**
- **ap-south-2 (Hyderabad)**: Newer region, some services may not be available
- **us-east-1 (Virginia)**: Cheapest but high latency for Indian users
- **ap-southeast-1 (Singapore)**: Good alternative, ~50-80ms latency

To change the region, update `CDK_DEFAULT_REGION` environment variable or modify `infrastructure/app.ts`.

```
┌─────────────────────────────────────────────────────────┐
│                  DEVELOPMENT WORKFLOW                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. LOCAL DEVELOPMENT (Your Computer)                   │
│     ├── LocalStack (DynamoDB, S3, Lambda emulation)     │
│     ├── Docker containers                               │
│     ├── Mock data                                       │
│     └── Cost: $0                                        │
│                                                          │
│  2. STAGING ENVIRONMENT (AWS ap-south-1)                │
│     ├── staging-* resources                             │
│     ├── Integration testing                             │
│     ├── Beta testing                                    │
│     └── Cost: ~$15-20/month                             │
│                                                          │
│  3. PRODUCTION ENVIRONMENT (AWS ap-south-1)             │
│     ├── prod-* resources                                │
│     ├── Real users, real data                           │
│     └── Cost: ~$13-186/month (scales with usage)        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Environment Isolation

### Resource Naming Convention

All AWS resources are prefixed with environment name:

| Resource Type | Staging | Production |
|--------------|---------|------------|
| DynamoDB Tables | `staging-HeritageSites` | `prod-HeritageSites` |
| Lambda Functions | `staging-temple-api` | `prod-temple-api` |
| S3 Buckets | `staging-temple-images-{account}` | `prod-temple-images-{account}` |
| API Gateway | `staging-temple-api` | `prod-temple-api` |
| Cognito Pools | `staging-temple-users` | `prod-temple-users` |
| CloudWatch Logs | `/aws/lambda/staging-*` | `/aws/lambda/prod-*` |

### Data Separation

- **Staging**: Test data, beta testers, fake payments
- **Production**: Real data, real users, real payments

### User Separation

- **Staging Cognito Pool**: Test accounts, developers, QA team
- **Production Cognito Pool**: Real users only

---

## 💰 Cost Breakdown

### Staging Environment (~$15-20/month)

| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 100K reads, 50K writes, 5GB | $2 |
| Lambda | 10K invocations | $0.50 |
| API Gateway | 10K requests | $0.04 |
| S3 + CloudFront | 10GB storage, 20GB transfer | $2 |
| Bedrock | 100K tokens (testing) | $1 |
| Polly | 500K characters | $2 |
| CloudWatch | 2GB logs | $1 |
| Cognito | <50K MAU | Free |
| **Total** | | **~$8.54** |

**Note**: Can be torn down when not testing to save costs.

### Production Environment (Scales with Usage)

#### Low Traffic (500 users/month)
| Service | Cost |
|---------|------|
| All services | ~$13/month |

#### Medium Traffic (2,000 users/month)
| Service | Cost |
|---------|------|
| All services | ~$41/month |

#### High Traffic (10,000 users/month)
| Service | Cost |
|---------|------|
| All services | ~$186/month |

---

## 🚀 Deployment Workflow

### 1. Local Development

```bash
# Install LocalStack
pip install localstack awscli-local

# Start LocalStack
localstack start

# Run app locally
npm run dev:local

# Test locally
npm run test:local
```

### 2. Deploy to Staging

```bash
# Build and test
npm run build
npm run test

# Deploy to staging
npm run deploy:staging

# Run E2E tests
npm run test:e2e:staging

# Monitor logs
npm run logs:staging
```

### 3. Deploy to Production

```bash
# Final checks
npm run test
npm run lint

# Deploy to production
npm run deploy:prod

# Smoke tests
npm run test:smoke:prod

# Monitor
npm run logs:prod
```

---

## 🔧 Environment Configuration

### Environment Variables

Each environment has its own configuration:

**Staging** (`.env.staging`):
```bash
STAGE=staging
AWS_REGION=ap-south-1  # Mumbai region for Indian users
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0  # Cheaper model
RAZORPAY_MODE=test
LOG_LEVEL=debug
ENABLE_XRAY=false
```

**Production** (`.env.prod`):
```bash
STAGE=prod
AWS_REGION=ap-south-1  # Mumbai region for Indian users
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0  # Better model
RAZORPAY_MODE=live
LOG_LEVEL=info
ENABLE_XRAY=true
```

### CDK Context

Environments are configured via CDK context:

```json
{
  "staging": {
    "account": "123456789012",
    "region": "ap-south-1",
    "domainName": "staging-api.example.com",
    "certificateArn": "arn:aws:acm:ap-south-1:..."
  },
  "prod": {
    "account": "123456789012",
    "region": "ap-south-1",
    "domainName": "api.example.com",
    "certificateArn": "arn:aws:acm:ap-south-1:..."
  }
}
```

---

## 📋 Deployment Checklist

### Before Deploying to Staging

- [ ] All tests passing locally
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] AWS credentials configured
- [ ] CDK bootstrapped

### Before Deploying to Production

- [ ] Staging tests passed
- [ ] Beta testing completed
- [ ] Performance testing done
- [ ] Security review completed
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main        # Deploy to staging
      - production  # Deploy to production

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: npm run deploy:staging

  deploy-production:
    if: github.ref == 'refs/heads/production'
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: npm run deploy:prod
```

---

## 🛡️ Security Considerations

### Staging Environment

- Use test Razorpay keys
- Separate Cognito user pool
- Less restrictive CORS
- Debug logging enabled
- No PII data

### Production Environment

- Live Razorpay keys (stored in Secrets Manager)
- Production Cognito user pool
- Strict CORS policy
- Info-level logging only
- PII data encrypted
- MFA enabled for admin users
- WAF enabled (optional)

---

## 📊 Monitoring

### Staging

- CloudWatch Logs (7-day retention)
- Basic CloudWatch metrics
- No alarms (optional)

### Production

- CloudWatch Logs (30-day retention)
- Custom CloudWatch metrics
- CloudWatch Alarms:
  - API error rate > 5%
  - Lambda errors > 10/hour
  - DynamoDB throttling
  - High latency (p99 > 3s)
- AWS X-Ray tracing enabled

---

## 🔧 Maintenance

### Staging Environment

**Option 1: Always On** (~$15-20/month)
- Keep running for continuous testing
- Good for active development

**Option 2: On-Demand** (~$2-5/month)
- Deploy only when needed
- Tear down after testing
- Good for cost savings

```bash
# Tear down staging
npm run destroy:staging

# Redeploy when needed
npm run deploy:staging
```

### Production Environment

- Always running
- Regular backups (DynamoDB PITR enabled)
- Monthly cost reviews
- Quarterly performance optimization

---

## 📈 Scaling Strategy

### Phase 1: MVP (Months 1-3)
- Staging: On-demand
- Production: Minimal resources
- **Cost**: $15-30/month

### Phase 2: Growth (Months 4-6)
- Staging: Always on
- Production: Scaled up
- **Cost**: $30-60/month

### Phase 3: Scale (Month 7+)
- Staging: Always on
- Production: Auto-scaling enabled
- **Cost**: $60-200/month

---

## 🆘 Troubleshooting

### Deployment Fails

```bash
# Check CDK diff
npm run diff:staging

# Check AWS credentials
aws sts get-caller-identity

# Check CDK bootstrap
cdk bootstrap aws://ACCOUNT/REGION
```

### Environment Mismatch

```bash
# Verify environment
aws dynamodb list-tables | grep staging
aws lambda list-functions | grep staging

# Check environment variables
aws lambda get-function-configuration \
  --function-name staging-temple-api \
  --query 'Environment.Variables'
```

### Cost Overrun

```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-26 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Identify expensive resources
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-26 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🎯 Quick Reference

### Common Commands

```bash
# Local development
npm run dev:local

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# View logs
npm run logs:staging
npm run logs:prod

# Tear down staging
npm run destroy:staging

# Run tests
npm run test:e2e:staging
npm run test:smoke:prod
```

### Cost Monitoring

```bash
# Daily cost check
npm run cost:check

# Set budget alert
npm run cost:alert --threshold 50
```

---

**Last Updated**: 2026-02-26
**Version**: 1.0.0
