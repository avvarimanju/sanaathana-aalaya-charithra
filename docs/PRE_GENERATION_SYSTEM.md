# Content Pre-Generation System

## Overview

The Content Pre-Generation System is a batch processing tool that generates all multimedia content (audio guides, videos, infographics, and Q&A knowledge bases) for the Sanaathana Aalaya Charithra heritage platform. By pre-generating content for all 49 artifacts across 14 temple groups in 10 supported Indian languages, the system eliminates on-demand generation costs during user interactions, reducing ongoing AWS operational costs by 80-90%.

### Key Benefits

- **Cost Reduction**: One-time generation cost (~₹5,560) vs. ongoing per-user costs (~₹3.81 per interaction)
- **Performance**: Instant content delivery from cache instead of 30-60 second generation delays
- **Reliability**: Pre-validated content ensures quality before platform launch
- **Scalability**: Supports thousands of concurrent users without generation bottlenecks

### System Capabilities

- ✅ Automatic artifact discovery from seed data (49 artifacts across 14 temple groups)
- ✅ Multi-language content generation (10 Indian languages)
- ✅ Complete content type coverage (audio, video, infographic, Q&A)
- ✅ Cost estimation before execution
- ✅ Progress tracking and resumption after interruption
- ✅ Rate limiting and retry logic for AWS service quotas
- ✅ Content quality validation
- ✅ S3 storage and DynamoDB caching
- ✅ Round-trip verification of stored content
- ✅ Comprehensive reporting (summary, cost, failures, verification)
- ✅ Both local and Lambda execution modes
- ✅ Idempotent execution (safe to re-run)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Pre-Generation Orchestrator                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Config     │  │   Progress   │  │     Cost     │          │
│  │   Loader     │  │   Tracker    │  │  Estimator   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Artifact Loader                             │
│  • Reads seed data configuration                                 │
│  • Validates 49 artifacts across 14 temple groups                │
│  • Extracts artifact metadata                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Content Generator Orchestrator                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Rate     │  │   Content    │  │   Retry      │          │
│  │   Limiter    │  │  Validator   │  │   Handler    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  AWS Bedrock     │  │  AWS Polly   │  │  Content     │
│  (AI Content)    │  │  (Audio TTS) │  │  Validator   │
└──────────────────┘  └──────────────┘  └──────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │      Amazon S3           │  │     DynamoDB             │    │
│  │  • Content files         │  │  • Content metadata      │    │
│  │  • Versioning enabled    │  │  • Progress state        │    │
│  │  • Encryption at rest    │  │  • Generation history    │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Configuration Loader
Loads and validates configuration from `config/pre-generation.yaml`:
- AWS region and service settings
- Rate limits for AWS services
- Retry configuration (max attempts, backoff strategy)
- Validation rules for content quality
- Output formats and directories

#### 2. Artifact Loader
Discovers and loads artifact definitions:
- Reads from `scripts/seed-data.ts`
- Validates exactly 49 artifacts across 14 temple groups
- Extracts metadata: ID, name, temple group, description, historical context
- Supports filtering by temple group, artifact ID, or site ID

#### 3. Progress Tracker
Tracks generation progress for resumption:
- Persists progress after each item completion
- Supports both local file storage and DynamoDB
- Calculates real-time statistics (completed, failed, skipped, remaining)
- Enables resumption of interrupted jobs

#### 4. Cost Estimator
Calculates expected AWS service costs:
- Bedrock API costs (based on token estimates)
- Polly TTS costs (based on character count)
- S3 storage and request costs
- DynamoDB write costs
- Displays breakdown by service and content type
- Requires user confirmation before proceeding

#### 5. Rate Limiter
Manages API request throttling:
- Token bucket algorithm per AWS service
- Enforces limits: Bedrock (10 req/sec), Polly (100 req/sec)
- Exponential backoff with jitter on throttling errors
- Prevents service quota violations

#### 6. Content Validator
Validates generated content quality:
- **Audio**: Valid format, non-zero duration, language detection
- **Video**: Valid format, expected dimensions, contains frames
- **Infographic**: Valid image, minimum resolution, visual elements
- **Q&A**: Minimum 5 question-answer pairs, valid JSON structure

