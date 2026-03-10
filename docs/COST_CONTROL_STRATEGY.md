# Cost Control Strategy - Bedrock Usage

## Overview
This document outlines how we prevent excessive AWS Bedrock costs while providing great user experience.

---

## Architecture: Pre-Generated Content (RECOMMENDED)

### How It Works
1. **Admin generates content once** via Admin Portal
2. **Content stored in DynamoDB** (permanent cache)
3. **Users read from database** (no Bedrock calls)
4. **Result**: Near-zero ongoing costs

### User Flow
```
User scans QR code
    ↓
Mobile app requests temple data
    ↓
API Gateway → Lambda
    ↓
Read from DynamoDB (cached content)
    ↓
Return to user
    
Bedrock calls: 0
Cost per user: $0.000004
```

---

## Cost Per Temple

### One-Time Generation Costs

**Using Claude 3 Haiku** (Fast, Cheap):
- Cost: ~$0.0006 per temple
- Quality: Good
- Use for: Bulk generation, testing

**Using Claude 3 Sonnet** (High Quality):
- Cost: ~$0.0092 per temple
- Quality: Excellent
- Use for: Production content

### Total Project Costs

**1,000 Temples**:
- Haiku: $0.60 (one-time)
- Sonnet: $9.20 (one-time)

**After generation**: FREE for unlimited users

---

## Cost Protection Mechanisms

### 1. Admin-Only Generation
```typescript
// Only admins can trigger Bedrock
export async function generateTempleContent(templeId: string, userId: string) {
    // Check admin permission
    const user = await getUser(userId);
    if (!user.isAdmin) {
        throw new Error('Only admins can generate content');
    }
    
    // Generate content
    const content = await bedrockService.generate(templeId);
    
    // Cache in DynamoDB
    await dynamoDB.put({ templeId, content, generatedAt: Date.now() });
    
    return content;
}
```

### 2. Cache-First Strategy
```typescript
export async function getTempleContent(templeId: string) {
    // Always check cache first
    const cached = await dynamoDB.get(templeId);
    
    if (cached) {
        return cached; // FREE - no Bedrock call
    }
    
    // Only generate if missing (shouldn't happen in production)
    throw new Error('Content not generated yet. Contact admin.');
}
```

### 3. Rate Limiting (Admin Portal)
```typescript
// Limit admin to 10 generations per minute
const rateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60000 // 1 minute
});

export async function generateContent(templeId: string, adminId: string) {
    await rateLimiter.check(adminId);
    return await bedrockService.generate(templeId);
}
```

### 4. Cost Monitoring
```typescript
// Track monthly Bedrock costs
export async function trackBedrockUsage(cost: number) {
    const monthlyTotal = await redis.incr('bedrock:monthly_cost', cost);
    
    // Alert if exceeding budget
    if (monthlyTotal > 50) { // $50 monthly budget
        await sendAlert({
            message: `Bedrock costs: $${monthlyTotal}`,
            severity: 'HIGH'
        });
    }
}
```

### 5. Batch Generation Script
```typescript
// Generate content for multiple temples efficiently
export async function batchGenerate(templeIds: string[]) {
    const results = [];
    
    for (const templeId of templeIds) {
        try {
            const content = await bedrockService.generate(templeId);
            await dynamoDB.put({ templeId, content });
            results.push({ templeId, status: 'success' });
            
            // Respect rate limits
            await sleep(2000); // 2 seconds between calls
        } catch (error) {
            results.push({ templeId, status: 'failed', error });
        }
    }
    
    return results;
}
```

---

## User Request Costs (Cached Content)

### Per User Request Breakdown

| Service | Cost per Request | Cost per 1,000 Users |
|---------|------------------|---------------------|
| API Gateway | $0.0000035 | $0.0035 |
| Lambda | $0.0000002 | $0.0002 |
| DynamoDB Read | $0.00000025 | $0.00025 |
| **Total** | **$0.000004** | **$0.004** |

### Monthly Cost Examples

**1,000 users/month**: $0.004  
**10,000 users/month**: $0.04  
**100,000 users/month**: $0.40  
**1,000,000 users/month**: $4.00  

