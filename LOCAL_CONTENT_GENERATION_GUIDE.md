# Local Content Generation Guide

Generate temple content on your Windows machine BEFORE deploying to AWS.

**Last Updated**: March 3, 2026  
**Status**: Ready to use after AWS enables Bedrock access

---

## Why Generate Locally?

✅ **Test immediately** - No AWS deployment needed  
✅ **Review content** - Check quality before publishing  
✅ **Edit if needed** - Manually improve AI-generated content  
✅ **Cost control** - Generate once, use everywhere  
✅ **Version control** - Store generated content in Git  
✅ **Faster iteration** - No deployment cycle for testing  

---

## Prerequisites

1. ✅ AWS CLI installed and configured
2. ✅ AWS Bedrock access enabled (waiting for support ticket)
3. ✅ PowerShell on Windows

---

## Quick Start

### Step 1: Test Bedrock Access (After AWS Enables It)

```powershell
# Test that Bedrock is working
.\scripts\test-bedrock-models.ps1 -HaikuOnly
```

**Expected output**: Successfully generated sample content  
**Cost**: ~$0.001

---

### Step 2: Generate Sample Content (10 Temples)

```powershell
# Generate content for 10 temples to test
.\scripts\generate-content-locally.ps1 -TempleCount 10 -Model haiku
```

**What this does**:
- Generates content for 10 temples
- Uses Haiku model (cheaper, faster)
- Saves to `data/generated-content/`
- Shows cost and progress

**Cost**: ~$0.006 (less than 1 cent)  
**Time**: ~30 seconds

---

### Step 3: Review Generated Content

```powershell
# Open the generated files
cd data/generated-content
ls
```

Each file contains:
```json
{
  "templeId": "temple_001",
  "templeName": "Brihadeeswarar Temple",
  "location": "Thanjavur, Tamil Nadu",
  "content": "Generated content here...",
  "metadata": {
    "model": "Claude 3.5 Haiku",
    "generatedAt": "2026-03-03T10:30:00Z",
    "cost": 0.000623
  }
}
```

---

### Step 4: Generate All Temples (Production)

Once you're happy with the quality:

**Option A: Use Haiku (Cheaper)**
```powershell
# Generate all 1,000 temples with Haiku
.\scripts\generate-content-locally.ps1 -TempleCount 1000 -Model haiku
```
**Cost**: ~$0.60  
**Time**: ~40 minutes  
**Quality**: Good for testing

**Option B: Use Sonnet (Better Quality)**
```powershell
# Generate all 1,000 temples with Sonnet
.\scripts\generate-content-locally.ps1 -TempleCount 1000 -Model sonnet
```
**Cost**: ~$9.20  
**Time**: ~60 minutes  
**Quality**: Excellent for production

---

## Script Options

### Basic Usage
```powershell
.\scripts\generate-content-locally.ps1
```
Generates 10 temples with Haiku model (default)

### Specify Model
```powershell
# Use Haiku (fast, cheap)
.\scripts\generate-content-locally.ps1 -Model haiku

# Use Sonnet (high quality)
.\scripts\generate-content-locally.ps1 -Model sonnet
```

### Specify Temple Count
```powershell
# Generate 50 temples
.\scripts\generate-content-locally.ps1 -TempleCount 50

# Generate all temples
.\scripts\generate-content-locally.ps1 -TempleCount 1000
```

### Custom Output Directory
```powershell
# Save to custom location
.\scripts\generate-content-locally.ps1 -OutputDir "data/production-content"
```

### Dry Run (Test Without Generating)
```powershell
# See what would happen without actually generating
.\scripts\generate-content-locally.ps1 -DryRun
```

---

## Complete Workflow

### Phase 1: Initial Testing (NOW)

```powershell
# 1. Test Bedrock access
.\scripts\test-bedrock-models.ps1

# 2. Generate 5 sample temples
.\scripts\generate-content-locally.ps1 -TempleCount 5 -Model haiku

# 3. Review quality
cd data/generated-content
cat temple_001.json
```

**Cost**: ~$0.01  
**Time**: 5 minutes

---

### Phase 2: Bulk Generation (Before Deployment)

```powershell
# Generate all temples with Haiku for testing
.\scripts\generate-content-locally.ps1 -TempleCount 1000 -Model haiku -OutputDir "data/staging-content"
```

**Cost**: ~$0.60  
**Time**: 40 minutes

---

### Phase 3: Review & Edit

1. Open files in `data/staging-content/`
2. Review AI-generated content
3. Edit any content that needs improvement
4. Save changes

---

### Phase 4: Production Quality (Optional)

If you want higher quality for production:

```powershell
# Regenerate with Sonnet for better quality
.\scripts\generate-content-locally.ps1 -TempleCount 1000 -Model sonnet -OutputDir "data/production-content"
```