#### 7. Storage Manager
Handles S3 and DynamoDB operations:
- Uploads content to S3 with structured key format
- Creates DynamoDB cache entries with metadata
- Sets appropriate cache TTL (30 days default)
- Performs round-trip verification of stored content

#### 8. Content Generators
Specialized generators for each content type:
- **Audio Guide Generator**: Uses AWS Polly for text-to-speech (MP3, 60-180s)
- **Video Generator**: Uses AWS Bedrock for AI-generated video (MP4, 1920x1080, 120-300s)
- **Infographic Generator**: Uses AWS Bedrock for AI-generated infographics (PNG, 1920x1080)
- **Q&A Generator**: Uses AWS Bedrock to generate question-answer pairs (JSON, 5-20 pairs)

#### 9. Report Generator
Generates comprehensive reports:
- **Summary Report**: Total items, succeeded, failed, skipped, duration
- **Cost Report**: Estimated vs actual costs by service
- **Detailed Log**: Timestamps, artifact IDs, languages, content types, status
- **Failure Report**: Error messages and recommended actions
- **Verification Report**: Confirms all content is retrievable

## Configuration

### Configuration File

The system uses `config/pre-generation.yaml` for configuration:

```yaml
aws:
  region: us-east-1
  s3:
    bucket: sanaathana-aalaya-charithra-content-${AWS_ACCOUNT_ID}-${AWS_REGION}
    encryption: AES256
  dynamodb:
    progressTable: PreGenerationProgress
    cacheTable: ContentCache
  bedrock:
    modelId: anthropic.claude-3-sonnet-20240229-v1:0
    maxTokens: 2048
    temperature: 0.7
  polly:
    engine: neural
    voiceMapping:
      en: Joanna
      hi: Aditi

generation:
  languages:
    - en
    - hi
    - ta
    - te
    - bn
    - mr
    - gu
    - kn
    - ml
    - pa
  contentTypes:
    - audio_guide
    - video
    - infographic
    - qa_knowledge_base
  forceRegenerate: false
  skipExisting: true
  cacheMaxAge: 2592000  # 30 days in seconds

rateLimits:
  bedrock: 10  # requests per second
  polly: 100
  s3: 3500
  dynamodb: 1000

retry:
  maxAttempts: 3
  initialDelay: 1000  # milliseconds
  maxDelay: 30000
  backoffMultiplier: 2
  jitter: true

validation:
  audio:
    minDuration: 30  # seconds
    maxDuration: 300
  video:
    minDuration: 60
    maxDuration: 600
    expectedDimensions:
      width: 1920
      height: 1080
  infographic:
    minResolution:
      width: 1200
      height: 800
  qaKnowledgeBase:
    minQuestionCount: 5

execution:
  mode: local  # local | lambda
  batchSize: 10  # for Lambda mode
  maxConcurrency: 5
  timeout: 300000  # 5 minutes in milliseconds

reporting:
  outputDir: ./reports
  formats:
    - json
    - csv
    - html
```

### Environment Variables

The system supports environment variable overrides:

- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_PROFILE`: AWS credentials profile
- `S3_BUCKET`: Content storage bucket name
- `DYNAMODB_PROGRESS_TABLE`: Progress tracking table name
- `DYNAMODB_CACHE_TABLE`: Content cache table name
- `BATCH_SIZE`: Items per Lambda invocation (default: 10)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)

## CLI Usage

### Quick Start

```bash
# Generate all content for all artifacts
npm run pre-generate

# Dry run to estimate costs (no actual generation)
npm run pre-generate:dry-run

# Force regeneration of all content (ignore cache)
npm run pre-generate:force
```

### Command-Line Options

#### Filtering Options

```bash
# Filter by temple groups
npm run pre-generate -- --temple-groups lepakshi-temple-andhra,thanjavur-temple-tamilnadu

# Filter by specific artifact IDs
npm run pre-generate -- --artifact-ids hanging-pillar,venkateswara-main-temple

# Filter by languages (en, hi, ta, te, bn, mr, gu, kn, ml, pa)
npm run pre-generate -- --languages en,hi,ta

