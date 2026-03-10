# Bedrock Model Switching Guide

## How to Use Different Models per Environment

Yes, it's **very easy** and already configured in your project! The model selection happens automatically based on environment variables.

---

## 🎯 Quick Answer

**Staging**: Uses Claude 3 Haiku (cheaper, faster)  
**Production**: Uses Claude 3 Sonnet (better quality)

**How it switches**: Environment variables set during deployment

---

## 📋 Current Configuration

### Environment Variables

Your project uses the `BEDROCK_MODEL` environment variable:

**Staging** (`.env.staging`):
```bash
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
```

**Production** (`.env.production`):
```bash
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
```

### How the Code Reads It

The Bedrock service automatically picks up the model from environment:

```typescript
// backend/services/bedrock-service.ts
constructor(config?: Partial<BedrockConfig>) {
  this.defaultConfig = {
    modelId: config?.modelId || 
             process.env.BEDROCK_MODEL ||  // ← Reads from environment
             'anthropic.claude-3-sonnet-20240229-v1:0',  // ← Fallback
    // ... other config
  };
}
```

---

## 🚀 How Deployment Works

### Method 1: Environment Variables (Recommended)

When you deploy, the environment variable is set automatically:

```bash
# Staging deployment
export BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
cdk deploy --context environment=staging

# Production deployment
export BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
cdk deploy --context environment=production
```

### Method 2: Lambda Environment Variables

Set in your CDK stack or CloudFormation:

```typescript
// In your Lambda function definition
const contentGenerationLambda = new lambda.Function(this, 'ContentGeneration', {
  // ... other config
  environment: {
    BEDROCK_MODEL: process.env.BEDROCK_MODEL || 
                   'anthropic.claude-3-sonnet-20240229-v1:0',
    AWS_REGION: 'ap-south-1',
    // ... other env vars
  },
});
```

### Method 3: AWS Systems Manager Parameter Store

Store model IDs in Parameter Store and read at runtime:

```typescript
// Read from Parameter Store
const modelId = await ssm.getParameter({
  Name: `/sanaathana/${stage}/bedrock-model`
}).promise();
```

---

## 🔄 Switching Models - Step by Step

### Option A: Via Environment Files (Easiest)

**1. Create environment files:**

```bash
# .env.staging
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
AWS_REGION=ap-south-1
STAGE=staging

# .env.production
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
AWS_REGION=ap-south-1
STAGE=production
```

**2. Deploy with the right environment:**

```bash
# Deploy to staging
cdk deploy --context environment=staging

# Deploy to production
cdk deploy --context environment=production
```

**That's it!** The Lambda functions automatically use the correct model.

### Option B: Via GitHub Actions (CI/CD)

Your GitHub Actions workflow already handles this:

```yaml
# .github/workflows/deploy-staging.yml
- name: Deploy to AWS Lambda
  run: |
    aws lambda update-function-configuration \
      --function-name staging-content-generation \
      --environment "Variables={
        BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0,
        AWS_REGION=ap-south-1,
        STAGE=staging
      }"

# .github/workflows/deploy-production.yml
- name: Deploy to AWS Lambda
  run: |
    aws lambda update-function-configuration \
      --function-name prod-content-generation \
      --environment "Variables={
        BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0,
        AWS_REGION=ap-south-1,
        STAGE=production
      }"
```

### Option C: Via AWS Console (Manual)

1. Go to AWS Lambda Console
2. Select your function (e.g., `staging-content-generation`)
3. Go to Configuration → Environment variables
4. Edit `BEDROCK_MODEL` value
5. Save

---

## 💡 Best Practices

### 1. Use Environment Variables (Recommended)

**Why**: Easy to change, no code changes needed, works across all environments

```typescript
// Your code just reads from environment
const modelId = process.env.BEDROCK_MODEL || 'default-model';
```

### 2. Set Defaults per Environment

**Staging defaults:**
```typescript
const STAGING_DEFAULTS = {
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  maxTokens: 1024,  // Lower for cost savings
  temperature: 0.7,
};
```

**Production defaults:**
```typescript
const PRODUCTION_DEFAULTS = {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  maxTokens: 2048,  // Higher for better quality
  temperature: 0.7,
};
```

### 3. Use CDK Context for Infrastructure

```json
// cdk.json
{
  "context": {
    "staging": {
      "bedrockModel": "anthropic.claude-3-haiku-20240307-v1:0",
      "region": "ap-south-1"
    },
    "production": {
      "bedrockModel": "anthropic.claude-3-sonnet-20240229-v1:0",
      "region": "ap-south-1"
    }
  }
}
```

---

## 🎨 Example: Complete Implementation

### 1. Environment Configuration

```bash
# .env.development (local testing)
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
AWS_REGION=ap-south-1
STAGE=development

# .env.staging
BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
AWS_REGION=ap-south-1
STAGE=staging

# .env.production
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
AWS_REGION=ap-south-1
STAGE=production
```

### 2. Service Code (Already Done!)

