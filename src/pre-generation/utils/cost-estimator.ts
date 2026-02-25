/**
 * Cost Estimator Module
 * 
 * Calculates expected AWS service costs before generation begins, allowing
 * administrators to approve the budget. Provides detailed cost breakdowns
 * by service and content type, and estimates processing time.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { 
  ArtifactMetadata, 
  GenerationOptions, 
  CostEstimate, 
  CostBreakdown,
  GenerationResult,
  ContentType,
  Language
} from '../types';

/**
 * AWS Service Pricing (as of 2024)
 * These are base rates in USD
 */
const PRICING = {
  // Bedrock Claude 3 Sonnet pricing
  bedrock: {
    inputTokensPer1K: 0.003,   // $0.003 per 1K input tokens
    outputTokensPer1K: 0.015,  // $0.015 per 1K output tokens
  },
  // Polly Neural TTS pricing
  polly: {
    per1MCharacters: 16.0,     // $16 per 1M characters
  },
  // S3 pricing
  s3: {
    storagePerGBMonth: 0.023,  // $0.023 per GB/month
    putRequestPer1K: 0.005,    // $0.005 per 1K PUT requests
  },
  // DynamoDB pricing (on-demand)
  dynamodb: {
    writeRequestPer1M: 1.25,   // $1.25 per 1M write requests
  },
};

/**
 * Content size estimates for cost calculation
 */
const CONTENT_ESTIMATES = {
  // Token estimates for Bedrock
  tokens: {
    inputPerItem: 500,         // ~500 tokens for artifact metadata
    outputPerItem: 1500,       // ~1500 tokens for generated content
  },
  // Character estimates for Polly
  characters: {
    audioGuide: 1000,          // ~1000 characters per audio guide
  },
  // File size estimates in MB
  fileSize: {
    audio_guide: 2,            // ~2 MB per audio file (MP3, 128kbps, ~2 min)
    video: 50,                 // ~50 MB per video (1080p, 5Mbps, ~2 min)
    infographic: 3,            // ~3 MB per infographic (PNG, 1920x1080)
    qa_knowledge_base: 0.1,    // ~100 KB per Q&A JSON
  },
};

/**
 * Current USD to INR exchange rate
 * In production, this should be fetched from a live API
 */
const USD_TO_INR_RATE = 83.5;

/**
 * CostEstimator class
 * 
 * Calculates expected AWS service costs before execution begins.
 * Provides detailed breakdowns and time estimates.
 */
export class CostEstimator {
  /**
   * Estimate total cost for generation job
   * 
   * @param artifacts - Artifacts to process
   * @param options - Generation options
   * @returns Cost breakdown and estimates
   */
  estimateCost(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): CostEstimate {
    const itemCount = this.calculateItemCount(artifacts, options);
    
    // Calculate costs for each service
    const bedrockCost = this.calculateBedrockCost(itemCount, options);
    const pollyCost = this.calculatePollyCost(artifacts.length, options);
    const s3Costs = this.calculateS3Costs(itemCount, options);
    const dynamoDBCost = this.calculateDynamoDBCost(itemCount);
    
    // Sum up total cost in USD
    const totalCostUSD = 
      bedrockCost + 
      pollyCost + 
      s3Costs.storage + 
      s3Costs.requests + 
      dynamoDBCost;
    
    // Convert to INR
    const totalCostINR = totalCostUSD * USD_TO_INR_RATE;
    
    // Calculate estimated duration
    const estimatedDuration = this.calculateEstimatedDuration(itemCount);
    
    // Build cost breakdown
    const breakdown: CostBreakdown = {
      bedrockCost,
      pollyCost,
      s3StorageCost: s3Costs.storage,
      s3RequestCost: s3Costs.requests,
      dynamoDBCost,
      totalCost: totalCostUSD,
      currency: 'USD',
    };
    
    return {
      totalCostINR,
      totalCostUSD,
      breakdown,
      estimatedDuration,
      itemCount,
    };
  }
  