# Filter by content types (audio_guide, video, infographic, qa_knowledge_base)
npm run pre-generate -- --content-types audio_guide,video
```

#### Execution Options

```bash
# Force regeneration even if cached content exists
npm run pre-generate -- --force

# Calculate cost estimate without generating content
npm run pre-generate -- --dry-run

# Resume a previously interrupted job
npm run pre-generate -- --resume job-12345
```

#### Combined Filters

```bash
# Generate only English and Hindi audio guides for specific temple
npm run pre-generate -- \
  --temple-groups lepakshi-temple-andhra \
  --languages en,hi \
  --content-types audio_guide
```

### Real-Time Progress

The CLI displays real-time progress during generation:

```
╔════════════════════════════════════════════════════════════════╗
║     Content Pre-Generation System                              ║
║     Sanaathana Aalaya Charithra Heritage Platform             ║
╚════════════════════════════════════════════════════════════════╝

✅ Pre-Generation Orchestrator initialized
   Execution Mode: local
   AWS Region: us-east-1
   S3 Bucket: sanaathana-aalaya-charithra-content-...

▶️  Mode: Normal Generation

📊 Progress: 45/196 items (23%)
   ✅ Succeeded: 42
   ⏭️  Skipped: 3
   ❌ Failed: 0
   ⏱️  Elapsed: 5m 23s
   ⏱️  Remaining: ~18m 12s
```

### Cost Approval

Before generation begins, the CLI displays a cost estimate:

```
💰 Cost Estimate:
   Bedrock API: ₹4,234.50
   Polly TTS: ₹567.80
   S3 Storage: ₹12.30
   DynamoDB: ₹8.90
   ─────────────────────
   Total: ₹4,823.50

⏱️  Estimated Duration: 2h 15m

Do you want to proceed? (yes/no):
```

## Lambda Deployment

### Deployment Process

The system supports AWS Lambda execution for serverless batch processing:

```bash
# Full deployment (build + bundle + deploy)
npm run deploy:pre-generation

# Verify existing deployment
npm run deploy:pre-generation:verify
```

### Lambda Configuration

- **Runtime**: Node.js 18.x
- **Memory**: 1024 MB
- **Timeout**: 5 minutes (300 seconds)
- **Handler**: pre-generation.handler
- **Batch Size**: 10 items per invocation (configurable)

### Lambda Invocation

```bash
# Test invocation with small batch
aws lambda invoke \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --payload '{"mode":"batch","jobId":"test-job-001","batchSize":5}' \
  --region us-east-1 \
  response.json

# Production invocation
aws lambda invoke \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --payload '{
    "mode": "batch",
    "jobId": "prod-job-20240101",
    "batchSize": 10,
    "forceRegenerate": false,
    "languages": ["en", "hi", "ta"],
    "contentTypes": ["audio_guide", "video", "infographic", "qa_knowledge_base"]
  }' \
  --region us-east-1 \
  response.json
```

### Lambda Timeout Handling

The Lambda function automatically handles timeout limits:
1. Processes items in batches (default: 10 items)
2. Updates progress in DynamoDB after each batch
3. Invokes next Lambda if more items remain and time allows
4. Continues until all items are processed

## Data Models

### S3 Key Structure

Content is stored in S3 with a structured key format:

```
Format: {templeGroup}/{artifactId}/{language}/{contentType}/{timestamp}.{extension}

