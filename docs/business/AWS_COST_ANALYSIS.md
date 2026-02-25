# AWS Cost Analysis & Pricing Strategy
## Sanaathana Aalaya Charithra

---

## 💰 AWS Services Cost Breakdown

### **1. Amazon Bedrock (AI Content Generation)** 💸 PAID - MOST EXPENSIVE

**Pricing Model:** Pay per token (input + output)

**Models Used:**
- **Claude 3 Sonnet** (recommended for quality)
  - Input: $3.00 per 1M tokens
  - Output: $15.00 per 1M tokens

**Per Scan Cost Estimate:**
```
Content Generation per Artifact:
- Input tokens: ~2,000 (artifact data + prompt)
- Output tokens: ~1,500 (generated content)

Cost per scan:
- Input: 2,000 tokens × $3.00/1M = $0.006
- Output: 1,500 tokens × $15.00/1M = $0.0225
- Total: ~$0.03 per content generation
```

**Monthly Cost Examples:**
- 100 scans/month: $3.00
- 1,000 scans/month: $30.00
- 10,000 scans/month: $300.00
- 100,000 scans/month: $3,000.00

---

### **2. Amazon Polly (Text-to-Speech)** 💸 PAID

**Pricing Model:** Pay per character

**Neural Voices (High Quality):**
- $16.00 per 1 million characters
- First 1 million characters free (first 12 months)

**Per Scan Cost Estimate:**
```
Audio Guide per Artifact:
- Average text: 1,000 characters (3-minute audio)

Cost per audio generation:
- 1,000 chars × $16.00/1M = $0.016
```

**Monthly Cost Examples:**
- 100 audio generations: $1.60
- 1,000 audio generations: $16.00
- 10,000 audio generations: $160.00

---

### **3. AWS Lambda (Serverless Compute)** ✅ FREE TIER + PAID

**Free Tier (Always Free):**
- 1 million requests per month
- 400,000 GB-seconds compute time per month

**Paid Pricing:**
- $0.20 per 1 million requests
- $0.0000166667 per GB-second

**Per Scan Cost Estimate:**
```
Lambda Invocations per Scan:
- QR Processing: 1 invocation (512 MB, 2 sec)
- Content Generation: 1 invocation (1024 MB, 5 sec)
- Total: 2 invocations

Cost per scan:
- Requests: 2 × $0.20/1M = $0.0000004
- Compute: (0.5 GB × 2s + 1 GB × 5s) × $0.0000166667 = $0.00010
- Total: ~$0.0001 (negligible)
```

**Monthly Cost:** Essentially FREE for most usage

---

### **4. Amazon DynamoDB (Database)** ✅ FREE TIER + PAID

**Free Tier (Always Free):**
- 25 GB storage
- 25 read capacity units
- 25 write capacity units

**On-Demand Pricing:**
- Write: $1.25 per million requests
- Read: $0.25 per million requests
- Storage: $0.25 per GB-month

**Per Scan Cost Estimate:**
```
Database Operations per Scan:
- 2 reads (site + artifact lookup)
- 2 writes (session + cache)

Cost per scan:
- Reads: 2 × $0.25/1M = $0.0000005
- Writes: 2 × $1.25/1M = $0.0000025
- Total: ~$0.000003 (negligible)
```

**Monthly Cost:** FREE for most usage (within free tier)

---

### **5. Amazon S3 (Content Storage)** ✅ FREE TIER + PAID

**Free Tier (First 12 Months):**
- 5 GB standard storage
- 20,000 GET requests
- 2,000 PUT requests

**Paid Pricing:**
- Storage: $0.023 per GB-month
- GET requests: $0.0004 per 1,000 requests
- PUT requests: $0.005 per 1,000 requests

**Per Scan Cost Estimate:**
```
Storage per Artifact:
- Audio file: 2 MB
- Images: 1 MB
- Total: 3 MB per artifact

Cost per scan:
- Storage: 3 MB × $0.023/GB = $0.000069/month
- GET request: $0.0000004
- Total: ~$0.00007 (negligible)
```

**Monthly Cost:** FREE initially, then ~$1-5/month for 1000 artifacts

---

