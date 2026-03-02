# AWS Region Selection Guide

## 🎯 Recommended Region: ap-south-1 (Mumbai)

This project is configured to use **Mumbai (ap-south-1)** as the default AWS region, optimized for Indian users.

---

## 📊 Region Comparison for Indian Users

| Region | Location | Latency | Cost | Maturity | Recommendation |
|--------|----------|---------|------|----------|----------------|
| **ap-south-1** | Mumbai | 5-20ms | Medium | ⭐⭐⭐⭐⭐ | ✅ **Best Choice** |
| ap-south-2 | Hyderabad | 10-30ms | Medium | ⭐⭐⭐ | ⚠️ Limited services |
| ap-southeast-1 | Singapore | 50-80ms | Medium | ⭐⭐⭐⭐⭐ | ✅ Good alternative |
| us-east-1 | Virginia | 200-300ms | Low | ⭐⭐⭐⭐⭐ | ❌ High latency |
| eu-west-1 | Ireland | 150-250ms | Medium | ⭐⭐⭐⭐⭐ | ❌ High latency |

---

## 🚀 Why Mumbai (ap-south-1)?

### 1. Performance

**Latency for Indian Users:**
- Mumbai: 5-20ms ⚡
- Hyderabad: 10-30ms
- Singapore: 50-80ms
- Virginia: 200-300ms 🐌

**Real-World Impact:**
```
User Action: Scan QR Code → Generate Content

Mumbai (ap-south-1):
  API Call: 10ms
  Bedrock Processing: 2000ms
  Total: ~2010ms ✅

Virginia (us-east-1):
  API Call: 250ms
  Bedrock Processing: 2000ms
  Total: ~2250ms ❌
  
Difference: 240ms slower (12% worse user experience)
```

### 2. Cost Comparison

**Monthly Cost Estimate (Medium Traffic - 2,000 users):**

| Service | Mumbai (ap-south-1) | Virginia (us-east-1) | Difference |
|---------|---------------------|----------------------|------------|
| DynamoDB | $6.50 | $6.00 | +$0.50 |
| Lambda | $4.20 | $4.00 | +$0.20 |
| API Gateway | $3.80 | $3.50 | +$0.30 |
| S3 + CloudFront | $5.50 | $5.00 | +$0.50 |
| Bedrock | $12.00 | $12.00 | $0.00 |
| Polly | $4.00 | $4.00 | $0.00 |
| CloudWatch | $2.00 | $2.00 | $0.00 |
| Cognito | Free | Free | $0.00 |
| **Total** | **$38.00** | **$36.50** | **+$1.50** |

**Cost Increase: Only 4% more expensive for 10-15x better performance!**

### 3. Service Availability

**Mumbai (ap-south-1) - Launched 2016:**
- ✅ All core services available
- ✅ Amazon Bedrock (Claude models)
- ✅ Amazon Polly (text-to-speech)
- ✅ DynamoDB with Global Tables
- ✅ Lambda@Edge
- ✅ CloudFront
- ✅ Cognito
- ✅ API Gateway
- ✅ S3 with Transfer Acceleration

**Hyderabad (ap-south-2) - Launched 2022:**
- ✅ Core services available
- ❌ Amazon Bedrock (not available yet)
- ❌ Some newer services unavailable
- ⚠️ Fewer availability zones

### 4. Data Residency

**Important for Indian Regulations:**
- Data stays within India
- Complies with data localization requirements
- Better for government/enterprise customers
- Meets RBI guidelines for financial data

---

## 🌏 Alternative Regions

### Option 1: Hyderabad (ap-south-2)

**Pros:**
- Low latency for Indian users (10-30ms)
- Data stays in India
- Similar cost to Mumbai

**Cons:**
- ❌ Bedrock not available (critical for this app!)
- ❌ Fewer services available
- ❌ Newer region, less mature
- ❌ Fewer availability zones

**Verdict:** ❌ Not recommended (Bedrock unavailable)

