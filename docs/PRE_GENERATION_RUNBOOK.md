# Content Pre-Generation System - Operational Runbook

## Table of Contents

- [Overview](#overview)
- [Initial Generation Process](#initial-generation-process)
- [Content Update Process](#content-update-process)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Emergency Procedures](#emergency-procedures)
- [Maintenance Tasks](#maintenance-tasks)
- [Performance Optimization](#performance-optimization)
- [Cost Management](#cost-management)
- [Appendix](#appendix)

## Overview

This operational runbook provides step-by-step procedures for operating the Content Pre-Generation System. It covers initial generation before platform launch, ongoing content updates, monitoring, troubleshooting, and emergency procedures.

### System Purpose

The Content Pre-Generation System generates all multimedia content (audio guides, videos, infographics, Q&A knowledge bases) for 49 heritage artifacts across 14 temple groups in 10 Indian languages. This eliminates on-demand generation costs and ensures instant content delivery.

### Key Metrics

- **Total Items**: 1,960 (49 artifacts × 10 languages × 4 content types)
- **Estimated Cost**: ~₹5,560 INR (~$66.74 USD) one-time
- **Estimated Duration**: 2-4 hours (depending on rate limits)
- **Storage Required**: ~4 GB in S3
- **Cache Entries**: 1,960 DynamoDB records

### Roles and Responsibilities

- **Platform Administrator**: Initiates generation, monitors progress, reviews reports
- **DevOps Engineer**: Deploys Lambda function, configures monitoring, manages AWS resources
- **Content Manager**: Reviews generated content quality, identifies artifacts needing updates
- **On-Call Engineer**: Responds to alerts, troubleshoots failures

## Initial Generation Process

### Pre-Launch Checklist

Before running the initial generation (before platform launch):


#### 1. Verify Prerequisites

```bash
# Check Node.js version (18+ required)
node --version

# Check AWS CLI configuration
aws sts get-caller-identity

# Verify AWS credentials have necessary permissions
aws iam get-user

# Check S3 bucket exists
aws s3 ls s3://sanaathana-aalaya-charithra-content-${AWS_ACCOUNT_ID}-${AWS_REGION}/

# Check DynamoDB tables exist
aws dynamodb describe-table --table-name SanaathanaAalayaCharithra-PreGenerationProgress
aws dynamodb describe-table --table-name SanaathanaAalayaCharithra-ContentCache
```

#### 2. Review Configuration

```bash
# Review configuration file
cat config/pre-generation.yaml

# Verify rate limits are appropriate
# Verify AWS region is correct
# Verify S3 bucket name is correct
# Verify DynamoDB table names are correct
```

#### 3. Run Dry Run

```bash
# Estimate costs without generating content
npm run pre-generate:dry-run
```

**Expected Output:**
```
💰 Cost Estimate:
   Bedrock API: ₹4,234.50
   Polly TTS: ₹567.80
   S3 Storage: ₹12.30
   DynamoDB: ₹8.90
   ─────────────────────
   Total: ₹4,823.50

⏱️  Estimated Duration: 2h 15m

Total Items: 1,960
- 49 artifacts
- 10 languages
- 4 content types
```

**Action**: Review and approve the cost estimate with stakeholders.

#### 4. Start Initial Generation

```bash
# Start full generation for all artifacts
npm run pre-generate
```

**Confirmation Prompt:**
```
Do you want to proceed? (yes/no): yes
```

#### 5. Monitor Progress

The CLI displays real-time progress:

```
📊 Progress: 245/1960 items (12.5%)
   ✅ Succeeded: 240
   ⏭️  Skipped: 5
   ❌ Failed: 0
   ⏱️  Elapsed: 15m 23s
   ⏱️  Remaining: ~1h 48m
```

**Monitoring Actions:**
- Watch for increasing failure count (investigate if >5%)
- Monitor elapsed time vs estimated time
- Check AWS CloudWatch for service throttling
- Monitor AWS costs in Cost Explorer

#### 6. Handle Interruptions

If the process is interrupted (network failure, system restart):

```bash
# List available jobs to resume
ls .pre-generation/progress-*.json

# Resume the most recent job
npm run pre-generate -- --resume job-20240101-120000
```

The system will:
- Load progress state from the last checkpoint
- Skip already completed items
- Continue from where it left off

#### 7. Review Completion Reports

After generation completes, review the generated reports:

```bash
# List generated reports
ls reports/

# View summary report
cat reports/summary-20240101-120000.json

# View cost report
cat reports/cost-20240101-120000.json

# View failure report (if any failures)
cat reports/failures-20240101-120000.json

# View verification report
cat reports/verification-20240101-120000.json
```

**Key Metrics to Review:**
- **Success Rate**: Should be >95% (succeeded / total items)
- **Cost Accuracy**: Actual cost should be within 10% of estimate
- **Verification**: All items should be verified as retrievable
- **Failures**: Review failure report for patterns

#### 8. Verify Content Quality

Randomly sample generated content:

```bash
# Download sample audio guide
aws s3 cp s3://bucket-name/lepakshi-temple-andhra/hanging-pillar/en/audio_guide/1704067200000.mp3 ./sample-audio.mp3

# Play audio to verify quality
# Check duration, clarity, language correctness

# Download sample infographic
aws s3 cp s3://bucket-name/lepakshi-temple-andhra/hanging-pillar/en/infographic/1704067200000.png ./sample-infographic.png

# View infographic to verify quality
# Check resolution, visual elements, text readability
```

**Quality Checklist:**
- [ ] Audio is clear and in correct language
- [ ] Audio duration is appropriate (60-180 seconds)
- [ ] Video plays correctly and has expected resolution
- [ ] Infographic is visually appealing and informative
- [ ] Q&A knowledge base has relevant questions and accurate answers

#### 9. Update Documentation

Document the generation run:

```bash
# Create generation log entry
echo "Initial Generation - $(date)" >> docs/generation-log.md
echo "Job ID: job-20240101-120000" >> docs/generation-log.md
echo "Total Items: 1960" >> docs/generation-log.md
echo "Succeeded: 1955" >> docs/generation-log.md
echo "Failed: 5" >> docs/generation-log.md
echo "Cost: ₹5,542.30" >> docs/generation-log.md
echo "Duration: 2h 15m" >> docs/generation-log.md
echo "" >> docs/generation-log.md
```

#### 10. Post-Generation Checklist

- [ ] All reports reviewed and archived
- [ ] Failure report analyzed (if any failures)
- [ ] Sample content quality verified
- [ ] Cost tracking updated
- [ ] Documentation updated
- [ ] Stakeholders notified of completion
- [ ] Platform ready for launch

### Initial Generation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Prerequisites | 30 min | Verify setup, review configuration |
| Dry Run | 5 min | Estimate costs and duration |
| Approval | Variable | Stakeholder approval of costs |
| Generation | 2-4 hours | Full content generation |
| Verification | 30 min | Review reports and sample content |
| Documentation | 15 min | Update logs and documentation |
| **Total** | **3-5 hours** | End-to-end process |

## Content Update Process

### When to Update Content

Update content when:
- Artifact metadata is corrected or enhanced
- New historical information is discovered
- Content quality issues are reported by users
- Language translations are improved
- Platform features require new content formats

### Selective Update Procedure

#### 1. Identify Artifacts to Update

```bash
# List artifacts that need updates
# Example: Update hanging-pillar artifact in all languages

ARTIFACT_IDS="hanging-pillar,venkateswara-main-temple"
```

#### 2. Run Dry Run for Updates

```bash
# Estimate cost for selective update
npm run pre-generate -- \
  --artifact-ids $ARTIFACT_IDS \
  --force \
  --dry-run
```

**Expected Output:**
```
💰 Cost Estimate:
   Bedrock API: ₹172.44 (2 artifacts × 10 languages × 4 types)
   Polly TTS: ₹23.12
   S3 Storage: ₹0.50
   DynamoDB: ₹0.36
   ─────────────────────
   Total: ₹196.42

⏱️  Estimated Duration: 15m

Total Items: 80 (2 artifacts × 10 languages × 4 types)
```

#### 3. Execute Selective Update

```bash
# Force regeneration for specific artifacts
npm run pre-generate -- \
  --artifact-ids $ARTIFACT_IDS \
  --force
```

**Note**: The `--force` flag ensures content is regenerated even if cached content exists.

#### 4. Verify Updates

```bash
# Check DynamoDB cache for updated timestamps
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --key-condition-expression "begins_with(cacheKey, :artifactId)" \
  --expression-attribute-values '{":artifactId":{"S":"site1#hanging-pillar"}}' \
  --region us-east-1

# Verify new content in S3
aws s3 ls s3://bucket-name/lepakshi-temple-andhra/hanging-pillar/ --recursive
```

### Language-Specific Updates

Update content for specific languages only:

```bash
# Update only Hindi and Tamil content for all artifacts
npm run pre-generate -- \
  --languages hi,ta \
  --force
```

### Content Type-Specific Updates

Update specific content types only:

```bash
# Regenerate only audio guides for all artifacts
npm run pre-generate -- \
  --content-types audio_guide \
  --force
```

### Combined Filters

```bash
# Update audio guides and videos for specific temple group in English and Hindi
npm run pre-generate -- \
  --temple-groups lepakshi-temple-andhra \
  --languages en,hi \
  --content-types audio_guide,video \
  --force
```

### Update Verification Checklist

- [ ] Dry run completed and costs approved
- [ ] Update executed successfully
- [ ] DynamoDB cache entries updated with new timestamps
- [ ] S3 objects updated with new content
- [ ] Sample content quality verified
- [ ] No user-facing disruption (versioning ensures smooth transition)
- [ ] Documentation updated with update details

## Monitoring and Alerting

### Real-Time Monitoring

#### Local Execution Monitoring

When running locally, monitor through CLI output:

```
📊 Progress: 245/1960 items (12.5%)
   ✅ Succeeded: 240
   ⏭️  Skipped: 5
   ❌ Failed: 0
   ⏱️  Elapsed: 15m 23s
   ⏱️  Remaining: ~1h 48m
```

**Key Indicators:**
- **Success Rate**: Should remain >95%
- **Failure Count**: Investigate if >10 failures
- **Time Remaining**: Should decrease linearly
- **Skipped Count**: Expected if re-running without --force

#### Lambda Execution Monitoring

When running in Lambda mode, monitor through CloudWatch:

```bash
# View Lambda logs in real-time
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-PreGeneration \
  --follow \
  --region us-east-1

# View logs for specific time range
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-PreGeneration \
  --since 1h \
  --region us-east-1
```

### CloudWatch Metrics

Monitor the following CloudWatch metrics:

#### Lambda Metrics

- **Invocations**: Number of Lambda invocations
  - **Expected**: ~196 invocations (1960 items / 10 batch size)
  - **Alert**: If invocations stop unexpectedly

- **Duration**: Execution time per invocation
  - **Expected**: 200-280 seconds per invocation
  - **Alert**: If duration approaches timeout (300 seconds)

- **Errors**: Number of failed invocations
  - **Expected**: 0
  - **Alert**: If errors > 0

- **Throttles**: Number of throttled invocations
  - **Expected**: 0
  - **Alert**: If throttles > 0

#### Custom Metrics

The system publishes custom metrics to CloudWatch:

- **PreGeneration.ItemsProcessed**: Count of items processed
- **PreGeneration.ItemsSucceeded**: Count of successful items
- **PreGeneration.ItemsFailed**: Count of failed items
- **PreGeneration.ItemsSkipped**: Count of skipped items (cached)
- **PreGeneration.ProcessingDuration**: Time per item (milliseconds)
- **PreGeneration.BedrockCost**: Estimated Bedrock cost (USD)
- **PreGeneration.PollyCost**: Estimated Polly cost (USD)

### CloudWatch Alarms

Set up the following CloudWatch alarms:

#### High Failure Rate Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name PreGeneration-HighFailureRate \
  --alarm-description "Alert when failure rate exceeds 10%" \
  --metric-name PreGeneration.ItemsFailed \
  --namespace PreGeneration \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

#### Lambda Timeout Approaching Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name PreGeneration-LambdaTimeoutApproaching \
  --alarm-description "Alert when Lambda duration approaches timeout" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=SanaathanaAalayaCharithra-PreGeneration \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 270000 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

#### Cost Exceeding Estimate Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name PreGeneration-CostExceedingEstimate \
  --alarm-description "Alert when actual cost exceeds estimate by 20%" \
  --metric-name PreGeneration.BedrockCost \
  --namespace PreGeneration \
  --statistic Sum \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

### Progress Tracking

#### Check Progress in DynamoDB

```bash
# Query progress for specific job
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress \
  --key-condition-expression "jobId = :jobId" \
  --expression-attribute-values '{":jobId":{"S":"job-20240101-120000"}}' \
  --region us-east-1

# Count completed items
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress \
  --index-name JobIdStatusIndex \
  --key-condition-expression "jobId = :jobId AND #status = :status" \
  --expression-attribute-names '{"#status":"status"}' \
  --expression-attribute-values '{":jobId":{"S":"job-20240101-120000"},":status":{"S":"completed"}}' \
  --select COUNT \
  --region us-east-1
```

#### Check Cache Entries

```bash
# Count total cache entries
aws dynamodb scan \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --select COUNT \
  --region us-east-1

# Query cache entries for specific artifact
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --key-condition-expression "begins_with(cacheKey, :prefix)" \
  --expression-attribute-values '{":prefix":{"S":"site1#hanging-pillar"}}' \
  --region us-east-1
```

### Cost Monitoring

#### AWS Cost Explorer

Monitor costs in AWS Cost Explorer:

1. Navigate to AWS Cost Explorer in AWS Console
2. Filter by service: Bedrock, Polly, S3, DynamoDB, Lambda
3. Group by: Service, Usage Type
4. Time range: Last 7 days

**Expected Costs:**
- **Bedrock**: ~$58.80 for full generation
- **Polly**: ~$7.84 for full generation
- **S3**: ~$0.09/month for storage
- **DynamoDB**: ~$0.005 for writes
- **Lambda**: ~$19.60 for full generation (if using Lambda mode)

#### Cost Tracking Script

```bash
# Get estimated costs from CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace PreGeneration \
  --metric-name BedrockCost \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```


## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Generation Fails with Throttling Errors

**Symptoms:**
```
Error: ThrottlingException: Rate exceeded for Bedrock API
```

**Root Cause:** AWS service rate limits exceeded

**Solution:**
1. The system automatically handles throttling with exponential backoff
2. If throttling persists, reduce rate limits in configuration:

```yaml
# config/pre-generation.yaml
rateLimits:
  bedrock: 5  # Reduce from 10 to 5 requests/second
```

3. Resume the job after configuration change:
```bash
npm run pre-generate -- --resume job-20240101-120000
```

**Prevention:** Start with conservative rate limits and increase gradually

---

#### Issue 2: Content Validation Fails Repeatedly

**Symptoms:**
```
Error: Validation failed: audio duration too short (25 seconds, minimum 30)
```

**Root Cause:** Generated content doesn't meet quality standards

**Solution:**
1. Review artifact metadata for completeness:
```bash
# Check artifact metadata in seed data
cat scripts/seed-data.ts | grep -A 20 "hanging-pillar"
```

2. Ensure artifact has sufficient description and historical context
3. If metadata is incomplete, update seed data and re-run:
```bash
npm run pre-generate -- --artifact-ids hanging-pillar --force
```

**Prevention:** Validate artifact metadata completeness before generation

---

#### Issue 3: Lambda Timeout

**Symptoms:**
```
Error: Task timed out after 300.00 seconds
```

**Root Cause:** Batch size too large or slow network

**Solution:**
1. Reduce batch size in Lambda event payload:
```json
{
  "batchSize": 5
}
```

2. Or increase Lambda timeout (max 15 minutes):
```bash
aws lambda update-function-configuration \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --timeout 900 \
  --region us-east-1
```

**Prevention:** Use smaller batch sizes for initial runs

---

#### Issue 4: S3 Upload Fails

**Symptoms:**
```
Error: AccessDenied: Access Denied
```

**Root Cause:** IAM permissions insufficient

**Solution:**
1. Check IAM role permissions:
```bash
aws iam get-role-policy \
  --role-name PreGenerationLambdaRole \
  --policy-name S3AccessPolicy
```

2. Ensure role has `s3:PutObject` permission:
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:HeadObject"
  ],
  "Resource": "arn:aws:s3:::bucket-name/*"
}
```

3. Update IAM policy if needed and retry

**Prevention:** Verify IAM permissions before starting generation

---

#### Issue 5: DynamoDB Write Fails

**Symptoms:**
```
Error: ProvisionedThroughputExceededException
```

**Root Cause:** DynamoDB table in provisioned mode with insufficient capacity

**Solution:**
1. Check table billing mode:
```bash
aws dynamodb describe-table \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress \
  --query 'Table.BillingModeSummary.BillingMode'
```

2. If provisioned mode, switch to on-demand:
```bash
aws dynamodb update-table \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress \
  --billing-mode PAY_PER_REQUEST
```

**Prevention:** Use on-demand billing mode for DynamoDB tables


#### Issue 6: Progress Not Persisting

**Symptoms:**
- Job restarts from beginning after interruption
- Progress state not found

**Root Cause:** DynamoDB table not accessible or local file system issue

**Solution:**
1. For local mode, check file system permissions:
```bash
ls -la .pre-generation/
chmod 755 .pre-generation/
```

2. For Lambda mode, check DynamoDB table exists:
```bash
aws dynamodb describe-table \
  --table-name SanaathanaAalayaCharithra-PreGenerationProgress
```

3. Verify IAM permissions for DynamoDB:
```bash
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:role/PreGenerationLambdaRole \
  --action-names dynamodb:PutItem dynamodb:GetItem dynamodb:UpdateItem \
  --resource-arns arn:aws:dynamodb:REGION:ACCOUNT:table/PreGenerationProgress
```

**Prevention:** Test progress persistence before full generation

---

#### Issue 7: High Failure Rate

**Symptoms:**
- More than 10% of items failing
- Multiple different error messages

**Root Cause:** Systemic issue (network, AWS service outage, configuration)

**Solution:**
1. Check AWS service health:
```bash
# Visit AWS Service Health Dashboard
# https://status.aws.amazon.com/
```

2. Review failure patterns in failure report:
```bash
cat reports/failures-20240101-120000.json | jq '.failures | group_by(.error) | map({error: .[0].error, count: length})'
```

3. If specific error pattern, address root cause
4. If AWS service issue, wait and resume later:
```bash
npm run pre-generate -- --resume job-20240101-120000
```

**Prevention:** Monitor AWS service health before starting large jobs

---

#### Issue 8: Cost Exceeding Estimate

**Symptoms:**
- Actual cost significantly higher than estimate
- CloudWatch alarm triggered

**Root Cause:** More retries than expected or larger content sizes

**Solution:**
1. Review actual vs estimated costs:
```bash
cat reports/cost-20240101-120000.json
```

2. Check retry counts in detailed log:
```bash
cat reports/detailed-20240101-120000.log | grep "retryCount" | sort | uniq -c
```

3. If high retry counts, investigate root cause (throttling, validation failures)
4. Adjust rate limits or validation rules as needed

**Prevention:** Monitor costs in real-time during generation

---

### Diagnostic Commands

#### Check System Health

```bash
# Check Node.js and npm versions
node --version
npm --version

# Check AWS CLI configuration
aws configure list

# Check AWS credentials
aws sts get-caller-identity

# Check network connectivity to AWS
ping s3.amazonaws.com
```

#### Check AWS Resources

```bash
# Check S3 bucket
aws s3 ls s3://bucket-name/

# Check DynamoDB tables
aws dynamodb list-tables

# Check Lambda function
aws lambda get-function --function-name SanaathanaAalayaCharithra-PreGeneration

# Check IAM role
aws iam get-role --role-name PreGenerationLambdaRole
```

#### Check Generation State

```bash
# List progress files
ls -la .pre-generation/

# View progress file
cat .pre-generation/progress-job-20240101-120000.json | jq '.'

# Count completed items
cat .pre-generation/progress-job-20240101-120000.json | jq '.completedItems | length'

# Count failed items
cat .pre-generation/progress-job-20240101-120000.json | jq '.failedItems | length'
```

#### Check Content in S3

```bash
# List all content
aws s3 ls s3://bucket-name/ --recursive | wc -l

# List content for specific artifact
aws s3 ls s3://bucket-name/lepakshi-temple-andhra/hanging-pillar/ --recursive

# Check file sizes
aws s3 ls s3://bucket-name/ --recursive --human-readable --summarize
```

#### Check Cache in DynamoDB

```bash
# Count cache entries
aws dynamodb scan \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --select COUNT

# Sample cache entries
aws dynamodb scan \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --limit 5
```


## Emergency Procedures

### Procedure 1: Abort Running Generation

**When to Use:** Critical issue detected, need to stop immediately

**Steps:**
1. For local execution, press `Ctrl+C` to interrupt
2. For Lambda execution, disable the Lambda function:
```bash
aws lambda put-function-concurrency \
  --function-name SanaathanaAalayaCharithra-PreGeneration \
  --reserved-concurrent-executions 0
```

3. Verify no more invocations:
```bash
aws lambda get-function-concurrency \
  --function-name SanaathanaAalayaCharithra-PreGeneration
```

4. Progress is automatically saved, can resume later

---

### Procedure 2: Rollback Content Updates

**When to Use:** Generated content has quality issues, need to revert

**Steps:**
1. Identify the previous generation job ID:
```bash
cat docs/generation-log.md
```

2. Query DynamoDB for previous content versions:
```bash
aws dynamodb query \
  --table-name SanaathanaAalayaCharithra-ContentCache \
  --key-condition-expression "cacheKey = :key" \
  --expression-attribute-values '{":key":{"S":"site1#hanging-pillar#en#audio_guide"}}' \
  --region us-east-1
```

3. Restore previous S3 objects using versioning:
```bash
# List object versions
aws s3api list-object-versions \
  --bucket bucket-name \
  --prefix lepakshi-temple-andhra/hanging-pillar/en/audio_guide/

# Restore previous version
aws s3api copy-object \
  --bucket bucket-name \
  --copy-source bucket-name/path/to/object?versionId=VERSION_ID \
  --key path/to/object
```

4. Update DynamoDB cache entries to point to previous versions

---

### Procedure 3: Emergency Cost Control

**When to Use:** Costs escalating unexpectedly

**Steps:**
1. Abort running generation (see Procedure 1)

2. Check current costs:
```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

3. Set up cost alert:
```bash
aws budgets create-budget \
  --account-id ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

4. Review and adjust rate limits to reduce costs

---

### Procedure 4: Data Corruption Recovery

**When to Use:** DynamoDB or S3 data appears corrupted

**Steps:**
1. Stop all generation processes

2. Backup current state:
```bash
# Export DynamoDB table
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:REGION:ACCOUNT:table/ContentCache \
  --s3-bucket backup-bucket \
  --s3-prefix dynamodb-backup/

# Sync S3 bucket to backup
aws s3 sync s3://bucket-name/ s3://backup-bucket/content-backup/
```

3. Restore from backup if available:
```bash
# Restore DynamoDB from backup
aws dynamodb restore-table-from-backup \
  --target-table-name ContentCache-Restored \
  --backup-arn arn:aws:dynamodb:REGION:ACCOUNT:table/ContentCache/backup/BACKUP_ID

# Restore S3 from backup
aws s3 sync s3://backup-bucket/content-backup/ s3://bucket-name/
```

4. If no backup, regenerate all content:
```bash
npm run pre-generate -- --force
```

---

## Maintenance Tasks

### Daily Maintenance

#### Check System Health
```bash
# Run daily health check script
./scripts/health-check.sh
```

**Checks:**
- AWS credentials valid
- S3 bucket accessible
- DynamoDB tables accessible
- No orphaned progress files
- No stale cache entries

#### Monitor Costs
```bash
# Check daily costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost
```

---

### Weekly Maintenance

#### Review Generation Logs
```bash
# Review generation log for past week
tail -n 100 docs/generation-log.md
```

#### Clean Up Old Progress Files
```bash
# Remove progress files older than 30 days
find .pre-generation/ -name "progress-*.json" -mtime +30 -delete
```

#### Verify Content Integrity
```bash
# Run verification script
npm run verify-content
```

---

### Monthly Maintenance

#### Review and Optimize Costs
1. Review AWS Cost Explorer for past month
2. Identify cost optimization opportunities
3. Adjust rate limits or batch sizes if needed

#### Update Configuration
1. Review configuration file for outdated settings
2. Update AWS service quotas if needed
3. Update Bedrock model versions if new versions available

#### Audit Content Quality
1. Sample 10-20 random artifacts
2. Review content quality across all languages
3. Identify artifacts needing updates

#### Update Documentation
1. Review and update runbook based on recent issues
2. Document any new procedures or workarounds
3. Update cost estimates based on actual costs

---

### Quarterly Maintenance

#### Full System Audit
1. Review all AWS resources (S3, DynamoDB, Lambda)
2. Check for unused resources
3. Verify IAM permissions are still appropriate
4. Review security best practices

#### Performance Review
1. Analyze generation performance over past quarter
2. Identify bottlenecks or inefficiencies
3. Plan optimizations for next quarter

#### Disaster Recovery Test
1. Test backup and restore procedures
2. Verify progress resumption works correctly
3. Test emergency procedures

---

## Performance Optimization

### Optimization Strategies

#### 1. Increase Rate Limits

If AWS service quotas allow, increase rate limits:

```yaml
# config/pre-generation.yaml
rateLimits:
  bedrock: 20  # Increase from 10 to 20 (if quota allows)
  polly: 200   # Increase from 100 to 200 (if quota allows)
```

**Impact:** Reduces generation time by up to 50%

#### 2. Increase Lambda Batch Size

For Lambda execution, increase batch size:

```json
{
  "batchSize": 20
}
```

**Impact:** Reduces number of Lambda invocations, lowers costs

#### 3. Optimize Content Generation

Use more efficient Bedrock models or Polly voices:

```yaml
# config/pre-generation.yaml
aws:
  bedrock:
    modelId: anthropic.claude-3-haiku-20240307-v1:0  # Faster, cheaper model
```

**Impact:** Reduces costs by 30-40%, may affect quality

#### 4. Parallel Processing

Enable parallel processing for independent items:

```yaml
# config/pre-generation.yaml
execution:
  maxConcurrency: 10  # Increase from 5 to 10
```

**Impact:** Reduces generation time, increases resource usage

---

### Performance Benchmarks

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Items per minute | >10 | 5-10 | <5 |
| Success rate | >98% | 95-98% | <95% |
| Cost per item | <₹3 | ₹3-₹4 | >₹4 |
| Lambda duration | <250s | 250-280s | >280s |
| Retry rate | <2% | 2-5% | >5% |

---

## Cost Management

### Cost Tracking

#### Track Costs by Generation Job

```bash
# Tag resources with job ID
aws s3api put-object-tagging \
  --bucket bucket-name \
  --key path/to/object \
  --tagging 'TagSet=[{Key=JobId,Value=job-20240101-120000}]'

# Query costs by tag
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-02 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=JobId
```

#### Set Up Cost Alerts

```bash
# Create budget for pre-generation
aws budgets create-budget \
  --account-id ACCOUNT_ID \
  --budget '{
    "BudgetName": "PreGenerationBudget",
    "BudgetLimit": {
      "Amount": "100",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "admin@example.com"
    }]
  }]'
```

### Cost Optimization Tips

1. **Use Cache Effectively**: Don't use `--force` unless necessary
2. **Filter Wisely**: Generate only needed languages/content types during testing
3. **Optimize Rate Limits**: Balance speed vs cost
4. **Use Cheaper Models**: Consider Claude Haiku for non-critical content
5. **Monitor Retries**: High retry rates increase costs
6. **Clean Up Old Data**: Set TTL on DynamoDB to auto-delete old records
7. **Use S3 Lifecycle Policies**: Archive old content to Glacier


## Appendix

### A. Configuration Reference

#### Complete Configuration File

See `config/pre-generation.yaml` for the complete configuration schema.

#### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_REGION` | AWS region | ap-south-1 | No |
| `AWS_PROFILE` | AWS credentials profile | default | No |
| `S3_BUCKET` | Content storage bucket | - | Yes |
| `DYNAMODB_PROGRESS_TABLE` | Progress tracking table | PreGenerationProgress | No |
| `DYNAMODB_CACHE_TABLE` | Content cache table | ContentCache | No |
| `BATCH_SIZE` | Items per Lambda invocation | 10 | No |
| `LOG_LEVEL` | Logging level | INFO | No |

---

### B. AWS Service Quotas

#### Required Service Quotas

| Service | Quota | Default | Recommended |
|---------|-------|---------|-------------|
| Bedrock | Requests per second | 10 | 20 |
| Polly | Requests per second | 100 | 200 |
| S3 | PUT requests per second | 3500 | 3500 |
| DynamoDB | Write capacity units | On-demand | On-demand |
| Lambda | Concurrent executions | 1000 | 10 |

#### Request Quota Increase

```bash
# Request Bedrock quota increase
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-XXXXXXXX \
  --desired-value 20
```

---

### C. IAM Permissions

#### Required IAM Permissions

**For Local Execution:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/PreGenerationProgress",
        "arn:aws:dynamodb:*:*:table/ContentCache"
      ]
    }
  ]
}
```

**For Lambda Execution (Additional):**
```json
{
  "Effect": "Allow",
  "Action": [
    "lambda:InvokeFunction"
  ],
  "Resource": "arn:aws:lambda:*:*:function:SanaathanaAalayaCharithra-PreGeneration"
}
```

---

### D. Supported Languages and Voices

| Language | Code | Polly Voice | Engine | Script |
|----------|------|-------------|--------|--------|
| English | en | Joanna | Neural | Latin |
| Hindi | hi | Aditi | Neural | Devanagari |
| Tamil | ta | Standard | Standard | Tamil |
| Telugu | te | Standard | Standard | Telugu |
| Bengali | bn | Standard | Standard | Bengali |
| Marathi | mr | Standard | Standard | Devanagari |
| Gujarati | gu | Standard | Standard | Gujarati |
| Kannada | kn | Standard | Standard | Kannada |
| Malayalam | ml | Standard | Standard | Malayalam |
| Punjabi | pa | Standard | Standard | Gurmukhi |

---

### E. Content Type Specifications

#### Audio Guide
- **Format**: MP3
- **Bitrate**: 128 kbps
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono
- **Duration**: 60-180 seconds
- **Average Size**: 1-2 MB

#### Video
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080
- **Frame Rate**: 30 fps
- **Bitrate**: 5 Mbps
- **Duration**: 120-300 seconds
- **Average Size**: 75-150 MB

#### Infographic
- **Format**: PNG
- **Resolution**: 1920x1080
- **Color Depth**: 24-bit
- **Compression**: Lossless
- **Average Size**: 2-5 MB

#### Q&A Knowledge Base
- **Format**: JSON
- **Question-Answer Pairs**: 5-20
- **Average Size**: 10-50 KB

---

### F. Error Codes and Messages

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| THROTTLING | Rate exceeded | AWS service throttling | Automatic retry with backoff |
| VALIDATION_FAILED | Content validation failed | Quality standards not met | Review artifact metadata |
| ACCESS_DENIED | Access denied | IAM permissions insufficient | Update IAM policy |
| TIMEOUT | Task timed out | Lambda timeout | Reduce batch size |
| NETWORK_ERROR | Network error | Network connectivity issue | Retry automatically |
| INVALID_CONFIG | Invalid configuration | Configuration file error | Fix configuration |

---

### G. Useful Commands

#### Quick Reference

```bash
# Generate all content
npm run pre-generate