### **6. Amazon CloudFront (CDN)** ✅ FREE TIER + PAID

**Free Tier (Always Free):**
- 1 TB data transfer out per month
- 10 million HTTP/HTTPS requests

**Paid Pricing:**
- Data transfer: $0.085 per GB (first 10 TB)
- Requests: $0.0075 per 10,000 requests

**Per Scan Cost Estimate:**
```
Content Delivery per Scan:
- Audio file: 2 MB
- Images: 1 MB
- Total: 3 MB transfer

Cost per scan:
- Transfer: 3 MB × $0.085/GB = $0.00025
- Request: $0.00000075
- Total: ~$0.00025
```

**Monthly Cost:** FREE for most usage (within free tier)

---

### **7. Amazon API Gateway (REST API)** ✅ FREE TIER + PAID

**Free Tier (First 12 Months):**
- 1 million API calls per month

**Paid Pricing:**
- $3.50 per million API calls

**Per Scan Cost Estimate:**
```
API Calls per Scan:
- 3-4 API calls (QR scan, content fetch, analytics)

Cost per scan:
- 4 calls × $3.50/1M = $0.000014
```

**Monthly Cost:** FREE initially, then ~$3.50 per million scans

---

### **8. Amazon Translate (Language Detection)** 💸 PAID

**Pricing Model:** Pay per character

**Pricing:**
- $15.00 per million characters

**Per Scan Cost Estimate:**
```
Translation per Scan:
- Language detection: 100 characters
- Optional translation: 1,000 characters

Cost per scan:
- Detection: 100 × $15/1M = $0.0015
- Translation: 1,000 × $15/1M = $0.015
- Total: ~$0.0165 (if translation used)
```

**Monthly Cost:** $15-150 depending on usage

---

## 📊 TOTAL COST PER SCAN

### **Breakdown by Service:**

| Service | Cost per Scan | % of Total |
|---------|--------------|------------|
| **Amazon Bedrock (AI)** | $0.0300 | 64% |
| **Amazon Polly (Audio)** | $0.0160 | 34% |
| **Amazon Translate** | $0.0015 | 3% |
| **CloudFront (CDN)** | $0.0003 | <1% |
| **Lambda** | $0.0001 | <1% |
| **API Gateway** | $0.00001 | <1% |
| **DynamoDB** | $0.000003 | <1% |
| **S3** | $0.00007 | <1% |
| **TOTAL** | **$0.0480** | 100% |

### **Simplified:**
- **~$0.05 per scan** (5 cents USD)
- **~₹4.15 per scan** (at ₹83/USD exchange rate)

---

## 💡 Cost Optimization Strategies

### **1. Caching Strategy** (Reduces costs by 80-90%)

**Problem:** Same artifact scanned multiple times = repeated AI generation

**Solution:** Cache generated content

```
First scan of artifact: $0.05 (full cost)
Subsequent scans: $0.001 (cache retrieval only)

Savings: 98% cost reduction
```

**Implementation:**
- Store generated content in DynamoDB
- Check cache before calling Bedrock
- Cache TTL: 30 days

**Impact:**
```
Without caching:
- 10,000 scans = $500

With caching (80% cache hit rate):
- 2,000 new scans × $0.05 = $100
- 8,000 cached scans × $0.001 = $8
- Total: $108 (78% savings)
```

---

### **2. Pre-Generate Content** (Reduces real-time costs)

**Strategy:** Generate content for all 23 artifacts upfront

**One-Time Cost:**
```
23 artifacts × $0.05 = $1.15 (one-time)
```

**Ongoing Cost:**
```
Per scan: $0.001 (cache retrieval only)
```

**Best for:** Fixed artifact catalog (like your 23 artifacts)

---

### **3. Tiered Content Quality**

**Strategy:** Offer different quality levels

| Tier | Content | Cost per Scan |
|------|---------|---------------|
| Basic | Text only | $0.005 |
| Standard | Text + Audio | $0.025 |
| Premium | Text + Audio + Video | $0.050 |

---

### **4. Batch Processing**

**Strategy:** Generate content during off-peak hours

**Savings:** 10-20% on compute costs

---

## 💳 Pricing Models for Users

