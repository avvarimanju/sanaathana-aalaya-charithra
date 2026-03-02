# AWS Region Selection Guide

## 🌏 Recommended Region: ap-south-1 (Mumbai)

For the Sanaathana Aalaya Charithra application targeting Indian users, we **strongly recommend** deploying to **ap-south-1 (Mumbai, India)**.

---

## 📊 Why Mumbai?

### 1. **Latency** ⚡
- **Mumbai**: 5-20ms for Indian users
- **US East**: 200-300ms for Indian users
- **Result**: **10-15x faster** response times

### 2. **User Experience** 🎯
| Region | Latency | User Experience |
|--------|---------|-----------------|
| **ap-south-1 (Mumbai)** | 5-20ms | ⚡ Excellent - Instant |
| ap-south-2 (Hyderabad) | 5-20ms | ⚡ Excellent - Instant |
| ap-southeast-1 (Singapore) | 50-80ms | 👍 Good - Noticeable |
| us-east-1 (Virginia) | 200-300ms | 🐌 Slow - Frustrating |

### 3. **Cost Comparison** 💰

| Service | us-east-1 | ap-south-1 | Extra Cost |
|---------|-----------|------------|------------|
| Lambda | $0.20/M | $0.20/M | $0 |
| DynamoDB | $0.25/M reads | $0.285/M reads | +14% |
| S3 | $0.023/GB | $0.025/GB | +9% |
| API Gateway | $3.50/M | $3.50/M | $0 |
| CloudFront | $0.085/GB | $0.085/GB | $0 |
| **Total Extra** | - | - | **~$2-5/month** |

**Verdict**: Only ~10% more expensive, but 10-15x faster!

### 4. **Data Residency** 🇮🇳
- Data stays in India
- Better compliance with Indian regulations
- User trust and privacy

### 5. **Razorpay Integration** 💳
- Razorpay is an Indian payment gateway
- Works best from Indian AWS regions
- Lower payment processing latency

### 6. **Service Availability** ✅
- All required AWS services available
- Mature region (launched 2016)
- Extensive documentation and support

---

## 🚫 Why NOT Other Regions?

### us-east-1 (Virginia, USA)
- ❌ 200-300ms latency from India
- ❌ Poor user experience
- ✅ Cheapest pricing
- ✅ Most services available
- **Verdict**: Not recommended for Indian users

### ap-south-2 (Hyderabad, India)
- ✅ Low latency (5-20ms)
- ❌ Newer region (2022)
- ❌ Some services may not be available
- ❌ Less documentation
- **Verdict**: Use Mumbai instead (more mature)

### ap-southeast-1 (Singapore)
- ⚠️ Medium latency (50-80ms)
- ✅ All services available
- ✅ Mature region
- **Verdict**: Acceptable backup, but Mumbai is better

---

## 🔧 How to Configure Mumbai Region

### 1. AWS CLI Configuration

```bash
# Configure AWS CLI to use Mumbai
aws configure set region ap-south-1

# Verify
aws configure get region
# Output: ap-south-1
```

### 2. Environment Variables

Create `.env` files:

```bash
# .env.staging
AWS_REGION=ap-south-1
AWS_DEFAULT_REGION=ap-south-1

# .env.prod
AWS_REGION=ap-south-1
AWS_DEFAULT_REGION=ap-south-1
```

### 3. CDK Configuration

Update `cdk.json`:

```json
{
  "context": {
    "staging": {
      "region": "ap-south-1",
      "account": "your-account-id"
    },
    "prod": {
      "region": "ap-south-1",
      "account": "your-account-id"
    }
  }
}
```

### 4. Deployment Commands

```bash
# Bootstrap CDK in Mumbai
AWS_REGION=ap-south-1 cdk bootstrap

# Deploy to staging
AWS_REGION=ap-south-1 npm run deploy:staging

# Deploy to production
AWS_REGION=ap-south-1 npm run deploy:prod
```

---

## 📱 Mobile App Configuration

### React Native

```typescript
// config/aws-config.ts
export const AWS_CONFIG = {
  region: 'ap-south-1',  // Mumbai
  apiUrl: 'https://xxx.execute-api.ap-south-1.amazonaws.com/prod',
  userPoolId: 'ap-south-1_ABC123',
  userPoolClientId: 'abc123def456',
};
```

### Flutter

```dart
// lib/config/aws_config.dart
class AWSConfig {
  static const region = 'ap-south-1';  // Mumbai
  static const apiUrl = 'https://xxx.execute-api.ap-south-1.amazonaws.com/prod';
  static const userPoolId = 'ap-south-1_ABC123';
  static const userPoolClientId = 'abc123def456';
}
```

