/**
 * Pre-Generation Lambda Handler
 * 
 * Lambda function for batch processing content pre-generation.
 * Handles Lambda timeout limits by processing in batches and recursively
 * invoking itself for large jobs.
 * 
 * Environment Variables:
 * - S3_BUCKET: S3 bucket name for content storage
 * - DYNAMODB_PROGRESS_TABLE: DynamoDB table for progress tracking
 * - DYNAMODB_CACHE_TABLE: DynamoDB table for content cache
 * - BATCH_SIZE: Number of items to process per invocation (default: 10)
 * - CONFIG_PATH: Optional path to configuration file
 * 
 * Requirements: 10.3, 10.4
 */

import { Context } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { PreGenerationOrchestrator } from '../pre-generation/orchestrator';
import { ProgressTracker } from '../pre-generation/tracking/progress-tracker';
import { ContentGeneratorOrchestrator } from '../pre-generation/generators/content-generator-orchestrator';
import { 
  GenerationOptions, 
  GenerationResult, 
  ArtifactMetadata,
  GenerationItem,
} from '../pre-generation/types';

/**
 * Lambda event payload
 */
export interface PreGenerationLambdaEvent {
  // Job identification
  jobId?: string;
  
  // Batch processing configuration
  batchSize?: number;
  startIndex?: number;
  
  // Generation options
  forceRegenerate?: boolean;
  languages?: string[];
  contentTypes?: string[];
  
  // Control flags
  isRecursiveInvocation?: boolean;
}

/**
 * Lambda response
 */
export interface PreGenerationLambdaResponse {
  success: boolean;
  jobId: string;
  batchProcessed: number;
  totalProcessed: number;
  totalRemaining: number;
  hasMoreItems: boolean;
  invokedNextBatch: boolean;
  duration: number;
  errors?: string[];
  result?: Partial<GenerationResult>;
}

// Lambda client for recursive invocation
const lambdaClient = new LambdaClient({});

// Environment variables
const ENV = {
  S3_BUCKET: process.env.S3_BUCKET || '',
  DYNAMODB_PROGRESS_TABLE: process.env.DYNAMODB_PROGRESS_TABLE || 'PreGenerationProgress',
  DYNAMODB_CACHE_TABLE: process.env.DYNAMODB_CACHE_TABLE || 'ContentCache',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '10', 10),
  CONFIG_PATH: process.env.CONFIG_PATH,
  LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || 'PreGenerationFunction',
  // Reserve 30 seconds for cleanup and next invocation
  TIME_BUFFER_MS: 30000,
};

/**
 * Lambda handler
 */