Examples:
- lepakshi-temple-andhra/hanging-pillar/en/audio_guide/1704067200000.mp3
- tirumala-tirupati-andhra/venkateswara-main-temple/hi/video/1704067200000.mp4
- halebidu-temple-karnataka/hoysaleswara-sculpture/ta/infographic/1704067200000.png
- thanjavur-temple-tamilnadu/brihadeeswarar-tower/te/qa_knowledge_base/1704067200000.json
```

### DynamoDB Schema

#### Content Cache Table

```typescript
{
  cacheKey: string;              // PK: {siteId}#{artifactId}#{language}#{contentType}
  siteId: string;
  artifactId: string;
  language: string;
  contentType: string;
  s3Key: string;
  s3Bucket: string;
  cdnUrl: string;
  contentHash: string;
  fileSize: number;
  mimeType: string;
  generatedAt: string;
  generationJobId: string;
  version: string;
  ttl: number;                   // 30 days default
  createdAt: string;
  updatedAt: string;
}
```

#### Progress Tracking Table

```typescript
{
  jobId: string;                 // PK
  itemKey: string;               // SK: {artifactId}#{language}#{contentType}
  artifactId: string;
  siteId: string;
  artifactName: string;
  language: string;
  contentType: string;
  status: string;                // pending | in_progress | completed | failed | skipped
  s3Key?: string;
  cdnUrl?: string;
  contentHash?: string;
  fileSize?: number;
  error?: string;
  retryCount: number;
  startTime?: string;
  completionTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  ttl?: number;                  // Auto-expire after 90 days
}
```

## Supported Languages

| Code | Language | Polly Voice | Script |
|------|----------|-------------|--------|
| en | English | Joanna (Neural) | Latin |
| hi | Hindi | Aditi (Neural) | Devanagari |
| ta | Tamil | Standard | Tamil |
| te | Telugu | Standard | Telugu |
| bn | Bengali | Standard | Bengali |
| mr | Marathi | Standard | Devanagari |
| gu | Gujarati | Standard | Gujarati |
| kn | Kannada | Standard | Kannada |
| ml | Malayalam | Standard | Malayalam |
| pa | Punjabi | Standard | Gurmukhi |

## Content Type Specifications

### Audio Guide
- **Format**: MP3, 128 kbps
- **Duration**: 60-180 seconds
- **Sample rate**: 44.1 kHz
- **Channels**: Mono
- **Generator**: AWS Polly (Neural TTS)

### Video
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (1080p)
- **Frame rate**: 30 fps
- **Bitrate**: 5 Mbps
- **Duration**: 120-300 seconds
- **Generator**: AWS Bedrock (Claude 3 Sonnet)

### Infographic
- **Format**: PNG
- **Resolution**: 1920x1080 minimum
- **Color depth**: 24-bit
- **Compression**: Lossless
- **Generator**: AWS Bedrock (Claude 3 Sonnet)

### Q&A Knowledge Base
- **Format**: JSON
- **Structure**: Array of {question, answer, confidence, sources}
- **Minimum**: 5 question-answer pairs
- **Maximum**: 20 question-answer pairs
- **Generator**: AWS Bedrock (Claude 3 Sonnet)

## Error Handling

### Error Categories

1. **Transient Errors** (Retry with backoff)
   - Network timeouts
   - Service throttling (429)
   - Temporary service unavailability (503)
   - Rate limit exceeded

2. **Validation Errors** (Retry up to 3 times)
   - Invalid content format
   - Content too short/long
   - Language mismatch
   - Missing required elements

3. **Permanent Errors** (Log and skip)
   - Invalid artifact metadata
   - Missing required fields
   - Unsupported language/content type
   - Authentication/authorization failures

4. **Critical Errors** (Abort job)
   - AWS credentials invalid
   - S3 bucket not accessible
   - DynamoDB table not found
   - Configuration file invalid

### Retry Strategy

The system implements exponential backoff with jitter:

```
Attempt 1: 1 second delay
Attempt 2: 2 seconds delay (+ random jitter)
Attempt 3: 4 seconds delay (+ random jitter)
Max delay: 30 seconds
```

After 3 failed attempts, the item is marked as failed and processing continues with remaining items.

## Cost Estimation

### Pricing Assumptions (2024)

- **Bedrock Claude 3 Sonnet**: $0.003 per 1K input tokens, $0.015 per 1K output tokens
- **Polly Neural TTS**: $16 per 1M characters
- **S3 Storage**: $0.023 per GB/month
- **S3 PUT requests**: $0.005 per 1K requests
- **DynamoDB**: $1.25 per million write requests

### Example Cost Calculation

For 49 artifacts × 10 languages × 4 content types = 1,960 items:

| Service | Cost per Item | Total Cost |
|---------|---------------|------------|
| Bedrock | $0.03 | $58.80 |
| Polly | $0.016 | $7.84 |
| S3 Storage | - | $0.09/month |
| S3 Requests | - | $0.01 |
| DynamoDB | - | $0.005 |
| **Total** | | **~$66.74 USD (~₹5,560 INR)** |

This is a one-time cost that eliminates ongoing generation costs of ~$0.03 per user interaction, saving 80-90% of operational costs.

## Output Reports

The system generates several output files in the `reports/` directory:

### Summary Report
`reports/summary-{timestamp}.json`

```json
{
  "jobId": "job-20240101-120000",
  "startTime": "2024-01-01T12:00:00Z",
  "endTime": "2024-01-01T14:15:00Z",
  "duration": 8100000,
  "totalItems": 1960,
  "succeeded": 1955,
  "failed": 2,
  "skipped": 3,
  "estimatedCost": 5560.00,
  "actualCost": 5542.30
}
```

### Cost Report
`reports/cost-{timestamp}.json`

```json
{
  "estimated": {
    "bedrockCost": 4234.50,
    "pollyCost": 567.80,
    "s3StorageCost": 12.30,
    "dynamoDBCost": 8.90,
    "totalCost": 4823.50
  },
  "actual": {
    "bedrockCost": 4220.15,
    "pollyCost": 565.40,
    "s3StorageCost": 12.30,
    "dynamoDBCost": 8.90,
    "totalCost": 4806.75
  }
}
```

### Failure Report
`reports/failures-{timestamp}.json`

```json
{
  "failures": [
    {
      "artifactId": "hanging-pillar",
      "language": "ta",
      "contentType": "video",
      "error": "Validation failed: video duration too short",
      "retryCount": 3,
      "timestamp": "2024-01-01T13:45:00Z",
      "recommendedAction": "Review artifact metadata for completeness"
    }
  ]
}
```

### Verification Report
`reports/verification-{timestamp}.json`

```json
{
  "totalItems": 1960,
  "verified": 1958,
  "failed": 2,
  "verificationDetails": [
    {
      "artifactId": "hanging-pillar",
      "language": "en",
      "contentType": "audio_guide",
      "s3Key": "lepakshi-temple-andhra/hanging-pillar/en/audio_guide/1704067200000.mp3",
      "verified": true,
      "contentHash": "abc123..."
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### "Unknown option" error
Make sure to use `--` to separate npm arguments from CLI arguments:
```bash
npm run pre-generate -- --languages en,hi
```

#### "Invalid language code" error
Check that language codes are valid: `en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`, `pa`

#### "Invalid content type" error
Check that content types are valid: `audio_guide`, `video`, `infographic`, `qa_knowledge_base`

#### Generation fails with throttling errors
The system automatically handles throttling with exponential backoff. If issues persist, reduce rate limits in `config/pre-generation.yaml`.

#### Progress not persisting
Check that DynamoDB table exists and IAM permissions are correct.

#### S3 upload fails
Check IAM permissions. Ensure the role has `s3:PutObject` permission for the content bucket.

#### Content validation fails repeatedly
Check artifact metadata quality. May need manual review of artifact descriptions and historical context.

## Requirements

### Software Requirements

- Node.js 18+
- TypeScript 5+
- AWS CLI configured with credentials
- AWS CDK CLI (for Lambda deployment)

### AWS Requirements

- AWS account with appropriate permissions
- S3 bucket for content storage
- DynamoDB tables: `PreGenerationProgress`, `ContentCache`
- IAM role with permissions for Bedrock, Polly, S3, DynamoDB, Lambda

### AWS Service Quotas

Ensure sufficient quotas for:
- Bedrock: 10 requests/second minimum
- Polly: 100 requests/second minimum
- S3: Standard quotas (3500 requests/second)
- DynamoDB: On-demand mode (no quota concerns)

## Related Documentation

- [CLI Usage Guide](../src/pre-generation/CLI_README.md) - Detailed CLI command reference
- [Lambda Deployment Guide](./PRE_GENERATION_LAMBDA_DEPLOYMENT.md) - AWS Lambda deployment instructions
- [Operational Runbook](./PRE_GENERATION_RUNBOOK.md) - Operational procedures and troubleshooting
- [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md) - Overall system architecture
- [Cost Tracking](./ACTUAL_COST_TRACKING.md) - Actual cost tracking and analysis

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs for error details
3. Check the operational runbook for common scenarios
4. Contact the development team

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0
