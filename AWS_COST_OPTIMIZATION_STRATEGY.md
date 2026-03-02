# AWS Cost Optimization Strategy - Ultra Low Cost Architecture

**Date**: March 1, 2026  
**Goal**: Reduce AWS costs from $96-178/month to **$15-25/month**  
**Strategy**: Maximize Free Tier + Remove Non-Essential Services

---

## Executive Summary

**Current Estimate**: $96.85 - $178.50/month  
**Optimized Estimate**: **$15-25/month** (84% cost reduction!)  
**First Year with Free Tier**: **$5-10/month** (95% cost reduction!)

---

## Cost Optimization Analysis

### ❌ Services to REMOVE (Not Essential for MVP)

#### 1. AWS Bedrock (AI Content Generation) - REMOVE
**Current Cost**: $0-20/month  
**Optimized Cost**: $0/month  
**Savings**: $20/month

**Why Remove:**
- Content generation is NOT a core feature for MVP
- Can be done manually by admins initially
- Can add later when you have revenue

**Alternative:**
- Admins write descriptions manually
- Use free ChatGPT web interface for drafts
- Add AI later when app generates revenue

#### 2. Amazon Polly (Text-to-Speech) - REMOVE
**Current Cost**: $0-10/month  
**Optimized Cost**: $0/month  
**Savings**: $10/month

**Why Remove:**
- Audio narration is nice-to-have, not essential
- Most users will read text descriptions
- Can add later when you have budget

**Alternative:**
- Text-only descriptions initially
- Add audio in v2.0 when you have users

#### 3. CloudFront CDN - REMOVE (Initially)
**Current Cost**: $8-20/month  
**Optimized Cost**: $0/month  
**Savings**: $15/month

**Why Remove:**
- For low traffic (<1000 users), direct S3 access is fine
- CloudFront is optimization, not requirement
- Can add when traffic increases

**Alternative:**
- Serve images directly from S3 with public URLs
- Enable S3 Transfer Acceleration (free tier)
- Add CloudFront later when you have >5K users

#### 4. API Gateway Caching - REMOVE
**Current Cost**: $14.60/month (0.5 GB cache)  
**Optimized Cost**: $0/month  
**Savings**: $14.60/month

**Why Remove:**
- Application-level caching is sufficient
- Lambda can cache in memory
- Mobile app can cache locally

**Alternative:**
- Use Lambda in-memory caching
- Use mobile app local storage
- Use browser localStorage in admin portal

#### 5. CloudWatch Custom Metrics - REDUCE
**Current Cost**: $12/month (50 metrics)  
**Optimized Cost**: $0/month (use only free metrics)  
**Savings**: $12/month

**Why Reduce:**
- AWS provides many free built-in metrics
- Custom metrics are nice-to-have for MVP
- Can add detailed monitoring later

**Alternative:**
- Use free Lambda metrics (invocations, errors, duration)
- Use free API Gateway metrics (count, latency, errors)
- Use free DynamoDB metrics (read/write capacity)

#### 6. Provisioned Concurrency - REMOVE
**Current Cost**: $7.60/month  
**Optimized Cost**: $0/month  
**Savings**: $7.60/month

**Why Remove:**
- Cold starts are acceptable for MVP (<1 second)
- Users won't notice for low traffic
- Can add when you have performance requirements

**Alternative:**
- Accept cold starts (1-2 seconds occasionally)
- Keep Lambda functions warm with scheduled pings (free)
- Optimize Lambda package size to reduce cold starts

---

### ✅ Services to KEEP (Essential)

#### 1. DynamoDB - OPTIMIZE
**Current Cost**: $50-100/month  
**Optimized Cost**: $0-5/month  
**Savings**: $90/month

**Optimization Strategy:**

**Use Free Tier Aggressively:**
- 25 GB storage: FREE (enough for 10K+ temples)
- 25 WCU (Write Capacity Units): FREE
- 25 RCU (Read Capacity Units): FREE
- This covers ~2M reads + 1M writes per month!

**Switch to Provisioned Capacity (Free Tier):**
```yaml
# Instead of On-Demand
BillingMode: PROVISIONED
ProvisionedThroughput:
  ReadCapacityUnits: 5   # FREE (within 25 RCU limit)
  WriteCapacityUnits: 5  # FREE (within 25 WCU limit)
```

**Reduce Number of Tables:**
- Current: 12 tables
- Optimized: 6 tables (combine related data)
- Use single-table design pattern

**Single-Table Design:**
```
Instead of:
- Temples table
- TempleGroups table
- Artifacts table
- etc. (12 tables)

Use:
- MainTable (all entities with PK/SK pattern)
- AuditLog table (separate for TTL)
- StateVisibility table (small, rarely accessed)
```

**Estimated Cost**: $0/month (within free tier)