**Bedrock costs**: $0 (content pre-generated)

---

## QR Code Scanning

### Does QR Scan = Bedrock Call?

**NO!** QR code scanning does NOT trigger Bedrock.

**Flow**:
1. User scans QR code
2. QR contains temple ID (e.g., `temple_123`)
3. App requests data from API
4. API reads from DynamoDB (cached)
5. Returns content to user

**Bedrock calls**: 0  
**Cost**: $0.000004 (DynamoDB + Lambda + API Gateway)

### Can Users Scan Multiple Times?

**YES!** Users can scan unlimited times.

- Each scan reads from cache
- No additional Bedrock costs
- Only minimal AWS infrastructure costs

---

## Cost Scenarios

### Scenario 1: Launch (1,000 Temples, 10K Users/Month)

**One-Time Setup**:
- Generate 1,000 temples with Sonnet: $9.20

**Monthly Ongoing**:
- 10,000 user requests: $0.04
- DynamoDB storage (1GB): $0.25
- **Total monthly**: $0.29

**Annual Cost**: $9.20 + ($0.29 × 12) = $12.68

---

### Scenario 2: Growth (1,000 Temples, 100K Users/Month)

**One-Time Setup**:
- Already generated: $0

**Monthly Ongoing**:
- 100,000 user requests: $0.40
- DynamoDB storage: $0.25
- **Total monthly**: $0.65

**Annual Cost**: $7.80

---

### Scenario 3: Scale (5,000 Temples, 1M Users/Month)

**One-Time Setup**:
- Generate 4,000 new temples: $36.80

**Monthly Ongoing**:
- 1,000,000 user requests: $4.00
- DynamoDB storage (5GB): $1.25
- **Total monthly**: $5.25

**Annual Cost**: $36.80 + ($5.25 × 12) = $99.80

---

## Budget Alerts

### CloudWatch Alarms

```yaml
Alarms:
  BedrockCostAlert:
    Threshold: $50/month
    Action: Send email + Disable Bedrock API
    
  DynamoDBCostAlert:
    Threshold: $10/month
    Action: Send email
    
  TotalAWSCostAlert:
    Threshold: $100/month
    Action: Send email + Review usage
```

---

## Best Practices

### DO ✅
- Pre-generate all content via Admin Portal
- Cache everything in DynamoDB
- Use Haiku for bulk generation
- Use Sonnet for final production content
- Monitor costs with CloudWatch
- Set up budget alerts

### DON'T ❌
- Generate content on user requests
- Allow users to trigger Bedrock
- Generate same content multiple times
- Skip caching
- Ignore cost monitoring

---

## Emergency Cost Control

### If Costs Spike

1. **Immediate**: Disable Bedrock API access
```typescript
const BEDROCK_ENABLED = process.env.BEDROCK_ENABLED === 'true';

if (!BEDROCK_ENABLED) {
    throw new Error('Bedrock temporarily disabled');
}
```

2. **Investigate**: Check CloudWatch logs
```bash
aws logs filter-log-events \
    --log-group-name /aws/lambda/content-generation \
    --start-time $(date -d '1 hour ago' +%s)000
```

3. **Review**: Identify unusual patterns
4. **Fix**: Implement additional rate limiting
5. **Re-enable**: Once issue resolved

---

## Summary

**Key Points**:
- ✅ Pre-generate content = ~$10 one-time for 1,000 temples
- ✅ Users read from cache = $0.000004 per request
- ✅ QR scans don't trigger Bedrock = FREE
- ✅ Unlimited user access = Minimal cost
- ❌ Real-time generation = $92,000/month (DON'T DO THIS)

**Recommended Approach**:
1. Generate all content once via Admin Portal
2. Store in DynamoDB
3. Serve from cache to users
4. Monitor costs monthly
5. Set budget alerts

**Expected Annual Cost**: $10-$100 depending on scale

---

**Last Updated**: March 3, 2026  
**Status**: Recommended Strategy  
**Risk Level**: LOW (with proper implementation)