export const handler = async (
  event: PreGenerationLambdaEvent,
  context: Context
): Promise<PreGenerationLambdaResponse> => {
  const startTime = Date.now();
  
  console.log('Pre-Generation Lambda invoked', {
    requestId: context.awsRequestId,
    functionName: context.functionName,
    remainingTimeMs: context.getRemainingTimeInMillis(),
    event,
  });
  
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Get batch size from event or environment
    const batchSize = event.batchSize || ENV.BATCH_SIZE;
    
    // Initialize or load progress tracker
    const progressTracker = await initializeProgressTracker(event.jobId);
    const jobId = progressTracker.getJobId();
    
    console.log(`Processing job: ${jobId}`);
    
    // Get current state
    const state = progressTracker.getState();
    const stats = progressTracker.getStatistics();
    
    console.log('Job statistics:', {
      totalItems: stats.totalItems,
      completed: stats.completed,
      failed: stats.failed,
      remaining: stats.remaining,
      percentComplete: stats.percentComplete.toFixed(1) + '%',
    });
    
    // Check if job is already complete
    if (stats.remaining === 0) {
      console.log('Job already complete');
      
      return {
        success: true,
        jobId,
        batchProcessed: 0,
        totalProcessed: stats.completed,
        totalRemaining: 0,
        hasMoreItems: false,
        invokedNextBatch: false,
        duration: Date.now() - startTime,
      };
    }
    
    // Process batch of items
    const result = await processBatch(
      progressTracker,
      batchSize,
      event,
      context
    );
    
    // Get updated statistics
    const updatedStats = progressTracker.getStatistics();
    
    console.log('Batch processing complete:', {
      batchProcessed: result.succeeded + result.failed + result.skipped,
      totalProcessed: updatedStats.completed,
      totalRemaining: updatedStats.remaining,
    });
    
    // Determine if we should invoke next batch
    const hasMoreItems = updatedStats.remaining > 0;
    const remainingTime = context.getRemainingTimeInMillis();
    const shouldInvokeNext = hasMoreItems && remainingTime > ENV.TIME_BUFFER_MS;
    
    let invokedNextBatch = false;
    
    if (shouldInvokeNext) {
      console.log(`Invoking next batch (${remainingTime}ms remaining)`);
      
      try {
        await invokeNextBatch(event, jobId);
        invokedNextBatch = true;
      } catch (error) {
        console.error('Failed to invoke next batch:', error);
        // Don't fail the current batch if next invocation fails
      }
    } else if (hasMoreItems) {
      console.log(`Not invoking next batch: insufficient time (${remainingTime}ms remaining)`);
    }
    
    // Mark job as completed if no more items
    if (!hasMoreItems) {
      await progressTracker.markJobCompleted();
      console.log('Job completed successfully');
    }
    
    return {
      success: true,
      jobId,
      batchProcessed: result.succeeded + result.failed + result.skipped,
      totalProcessed: updatedStats.completed,
      totalRemaining: updatedStats.remaining,
      hasMoreItems,
      invokedNextBatch,
      duration: Date.now() - startTime,
      result: {
        totalItems: result.totalItems,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        duration: result.duration,
      },
    };
  } catch (error) {
    console.error('Lambda execution failed:', error);
    
    return {
      success: false,
      jobId: event.jobId || 'unknown',
      batchProcessed: 0,
      totalProcessed: 0,
      totalRemaining: 0,
      hasMoreItems: false,
      invokedNextBatch: false,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
};

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ['S3_BUCKET', 'DYNAMODB_PROGRESS_TABLE', 'DYNAMODB_CACHE_TABLE'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Initialize or load progress tracker
 */
async function initializeProgressTracker(jobId?: string): Promise<ProgressTracker> {
  const config = {
    storageMode: 'dynamodb' as const,
    localStorageDir: '.pre-generation', // Required but not used in DynamoDB mode
    dynamoDBTableName: ENV.DYNAMODB_PROGRESS_TABLE,
  };
  
  if (jobId) {
    // Load existing job
    console.log(`Loading existing job: ${jobId}`);
    return await ProgressTracker.load(config, jobId);
  }
  
  // Check for incomplete jobs
  const incompleteJobs = await ProgressTracker.listIncompleteJobs(config);
  
  if (incompleteJobs.length > 0) {
    // Resume the first incomplete job
    const job = incompleteJobs[0];
    console.log(`Resuming incomplete job: ${job.jobId}`);
    return await ProgressTracker.load(config, job.jobId);
  }
  
  // No existing job - this shouldn't happen in Lambda mode
  // Lambda should be invoked with a jobId or after a job is created
  throw new Error('No job ID provided and no incomplete jobs found. Lambda requires an existing job.');
}

/**
 * Process a batch of items
 */
async function processBatch(
  progressTracker: ProgressTracker,
  batchSize: number,
  event: PreGenerationLambdaEvent,
  context: Context
): Promise<GenerationResult> {
  // Initialize orchestrator
  const orchestrator = new PreGenerationOrchestrator(ENV.CONFIG_PATH);
  const config = orchestrator.getConfig();
  
  // Get remaining items
  const state = progressTracker.getState();
  const itemsToProcess = state.remainingItems.slice(0, batchSize);
  
  console.log(`Processing ${itemsToProcess.length} items`);
  
  // Build generation options
  const generationOptions: GenerationOptions = {
    languages: event.languages as any[] || config.generation.languages,
    contentTypes: event.contentTypes as any[] || config.generation.contentTypes,
    forceRegenerate: event.forceRegenerate ?? config.generation.forceRegenerate,
    dryRun: false,
    batchSize: batchSize,
    maxConcurrency: config.execution.maxConcurrency,
  };
  
  // Create content generator orchestrator
  const contentGeneratorOrchestrator = new ContentGeneratorOrchestrator(
    config,
    orchestrator['rateLimiter'],
    orchestrator['retryHandler'],
    orchestrator['contentValidator'],
    orchestrator['storageManager'],
    progressTracker
  );
  
  // Reconstruct artifacts from items
  const artifactMap = new Map<string, ArtifactMetadata>();
  
  for (const item of itemsToProcess) {
    if (!artifactMap.has(item.artifactId)) {
      // Create minimal artifact metadata
      // In a real implementation, we might want to load full metadata
      artifactMap.set(item.artifactId, {
        artifactId: item.artifactId,
        siteId: item.siteId,
        name: item.artifactId,
        type: 'unknown',
        description: '',
        historicalContext: '',
        culturalSignificance: '',
        templeGroup: '',
      });
    }
  }
  
  const artifacts = Array.from(artifactMap.values());
  
  // Process the batch
  const result = await contentGeneratorOrchestrator.generateAll(
    artifacts,
    generationOptions
  );
  
  return result;
}

/**
 * Invoke next Lambda batch
 */
async function invokeNextBatch(
  currentEvent: PreGenerationLambdaEvent,
  jobId: string
): Promise<void> {
  const nextEvent: PreGenerationLambdaEvent = {
    ...currentEvent,
    jobId,
    isRecursiveInvocation: true,
  };
  
  const command = new InvokeCommand({
    FunctionName: ENV.LAMBDA_FUNCTION_NAME,
    InvocationType: 'Event', // Async invocation
    Payload: Buffer.from(JSON.stringify(nextEvent)),
  });
  
  await lambdaClient.send(command);
  
  console.log('Next batch invoked successfully');
}