# Dry run (estimate costs)
npm run pre-generate:dry-run

# Force regeneration
npm run pre-generate:force

# Resume interrupted job
npm run pre-generate -- --resume JOB_ID

# Filter by temple group
npm run pre-generate -- --temple-groups GROUP_NAME

# Filter by languages
npm run pre-generate -- --languages en,hi,ta

# Filter by content types
npm run pre-generate -- --content-types audio_guide,video

# Deploy Lambda
npm run deploy:pre-generation

# Verify Lambda deployment
npm run deploy:pre-generation:verify

# View Lambda logs
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-PreGeneration --follow

# Check progress in DynamoDB
aws dynamodb query --table-name PreGenerationProgress --key-condition-expression "jobId = :id" --expression-attribute-values '{":id":{"S":"JOB_ID"}}'

# Check cache entries
aws dynamodb scan --table-name ContentCache --select COUNT

# List S3 content
aws s3 ls s3://bucket-name/ --recursive

# Check costs
aws ce get-cost-and-usage --time-period Start=START_DATE,End=END_DATE --granularity DAILY --metrics BlendedCost
```

---

### H. Contact Information

#### Support Contacts

- **Platform Administrator**: admin@example.com
- **DevOps Team**: devops@example.com
- **On-Call Engineer**: oncall@example.com
- **AWS Support**: AWS Support Console

#### Escalation Path

1. **Level 1**: Check troubleshooting guide
2. **Level 2**: Contact DevOps team
3. **Level 3**: Contact AWS support
4. **Level 4**: Escalate to platform administrator

---

### I. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-01 | 1.0.0 | Initial runbook creation | System |

---

### J. Related Documentation

- [Pre-Generation System Overview](./PRE_GENERATION_SYSTEM.md)
- [CLI Usage Guide](../src/pre-generation/CLI_README.md)
- [Lambda Deployment Guide](./PRE_GENERATION_LAMBDA_DEPLOYMENT.md)
- [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md)
- [Cost Tracking](./ACTUAL_COST_TRACKING.md)

---

## Document Information

**Document Title**: Content Pre-Generation System - Operational Runbook  
**Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Owner**: Platform Operations Team  
**Review Frequency**: Quarterly  
**Next Review Date**: 2024-04-01

---

**End of Runbook**
