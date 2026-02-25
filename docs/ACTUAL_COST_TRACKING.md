# Actual Cost Tracking Implementation

## Overview

The Content Pre-Generation System tracks actual costs incurred during generation to compare against initial estimates. This document explains the implementation approach and accuracy considerations.

## Implementation Approach

### Metrics Tracked

The system tracks the following actual metrics during generation:

1. **File Sizes** (Actual): Captured from S3 storage after upload
2. **S3 Requests** (Actual): Counted for each successful upload
3. **DynamoDB Writes** (Actual): Counted for cache and progress entries
4. **Token Counts** (Estimated): Based on content type heuristics
5. **Character Counts** (Estimated): Based on content type heuristics

### Why Hybrid Approach?

We use a hybrid approach (actual + estimated metrics) because:

1. **AWS SDK Limitations**: The AWS Bedrock and Polly SDKs don't return token/character counts in their responses
2. **Implementation Complexity**: Tracking exact token counts would require parsing Bedrock request/response payloads
3. **Accuracy Trade-off**: File sizes and request counts provide actual data, while token/character estimates are consistent with initial estimates
4. **Sufficient for Comparison**: The goal is to compare estimated vs actual costs, and consistent estimation methods achieve this

### Estimation Heuristics

For content types that use AWS services:

**Audio Guide (Polly)**:
- Characters: ~1000 per audio guide
- Based on typical script length for 60-180 second audio

**Video, Infographic, Q&A (Bedrock)**:
- Input tokens: ~500 per item (artifact metadata)
- Output tokens: ~1500 per item (generated content)
- Based on average content complexity

### Actual Metrics Structure

```typescript
interface GenerationResult {
  // ... other fields
  actualMetrics?: {
    totalInputTokens: number;      // Estimated from content type
    totalOutputTokens: number;     // Estimated from content type
    totalCharacters: number;       // Estimated from content type
    totalFileSizeBytes: number;    // ACTUAL from S3 storage
    totalS3Requests: number;       // ACTUAL count
    totalDynamoDBWrites: number;   // ACTUAL count
  };
}
```

## Cost Calculation

### With Actual Metrics

When `actualMetrics` are available, the `CostEstimator.calculateActualCost()` method uses:

```typescript
// Bedrock cost from estimated token usage
bedrockCost = (totalInputTokens / 1000) * $0.003 + (totalOutputTokens / 1000) * $0.015

// Polly cost from estimated character count
pollyCost = (totalCharacters / 1000000) * $16

// S3 storage cost from ACTUAL file sizes
s3StorageCost = (totalFileSizeBytes / (1024^3)) * $0.023

// S3 request cost from ACTUAL request count
s3RequestCost = (totalS3Requests / 1000) * $0.005

// DynamoDB cost from ACTUAL write count
dynamoDBCost = (totalDynamoDBWrites / 1000000) * $1.25
```

### Fallback to Estimation

If `actualMetrics` are not available (e.g., for older generation runs), the system falls back to estimation based on succeeded item count using the same heuristics as initial cost estimation.

## Cost Comparison Report

The `formatCostComparison()` method generates a detailed comparison report:

```
================================================================================
COST COMPARISON: ESTIMATED vs ACTUAL
================================================================================

Service Breakdown:
--------------------------------------------------------------------------------
  Bedrock (AI Content):     $  5.00 → $  5.20  ⚠ +4.0%
  Polly (Audio TTS):        $  2.00 → $  1.90  ✓ -5.0%
  S3 Storage:               $  1.50 → $  1.60  ⚠ +6.7%
  S3 Requests:              $  1.00 → $  0.95  ✓ -5.0%
  DynamoDB Writes:          $  0.50 → $  0.48  ✓ -4.0%
--------------------------------------------------------------------------------
  TOTAL:                    $ 10.00 → $ 10.13  ⚠ +1.3%

Summary:
  Estimated Total: $10.00
  Actual Total:    $10.13
  Variance:        +$0.13 (+1.3%)
  Status:          ✓ Within 10% accuracy
================================================================================
```

### Variance Indicators

- ✓ (checkmark): Within acceptable range or under budget
- ⚠ (warning): Over budget or significant variance

### Status Messages

- "Within 10% accuracy": Variance is ≤10% (acceptable)
- "Over budget by X%": Actual cost exceeds estimate by >10%
- "Under budget by X%": Actual cost is less than estimate by >10%

## Accuracy Considerations

### Expected Accuracy

- **S3 Storage**: High accuracy (actual file sizes)
- **S3 Requests**: High accuracy (actual count)
- **DynamoDB Writes**: High accuracy (actual count)
- **Bedrock Costs**: Moderate accuracy (estimated tokens)
- **Polly Costs**: Moderate accuracy (estimated characters)

### Factors Affecting Accuracy

1. **Content Complexity**: More complex artifacts may use more tokens
2. **Language Differences**: Some languages may require more characters
3. **Retry Attempts**: Failed attempts still incur costs
4. **Rate Limiting**: Throttling doesn't affect costs but may affect timing

### Improving Accuracy

To improve accuracy in the future:

1. **Parse Bedrock Responses**: Extract actual token counts from response metadata
2. **Track Polly Characters**: Count actual characters sent to Polly API
3. **Log API Metrics**: Store detailed API usage logs for analysis
4. **Use CloudWatch Metrics**: Query AWS CloudWatch for actual service usage

## Usage in Reports

The actual cost calculation is used in:

1. **Generation Summary Report**: Shows total actual cost
2. **Cost Comparison Report**: Compares estimated vs actual
3. **Failure Analysis**: Helps understand cost impact of failures
4. **Budget Tracking**: Monitors spending against estimates

## Example Usage

```typescript
// After generation completes
const results = await orchestrator.generateAll(artifacts, options);

// Calculate actual cost
const actualCost = costEstimator.calculateActualCost(results);

// Compare with estimate
const estimate = costEstimator.estimateCost(artifacts, options);
const comparison = costEstimator.formatCostComparison(
  estimate.breakdown,
  actualCost
);

console.log(comparison);
```

## Conclusion

The hybrid approach (actual + estimated metrics) provides a practical balance between implementation complexity and cost tracking accuracy. The system captures actual data where easily available (file sizes, request counts) and uses consistent estimation methods for API usage metrics. This approach is sufficient for the primary goal: comparing estimated vs actual costs to validate budget accuracy and identify cost optimization opportunities.