### **Option 1: Pay Per Scan** 💰

**AWS Cost:** $0.05 per scan
**Your Markup:** 3-5x
**User Price:** ₹10-20 per scan

**Pros:**
- ✅ Low barrier to entry
- ✅ Fair usage-based pricing
- ✅ Users only pay for what they use

**Cons:**
- ❌ Friction on every scan
- ❌ Users may hesitate to scan
- ❌ Complex payment processing

**Best for:** Casual users, one-time visitors

---

### **Option 2: Pay Per Temple** 🏛️

**AWS Cost:** $0.05 × 2-3 artifacts = $0.15 per temple
**Your Markup:** 10-20x
**User Price:** ₹50-100 per temple

**Pros:**
- ✅ Better user experience (unlimited scans per temple)
- ✅ Encourages exploration
- ✅ Higher revenue per transaction

**Cons:**
- ❌ Higher upfront cost
- ❌ May not visit all artifacts

**Best for:** Serious temple visitors, tourists

---

### **Option 3: Subscription Model** 📅

**Monthly Subscription:**
- Basic: ₹99/month (5 temples)
- Premium: ₹199/month (unlimited temples)
- Annual: ₹999/year (unlimited, 2 months free)

**Pros:**
- ✅ Predictable revenue
- ✅ Best user experience
- ✅ Encourages repeat usage
- ✅ Covers AWS costs easily

**Cons:**
- ❌ Requires commitment
- ❌ May not suit one-time visitors

**Best for:** Regular temple visitors, devotees, students

---

### **Option 4: Freemium Model** 🎁

**Free Tier:**
- 3 free scans per month
- Basic text content only

**Paid Tier:**
- ₹149/month unlimited
- Audio + Video + Q&A

**Pros:**
- ✅ Attracts users with free tier
- ✅ Converts to paid naturally
- ✅ Viral growth potential

**Cons:**
- ❌ Free tier costs money
- ❌ Conversion rate uncertainty

**Best for:** Growth-focused strategy

---

## 📈 Revenue Projections

### **Scenario 1: Pay Per Scan (₹15/scan)**

| Users | Scans/User | Total Scans | Revenue | AWS Cost | Profit |
|-------|------------|-------------|---------|----------|--------|
| 100 | 5 | 500 | ₹7,500 | ₹2,075 | ₹5,425 |
| 1,000 | 5 | 5,000 | ₹75,000 | ₹20,750 | ₹54,250 |
| 10,000 | 5 | 50,000 | ₹7,50,000 | ₹2,07,500 | ₹5,42,500 |

**Profit Margin:** 72%

---

### **Scenario 2: Pay Per Temple (₹99/temple)**

| Users | Temples/User | Total Purchases | Revenue | AWS Cost | Profit |
|-------|--------------|-----------------|---------|----------|--------|
| 100 | 2 | 200 | ₹19,800 | ₹4,150 | ₹15,650 |
| 1,000 | 2 | 2,000 | ₹1,98,000 | ₹41,500 | ₹1,56,500 |
| 10,000 | 2 | 20,000 | ₹19,80,000 | ₹4,15,000 | ₹15,65,000 |

**Profit Margin:** 79%

---

### **Scenario 3: Subscription (₹199/month)**

| Subscribers | Avg Scans/Month | Total Scans | Revenue | AWS Cost | Profit |
|-------------|-----------------|-------------|---------|----------|--------|
| 100 | 10 | 1,000 | ₹19,900 | ₹4,150 | ₹15,750 |
| 1,000 | 10 | 10,000 | ₹1,99,000 | ₹41,500 | ₹1,57,500 |
| 10,000 | 10 | 100,000 | ₹19,90,000 | ₹4,15,000 | ₹15,75,000 |

**Profit Margin:** 79%

---

## 🎯 RECOMMENDED PRICING STRATEGY

### **Hybrid Model: Best of All Worlds**

