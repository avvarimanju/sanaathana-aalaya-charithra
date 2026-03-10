// Core types for Content Pre-Generation System
import { Language, ContentType as CommonContentType } from '../models/common';

// Re-export Language for convenience
export { Language };

// Extend ContentType to include qa_knowledge_base
export type ContentType = 'audio_guide' | 'video' | 'infographic' | 'qa_knowledge_base';

// ============================================================================
// Artifact Types
// ============================================================================

export interface ArtifactMetadata {
  artifactId: string;
  siteId: string;
  name: string;
  type: string;
  description: string;
  historicalContext: string;
  culturalSignificance: string;
  templeGroup: string;
}

export interface ArtifactFilter {
  templeGroups?: string[];
  artifactIds?: string[];
  siteIds?: string[];
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

// ============================================================================
// Content Generation Types
// ============================================================================

export interface GenerationOptions {
  languages: Language[];
  contentTypes: ContentType[];
  forceRegenerate: boolean;
  dryRun: boolean;
  batchSize: number;
  maxConcurrency: number;
}

export interface GenerationItem {
  artifactId: string;
  siteId: string;
  language: Language;
  contentType: ContentType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  s3Key?: string;
  error?: string;
  retryCount: number;
  timestamp: string;
}

export interface ArtifactGenerationResult {
  artifactId: string;
  language: Language;
  contentType: ContentType;
  success: boolean;
  s3Key?: string;
  cdnUrl?: string;
  error?: string;
  retryCount: number;
  duration: number;
  // Actual metrics for cost calculation
  actualMetrics?: {
    inputTokens?: number;      // For Bedrock API calls
    outputTokens?: number;     // For Bedrock API calls
    characters?: number;       // For Polly API calls
    fileSizeBytes?: number;    // Actual file size stored in S3
  };
}

export interface GenerationResult {
  totalItems: number;
  succeeded: number;
  failed: number;
  skipped: number;
  duration: number;
  estimatedCost: number;
  actualCost: number;
  failures: GenerationFailure[];
  // Aggregated actual metrics for cost calculation
  actualMetrics?: {
    totalInputTokens: number;      // Total Bedrock input tokens
    totalOutputTokens: number;     // Total Bedrock output tokens
    totalCharacters: number;       // Total Polly characters
    totalFileSizeBytes: number;    // Total S3 storage used
    totalS3Requests: number;       // Total S3 PUT requests
    totalDynamoDBWrites: number;   // Total DynamoDB write requests
  };
}

export interface GenerationFailure {
  artifactId: string;
  language: Language;
  contentType: ContentType;
  error: string;
  retryCount: number;
  timestamp: string;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface ProgressState {
  jobId: string;
  startTime: string;
  lastUpdateTime: string;
  totalItems: number;
  completedItems: GenerationItem[];
  failedItems: GenerationItem[];
  remainingItems: GenerationItem[];
  status: 'in_progress' | 'completed' | 'failed' | 'paused';
}

export interface ProgressStatistics {
  totalItems: number;
  completed: number;
  failed: number;
  skipped: number;
  remaining: number;
  percentComplete: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  itemsPerMinute: number;
}

// ============================================================================
// Cost Estimation Types
// ============================================================================

export interface CostEstimate {
  totalCostINR: number;
  totalCostUSD: number;
  breakdown: CostBreakdown;
  estimatedDuration: number;
  itemCount: number;
}

export interface CostBreakdown {
  bedrockCost: number;
  pollyCost: number;
  s3StorageCost: number;
  s3RequestCost: number;
  dynamoDBCost: number;
  totalCost: number;
  currency: 'INR' | 'USD';
}


export interface RateLimitStats {
  service: AWSService;
  requestsInWindow: number;
  maxRequestsPerSecond: number;
  currentDelay: number;
  totalRequests: number;
}

// ============================================================================
// Content Validation Types
// ============================================================================

export interface AudioMetadata {
  language: Language;
  expectedDuration?: number;
  minDuration: number;
  maxDuration: number;
}

export interface VideoMetadata {
  language: Language;
  expectedDimensions?: { width: number; height: number };
  minDuration: number;
}

export interface InfographicMetadata {
  language: Language;
  minResolution: { width: number; height: number };
}

export interface QAMetadata {
  language: Language;
  minQuestionCount: number;
}

export interface QAKnowledgeBase {
  artifactId: string;
  language: Language;
  questionAnswerPairs: QAPair[];
}

export interface QAPair {
  question: string;
  answer: string;
  confidence: number;
  sources: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PreGenerationConfig {
  aws: {
    region: string;
    s3: {
      bucket: string;
      encryption: string;
    };
    dynamodb: {
      progressTable: string;
      cacheTable: string;
    };
    bedrock: {
      modelId: string;
      maxTokens: number;
      temperature: number;
    };
    polly: {
      engine: string;
      voiceMapping: Record<string, string | null>;
    };
  };
  generation: {
    languages: Language[];
    contentTypes: ContentType[];
    forceRegenerate: boolean;
    skipExisting: boolean;
    cacheMaxAge: number;
  };
  rateLimits: {
    bedrock: number;
    polly: number;
    s3: number;
    dynamodb: number;
  };
  retry: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  };
  validation: {
    audio: {
      minDuration: number;
      maxDuration: number;
    };
    video: {
      minDuration: number;
      maxDuration: number;
      expectedDimensions: {
        width: number;
        height: number;
      };
    };
    infographic: {
      minResolution: {
        width: number;
        height: number;
      };
    };
    qaKnowledgeBase: {
      minQuestionCount: number;
    };
  };
  execution: {
    mode: 'local' | 'lambda';
    batchSize: number;
    maxConcurrency: number;
    timeout: number;
  };
  reporting: {
    outputDir: string;
    formats: ('json' | 'csv' | 'html')[];
  };
}

// ============================================================================
// AWS Service Types
// ============================================================================

export type AWSService = 'bedrock' | 'polly' | 's3' | 'dynamodb';

// ============================================================================
// Rate Limit Configuration Types
// ============================================================================

export interface ServiceRateLimitConfig {
  requestsPerSecond: number;
  throttleBackoffMs: number;
  maxBackoffMs: number;
}

export interface RateLimitConfig {
  bedrock: ServiceRateLimitConfig;
  polly: ServiceRateLimitConfig;
  s3: ServiceRateLimitConfig;
  dynamodb: ServiceRateLimitConfig;
}

// ============================================================================
// Retry Configuration Types
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: number;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface ContentCacheEntry {
  cacheKey: string;
  siteId: string;
  artifactId: string;
  language: Language;
  contentType: ContentType;
  s3Key: string;
  s3Bucket: string;
  cdnUrl: string;
  contentHash: string;
  fileSize: number;
  mimeType: string;
  generatedAt: string;
  generationJobId: string;
  generationDuration: number;
  bedrockModelId?: string;
  pollyVoiceId?: string;
  version: string;
  previousVersions?: string[];
  ttl: number;
  cacheControl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressRecord {
  jobId: string;
  itemKey: string;
  artifactId: string;
  siteId: string;
  artifactName: string;
  language: Language;
  contentType: ContentType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
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
  ttl?: number;
}
