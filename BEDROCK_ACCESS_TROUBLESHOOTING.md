# AWS Bedrock Access Troubleshooting Guide

## Issue Summary

You're encountering an **account-level access restriction** (not a quota limit) when trying to use Claude 3 models in AWS Bedrock.

**Error Type**: AccessDeniedException  
**Root Cause**: Account verification or model access not properly enabled  
**Regions Affected**: us-east-1, ap-south-1

---

## Step-by-Step Resolution

### Step 1: Verify Model Access Status

1. Navigate to AWS Bedrock console in your target region:
   - [us-east-1 (N. Virginia)](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess)
   - [ap-south-1 (Mumbai)](https://console.aws.amazon.com/bedrock/home?region=ap-south-1#/modelaccess)

2. Go to "Model access" in the left navigation panel

3. Check the status for these models:
   - `anthropic.claude-3-haiku-20240307-v1:0`
   - `anthropic.claude-3-sonnet-20240229-v1:0`

4. Expected statuses:
   - ✅ **"Access granted"** - Ready to use
   - ⏳ **"Access requested"** - Wait 24-48 hours
   - ⏳ **"Request pending"** - Wait 24-48 hours
   - ❌ **"Not requested"** - Need to request access

### Step 2: Request Model Access (if needed)

If models show "Not requested":

1. Click "Manage model access" or "Edit"
2. Find "Anthropic" section
3. Check boxes for:
   - Claude 3 Haiku
   - Claude 3 Sonnet
4. Click "Save changes"
5. Wait for approval (typically instant, but can take 24-48 hours)

### Step 3: Validate IAM Permissions

Ensure your IAM user/role has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetFoundationModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

**To check your permissions:**

```powershell
# Check current IAM user
aws sts get-caller-identity

# List attached policies
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# Or for a role
aws iam list-attached-role-policies --role-name YOUR_ROLE_NAME
```

### Step 4: Test with Basic API Call

Try a simple test to verify access:

```powershell
# Test Haiku in ap-south-1
aws bedrock-runtime invoke-model `
  --region ap-south-1 `
  --model-id anthropic.claude-3-haiku-20240307-v1:0 `
  --content-type application/json `
  --body '{\"anthropic_version\": \"bedrock-2023-05-31\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}' `
  response.json

# Check the response
cat response.json
```

**Expected Success Response:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Hello! How can I help you today?"}],
  "model": "claude-3-haiku-20240307",
  "stop_reason": "end_turn"
}
```

**If you get AccessDeniedException:**
- Model access not enabled yet
- IAM permissions missing
- Account verification pending

### Step 5: Try Console Playground First

Before using the API, test in the console:

1. Go to [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Playgrounds" → "Chat"
3. Select "Claude 3 Haiku" from the model dropdown
4. Type a simple prompt: "Hello"
5. Click "Run"

**If playground works but API doesn't:**
- This confirms an API-level access restriction
- Check IAM permissions again
- Verify AWS credentials are configured correctly

**If playground doesn't work:**
- Model access not enabled
- Wait for approval (24-48 hours)

### Step 6: Check Service Quotas

While this is likely not a quota issue, verify your limits:

1. Go to [Service Quotas Console](https://console.aws.amazon.com/servicequotas/)
2. Search for "Amazon Bedrock"
3. Check these quotas:
   - "Invocations per minute" (default: 10,000)
   - "Tokens per minute" (varies by model)
   - "Concurrent requests" (default: 100)

**For Claude 3 Haiku in ap-south-1:**
- Default: 10,000 requests/minute
- Should be sufficient for testing

### Step 7: Account Verification Status

The error may indicate your AWS account needs verification:

**Common scenarios:**
- New AWS accounts (< 30 days old)
- Accounts without payment method verified
- Accounts flagged for additional review
- First-time Bedrock users

**Resolution:**
1. Verify payment method in [AWS Billing Console](https://console.aws.amazon.com/billing/)
2. Complete account verification if prompted
3. Wait 24-48 hours after verification
4. Contact AWS Support if issues persist

### Step 8: Wait Period

If you recently enabled model access:

- **Propagation delay**: 24-48 hours
- **What to do**: Wait before retrying
- **Check status**: Monitor "Model access" page for status changes

---

## Testing Your Setup

Once you believe access is granted, run our test script:

```powershell
# Navigate to project directory
cd Sanaathana-Aalaya-Charithra

# Run comprehensive test
.\scripts\test-bedrock-models.ps1
```

This will test both models and show you:
- ✅ Access is working
- ⏱️ Response times
- 💰 Cost per request
- 📝 Content quality

---

## Common Error Messages

### "AccessDeniedException: User is not authorized"

**Cause**: IAM permissions missing

**Fix**:
```powershell
# Attach the AmazonBedrockFullAccess policy
aws iam attach-user-policy `
  --user-name YOUR_USERNAME `
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
```

### "ValidationException: The provided model identifier is invalid"

**Cause**: Wrong model ID or region

**Fix**:
- Verify model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Verify region: `ap-south-1` or `us-east-1`
- Check [supported models documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)

### "ThrottlingException: Rate exceeded"

**Cause**: Too many requests

**Fix**:
- Wait 1-2 minutes between tests
- Check Service Quotas
- Implement exponential backoff in your code

### "ResourceNotFoundException: Could not resolve the foundation model"

**Cause**: Model not available in your region

**Fix**:
- Use `ap-south-1` (Mumbai) or `us-east-1` (N. Virginia)
- Both regions support Claude 3 models
- Update your AWS region configuration

---

## Region-Specific Notes

### ap-south-1 (Mumbai) - Recommended

✅ **Advantages:**
- Lower latency for Indian users
- Claude 3 Haiku available
- Claude 3 Sonnet available
- Closer to your target audience

**Configuration:**
```bash
AWS_REGION=ap-south-1
```

### us-east-1 (N. Virginia) - Alternative

✅ **Advantages:**
- More models available
- Often gets new features first
- Established region

⚠️ **Disadvantages:**
- Higher latency for Indian users (~200-300ms)

**Configuration:**
```bash
AWS_REGION=us-east-1
```

---

## Next Steps After Resolution

Once access is working:

### 1. Update Environment Variables

```bash
# .env.development
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0

# .env.staging
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0

# .env.production
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
```

### 2. Test Content Generation

```powershell
# Test local content generation
.\scripts\generate-content-locally.ps1 -TempleId "lepakshi-temple"
```

### 3. Deploy to AWS

```powershell
# Deploy staging environment
cd backend
cdk deploy --context environment=staging

# Deploy production environment
cdk deploy --context environment=production
```

### 4. Monitor Usage and Costs

- Set up CloudWatch alarms for Bedrock usage
- Monitor costs in AWS Cost Explorer
- Track token usage per request

---

## Still Having Issues?

### Option 1: Contact AWS Support

If you've waited 48+ hours and still have access issues:

1. Go to [AWS Support Center](https://console.aws.amazon.com/support/)
2. Create a new case
3. Select "Account and billing support"
4. Subject: "Bedrock Model Access - Claude 3 Models"
5. Include:
   - Your AWS Account ID
   - Region (ap-south-1)
   - Models requested (Claude 3 Haiku, Sonnet)
   - When you requested access
   - Error messages you're seeing

### Option 2: Use Alternative Models (Temporary)

While waiting for Claude access, you can use:

**Amazon Titan Text Express:**
```bash
BEDROCK_MODEL=amazon.titan-text-express-v1
```

**Pros:**
- No access request needed
- Available immediately
- Lower cost

**Cons:**
- Lower quality than Claude
- Less sophisticated reasoning

### Option 3: Check AWS Service Health

Verify there are no ongoing issues:
- [AWS Service Health Dashboard](https://status.aws.amazon.com/)
- Check "Amazon Bedrock" status for your region

---

## Prevention for Future

### Best Practices

1. **Request access early**: Don't wait until you need it
2. **Test in console first**: Verify access before coding
3. **Use IAM roles**: Better than user credentials
4. **Set up CloudWatch alarms**: Monitor for access issues
5. **Document your setup**: Keep track of what's enabled

### Recommended IAM Setup

Create a dedicated IAM role for Bedrock:

```json
{
  "RoleName": "BedrockContentGenerationRole",
  "AssumeRolePolicyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  },
  "Policies": [
    "AmazonBedrockFullAccess",
    "CloudWatchLogsFullAccess"
  ]
}
```

---

## Summary Checklist

Use this checklist to verify everything:

- [ ] Model access shows "Access granted" in console
- [ ] IAM permissions include `bedrock:InvokeModel`
- [ ] AWS credentials configured (`aws configure`)
- [ ] Region set to `ap-south-1` or `us-east-1`
- [ ] Console playground test successful
- [ ] CLI test command successful
- [ ] Test script runs without errors
- [ ] Account payment method verified
- [ ] Waited 24-48 hours if recently requested

---

## Quick Reference Commands

```powershell
# Check AWS identity
aws sts get-caller-identity

# Check model access status
aws bedrock list-foundation-models --region ap-south-1

# Test Haiku model
aws bedrock-runtime invoke-model `
  --region ap-south-1 `
  --model-id anthropic.claude-3-haiku-20240307-v1:0 `
  --content-type application/json `
  --body '{\"anthropic_version\": \"bedrock-2023-05-31\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Test\"}]}' `
  test-response.json

# Run project test script
.\scripts\test-bedrock-models.ps1
```

---

**Last Updated**: March 4, 2026  
**AWS Support Case Reference**: Based on automated AWS Support response  
**Estimated Resolution Time**: 24-48 hours after requesting access