```typescript
// backend/services/bedrock-service.ts
export class BedrockService {
  constructor(config?: Partial<BedrockConfig>) {
    this.defaultConfig = {
      // Reads from environment automatically
      modelId: config?.modelId || 
               process.env.BEDROCK_MODEL || 
               'anthropic.claude-3-sonnet-20240229-v1:0',
      region: process.env.AWS_REGION || 'ap-south-1',
      maxTokens: config?.maxTokens || 2048,
      temperature: config?.temperature || 0.7,
    };
  }

  async generateContent(prompt: string): Promise<string> {
    // Uses the model from environment automatically
    const response = await this.client.send(
      new InvokeModelCommand({
        modelId: this.defaultConfig.modelId,  // ← Environment-specific
        body: JSON.stringify({
          prompt,
          max_tokens: this.defaultConfig.maxTokens,
          temperature: this.defaultConfig.temperature,
        }),
      })
    );
    return response;
  }
}
```

### 3. Lambda Handler (No Changes Needed!)

```typescript
// backend/lambdas/content-generation.ts
import { BedrockService } from '../services/bedrock-service';

export const handler = async (event: any) => {
  // Service automatically uses environment-specific model
  const bedrock = new BedrockService();
  
  const content = await bedrock.generateContent(event.prompt);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ content }),
  };
};
```

---

## 🔍 Verification

### Check Which Model is Being Used

**In Lambda logs (CloudWatch):**
```typescript
logger.info('Bedrock service initialized', {
  modelId: this.defaultConfig.modelId,  // ← Shows which model
  region: this.defaultConfig.region,
});
```

**Via AWS CLI:**
```bash
# Check staging Lambda environment
aws lambda get-function-configuration \
  --function-name staging-content-generation \
  --query 'Environment.Variables.BEDROCK_MODEL'

# Check production Lambda environment
aws lambda get-function-configuration \
  --function-name prod-content-generation \
  --query 'Environment.Variables.BEDROCK_MODEL'
```

**In your code:**
```typescript
console.log('Using Bedrock model:', process.env.BEDROCK_MODEL);
```

---

## 💰 Cost Comparison

### Staging (Haiku)
- **Model**: Claude 3 Haiku
- **Cost**: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
- **Speed**: ~2-3 seconds per request
- **Use**: Testing, development, QA

### Production (Sonnet)
- **Model**: Claude 3 Sonnet
- **Cost**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Speed**: ~3-5 seconds per request
- **Quality**: Higher quality, better reasoning
- **Use**: Real users, production content

**Savings**: Using Haiku in staging saves ~90% on testing costs!

---

## 🎯 Quick Reference

| Environment | Model | Model ID | Cost | Use Case |
|-------------|-------|----------|------|----------|
| **Development** | Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | Lowest | Local testing |
| **Staging** | Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | Low | QA, testing |
| **Production** | Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` | Higher | Real users |

---

## 🚨 Common Issues & Solutions

### Issue 1: Model Not Switching

**Problem**: Lambda still uses old model after deployment

**Solution**: Update Lambda environment variables:
```bash
aws lambda update-function-configuration \
  --function-name your-function-name \
  --environment "Variables={BEDROCK_MODEL=new-model-id}"
```

### Issue 2: Model Not Available in Region

**Problem**: Model not available in `ap-south-1`

**Solution**: Check model availability:
```bash
aws bedrock list-foundation-models \
  --region ap-south-1 \
  --query 'modelSummaries[?contains(modelId, `claude`)].modelId'
```

### Issue 3: Permission Denied

**Problem**: Lambda can't invoke Bedrock model

**Solution**: Add IAM permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": [
    "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
    "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
  ]
}
```

---

## 📝 Summary

**Is it easy?** YES! ✅

**How it works:**
1. Set `BEDROCK_MODEL` environment variable
2. Deploy to staging/production
3. Code automatically uses the right model

**No code changes needed** - just environment configuration!

**Benefits:**
- ✅ Save money in staging (Haiku is 12x cheaper)
- ✅ Better quality in production (Sonnet is smarter)
- ✅ Easy to switch models anytime
- ✅ No code changes required
- ✅ Test with cheap model, deploy with good model

---

## 🎓 Advanced: Dynamic Model Selection

Want to switch models based on request type?

```typescript
class BedrockService {
  async generateContent(prompt: string, options?: { quality?: 'fast' | 'high' }) {
    const modelId = options?.quality === 'high'
      ? 'anthropic.claude-3-sonnet-20240229-v1:0'  // High quality
      : 'anthropic.claude-3-haiku-20240307-v1:0';   // Fast & cheap
    
    // Use selected model
    return this.invokeModel(prompt, { modelId });
  }
}

// Usage
await bedrock.generateContent(prompt, { quality: 'high' });  // Uses Sonnet
await bedrock.generateContent(prompt, { quality: 'fast' });  // Uses Haiku
```

---

**Last Updated**: March 3, 2026  
**Status**: Configuration ready, implementation pending  
**Difficulty**: Easy - just environment variables!