  /**
   * Calculate actual cost from generation results
   * 
   * Uses actual metrics when available, falls back to estimates based on succeeded items
   * 
   * @param results - Generation results with actual metrics
   * @returns Actual cost breakdown
   */
  calculateActualCost(results: GenerationResult): CostBreakdown {
    // If actual metrics are available, use them for precise cost calculation
    if (results.actualMetrics) {
      return this.calculateCostFromActualMetrics(results.actualMetrics);
    }
    
    // Fall back to estimation based on succeeded items
    const succeededItems = results.succeeded;
    
    const bedrockCost = this.calculateBedrockCostForItems(succeededItems);
    const pollyCost = this.calculatePollyCostForItems(succeededItems);
    const s3Costs = this.calculateS3CostsForItems(succeededItems);
    const dynamoDBCost = this.calculateDynamoDBCostForItems(succeededItems);
    
    const totalCost = 
      bedrockCost + 
      pollyCost + 
      s3Costs.storage + 
      s3Costs.requests + 
      dynamoDBCost;
    
    return {
      bedrockCost,
      pollyCost,
      s3StorageCost: s3Costs.storage,
      s3RequestCost: s3Costs.requests,
      dynamoDBCost,
      totalCost,
      currency: 'USD',
    };
  }
  
  /**
   * Calculate cost from actual tracked metrics
   * 
   * @param metrics - Actual metrics tracked during generation
   * @returns Cost breakdown based on actual usage
   */
  private calculateCostFromActualMetrics(metrics: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCharacters: number;
    totalFileSizeBytes: number;
    totalS3Requests: number;
    totalDynamoDBWrites: number;
  }): CostBreakdown {
    // Calculate Bedrock cost from actual token usage
    const bedrockCost = 
      (metrics.totalInputTokens / 1000) * PRICING.bedrock.inputTokensPer1K +
      (metrics.totalOutputTokens / 1000) * PRICING.bedrock.outputTokensPer1K;
    
    // Calculate Polly cost from actual character count
    const pollyCost = (metrics.totalCharacters / 1_000_000) * PRICING.polly.per1MCharacters;
    
    // Calculate S3 storage cost from actual file sizes
    const totalSizeGB = metrics.totalFileSizeBytes / (1024 * 1024 * 1024);
    const s3StorageCost = totalSizeGB * PRICING.s3.storagePerGBMonth;
    
    // Calculate S3 request cost from actual request count
    const s3RequestCost = (metrics.totalS3Requests / 1000) * PRICING.s3.putRequestPer1K;
    
    // Calculate DynamoDB cost from actual write count
    const dynamoDBCost = (metrics.totalDynamoDBWrites / 1_000_000) * PRICING.dynamodb.writeRequestPer1M;
    
    const totalCost = bedrockCost + pollyCost + s3StorageCost + s3RequestCost + dynamoDBCost;
    
    return {
      bedrockCost,
      pollyCost,
      s3StorageCost,
      s3RequestCost,
      dynamoDBCost,
      totalCost,
      currency: 'USD',
    };
  }
  
  /**
   * Calculate total number of items to process
   */
  private calculateItemCount(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): number {
    return artifacts.length * options.languages.length * options.contentTypes.length;
  }
  
  /**
   * Calculate Bedrock costs based on token estimates
   * 
   * Bedrock is used for video, infographic, and Q&A generation
   * Audio uses Polly, not Bedrock
   */
  private calculateBedrockCost(
    totalItems: number,
    options: GenerationOptions
  ): number {
    // Count content types that use Bedrock (exclude audio_guide)
    const bedrockContentTypes = options.contentTypes.filter(
      ct => ct !== 'audio_guide'
    );
    
    if (bedrockContentTypes.length === 0) {
      return 0;
    }
    
    // Calculate proportion of items using Bedrock
    const bedrockItemRatio = bedrockContentTypes.length / options.contentTypes.length;
    const bedrockItems = Math.ceil(totalItems * bedrockItemRatio);
    
    // Calculate token costs
    const inputCost = 
      (CONTENT_ESTIMATES.tokens.inputPerItem / 1000) * 
      PRICING.bedrock.inputTokensPer1K * 
      bedrockItems;
    
    const outputCost = 
      (CONTENT_ESTIMATES.tokens.outputPerItem / 1000) * 
      PRICING.bedrock.outputTokensPer1K * 
      bedrockItems;
    
    return inputCost + outputCost;
  }
  
  /**
   * Calculate Polly costs based on character count
   * 
   * Polly is used only for audio guide generation
   */
  private calculatePollyCost(
    artifactCount: number,
    options: GenerationOptions
  ): number {
    // Check if audio_guide is in content types
    if (!options.contentTypes.includes('audio_guide')) {
      return 0;
    }
    
    // Calculate total audio guides to generate
    const audioGuideCount = artifactCount * options.languages.length;
    
    // Calculate total characters
    const totalCharacters = audioGuideCount * CONTENT_ESTIMATES.characters.audioGuide;
    
    // Calculate cost
    return (totalCharacters / 1_000_000) * PRICING.polly.per1MCharacters;
  }
  
  /**
   * Calculate S3 storage and request costs
   */
  private calculateS3Costs(
    totalItems: number,
    options: GenerationOptions
  ): { storage: number; requests: number } {
    // Calculate total storage size in GB
    let totalSizeGB = 0;
    
    for (const contentType of options.contentTypes) {
      const itemsOfType = totalItems / options.contentTypes.length;
      const sizePerItem = CONTENT_ESTIMATES.fileSize[contentType] || 1;
      totalSizeGB += (itemsOfType * sizePerItem) / 1024; // Convert MB to GB
    }
    
    // Storage cost (monthly, but we show for first month)
    const storageCost = totalSizeGB * PRICING.s3.storagePerGBMonth;
    
    // Request cost (PUT requests)
    const requestCost = (totalItems / 1000) * PRICING.s3.putRequestPer1K;
    
    return { storage: storageCost, requests: requestCost };
  }
  
  /**
   * Calculate DynamoDB write costs
   * 
   * Each item generates 2 writes:
   * 1. Content cache entry
   * 2. Progress tracking entry
   */
  private calculateDynamoDBCost(totalItems: number): number {
    const totalWrites = totalItems * 2; // Cache entry + progress entry
    return (totalWrites / 1_000_000) * PRICING.dynamodb.writeRequestPer1M;
  }
  
  /**
   * Calculate estimated processing time based on artifact count and rate limits
   * 
   * The bottleneck is typically Bedrock with 10 req/sec rate limit
   */
  private calculateEstimatedDuration(totalItems: number): number {
    // Bedrock rate limit is the bottleneck: 10 requests/second
    const bedrockRateLimit = 10;
    
    // Calculate time in seconds
    const timeInSeconds = totalItems / bedrockRateLimit;
    
    // Add 20% buffer for retries, validation, storage operations
    const timeWithBuffer = timeInSeconds * 1.2;
    
    // Return in seconds
    return Math.ceil(timeWithBuffer);
  }
  
  /**
   * Helper methods for actual cost calculation
   */
  
  private calculateBedrockCostForItems(itemCount: number): number {
    // Simplified: assume all items use Bedrock
    // In reality, we'd track actual token usage
    const inputCost = 
      (CONTENT_ESTIMATES.tokens.inputPerItem / 1000) * 
      PRICING.bedrock.inputTokensPer1K * 
      itemCount;
    
    const outputCost = 
      (CONTENT_ESTIMATES.tokens.outputPerItem / 1000) * 
      PRICING.bedrock.outputTokensPer1K * 
      itemCount;
    
    return inputCost + outputCost;
  }
  
  private calculatePollyCostForItems(itemCount: number): number {
    // Simplified: assume 1/4 of items are audio guides
    const audioGuideCount = Math.ceil(itemCount / 4);
    const totalCharacters = audioGuideCount * CONTENT_ESTIMATES.characters.audioGuide;
    return (totalCharacters / 1_000_000) * PRICING.polly.per1MCharacters;
  }
  
  private calculateS3CostsForItems(itemCount: number): { storage: number; requests: number } {
    // Simplified: use average file size
    const avgFileSizeMB = 10; // Average across all content types
    const totalSizeGB = (itemCount * avgFileSizeMB) / 1024;
    
    const storageCost = totalSizeGB * PRICING.s3.storagePerGBMonth;
    const requestCost = (itemCount / 1000) * PRICING.s3.putRequestPer1K;
    
    return { storage: storageCost, requests: requestCost };
  }
  
  private calculateDynamoDBCostForItems(itemCount: number): number {
    const totalWrites = itemCount * 2;
    return (totalWrites / 1_000_000) * PRICING.dynamodb.writeRequestPer1M;
  }
  
  /**
   * Format cost estimate for display
   * 
   * @param estimate - Cost estimate to format
   * @returns Formatted string for console output
   */
  formatCostEstimate(estimate: CostEstimate): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('COST ESTIMATE');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Total Items to Process: ${estimate.itemCount.toLocaleString()}`);
    lines.push(`Estimated Duration: ${this.formatDuration(estimate.estimatedDuration)}`);
    lines.push('');
    lines.push('Cost Breakdown (USD):');
    lines.push('-'.repeat(60));
    lines.push(`  Bedrock (AI Content):     $${estimate.breakdown.bedrockCost.toFixed(2)}`);
    lines.push(`  Polly (Audio TTS):        $${estimate.breakdown.pollyCost.toFixed(2)}`);
    lines.push(`  S3 Storage:               $${estimate.breakdown.s3StorageCost.toFixed(2)}`);
    lines.push(`  S3 Requests:              $${estimate.breakdown.s3RequestCost.toFixed(2)}`);
    lines.push(`  DynamoDB Writes:          $${estimate.breakdown.dynamoDBCost.toFixed(2)}`);
    lines.push('-'.repeat(60));
    lines.push(`  Total (USD):              $${estimate.totalCostUSD.toFixed(2)}`);
    lines.push(`  Total (INR):              ₹${estimate.totalCostINR.toFixed(2)}`);
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Format duration in human-readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }
  
  /**
   * Format cost comparison between estimated and actual costs
   * 
   * @param estimated - Estimated cost breakdown
   * @param actual - Actual cost breakdown
   * @returns Formatted string for console output
   */
  formatCostComparison(estimated: CostBreakdown, actual: CostBreakdown): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('COST COMPARISON: ESTIMATED vs ACTUAL');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Helper to format cost with variance
    const formatCostLine = (label: string, est: number, act: number) => {
      const variance = act - est;
      const variancePercent = est > 0 ? ((variance / est) * 100).toFixed(1) : '0.0';
      const varianceSign = variance >= 0 ? '+' : '';
      const varianceIndicator = Math.abs(variance) < 0.01 ? '✓' : variance > 0 ? '⚠' : '✓';
      
      return `  ${label.padEnd(25)} $${est.toFixed(2).padStart(8)} → $${act.toFixed(2).padStart(8)}  ${varianceIndicator} ${varianceSign}${variancePercent}%`;
    };
    
    lines.push('Service Breakdown:');
    lines.push('-'.repeat(80));
    lines.push(formatCostLine('Bedrock (AI Content):', estimated.bedrockCost, actual.bedrockCost));
    lines.push(formatCostLine('Polly (Audio TTS):', estimated.pollyCost, actual.pollyCost));
    lines.push(formatCostLine('S3 Storage:', estimated.s3StorageCost, actual.s3StorageCost));
    lines.push(formatCostLine('S3 Requests:', estimated.s3RequestCost, actual.s3RequestCost));
    lines.push(formatCostLine('DynamoDB Writes:', estimated.dynamoDBCost, actual.dynamoDBCost));
    lines.push('-'.repeat(80));
    lines.push(formatCostLine('TOTAL:', estimated.totalCost, actual.totalCost));
    lines.push('');
    
    // Overall variance summary
    const totalVariance = actual.totalCost - estimated.totalCost;
    const totalVariancePercent = estimated.totalCost > 0 
      ? ((totalVariance / estimated.totalCost) * 100).toFixed(1) 
      : '0.0';
    const varianceSign = totalVariance >= 0 ? '+' : '';
    
    lines.push('Summary:');
    lines.push(`  Estimated Total: $${estimated.totalCost.toFixed(2)}`);
    lines.push(`  Actual Total:    $${actual.totalCost.toFixed(2)}`);
    lines.push(`  Variance:        ${varianceSign}$${totalVariance.toFixed(2)} (${varianceSign}${totalVariancePercent}%)`);
    
    if (Math.abs(parseFloat(totalVariancePercent)) <= 10) {
      lines.push(`  Status:          ✓ Within 10% accuracy`);
    } else if (totalVariance > 0) {
      lines.push(`  Status:          ⚠ Over budget by ${totalVariancePercent}%`);
    } else {
      lines.push(`  Status:          ✓ Under budget by ${Math.abs(parseFloat(totalVariancePercent))}%`);
    }
    
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }
}