#### 2. Lambda - OPTIMIZE
**Current Cost**: $20-30/month  
**Optimized Cost**: $0/month  
**Savings**: $30/month

**Optimization Strategy:**

**Stay Within Free Tier:**
- 1M requests/month: FREE
- 400K GB-seconds/month: FREE

**Reduce Memory Allocation:**
```yaml
# Instead of 512 MB
MemorySize: 256  # Sufficient for most operations

# For simple operations
MemorySize: 128  # Minimum, very cheap
```

**Optimize Function Count:**
- Current: 30+ functions
- Optimized: 10-15 functions (combine related operations)

**Example Consolidation:**
```typescript
// Instead of separate functions:
// - CreateTemple
// - UpdateTemple
// - DeleteTemple
// - GetTemple
// - ListTemples

// Use single function:
// - TempleHandler (routes based on HTTP method)
```

**Estimated Cost**: $0/month (within free tier)

#### 3. API Gateway - OPTIMIZE
**Current Cost**: $3.50-7/month  
**Optimized Cost**: $3.50/month  
**Savings**: $3.50/month

**Optimization Strategy:**

**No Caching** (as discussed above)

**Use HTTP API Instead of REST API:**
```yaml
# HTTP API is 70% cheaper than REST API
# $1.00 per million requests vs $3.50

Type: AWS::ApiGatewayV2::Api  # HTTP API
# Instead of: AWS::ApiGateway::RestApi
```

**Estimated Cost**: $1.00/month (HTTP API pricing)

#### 4. S3 - OPTIMIZE
**Current Cost**: $5-15/month  
**Optimized Cost**: $2-5/month  
**Savings**: $10/month

**Optimization Strategy:**

**Use Free Tier:**
- 5 GB storage: FREE (first 12 months)
- 20,000 GET requests: FREE (first 12 months)
- 2,000 PUT requests: FREE (first 12 months)

**Optimize Storage:**
- Compress images before upload (reduce size by 70%)
- Use WebP format instead of PNG/JPG (50% smaller)
- Delete old QR codes after 1 year (lifecycle policy)

**Reduce Versioning:**
- Keep only last 2 versions instead of all versions
- Delete old versions after 30 days

**Estimated Cost**: $2/month (after free tier)

#### 5. Cognito - KEEP FREE
**Current Cost**: $0/month  
**Optimized Cost**: $0/month  
**Savings**: $0

**Why Keep:**
- FREE up to 50,000 MAU
- Essential for authentication
- No alternative is cheaper

**Estimated Cost**: $0/month

#### 6. CloudWatch - OPTIMIZE
**Current Cost**: $10-25/month  
**Optimized Cost**: $2-5/month  
**Savings**: $20/month

**Optimization Strategy:**

**Use Free Tier:**
- 5 GB log ingestion: FREE
- 10 custom metrics: FREE
- 10 alarms: FREE
- 3 dashboards: FREE

**Reduce Log Retention:**
```yaml
# Instead of 90 days
RetentionInDays: 7  # Only keep 1 week

# For important logs
RetentionInDays: 30  # Keep 1 month
```

**Reduce Log Volume:**
```typescript
// Only log errors and important events
if (process.env.LOG_LEVEL === 'error') {
  logger.error('Error occurred', error);
}

// Don't log every request in production
```

**Estimated Cost**: $2/month

#### 7. Route 53 - KEEP
**Current Cost**: $1.50/month  
**Optimized Cost**: $1.50/month  
**Savings**: $0

**Why Keep:**
- Essential for custom domain
- No cheaper alternative
- Fixed cost

**Estimated Cost**: $1.50/month

#### 8. SES - KEEP FREE
**Current Cost**: $0-5/month  
**Optimized Cost**: $0/month  
**Savings**: $5/month

**Optimization Strategy:**

**Use Free Tier:**
- 62,000 emails/month from Lambda: FREE
- More than enough for defect notifications

**Estimated Cost**: $0/month

#### 9. ACM (SSL) - KEEP FREE
**Current Cost**: $0/month  
**Optimized Cost**: $0/month  
**Savings**: $0

**Why Keep:**
- FREE SSL certificates
- Essential for HTTPS

**Estimated Cost**: $0/month

---

## Optimized Architecture

### New Monthly Cost Breakdown

| Service | Current | Optimized | Savings |
|---------|---------|-----------|---------|
| DynamoDB | $50-100 | $0 | $90 |
| Lambda | $20-30 | $0 | $25 |
| API Gateway | $3.50-7 | $1 | $5 |
| S3 | $5-15 | $2 | $10 |
| CloudFront | $8-20 | $0 | $15 |
| Cognito | $0 | $0 | $0 |
| CloudWatch | $10-25 | $2 | $20 |
| Route 53 | $1.50 | $1.50 | $0 |
| SES | $0-5 | $0 | $3 |
| Bedrock | $0-20 | $0 | $10 |
| Polly | $0-10 | $0 | $5 |
| ACM | $0 | $0 | $0 |
| **TOTAL** | **$96-233** | **$6.50** | **$183** |