### Option 2: Singapore (ap-southeast-1)

**Pros:**
- Mature region (launched 2006)
- All services available
- Good latency for South/Southeast Asia (50-80ms)
- Similar cost to Mumbai

**Cons:**
- Higher latency than Mumbai
- Data outside India

**Verdict:** ✅ Good alternative if Mumbai has issues

### Option 3: Virginia (us-east-1)

**Pros:**
- Cheapest region (~4% less expensive)
- Most mature region
- All services available first
- Largest capacity

**Cons:**
- ❌ High latency for Indian users (200-300ms)
- ❌ Poor user experience
- ❌ Data outside India

**Verdict:** ❌ Not recommended for Indian users

---

## 🔧 How to Change Region

### Method 1: Environment Variable (Recommended)

```bash
# Set for current session
export CDK_DEFAULT_REGION=ap-south-1

# Set permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export CDK_DEFAULT_REGION=ap-south-1' >> ~/.bashrc
source ~/.bashrc
```

### Method 2: AWS CLI Configuration

```bash
# Configure default region
aws configure set region ap-south-1

# Verify
aws configure get region
```

### Method 3: Modify CDK Code

Edit `infrastructure/app.ts`:

```typescript
// Get environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'ap-south-1';  // Change here
const environment = (process.env.ENVIRONMENT || 'dev') as 'dev' | 'staging' | 'prod';
```

### Method 4: Per-Deployment Override

```bash
# Deploy to specific region
CDK_DEFAULT_REGION=ap-southeast-1 npm run deploy:staging
```

---

## 📍 Multi-Region Deployment (Advanced)

For global applications, you can deploy to multiple regions:

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Global Users                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│            CloudFront (Global CDN)                   │
│         Automatic routing to nearest region          │
└─────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Mumbai Region   │  │ Singapore Region │  │ Virginia Region  │
│  (ap-south-1)    │  │ (ap-southeast-1) │  │  (us-east-1)     │
│                  │  │                  │  │                  │
│  Indian Users    │  │  Asian Users     │  │  Global Users    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────┐
│        DynamoDB Global Tables (Replicated)          │
└─────────────────────────────────────────────────────┘
```

### Cost Impact

**Single Region (Mumbai):** $38/month
**Multi-Region (Mumbai + Singapore):** $76/month + data transfer
**Multi-Region (3 regions):** $114/month + data transfer

**Recommendation:** Start with single region (Mumbai), expand later if needed.

---

## 🧪 Testing Latency

### Test API Latency from India

```bash
# Test Mumbai
time curl https://your-api.ap-south-1.amazonaws.com/health

# Test Virginia
time curl https://your-api.us-east-1.amazonaws.com/health

# Test Singapore
time curl https://your-api.ap-southeast-1.amazonaws.com/health
```

### Expected Results (from Mumbai, India)

```
Mumbai (ap-south-1):     10-20ms   ✅
Hyderabad (ap-south-2):  15-30ms   ✅
Singapore (ap-southeast-1): 50-80ms   ⚠️
Virginia (us-east-1):    200-300ms ❌
```

---

## 📋 Region Selection Checklist

Use this checklist to decide on a region:

### For Indian Users (Recommended: Mumbai)

- [ ] Primary users in India? → **Mumbai (ap-south-1)**
- [ ] Need Bedrock AI? → **Mumbai (ap-south-1)** ✅
- [ ] Need low latency? → **Mumbai (ap-south-1)** ✅
- [ ] Data residency in India? → **Mumbai (ap-south-1)** ✅
- [ ] Cost-sensitive? → **Mumbai** (only 4% more than Virginia)

### For Southeast Asian Users

- [ ] Primary users in Singapore/Malaysia/Thailand? → **Singapore (ap-southeast-1)**
- [ ] Need all AWS services? → **Singapore (ap-southeast-1)** ✅
- [ ] Acceptable latency for Indian users (50-80ms)? → **Singapore**

### For Global Users

- [ ] Users worldwide? → **Multi-region deployment**
- [ ] High budget? → **Multi-region deployment**
- [ ] Need 99.99% uptime? → **Multi-region deployment**

---

## 💰 Cost Optimization Tips

### 1. Use CloudFront for Static Content

Even with Mumbai region, use CloudFront for images/videos:
- CloudFront caches content globally
- Reduces latency for all users
- Reduces data transfer costs from Mumbai

### 2. Enable S3 Transfer Acceleration

For file uploads from distant locations:
```bash
aws s3api put-bucket-accelerate-configuration \
  --bucket your-bucket-name \
  --accelerate-configuration Status=Enabled
