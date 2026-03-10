# How to Test Bedrock Models (Haiku vs Sonnet)

## Quick Start

Want to see how content generation differs between staging and production? Run this:

```powershell
.\scripts\test-bedrock-models.ps1
```

This will show you side-by-side comparison of:
- Content quality
- Generation speed
- Token usage
- Cost per request

---

## Prerequisites

### 1. AWS CLI Installed

```powershell
# Check if installed
aws --version

# If not installed, download from:
# https://aws.amazon.com/cli/
```

### 2. AWS Credentials Configured

```powershell
# Configure credentials
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1
# - Default output format: json
```

### 3. Bedrock Model Access Enabled

1. Go to [AWS Console → Bedrock → Model access](https://console.aws.amazon.com/bedrock/home?region=ap-south-1#/modelaccess)
2. Click "Manage model access"
3. Enable:
   - ✅ Claude 3 Haiku
   - ✅ Claude 3 Sonnet
4. Click "Save changes"
5. Wait for approval (usually instant)

---

## Running the Tests

### Test Both Models (Recommended)

```powershell
# Compare Haiku vs Sonnet side-by-side
.\scripts\test-bedrock-models.ps1
```

**Output:**
```
┌─────────────────────┬──────────────────┬──────────────────┐
│ Metric              │ Haiku (Staging)  │ Sonnet (Prod)    │
├─────────────────────┼──────────────────┼──────────────────┤
│ Latency (ms)        │ 2341             │ 3567             │
│ Tokens Used         │ 456              │ 523              │
│ Cost                │ $0.000623        │ $0.009195        │
│ Content Length      │ 1234             │ 1456             │
└─────────────────────┴──────────────────┴──────────────────┘
```

### Test Only Haiku (Staging)

```powershell
# Test only the cheaper, faster model
.\scripts\test-bedrock-models.ps1 -HaikuOnly
```

### Test Only Sonnet (Production)

```powershell
# Test only the high-quality model
.\scripts\test-bedrock-models.ps1 -SonnetOnly
```

### Custom Prompt

```powershell
# Test with your own prompt
.\scripts\test-bedrock-models.ps1 -Prompt "Describe the Brihadeeswarar Temple in Tamil Nadu"
```

---

## What You'll See

### 1. Model Invocation

```
================================================================================
Testing: Haiku
Model ID: anthropic.claude-3-haiku-20240307-v1:0
================================================================================

Invoking model...
SUCCESS!

Latency:     2341 ms
Tokens Used: 456 (Input: 123, Output: 333)
Cost:        $0.000623

Generated Content:
─────────────────────────────────────────────────────────────────────────────
The Lepakshi Temple's Hanging Pillar is one of India's most fascinating 
architectural mysteries. Built in the 16th century during the Vijayanagara 
Empire, this pillar appears to defy gravity...
[Full content displayed here]
─────────────────────────────────────────────────────────────────────────────
```

### 2. Side-by-Side Comparison

```
================================================================================
                           COMPARISON RESULTS
================================================================================

Analysis:
  • Sonnet is 52.4% slower than Haiku
  • Sonnet costs 14.8x more than Haiku
  • Sonnet is 1375.6% more expensive than Haiku

Recommendations:
  • Use Haiku for:
    - Testing and development
    - QA and staging environments
    - Bulk content generation
    - Cost-sensitive operations

  • Use Sonnet for:
    - Production user-facing content
    - High-quality requirements
    - Complex reasoning tasks
    - Final published content
```

---

## Understanding the Results

### Latency (Speed)

**Haiku**: ~2-3 seconds per request
- ✅ Faster response time
- ✅ Better for bulk generation
- ✅ Good for testing

**Sonnet**: ~3-5 seconds per request
- ⚠️ Slower but more thoughtful
- ✅ Better reasoning
- ✅ Higher quality output

### Cost

**Haiku**: ~$0.0006 per request
- ✅ 12-15x cheaper than Sonnet
- ✅ Perfect for staging/testing
- ✅ Can generate 1,000+ pieces for $1

**Sonnet**: ~$0.009 per request
- ⚠️ More expensive
- ✅ Better quality justifies cost
- ✅ Use for production only

### Content Quality

**Haiku**:
- Good quality, concise
- Factually accurate
- Suitable for most use cases
- May be less detailed

**Sonnet**:
- Excellent quality, detailed
- Better reasoning and nuance
- More engaging writing style
- Richer descriptions

---

## Real-World Example

### Scenario: Generate 100 Temple Descriptions

**Using Haiku (Staging)**:
- Time: ~4 minutes (2.4s per request)
- Cost: ~$0.06 (100 × $0.0006)
- Quality: Good, suitable for testing

**Using Sonnet (Production)**:
- Time: ~6 minutes (3.6s per request)
- Cost: ~$0.92 (100 × $0.0092)
- Quality: Excellent, production-ready

**Savings**: Use Haiku for testing saves $0.86 (93% cost reduction)

---

## Typical Output Comparison

### Haiku Output (Staging)

```
The Lepakshi Temple's Hanging Pillar is a remarkable architectural feat 
from the 16th century Vijayanagara period. This granite pillar appears 
to float above the ground, with a small gap visible beneath it. Legend 
says that a British engineer tried to move it to verify the gap, causing 
it to shift slightly. The pillar demonstrates advanced engineering 
knowledge of the era. Visitors often pass objects underneath to witness 
this unique phenomenon. It remains one of India's most intriguing 
architectural mysteries.
```

**Characteristics**:
- Concise and factual
- Covers key points
- Good for testing
- ~150 words

### Sonnet Output (Production)

```
The Hanging Pillar of Lepakshi Temple stands as one of India's most 
captivating architectural enigmas, defying conventional understanding 
of structural engineering. Constructed during the glorious Vijayanagara 
Empire in the 16th century, this magnificent granite pillar appears to 
hover mysteriously above the temple floor, with a visible gap that has 
puzzled visitors and scholars for centuries.

The pillar's unique design showcases the extraordinary mathematical and 
engineering prowess of ancient Indian architects. Legend intertwines 
with history here: it's said that a British engineer, skeptical of the 
pillar's suspended state, attempted to dislodge it to uncover the 
"trick," inadvertently causing a slight displacement that remains 
visible today.

Visitors are encouraged to pass thin objects—cloth, paper, or even 
walking sticks—beneath the pillar to witness this architectural marvel 
firsthand. The experience evokes wonder about the advanced knowledge 
possessed by craftsmen who created such impossibilities in stone, 
making it a must-see attraction that bridges ancient wisdom with 
modern curiosity.
```

**Characteristics**:
- Rich, engaging narrative
- More detailed descriptions
- Better storytelling
- ~200 words
- Production-quality

---

## Decision Matrix

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| **Local Development** | Haiku | Fast feedback, low cost |
| **Testing/QA** | Haiku | Verify functionality, save money |
| **Staging Environment** | Haiku | Test with real data, cost-effective |
| **Production Content** | Sonnet | High quality for users |
| **Bulk Pre-generation** | Haiku first, then Sonnet for final | Test with Haiku, finalize with Sonnet |
| **User-facing Features** | Sonnet | Best experience for users |
| **Internal Tools** | Haiku | Good enough, saves cost |

---

## Cost Projections

### Monthly Usage: 1,000 Requests

**Staging (Haiku)**:
- Cost: ~$0.60/month
- Time: ~40 minutes total
- Quality: Good for testing

**Production (Sonnet)**:
- Cost: ~$9.20/month
- Time: ~60 minutes total
- Quality: Excellent for users

**Hybrid Approach** (Recommended):
- Staging: 800 requests with Haiku = $0.48
- Production: 200 requests with Sonnet = $1.84
- Total: $2.32/month
- Savings: 75% compared to all-Sonnet

---

## Troubleshooting

### Error: "AccessDeniedException"

**Problem**: Model access not enabled

**Solution**:
1. Go to AWS Console → Bedrock → Model access
2. Enable Claude 3 Haiku and Sonnet
3. Wait for approval (instant)
4. Retry the test

### Error: "AWS CLI not found"

**Problem**: AWS CLI not installed

**Solution**:
```powershell
# Download and install from:
# https://aws.amazon.com/cli/

# Verify installation
aws --version
```

### Error: "Credentials not configured"

**Problem**: AWS credentials missing

**Solution**:
```powershell
aws configure

# Enter your credentials:
# - Access Key ID
# - Secret Access Key
# - Region: ap-south-1
```

### Error: "ThrottlingException"

**Problem**: Too many requests

**Solution**:
- Wait 1-2 minutes between tests
- Bedrock has rate limits (10 requests/second)
- Use the script's built-in delays

---

## Next Steps

After testing:

1. **Review Content Quality**
   - Compare the generated content
   - Decide if Haiku quality is sufficient for staging

2. **Analyze Costs**
   - Calculate your expected monthly usage
   - Determine budget allocation

3. **Configure Environments**
   ```bash
   # .env.staging
   BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
   
   # .env.production
   BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
   ```

4. **Deploy**
   ```powershell
   # Deploy to staging with Haiku
   cdk deploy --context environment=staging
   
   # Deploy to production with Sonnet
   cdk deploy --context environment=production
   ```

---

## Summary

✅ **Easy to test** - Just run one PowerShell command  
✅ **See real differences** - Side-by-side comparison  
✅ **Make informed decisions** - Data-driven model selection  
✅ **Save money** - Use Haiku for testing, Sonnet for production  

**Recommended Approach**:
- Development: Haiku
- Staging: Haiku
- Production: Sonnet

This saves ~90% on testing costs while maintaining high quality in production!

---

**Last Updated**: March 3, 2026  
**Script Location**: `scripts/test-bedrock-models.ps1`  
**Estimated Test Time**: 5-10 minutes