---

## Ultra-Optimized Cost: $6.50/month

### First Year (with Free Tier):
- DynamoDB: $0 (free tier)
- Lambda: $0 (free tier)
- API Gateway: $1 (HTTP API)
- S3: $0 (free tier)
- CloudWatch: $0 (free tier)
- Route 53: $1.50
- SES: $0 (free tier)
- Cognito: $0 (free tier)
- ACM: $0 (free)
- **Total: $2.50/month** 🎉

### After First Year:
- DynamoDB: $0 (stay within free tier)
- Lambda: $0 (stay within free tier)
- API Gateway: $1
- S3: $2
- CloudWatch: $2
- Route 53: $1.50
- **Total: $6.50/month** 🎉

---

## Implementation Changes

### 1. Switch DynamoDB to Provisioned Capacity

```yaml
# cloudformation/storage-stack.yaml
TemplesTable:
  Type: AWS::DynamoDB::Table
  Properties:
    BillingMode: PROVISIONED  # Changed from PAY_PER_REQUEST
    ProvisionedThroughput:
      ReadCapacityUnits: 5
      WriteCapacityUnits: 5
```

### 2. Implement Single-Table Design

```typescript
// Single table schema
MainTable:
  PK: "TEMPLE#uuid" | "ARTIFACT#uuid" | "CONTENT#uuid" | etc.
  SK: "METADATA" | "TEMPLE#uuid" | "ARTIFACT#uuid" | etc.
  
// Examples:
// Temple:
PK: "TEMPLE#123"
SK: "METADATA"

// Artifact belonging to temple:
PK: "TEMPLE#123"
SK: "ARTIFACT#456"

// Temple in state index:
GSI1PK: "STATE#Karnataka"
GSI1SK: "TEMPLE#123"
```

### 3. Switch to HTTP API

```yaml
# cloudformation/api-stack.yaml
HttpApi:
  Type: AWS::ApiGatewayV2::Api
  Properties:
    Name: !Sub 'SanaathanaAalayaCharithra-${Environment}'
    ProtocolType: HTTP  # 70% cheaper than REST
    CorsConfiguration:
      AllowOrigins:
        - '*'
      AllowMethods:
        - GET
        - POST
        - PUT
        - DELETE
      AllowHeaders:
        - '*'
```

### 4. Consolidate Lambda Functions

```typescript
// src/handlers/templeHandler.ts
export const handler = async (event: APIGatewayProxyEvent) => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;
  
  // Route based on method and path
  if (method === 'POST' && path === '/temples') {
    return createTemple(event);
  } else if (method === 'GET' && path.startsWith('/temples/')) {
    return getTemple(event);
  } else if (method === 'PUT' && path.startsWith('/temples/')) {
    return updateTemple(event);
  } else if (method === 'DELETE' && path.startsWith('/temples/')) {
    return deleteTemple(event);
  } else if (method === 'GET' && path === '/temples') {
    return listTemples(event);
  }
  
  return { statusCode: 404, body: 'Not found' };
};
```

### 5. Optimize Lambda Memory

```yaml
# Reduce memory for simple operations
GetTempleFunction:
  Type: AWS::Lambda::Function
  Properties:
    MemorySize: 128  # Reduced from 512 MB
    Timeout: 10      # Reduced from 30 seconds
```

### 6. Serve Images from S3 Directly

```typescript
// Instead of CloudFront URL:
// https://d123456.cloudfront.net/images/temple.jpg

// Use S3 direct URL:
// https://bucket-name.s3.amazonaws.com/images/temple.jpg

// Enable CORS on S3 bucket
CorsConfiguration:
  CorsRules:
    - AllowedOrigins:
        - '*'
      AllowedMethods:
        - GET
      AllowedHeaders:
        - '*'
```

### 7. Reduce CloudWatch Logging

```typescript
// src/utils/logger.ts
export class Logger {
  log(level: string, message: string, data?: any): void {
    // Only log errors in production
    if (process.env.ENVIRONMENT === 'production' && level !== 'ERROR') {
      return;
    }
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data })
    }));
  }
}
```

### 8. Set Log Retention to 7 Days

```yaml
# cloudformation/compute-stack.yaml
CreateTempleFunctionLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub '/aws/lambda/CreateTemple-${Environment}'
    RetentionInDays: 7  # Changed from 30
```

---

## Feature Trade-offs

