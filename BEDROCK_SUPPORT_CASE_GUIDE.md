# How to Request Bedrock Access - Support Case Guide

## Current Status

✅ AWS credentials configured  
✅ IAM user identified: `ManjuAvvariAdmin`  
✅ AWS Account: `964474461414`  
❌ Bedrock access blocked: "Access to Bedrock models is not allowed for this account"

## What You Need to Do

Your account requires manual approval to use Amazon Bedrock. You need to submit an AWS Support case.

---

## Step 1: Open AWS Support Center

1. Go to: https://console.aws.amazon.com/support/home
2. Sign in with your AWS account
3. Click "Create case"

---

## Step 2: Select Case Type

- Select: **Service limit increase**
- Service: **Amazon Bedrock**

---

## Step 3: Fill Out the Request

### Case Details

**Limit type**: Model access

**Region**: Asia Pacific (Mumbai) - ap-south-1

**Models requested**:
- Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`)
- Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)

### Use Case Description

Copy and paste this (customize as needed):

```
Subject: Request Access to Amazon Bedrock - Claude 3 Models

Use Case: Temple History and Cultural Heritage Content Generation

Description:
We are developing "Sanaathana Aalaya Charithra," a mobile application and web platform 
dedicated to preserving and sharing the rich history of Hindu temples across India. 
Our platform aims to make temple history, architecture, and cultural significance 
accessible to devotees, researchers, and cultural enthusiasts.

Bedrock Use Case:
- Generate educational content about temple history and architecture
- Create multilingual descriptions (English, Hindi, Telugu, Tamil, Kannada)
- Produce engaging narratives about temple legends and cultural significance
- Generate Q&A content for educational purposes

Expected Usage:
- Development/Testing: ~100 requests/month (Claude 3 Haiku)
- Staging: ~500 requests/month (Claude 3 Haiku)
- Production: ~1,000 requests/month (Claude 3 Sonnet)
- Total estimated cost: $10-15/month

Models Needed:
- Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0) - Development & Staging
- Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0) - Production

Region: ap-south-1 (Mumbai) - to serve Indian users with low latency

Target Audience:
- Temple devotees and pilgrims
- Cultural heritage researchers
- Students studying Indian architecture and history
- Tourism and cultural organizations

This is a non-commercial, educational, and cultural preservation initiative.

Account ID: 964474461414
IAM User: ManjuAvvariAdmin
```

### Contact Options

**Preferred contact language**: English

**Contact method**: 
- Email (for non-urgent)
- Web (for faster response)

---

## Step 4: Submit and Wait

**Expected timeline**: 24-48 hours (usually faster)

**What happens next**:
1. AWS Support reviews your request
2. They may ask clarifying questions
3. Once approved, you'll receive an email
4. Models will be immediately available

---

## Alternative: Try Different Region

While waiting, you can try requesting access in **us-east-1** (N. Virginia):

```powershell
# Test us-east-1 region
python .\scripts\test-bedrock-python.py --region us-east-1
```

Some accounts have different restrictions per region.

---

## After Approval

Once you receive approval, test immediately:

```powershell
# Test Bedrock access
.\scripts\test-bedrock-python.ps1

# If successful, run full tests
.\scripts\test-bedrock-models.ps1
```

---

## Temporary Workaround: Use Alternative Models

While waiting for Claude access, you can use Amazon Titan models (no approval needed):

### Option 1: Amazon Titan Text Express

```python
# In your code, temporarily use:
model_id = "amazon.titan-text-express-v1"
```

**Pros:**
- Available immediately
- No approval needed
- Lower cost

**Cons:**
- Lower quality than Claude
- Less sophisticated reasoning
- May need prompt adjustments

### Option 2: Wait for Approval

**Recommended** - Claude models are significantly better for your use case.

---

## Support Case Template (Copy-Paste Ready)

```
Case Type: Service Limit Increase
Service: Amazon Bedrock
Limit Type: Model Access
Region: ap-south-1

Subject: Bedrock Model Access Request - Cultural Heritage Application

Use Case Summary:
Educational content generation for Hindu temple history and cultural preservation platform.

Models Requested:
1. anthropic.claude-3-haiku-20240307-v1:0
2. anthropic.claude-3-sonnet-20240229-v1:0

Expected Monthly Usage:
- Development: 100 requests (Haiku)
- Staging: 500 requests (Haiku)
- Production: 1,000 requests (Sonnet)
- Estimated cost: $10-15/month

Application Type: Non-commercial, educational, cultural preservation

Target Audience: Temple devotees, researchers, students, cultural organizations

Account ID: 964474461414
Region: ap-south-1 (Mumbai)

Additional Context:
This is a cultural heritage preservation initiative focused on documenting and sharing 
the history of Hindu temples across India. We chose Claude models for their superior 
ability to generate culturally sensitive, accurate, and engaging educational content 
in multiple Indian languages.
```

---

## FAQ

### Q: How long does approval take?
**A:** Usually 24-48 hours, sometimes within a few hours.

### Q: Will I be charged for the support case?
**A:** No, service limit increase requests are free.

### Q: Can I use Bedrock in other regions while waiting?
**A:** You can try, but the restriction is usually account-wide.

### Q: What if my request is denied?
**A:** Rare for legitimate use cases. If denied, they'll explain why and suggest alternatives.

### Q: Do I need to provide payment information?
**A:** Your account should already have payment configured. If not, add it first.

### Q: Can I request higher limits now?
**A:** Start with basic access. You can request higher limits later if needed.

---

## Checking Request Status

1. Go to: https://console.aws.amazon.com/support/home
2. Click "Your support cases"
3. Find your Bedrock access request
4. Check for updates or responses

---

## What to Do While Waiting

1. **Continue development** with mock data
2. **Prepare your content generation code** (it will work once approved)
3. **Set up your environment variables**:
   ```bash
   AWS_REGION=ap-south-1
   BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
   ```
4. **Review the cost optimization guide**: `docs/COST_CONTROL_STRATEGY.md`
5. **Test other AWS services** (DynamoDB, S3, etc.)

---

## Quick Links

- **AWS Support Center**: https://console.aws.amazon.com/support/
- **Bedrock Pricing**: https://aws.amazon.com/bedrock/pricing/
- **Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **Model Access Guide**: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html

---

## Summary

Your account needs manual approval for Bedrock access. This is normal for new Bedrock users. Submit a support case with your use case details, and you should have access within 24-48 hours.

The test confirmed:
- ✅ AWS credentials work
- ✅ IAM permissions are correct
- ❌ Account-level Bedrock access not yet granted

Once approved, all your code will work immediately - no changes needed!

---

**Last Updated**: March 4, 2026  
**Account**: 964474461414  
**Status**: Awaiting Bedrock access approval
