# Content Generation Integration Guide

This guide explains how to integrate AI content generation into the Sanaathana Aalaya Charithra application.

## Integration Options

### Option 1: Use Kiro Chat (Development)

During development, you can generate content directly in Kiro chat:

```
Generate audio guide content about the Hanging Pillar at Lepakshi Temple. 
Use sources from ASI documentation, Andhra Pradesh State Archaeology, 
and Agama Shastras on Vijayanagara architecture. Include proper citations.
```

Kiro will generate the content following the guidelines in `docs/AI_CONTENT_GENERATION_PROMPT.md`.

### Option 2: Admin Portal Interface (Recommended)

Add a content generation interface to the Admin Portal:

**Features:**
- Artifact selection dropdown
- Content type selector (Audio Guide, Video Script, Infographic, Q&A)
- Source selection checkboxes
- Language selector
- Generate button
- Preview and edit area
- Approve and publish workflow

**Location:** `admin-portal/src/pages/ContentGenerationPage.tsx`

### Option 3: AWS Bedrock Integration (Production)

For production, integrate with AWS Bedrock for scalable AI content generation.

**Architecture:**
```
Admin Portal → API Gateway → Lambda Function → AWS Bedrock → DynamoDB
```

**Lambda Function:** `src/content-generation/lambdas/generate-content.ts`

**Example API Call:**
```typescript
POST /api/content/generate
{
  "artifactId": "LP-PILLAR-001",
  "contentType": "audio_guide",
  "language": "en",
  "sources": ["asi", "ap_archaeology", "agama_shastras"],
  "wordCount": 400
}
```

### Option 4: OpenAI API Integration (Alternative)

Use OpenAI's API for content generation.

**Environment Variables:**
```
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4
```

**Lambda Function:** `src/content-generation/lambdas/openai-generate.ts`

## Implementation Steps

### Step 1: Create Admin Portal Interface

```bash
# Create new page in Admin Portal
cd admin-portal/src/pages
# Create ContentGenerationPage.tsx
```

**Features to include:**
1. Artifact selector
2. Content type selector
3. Source configuration
4. Generate button
5. Preview area
6. Edit capabilities
7. Source citation display
8. Approve/Reject workflow

### Step 2: Create Backend Lambda

```bash
# Create Lambda function
cd src/content-generation/lambdas
# Create generate-content.ts
```

**Lambda responsibilities:**
1. Receive generation request
2. Load source configuration from `config/content-sources.json`
3. Build prompt using template from `docs/AI_CONTENT_GENERATION_PROMPT.md`
4. Call AI service (Bedrock/OpenAI)
5. Parse and validate response
6. Store in DynamoDB with metadata
7. Return generated content

### Step 3: Set Up AWS Bedrock (Production)

```bash
# Install AWS SDK
npm install @aws-sdk/client-bedrock-runtime

# Configure IAM permissions
# Add Bedrock access to Lambda execution role
```

**Bedrock Models to Use:**
- `anthropic.claude-3-sonnet` - Best for detailed content
- `anthropic.claude-3-haiku` - Fast, cost-effective
- `amazon.titan-text-express` - AWS native option

### Step 4: Create API Endpoints

**API Gateway Routes:**
```
POST   /api/content/generate          - Generate new content
GET    /api/content/{id}               - Get generated content
PUT    /api/content/{id}/approve       - Approve content
PUT    /api/content/{id}/edit          - Edit content
DELETE /api/content/{id}               - Delete content
GET    /api/content/artifact/{id}      - Get all content for artifact
```

## Usage Examples

### Example 1: Generate Audio Guide via Admin Portal

1. Login to Admin Portal
2. Navigate to "Content Generation"
3. Select artifact: "Hanging Pillar"
4. Select content type: "Audio Guide"
5. Select sources: ASI, AP Archaeology, Agama Shastras
6. Set language: English
7. Set word count: 400
8. Click "Generate"
9. Review generated content
10. Edit if needed
11. Click "Approve & Publish"

### Example 2: Generate via API Call

```bash
curl -X POST https://api.sanaathana-aalaya-charithra.org/api/content/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "artifactId": "LP-PILLAR-001",
    "contentType": "audio_guide",
    "language": "en",
    "sources": ["asi", "ap_archaeology", "agama_shastras"],
    "wordCount": 400
  }'
```

### Example 3: Batch Generation Script

```bash
# Generate content for all artifacts
node scripts/batch-generate-content.js \
  --artifacts all \
  --content-type audio_guide \
  --language en,hi,te
```

## Content Review Workflow

```
Generate → Auto-Review → Expert Review → Temple Authority Review → Publish
```

**Auto-Review Checks:**
- Source citations present
- Word count within range
- No prohibited terms
- Proper Sanskrit translations
- Factual consistency

**Expert Review:**
- Historical accuracy
- Architectural terminology
- Cultural sensitivity
- Religious appropriateness

**Temple Authority Review:**
- For sensitive content
- Ritual descriptions
- Deity information

## Cost Estimation

### AWS Bedrock Pricing (Approximate)

**Claude 3 Sonnet:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Average cost per content piece: $0.05 - $0.15

**Monthly Estimate:**
- 100 artifacts × 4 content types = 400 pieces
- Cost: $20 - $60 per month

### OpenAI Pricing (Approximate)

**GPT-4:**
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- Average cost per content piece: $0.50 - $1.50

**Monthly Estimate:**
- 400 pieces × $1.00 = $400 per month

**Recommendation:** Use AWS Bedrock for cost-effectiveness in production.

## Testing

### Test Content Generation Locally

```bash
# Set up test environment
export OPENAI_API_KEY=your-test-key

# Run test generation
npm run test:content-generation

# Generate sample content
npm run generate:sample -- --artifact LP-PILLAR-001
```

### Test Prompts

Use the test prompts in `docs/AI_CONTENT_GENERATION_PROMPT.md` to verify:
- Content quality
- Source citations
- Factual accuracy
- Cultural sensitivity
- Language appropriateness

## Monitoring

**CloudWatch Metrics to Track:**
- Generation requests per day
- Success/failure rate
- Average generation time
- Token usage
- Cost per content piece
- Content approval rate

**Alerts:**
- High failure rate
- Unusual cost spikes
- Long generation times
- Low approval rate

## Security Considerations

1. **API Key Management:**
   - Store in AWS Secrets Manager
   - Rotate regularly
   - Use separate keys for dev/prod

2. **Content Validation:**
   - Scan for inappropriate content
   - Verify source citations
   - Check for plagiarism

3. **Access Control:**
   - Only authorized admins can generate
   - Audit log all generations
   - Require approval before publishing

4. **Rate Limiting:**
   - Limit generations per user
   - Prevent abuse
   - Monitor usage patterns

## Next Steps

1. **Immediate:** Use Kiro chat for content generation during development
2. **Short-term:** Build Admin Portal interface
3. **Medium-term:** Integrate AWS Bedrock for production
4. **Long-term:** Implement full review workflow and automation

---

**Questions?** Contact the development team or refer to:
- `docs/CONTENT_SOURCES.md` - Source guidelines
- `docs/AI_CONTENT_GENERATION_PROMPT.md` - Prompt templates
- `config/content-sources.json` - Source configuration