**Cost**: ~$9.20  
**Time**: 60 minutes

---

### Phase 5: Deploy to AWS

```bash
# Deploy your application
cdk deploy --context environment=production

# Import generated content to DynamoDB
.\scripts\import-content-to-dynamodb.ps1 -InputDir "data/production-content"
```

---

## Cost Comparison

| Scenario | Model | Temples | Cost | Time |
|----------|-------|---------|------|------|
| **Testing** | Haiku | 10 | $0.006 | 30 sec |
| **Small Batch** | Haiku | 100 | $0.06 | 4 min |
| **Full Dataset** | Haiku | 1,000 | $0.60 | 40 min |
| **Production Quality** | Sonnet | 1,000 | $9.20 | 60 min |

---

## Output Structure

Generated files are saved in JSON format:

```
data/generated-content/
├── temple_001.json
├── temple_002.json
├── temple_003.json
└── ...
```

Each file contains:
- Temple ID and name
- Generated content (about, history, significance, architecture)
- Metadata (model used, timestamp, cost, tokens)

---

## Troubleshooting

### Error: "AWS CLI not found"

**Solution**:
```powershell
# Install AWS CLI from:
# https://aws.amazon.com/cli/
```

### Error: "AWS credentials not configured"

**Solution**:
```powershell
aws configure
# Enter your credentials
```

### Error: "Access to Bedrock models is not allowed"

**Solution**:
- Wait for AWS support to enable Bedrock access
- Check support ticket status
- Usually resolved within 24-48 hours

### Error: "ThrottlingException"

**Solution**:
- Script already includes 2-second delays
- If still throttled, increase delay in script
- Bedrock has rate limits (10 requests/second)

---

## Best Practices

### 1. Start Small
```powershell
# Test with 5-10 temples first
.\scripts\generate-content-locally.ps1 -TempleCount 10
```

### 2. Use Haiku for Testing
```powershell
# Cheaper for testing
.\scripts\generate-content-locally.ps1 -Model haiku
```

### 3. Use Sonnet for Production
```powershell
# Better quality for users
.\scripts\generate-content-locally.ps1 -Model sonnet
```

### 4. Review Before Deploying
- Check generated content quality
- Edit any inaccuracies
- Ensure cultural sensitivity

### 5. Version Control
```bash
# Commit generated content to Git
git add data/generated-content/
git commit -m "Add AI-generated temple content"
```

---

## Advantages vs. Generating in AWS

| Aspect | Local Generation | AWS Generation |
|--------|-----------------|----------------|
| **Setup** | No deployment needed | Requires AWS deployment |
| **Testing** | Immediate | Need to deploy first |
| **Review** | Easy to review files | Need to query DynamoDB |
| **Editing** | Edit JSON files directly | Need admin portal |
| **Cost** | Same API cost | Same API cost |
| **Speed** | Same generation speed | Same generation speed |
| **Backup** | Local files + Git | DynamoDB only |
| **Iteration** | Fast (no deployment) | Slow (redeploy needed) |

---

## When to Use Each Approach

### Use Local Generation When:
- ✅ Testing Bedrock for the first time
- ✅ Want to review content before publishing
- ✅ Need to edit AI-generated content
- ✅ Want version control of content
- ✅ Haven't deployed to AWS yet

### Use AWS Generation When:
- ✅ Already deployed to AWS
- ✅ Using Admin Portal for content management
- ✅ Need to regenerate specific temples
- ✅ Want admins to generate content via UI

---

## Next Steps After Generation

1. **Review Content**
   - Check quality and accuracy
   - Verify cultural sensitivity
   - Edit if needed

2. **Prepare for Import**
   - Ensure all files are valid JSON
   - Check file naming convention
   - Verify temple IDs match database

3. **Deploy to AWS**
   - Deploy your application
   - Set up DynamoDB tables
   - Import generated content

4. **Test End-to-End**
   - Test mobile app with real content
   - Verify content displays correctly
   - Check audio generation works

---

## Summary

**Recommended Approach**:
1. ✅ Test Bedrock access with sample script
2. ✅ Generate 10 temples locally to verify quality
3. ✅ Generate all temples with Haiku (~$0.60)
4. ✅ Review and edit content
5. ✅ Deploy to AWS
6. ✅ Import content to DynamoDB
7. ✅ (Optional) Regenerate with Sonnet for production

**Total Cost**: $0.60 - $9.20 (one-time)  
**Total Time**: 1-2 hours  
**Result**: All temple content ready before deployment!

---

**Last Updated**: March 3, 2026  
**Script Location**: `scripts/generate-content-locally.ps1`  
**Status**: Ready to use after AWS enables Bedrock access