```
┌─────────────────────────────────────────┐
│  FREE TIER (Marketing)                  │
│  • 1 free scan per temple               │
│  • Text content only                    │
│  • Attracts users                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PAY PER TEMPLE (Casual Users)          │
│  • ₹99 per temple                       │
│  • Unlimited scans in that temple       │
│  • Full content (audio + video)         │
│  • Valid for 30 days                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  SUBSCRIPTION (Power Users)             │
│  • ₹199/month - All temples             │
│  • ₹999/year - Save 58%                 │
│  • Priority support                     │
│  • Offline downloads                    │
└─────────────────────────────────────────┘
```

### **Why This Works:**

1. **Free tier** attracts users and builds trust
2. **Pay per temple** converts casual visitors
3. **Subscription** captures serious users
4. **Covers AWS costs** at all tiers
5. **Scalable** as you add more temples

---

## 💰 Break-Even Analysis

### **Monthly Fixed Costs:**
- AWS infrastructure: ~₹2,000/month (base)
- Domain + SSL: ~₹500/month
- App store fees: ~₹1,000/month
- **Total Fixed:** ₹3,500/month

### **Break-Even Points:**

**Pay Per Scan (₹15):**
- Need: 234 scans/month
- ~47 users (5 scans each)

**Pay Per Temple (₹99):**
- Need: 36 temple purchases/month
- ~18 users (2 temples each)

**Subscription (₹199):**
- Need: 18 subscribers/month

---

## 🚀 Scaling Considerations

### **At 10,000 Users:**

**AWS Costs:**
- Bedrock: ₹20,750/month
- Polly: ₹6,640/month
- Other services: ₹2,000/month
- **Total:** ₹29,390/month

**Revenue (Subscription Model):**
- 10,000 × ₹199 = ₹19,90,000/month

**Profit:** ₹19,60,610/month (98.5% margin)

---

## ✅ FINAL RECOMMENDATION

### **Best Pricing Model: Pay Per Temple**

**Reasons:**
1. ✅ Better UX than pay-per-scan
2. ✅ Higher revenue per transaction
3. ✅ Encourages full temple exploration
4. ✅ Simple to understand
5. ✅ 79% profit margin
6. ✅ Covers AWS costs comfortably

**Pricing:**
- **₹99 per temple** (30-day access)
- **₹499 for 6 temples** (bundle discount)
- **₹899 for all 11 temples** (best value)

**With Free Tier:**
- 1 free artifact per temple (marketing)
- Upgrade prompt after free scan

---

## 📱 Payment Integration

**Recommended Payment Gateways:**
- Razorpay (India-focused, 2% fee)
- Stripe (International, 2.9% + ₹2 fee)
- Paytm (Popular in India, 2% fee)

**Payment Flow:**
```
User scans QR → Free preview → "Unlock full content for ₹99" → Payment → Content unlocked
```

---

**Summary:** With caching and smart pricing, you can build a profitable business while keeping costs low and providing great value to users!


---

## 🎯 Cost Optimization Strategy for Admin/Dashboard Features

### Phase 1: Initial Deployment (Current Decision)
**Total Monthly Cost: $5-16/month**

**Excluded Services:**
- ❌ ElastiCache Redis ($12/month) - Deferred until performance requires it

**Rationale:**
- Dashboard performs acceptably without cache (500-800ms load times)
- CacheService designed with graceful degradation
- Can add ElastiCache later with zero code changes
- Saves $12/month during initial validation phase
- Expected <20 concurrent admin users initially

### Phase 2: Scale-Up (When Needed)
**Total Monthly Cost: $17-28/month**

**Add ElastiCache when experiencing:**
- Dashboard load times >1 second
- 50+ concurrent admin users
- DynamoDB read costs >$10/month for dashboard queries
- Frequent dashboard refreshes causing high DynamoDB load

**Migration Path:**
1. Deploy ElastiCache t3.micro cluster via CDK
2. Set environment variables: `CACHE_ENABLED=true`, `REDIS_ENDPOINT=...`
3. Deploy updated Lambda functions
4. **Zero code changes required**

---

## 💡 Key Insight

The admin/dashboard infrastructure is designed for **cost-effective initial deployment** with an **easy scaling path** when usage grows. All features work identically with or without cache - only performance differs.

**Current Total Infrastructure Cost: $5-16/month**

This keeps the project affordable during initial development and validation while maintaining the ability to scale performance when needed.