### Features REMOVED (Can Add Later):
1. ❌ AI Content Generation (Bedrock)
2. ❌ Audio Narration (Polly)
3. ❌ CDN (CloudFront) - for initial launch
4. ❌ API Caching
5. ❌ Custom CloudWatch Metrics
6. ❌ Provisioned Concurrency

### Features KEPT (Essential):
1. ✅ Temple Management (CRUD)
2. ✅ Artifact Management (CRUD)
3. ✅ QR Code Generation
4. ✅ Pricing Management
5. ✅ User Authentication (Cognito)
6. ✅ Admin Portal
7. ✅ Mobile App
8. ✅ State Visibility
9. ✅ Defect Tracking
10. ✅ Image Storage (S3)
11. ✅ Custom Domain (Route 53)
12. ✅ SSL Certificate (ACM)
13. ✅ Email Notifications (SES)

---

## When to Add Back Removed Features

### At 1,000 Active Users:
- Add CloudFront CDN ($10/month)
- Add API Gateway caching ($15/month)
- **Total: $31.50/month**

### At 5,000 Active Users:
- Add custom CloudWatch metrics ($12/month)
- Add provisioned concurrency ($8/month)
- **Total: $51.50/month**

### When You Have Revenue:
- Add AI Content Generation (Bedrock) ($20/month)
- Add Audio Narration (Polly) ($10/month)
- **Total: $81.50/month**

---

## Cost Monitoring & Alerts

### Set Up Billing Alarms

```yaml
# cloudformation/billing-stack.yaml
BillingAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MonthlyBillingAlert
    AlarmDescription: Alert when monthly bill exceeds $10
    MetricName: EstimatedCharges
    Namespace: AWS/Billing
    Statistic: Maximum
    Period: 21600  # 6 hours
    EvaluationPeriods: 1
    Threshold: 10.00
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref AlertTopic
```

### Enable Cost Explorer
- Free service to visualize costs
- Track spending by service
- Identify cost spikes

### Set Budget
```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json
```

```json
{
  "BudgetName": "Monthly AWS Budget",
  "BudgetLimit": {
    "Amount": "10",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

---

## Alternative: Even Cheaper Options

### Option 1: Use AWS Amplify (Simpler, Slightly More Expensive)
- Amplify Hosting: $0.15/GB (first 15 GB free)
- Amplify Backend: Includes Lambda, API Gateway, DynamoDB
- **Cost**: $10-15/month
- **Pros**: Easier setup, managed infrastructure
- **Cons**: Less control, slightly more expensive

### Option 2: Use AWS Lightsail (Fixed Price)
- Lightsail instance: $5/month (512 MB RAM)
- Lightsail database: $15/month (1 GB RAM)
- **Cost**: $20/month
- **Pros**: Predictable pricing, simple
- **Cons**: Not serverless, manual scaling

### Option 3: Hybrid (Lightsail + Lambda)
- Lightsail for database: $15/month
- Lambda + API Gateway: $2/month
- S3: $2/month
- **Cost**: $19/month
- **Pros**: Balance of cost and scalability
- **Cons**: More complex setup

---

## Recommended Approach

### Phase 1: MVP Launch (Months 1-6)
**Cost**: $2.50-6.50/month
- Use ultra-optimized architecture
- Stay within free tier
- Manual content creation (no AI)
- No audio narration
- Direct S3 access (no CDN)

### Phase 2: Growth (Months 7-12)
**Cost**: $10-20/month
- Add CloudFront CDN
- Add API caching
- Still within most free tiers

### Phase 3: Scale (Year 2+)
**Cost**: $50-100/month
- Add AI content generation
- Add audio narration
- Add custom metrics
- Add provisioned concurrency

---

## Summary

### Cost Reduction Achieved:
- **Original**: $96.85 - $178.50/month
- **Optimized**: $6.50/month
- **Savings**: $90-172/month (93% reduction!)
- **First Year**: $2.50/month (97% reduction!)

### Key Optimizations:
1. ✅ Remove non-essential services (Bedrock, Polly, CloudFront)
2. ✅ Switch DynamoDB to provisioned capacity (free tier)
3. ✅ Use HTTP API instead of REST API (70% cheaper)
4. ✅ Consolidate Lambda functions (reduce count)
5. ✅ Reduce Lambda memory allocation
6. ✅ Implement single-table design (fewer tables)
7. ✅ Reduce CloudWatch logging and retention
8. ✅ Stay within free tier limits

### Trade-offs:
- No AI content generation (manual initially)
- No audio narration (text only)
- No CDN (slightly slower for distant users)
- Occasional cold starts (1-2 seconds)
- Less detailed monitoring

### When to Scale Up:
- Add features back when you have 1,000+ users
- Add AI when you have revenue
- Add CDN when you have international users

**Result**: Production-ready app for **$2.50-6.50/month** instead of $100-180/month! 🎉

---

**Last Updated**: March 1, 2026