---

## 🌐 CloudFront for Global Distribution

Even with Mumbai backend, use CloudFront for static content:

```
User in India
    ↓
CloudFront Edge (Mumbai) - 5ms
    ↓
S3 (Mumbai) - 5ms
    ↓
Total: 10ms ⚡
```

CloudFront automatically routes to nearest edge location:
- **India**: Mumbai edge (5-10ms)
- **Asia**: Singapore/Tokyo edge (30-50ms)
- **US**: US edge locations (50-100ms)

---

## 📊 Performance Comparison

### API Request Latency

| Operation | us-east-1 | ap-south-1 | Improvement |
|-----------|-----------|------------|-------------|
| API Gateway | 200ms | 10ms | **20x faster** |
| Lambda Execution | 50ms | 50ms | Same |
| DynamoDB Query | 50ms | 5ms | **10x faster** |
| **Total** | **300ms** | **65ms** | **4.6x faster** |

### User Experience Impact

| Latency | User Perception |
|---------|-----------------|
| 0-100ms | Instant |
| 100-300ms | Slight delay |
| 300-1000ms | Noticeable lag |
| 1000ms+ | Frustrating |

**Mumbai**: 65ms = Instant ⚡
**US East**: 300ms = Noticeable lag 🐌

---

## 💡 Best Practices

### 1. Use CloudFront for Static Content
```typescript
// Store images in S3, serve via CloudFront
const imageUrl = 'https://d123.cloudfront.net/temples/image.jpg';
```

### 2. Enable Caching
```typescript
// Cache API responses
const cacheControl = 'max-age=3600, public';
```

### 3. Optimize Lambda Functions
```typescript
// Use smaller memory for faster cold starts
memory: 256,  // MB
timeout: 10,  // seconds
```

### 4. Use DynamoDB On-Demand
```typescript
// Auto-scales with traffic
billingMode: BillingMode.PAY_PER_REQUEST
```

---

## 🔄 Multi-Region Strategy (Future)

For global expansion:

### Phase 1: India Only (Current)
- **Primary**: ap-south-1 (Mumbai)
- **Users**: Indian users
- **Cost**: $30-210/month

### Phase 2: Asia Expansion
- **Primary**: ap-south-1 (Mumbai)
- **Secondary**: ap-southeast-1 (Singapore)
- **Users**: India + Southeast Asia
- **Cost**: $60-420/month

### Phase 3: Global
- **Primary**: ap-south-1 (Mumbai)
- **Secondary**: us-east-1 (Virginia)
- **Tertiary**: eu-west-1 (Ireland)
- **Users**: Worldwide
- **Cost**: $120-840/month

Use Route 53 geo-routing to direct users to nearest region.

---

## ✅ Deployment Checklist

- [ ] Set AWS CLI region to `ap-south-1`
- [ ] Update CDK context with Mumbai region
- [ ] Bootstrap CDK in Mumbai
- [ ] Update mobile app configuration
- [ ] Test API latency from India
- [ ] Verify Razorpay integration
- [ ] Configure CloudFront for static content
- [ ] Update all documentation

---

## 🆘 Troubleshooting

### Issue: High Latency from India

**Check Region:**
```bash
aws configure get region
# Should output: ap-south-1
```

**Test Latency:**
```bash
curl -w "@curl-format.txt" -o /dev/null -s \
  https://your-api.ap-south-1.amazonaws.com/health
```

### Issue: Service Not Available

Some services may not be available in all regions. Check:
- [AWS Regional Services](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/)

For Mumbai (ap-south-1), all required services are available:
- ✅ Lambda
- ✅ DynamoDB
- ✅ S3
- ✅ API Gateway
- ✅ CloudFront
- ✅ Cognito
- ✅ Bedrock
- ✅ Polly

---

## 📚 Additional Resources

- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS Regional Services List](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [CloudFront Edge Locations](https://aws.amazon.com/cloudfront/features/)

---

## 🎯 Summary

**For Indian Users:**
- ✅ Use **ap-south-1 (Mumbai)**
- ✅ 10-15x faster than US regions
- ✅ Only ~$2-5/month extra cost
- ✅ Better Razorpay integration
- ✅ Data stays in India

**Configuration:**
```bash
AWS_REGION=ap-south-1
```

**That's it!** 🚀

---

**Last Updated**: 2026-02-26
**Recommended Region**: ap-south-1 (Mumbai, India)
