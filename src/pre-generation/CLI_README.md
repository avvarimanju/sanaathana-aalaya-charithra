# Content Pre-Generation CLI

Command-line interface for the Content Pre-Generation System that generates all multimedia content (audio guides, videos, infographics, and Q&A knowledge bases) for heritage artifacts.

## Quick Start

```bash
# Generate all content for all artifacts
npm run pre-generate

# Dry run to estimate costs (no actual generation)
npm run pre-generate:dry-run

# Force regeneration of all content (ignore cache)
npm run pre-generate:force
```

## NPM Scripts

The following npm scripts are available in `package.json`:

### `npm run pre-generate`
Runs the CLI with no default flags. You can pass additional arguments using `--`:

```bash
npm run pre-generate -- --languages en,hi --content-types audio_guide
```

### `npm run pre-generate:dry-run`
Runs the CLI in dry-run mode to estimate costs without generating content. Equivalent to:

```bash
npm run pre-generate -- --dry-run
```

### `npm run pre-generate:force`
Runs the CLI with force mode enabled to regenerate all content regardless of cache status. Equivalent to:

```bash
npm run pre-generate -- --force
```

**Note:** All scripts use `ts-node` for direct TypeScript execution without requiring a build step.

## Usage

```bash
npm run pre-generate [-- options]
```

**Note:** When passing options, use `--` to separate npm arguments from CLI arguments.

## Options

### Filtering Options

#### `--temple-groups <groups>`
Filter by temple groups (comma-separated).

```bash
npm run pre-generate -- --temple-groups lepakshi-temple-andhra,thanjavur-temple-tamilnadu
```

#### `--artifact-ids <ids>`
Filter by specific artifact IDs (comma-separated).

```bash
npm run pre-generate -- --artifact-ids hanging-pillar,venkateswara-main-temple
```

#### `--site-ids <ids>`
Filter by site IDs (comma-separated).

```bash
npm run pre-generate -- --site-ids site1,site2
```

#### `--languages <langs>`
Generate content only for specific languages (comma-separated).

**Supported languages:** `en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`, `pa`

```bash
npm run pre-generate -- --languages en,hi,ta
```

#### `--content-types <types>`
Generate only specific content types (comma-separated).

**Supported types:** `audio_guide`, `video`, `infographic`, `qa_knowledge_base`

```bash
npm run pre-generate -- --content-types audio_guide,video
```

### Execution Options

#### `--force`
Force regeneration even if cached content exists (less than 30 days old).

```bash
npm run pre-generate -- --force
```

#### `--dry-run`
Calculate cost estimate without generating content.

```bash
npm run pre-generate -- --dry-run
```

#### `--resume <jobId>`
Resume a previously interrupted job.

```bash
npm run pre-generate -- --resume job-12345
```

### Help

#### `--help` or `-h`
Display help message with all available options.

```bash
npm run pre-generate -- --help
```

## Examples

### Generate all content
```bash
npm run pre-generate
```

### Generate only English and Hindi audio guides
```bash
npm run pre-generate -- --languages en,hi --content-types audio_guide
```

### Generate content for specific temple group
```bash
npm run pre-generate -- --temple-groups lepakshi-temple-andhra
```

### Estimate costs before generation
```bash
npm run pre-generate -- --dry-run
```

### Force regeneration of all content
```bash
npm run pre-generate -- --force
```

### Resume interrupted job
```bash
npm run pre-generate -- --resume job-12345
```

### Combine multiple filters
```bash
npm run pre-generate -- --temple-groups lepakshi-temple-andhra --languages en,hi --content-types audio_guide,video
```

## Real-Time Progress

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

## Cost Approval

Before generation begins, the CLI displays a cost estimate and requires confirmation:

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

## Exit Codes

- `0`: Success (all items succeeded or were skipped)
- `1`: Failure (some items failed or validation errors)

## Error Handling

The CLI handles errors gracefully:

- **Invalid arguments**: Displays error message and usage information
- **Validation failures**: Lists all validation errors before exiting
- **Generation failures**: Continues processing remaining items and generates failure report
- **Fatal errors**: Displays error message and stack trace

## Output

The CLI generates several output files:

- **Summary Report**: `reports/summary-{timestamp}.json`
- **Cost Report**: `reports/cost-{timestamp}.json`
- **Detailed Log**: `reports/detailed-{timestamp}.log`
- **Failure Report**: `reports/failures-{timestamp}.json` (if any failures)
- **Verification Report**: `reports/verification-{timestamp}.json`

## Configuration

The CLI uses configuration from `config/pre-generation.yaml`. You can customize:

- AWS region and service settings
- Rate limits for AWS services
- Retry configuration
- Validation rules
- Output formats and directories

See `config/pre-generation.yaml` for all available options.

## Troubleshooting

### "Unknown option" error
Make sure to use `--` to separate npm arguments from CLI arguments:
```bash
npm run pre-generate -- --languages en,hi
```

### "Invalid language code" error
Check that language codes are valid: `en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`, `pa`

### "Invalid content type" error
Check that content types are valid: `audio_guide`, `video`, `infographic`, `qa_knowledge_base`

### Generation fails with throttling errors
The system automatically handles throttling with exponential backoff. If issues persist, reduce rate limits in `config/pre-generation.yaml`.

### Progress not persisting
Check that DynamoDB table exists and IAM permissions are correct.

## Requirements

- Node.js 18+
- AWS credentials configured (via environment variables or AWS CLI)
- Access to S3 bucket and DynamoDB tables
- Sufficient AWS service quotas for Bedrock, Polly, S3, and DynamoDB

## Related Documentation

- [Pre-Generation System Overview](./README.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Operational Runbook](./RUNBOOK.md)
- [Architecture Documentation](../../docs/DEPLOYMENT_ARCHITECTURE.md)