```

### 3. Use DynamoDB Global Tables (If Multi-Region)

Automatic replication across regions:
- Low latency reads from nearest region
- Automatic conflict resolution
- Additional cost: ~$0.02 per GB replicated

---

## 🔄 Migration Between Regions

If you need to change regions after deployment:

### Step 1: Backup Data

```bash
# Export DynamoDB tables
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:ap-south-1:ACCOUNT:table/prod-HeritageSites \
  --s3-bucket backup-bucket \
  --s3-prefix dynamodb-backup/

# Copy S3 buckets
aws s3 sync s3://old-region-bucket s3://new-region-bucket
```

### Step 2: Deploy to New Region

```bash
# Set new region
export CDK_DEFAULT_REGION=ap-southeast-1

# Deploy
npm run deploy:prod
```

### Step 3: Import Data

```bash
# Import DynamoDB tables
aws dynamodb import-table \
  --s3-bucket-source backup-bucket \
  --input-format DYNAMODB_JSON \
  --table-creation-parameters ...
```

### Step 4: Update Mobile App

Update API endpoints in mobile app configuration.

### Step 5: DNS Cutover

Update DNS records to point to new region.

---

## 📊 Summary

### Recommended Configuration

**For Indian Users (This Project):**
- **Primary Region:** Mumbai (ap-south-1) ✅
- **Backup Region:** Singapore (ap-southeast-1)
- **CDN:** CloudFront (global)
- **Cost:** $38/month (medium traffic)
- **Latency:** 5-20ms for Indian users

**Key Benefits:**
- ⚡ 10-15x faster than Virginia
- 💰 Only 4% more expensive
- 🇮🇳 Data stays in India
- ✅ All services available

---

## 🆘 Troubleshooting

### Issue: Service Not Available in Mumbai

**Solution:** Check AWS service availability:
```bash
# List available services in region
aws service-quotas list-services --region ap-south-1
```

If service unavailable, consider:
1. Use Singapore (ap-southeast-1) as alternative
2. Use multi-region deployment
3. Wait for service to launch in Mumbai

### Issue: High Costs in Mumbai

**Solution:** Cost optimization strategies:
1. Use CloudFront for static content
2. Enable DynamoDB on-demand pricing
3. Use Lambda reserved concurrency
4. Set up CloudWatch cost alerts
5. Review and delete unused resources

### Issue: Latency Still High

**Solution:** Investigate bottlenecks:
```bash
# Check API Gateway latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=prod-temple-api \
  --start-time 2026-02-26T00:00:00Z \
  --end-time 2026-02-26T23:59:59Z \
  --period 3600 \
  --statistics Average

# Check Lambda duration
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=prod-temple-api \
  --start-time 2026-02-26T00:00:00Z \
  --end-time 2026-02-26T23:59:59Z \
  --period 3600 \
  --statistics Average
```

---

## 📚 Additional Resources

- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS Regional Services List](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [CloudPing - Test Latency](https://www.cloudping.info/)
- [AWS India Blog](https://aws.amazon.com/blogs/india/)

---

**Last Updated**: 2026-02-26
**Version**: 1.0.0
**Recommended Region**: ap-south-1 (Mumbai)
