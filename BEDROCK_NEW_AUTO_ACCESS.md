# Bedrock Auto-Access - New AWS Policy (2026)

## What Changed

AWS has **retired the manual model access page**. Models are now automatically enabled when first invoked!

**Old Way (Before 2026):**
- Go to Bedrock console
- Request model access
- Wait for approval
- Then use models

**New Way (2026+):**
- Just invoke the model
- Access is granted automatically on first use
- No manual approval needed

---

## What This Means For You

✅ **No more waiting** - Models work immediately  
✅ **No manual approval** - Automatic on first invoke  
✅ **Simpler workflow** - Just start using Bedrock  

⚠️ **Exception**: Anthropic models from AWS Marketplace still require case submission

---

## How to Get Started

### Step 1: Verify IAM Permissions

Make sure your IAM user/role has these permissions:

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
      "Resource": "*"
    }
  ]
}
```

**Quick check:**
```powershell
# Check your identity
aws sts get-caller-identity

# List available models
aws bedrock list-foundation-models --region ap-south-1
```

### Step 2: Test Direct Invocation

Just try invoking the model - it should work immediately:

```powershell
# Test Claude 3 Haiku
aws bedrock-runtime invoke-model `
  --region ap-south-1 `
  --model-id anthropic.claude-3-haiku-20240307-v1:0 `
  --content-type application/json `
  --body '{\"anthropic_version\": \"bedrock-2023-05-31\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}' `
  response.json

# Check response
cat response.json
```

**Expected Result:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Hello! How can I help you today?"}]
}
```

### Step 3: Run Project Test

```powershell
cd Sanaathana-Aalaya-Charithra
.\scripts\test-bedrock-models.ps1
```

This will test both Haiku and Sonnet models.

---

## If You Still Get AccessDeniedException

### Scenario 1: IAM Permissions Missing

**Error:**
```
AccessDeniedException: User: arn:aws:iam::123456789:user/myuser is not authorized to perform: bedrock:InvokeModel
```

**Fix:**
```powershell
# Attach Bedrock policy to your user
aws iam attach-user-policy `
  --user-name YOUR_USERNAME `
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
```

### Scenario 2: Anthropic Marketplace Models

**Error:**
```
AccessDeniedException: You must submit use case details before accessing this model
```

**What this means:**
- You're trying to use an Anthropic model from AWS Marketplace
- These still require manual approval

**Fix:**
1. Go to [AWS Support Center](https://console.aws.amazon.com/support/)
2. Create a case: "Service limit increase"
3. Select: "Amazon Bedrock"
4. Describe your use case:
   ```
   Use Case: Temple history and cultural content generation
   Expected Usage: ~1,000 requests/month
   Models Needed: Claude 3 Haiku, Claude 3 Sonnet
   Region: ap-south-1 (Mumbai)
   ```
5. Submit and wait for approval (usually 24-48 hours)

### Scenario 3: Account Verification Needed

**Error:**
```
AccessDeniedException: Your account requires additional verification
```

**Fix:**
1. Verify payment method in [AWS Billing](https://console.aws.amazon.com/billing/)
2. Complete any pending account verification
3. Wait 24-48 hours
4. Retry

### Scenario 4: Region Not Supported

**Error:**
```
ValidationException: The provided model identifier is invalid
```

**Fix:**
- Use `ap-south-1` (Mumbai) or `us-east-1` (N. Virginia)
- Both regions support Claude 3 models

```powershell
# Set region explicitly
$env:AWS_REGION = "ap-south-1"
aws bedrock-runtime invoke-model --region ap-south-1 ...
```

---

## Testing Checklist

Use this to verify everything works:

- [ ] AWS CLI installed and configured
- [ ] IAM permissions include `bedrock:InvokeModel`
- [ ] Region set to `ap-south-1` or `us-east-1`
- [ ] Test command runs successfully
- [ ] Response contains generated text
- [ ] Project test script works

---

## Quick Test Commands

```powershell
# 1. Check AWS identity
aws sts get-caller-identity

# 2. List available models in your region
aws bedrock list-foundation-models --region ap-south-1 --query "modelSummaries[?contains(modelId, 'claude')].{ID:modelId,Name:modelName}" --output table

# 3. Test Haiku (fast, cheap)
aws bedrock-runtime invoke-model `
  --region ap-south-1 `
  --model-id anthropic.claude-3-haiku-20240307-v1:0 `
  --content-type application/json `
  --body '{\"anthropic_version\": \"bedrock-2023-05-31\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Test\"}]}' `
  haiku-test.json

# 4. Test Sonnet (high quality)
aws bedrock-runtime invoke-model `
  --region ap-south-1 `
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 `
  --content-type application/json `
  --body '{\"anthropic_version\": \"bedrock-2023-05-31\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"Test\"}]}' `
  sonnet-test.json

# 5. Run project tests
cd Sanaathana-Aalaya-Charithra
.\scripts\test-bedrock-models.ps1
```

---

## Understanding the New Model Access Policy

From the AWS console message:

> "Serverless foundation models are now automatically enabled across all AWS commercial regions when first invoked in your account, so you can start using them instantly. You no longer need to manually activate model access through this page."

**What this means:**

1. **First Invocation**: When you call a model for the first time, AWS automatically grants access
2. **Account-Wide**: Once enabled, all users in your account can use it
3. **No Delays**: Instant access, no waiting period
4. **IAM Control**: Admins still control access via IAM policies
5. **Service Control Policies**: Can restrict access if needed

**Exception - Anthropic Marketplace Models:**

> "Note that for Anthropic models, a user with AWS Marketplace permissions must invoke the model once to enable it account-wide for all users."

If you're using Anthropic models from Marketplace:
- Need AWS Marketplace permissions
- Must invoke once to enable
- Then available for all users

---

## For Your Project

### Development Environment

```bash
# .env.development
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
```

### Staging Environment

```bash
# .env.staging
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
```

### Production Environment

```bash
# .env.production
AWS_REGION=ap-south-1
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
```

---

## Cost Estimates (ap-south-1 Region)

### Claude 3 Haiku
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Typical request: ~$0.0006
- 1,000 requests: ~$0.60

### Claude 3 Sonnet
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens
- Typical request: ~$0.009
- 1,000 requests: ~$9.00

**Recommendation**: Use Haiku for development/staging, Sonnet for production

---

## Next Steps

1. **Test immediately** - No need to wait for approval
2. **Run test script** - Verify both models work
3. **Start development** - Begin generating content
4. **Monitor costs** - Set up billing alerts

```powershell
# Start testing now
cd Sanaathana-Aalaya-Charithra
.\scripts\test-bedrock-models.ps1
```

---

## Summary

✅ **Model access is automatic** - Just invoke and use  
✅ **No manual approval needed** - Works immediately  
✅ **IAM permissions required** - Make sure you have them  
✅ **Marketplace models different** - May need case submission  

The old troubleshooting guide is outdated. With the new policy, you should be able to use Bedrock models immediately after ensuring IAM permissions are correct.

---

**Last Updated**: March 4, 2026  
**AWS Policy Change**: Model Access Page Retired  
**Source**: AWS Bedrock Console Notification
