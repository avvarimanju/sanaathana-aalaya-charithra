# Deployment Architecture - Sanaathana Aalaya Charithra

## Overview
This application uses a **serverless architecture** on AWS, which means **NO EC2 instances** are used. Everything runs on managed AWS services that automatically scale and require no server management.

## Why Serverless? (Not EC2)

### ❌ Why NOT EC2?
1. **Cost**: EC2 runs 24/7 even when idle - you pay ~$10-50/month minimum
2. **Maintenance**: You must manage OS updates, security patches, scaling
3. **Scaling**: Manual setup required for auto-scaling
4. **Complexity**: Need to configure load balancers, health checks, etc.

### ✅ Why Serverless (Lambda)?
1. **Cost**: Pay only for actual usage - $0 when no one uses the app
2. **Zero Maintenance**: AWS manages everything (OS, scaling, security)
3. **Auto-Scaling**: Automatically handles 1 user or 10,000 users
4. **Simplicity**: Just deploy code, AWS handles infrastructure

## AWS Services Used

### 1. **AWS Lambda** (Compute Layer)
**What it is:** Serverless compute - runs your code without servers

**Where code deploys:** 
- Code is packaged and uploaded to Lambda
- Each Lambda function is a separate deployment unit
- Located in: `dist/lambdas/` after build

**Lambda Functions Deployed:**
1. **QR Processing Lambda** (`qr-processing.handler`)
   - Handles QR code scanning
   - Timeout: 30 seconds
   - Memory: 512 MB

2. **Content Generation Lambda** (`content-generation.handler`)
   - Generates AI content using Bedrock
   - Timeout: 5 minutes (AI generation takes time)
   - Memory: 1024 MB

3. **Q&A Processing Lambda** (`qa-processing.handler`)
   - Handles user questions
   - Timeout: 2 minutes
   - Memory: 512 MB

4. **Analytics Lambda** (`analytics.handler`)
   - Tracks user interactions
   - Timeout: 30 seconds
   - Memory: 256 MB

5. **Payment Handler Lambda** (`payment-handler.handler`)
   - Processes Razorpay payments
   - Timeout: 30 seconds
   - Memory: 512 MB

6. **Pre-Generation Lambda** (`pre-generation.handler`)
   - Batch processes content pre-generation for all artifacts
   - Handles Lambda timeout limits through recursive invocation
   - Timeout: 5 minutes
   - Memory: 1024 MB
   - Environment Variables:
     - `S3_BUCKET`: Content bucket name
     - `DYNAMODB_PROGRESS_TABLE`: Progress tracking table
     - `DYNAMODB_CACHE_TABLE`: Content cache table
     - `BATCH_SIZE`: Items per invocation (default: 10)

**How Lambda Works:**
```
User Request → API Gateway → Lambda Function → Response
                                ↓
                          (Lambda auto-scales)
```

### 2. **Amazon API Gateway** (API Layer)
**What it is:** Managed API service that routes HTTP requests to Lambda

**Endpoints Created:**
- `POST /qr` - QR code processing
- `POST /content` - Content generation
- `GET /content/{artifactId}` - Get artifact content
- `POST /qa` - Ask questions
- `GET /qa/{sessionId}` - Get conversation history
- `POST /analytics` - Track events
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `GET /payments/check-access/{userId}/{templeId}` - Check access
- `GET /health` - Health check

**URL Format:** `https://[api-id].execute-api.us-east-1.amazonaws.com/prod/`

### 3. **Amazon DynamoDB** (Database Layer)
**What it is:** Serverless NoSQL database - no server management needed

**Tables Created:**
1. **HeritageSites** - Temple/site information
2. **Artifacts** - Artifact details (49 artifacts)
3. **UserSessions** - User session data (auto-expires)
4. **ContentCache** - Cached AI-generated content (auto-expires)
5. **Analytics** - Usage analytics
6. **Purchases** - Payment records
7. **PreGenerationProgress** - Progress tracking for batch content generation (auto-expires after 90 days)

**Billing:** Pay-per-request (no fixed cost)

### 4. **Amazon S3** (Storage Layer)
**What it is:** Object storage for files (audio, video, images)

**Bucket:** `sanaathana-aalaya-charithra-content-[account]-[region]`

**Stores:**
- Generated audio files (from Polly)
- Generated video files
- Infographic images
- QR code images

**Features:**
- Versioning enabled
- Encryption enabled
- Auto-transition to cheaper storage after 30 days

### 5. **Amazon CloudFront** (CDN Layer)
**What it is:** Global content delivery network

**Purpose:**
- Caches content globally for fast access
- Reduces S3 costs (CloudFront is cheaper for downloads)
- HTTPS by default
- Low latency worldwide

### 6. **Amazon Bedrock** (AI Layer)
**What it is:** Managed AI service (Claude 3 Sonnet model)

**Used for:**
- Generating artifact descriptions
- Answering user questions
- Creating historical narratives
- Multilingual content

**Cost:** ~$0.03 per content generation

### 7. **Amazon Polly** (Text-to-Speech)
**What it is:** Converts text to natural speech

**Used for:**
- Audio guides in multiple languages
- Supports 10+ Indian languages

### 8. **Amazon Translate** (Translation)
**What it is:** Neural machine translation

**Used for:**
- Translating content to user's language
- Supports English, Hindi, Telugu, Tamil, Kannada, etc.

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PROCESS                        │
└─────────────────────────────────────────────────────────────┘

1. Developer Machine
   ├── npm run build          (TypeScript → JavaScript)
   ├── npm run bundle         (Bundle Lambda code)
   └── npm run deploy         (Deploy to AWS)
                ↓
2. AWS CDK (Infrastructure as Code)
   ├── Creates/Updates Lambda functions
   ├── Creates/Updates DynamoDB tables
   ├── Creates/Updates API Gateway
   ├── Creates/Updates S3 bucket
   ├── Creates/Updates CloudFront
   └── Sets up IAM permissions
                ↓
3. AWS CloudFormation
   ├── Executes CDK instructions
   ├── Creates AWS resources
   └── Outputs API URLs
                ↓
4. Seed Data
   └── npm run seed           (Populate DynamoDB with 49 artifacts)
```

## Deployment Commands

```bash
# Full deployment
npm run build && npm run bundle && npm run deploy && npm run seed

# Or use quick-deploy
npm run quick-deploy
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│              (Mobile App on Android Devices)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│              (HTTPS REST API Endpoints)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Lambda    │  │   Lambda    │  │   Lambda    │
│ QR Process  │  │  Content    │  │  Payment    │
│             │  │  Generate   │  │  Handler    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  DynamoDB   │  │   Bedrock   │  │     S3      │
│  (Tables)   │  │  (AI/LLM)   │  │  (Storage)  │
└─────────────┘  └─────────────┘  └──────┬──────┘
                                          │
                                          ↓
                                  ┌─────────────┐
                                  │ CloudFront  │
                                  │    (CDN)    │
                                  └─────────────┘
```

## Cost Breakdown (Monthly Estimates)

### Free Tier (First 12 months)
- **Lambda**: 1M requests/month FREE
- **DynamoDB**: 25 GB storage + 25 WCU/RCU FREE
- **S3**: 5 GB storage FREE
- **CloudFront**: 50 GB transfer FREE
- **API Gateway**: 1M requests FREE

### After Free Tier (100 users/day)
- **Lambda**: ~$1-2/month
- **DynamoDB**: ~$2-3/month
- **S3**: ~$1/month
- **CloudFront**: ~$1/month
- **API Gateway**: ~$1/month
- **Bedrock (AI)**: ~$15-30/month (if generating on-demand)
- **Polly**: ~$2/month
- **Translate**: ~$1/month

**Total: ~$24-40/month** for 100 active users/day

### Cost Optimization
Pre-generate all content for 49 artifacts = ~₹186 one-time cost
Then ongoing cost drops to ~$10-15/month (no Bedrock usage)

## Why This Architecture?

### 1. **Cost-Effective**
- No servers running 24/7
- Pay only for actual usage
- Free tier covers initial users

### 2. **Scalable**
- Handles 1 user or 10,000 users automatically
- No manual scaling needed
- No performance degradation

### 3. **Reliable**
- AWS manages infrastructure
- 99.99% uptime SLA
- Automatic failover

### 4. **Secure**
- Encryption at rest and in transit
- IAM-based access control
- No server vulnerabilities to patch

### 5. **Fast**
- CloudFront CDN for global delivery
- Lambda cold start: ~1-2 seconds
- Warm Lambda: ~100-200ms response

### 6. **Maintainable**
- Infrastructure as Code (CDK)
- Version controlled
- Easy to update and rollback

## Comparison: Serverless vs EC2

| Aspect | Serverless (Current) | EC2 (Alternative) |
|--------|---------------------|-------------------|
| **Cost (idle)** | $0 | $10-50/month |
| **Cost (100 users)** | $24-40/month | $50-100/month |
| **Scaling** | Automatic | Manual setup |
| **Maintenance** | Zero | Weekly updates |
| **Setup Time** | 10 minutes | 2-3 hours |
| **Expertise Needed** | Basic AWS | Advanced DevOps |
| **Reliability** | 99.99% | Depends on setup |

## Mobile App Deployment

**Important:** The mobile app does NOT deploy to AWS!

- **Android App**: Deployed to user devices via Google Play Store
- **App connects to**: AWS API Gateway endpoints
- **App downloads**: Content from CloudFront CDN

## Environment Variables

Set these before deployment:

```bash
# Required for payment functionality
export RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
export RAZORPAY_KEY_SECRET=YOUR_SECRET

# Optional - defaults to us-east-1
export AWS_REGION=us-east-1
```

## Monitoring & Logs

- **CloudWatch Logs**: All Lambda logs (7-day retention)
- **API Gateway Logs**: Request/response logs
- **CloudWatch Metrics**: Automatic performance metrics
- **X-Ray**: Distributed tracing (optional)

## Security

- **API Gateway**: HTTPS only, CORS enabled
- **Lambda**: IAM role-based permissions
- **DynamoDB**: Encryption at rest
- **S3**: Private bucket, CloudFront access only
- **Secrets**: Environment variables (use AWS Secrets Manager for production)

## Deployment Regions

**Current:** us-east-1 (US East - N. Virginia)

**Why?**
- Bedrock availability
- Lowest latency to India
- Most AWS services available

**Can change to:** ap-south-1 (Mumbai) for lower latency to Indian users
- Update `cdk.json` or pass `--region` flag

## Summary

Your code deploys to **AWS Lambda** (serverless functions), not EC2 servers. This is the modern, cost-effective approach for applications like yours that have variable traffic. AWS automatically manages all infrastructure, scaling, and maintenance, allowing you to focus on code rather than servers.
