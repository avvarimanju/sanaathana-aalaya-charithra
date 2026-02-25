/**
 * Pre-Generation Orchestrator
 * 
 * Main orchestrator that coordinates all components of the content pre-generation system:
 * - Configuration loading
 * - Artifact discovery and loading
 * - Progress tracking and resumption
 * - Cost estimation and user confirmation
 * - Content generation coordination
 * - Storage management
 * - Report generation
 * 
 * Supports both local and Lambda execution modes.
 * 
 * Requirements: 5.5, 6.3, 6.4, 10.1, 10.2
 */

import * as readline from 'readline';
import { ConfigLoader } from './config/config-loader';
import { ArtifactLoader } from './loaders/artifact-loader';
import { ProgressTracker } from './tracking/progress-tracker';
import { CostEstimator } from './utils/cost-estimator';
import { RateLimiter } from './utils/rate-limiter';
import { RetryHandler } from './utils/retry-handler';
import { ContentValidator } from './validators/content-validator';
import { StorageManager } from './storage/storage-manager';
import { ContentGeneratorOrchestrator } from './generators/content-generator-orchestrator';
import { ReportGenerator } from './reporting/report-generator';
import { logger } from '../utils/logger';
import {
  PreGenerationConfig,
  ArtifactMetadata,
  ArtifactFilter,
  GenerationOptions,
  GenerationResult,
  GenerationItem,
  Language,
  ContentType,
  CostEstimate,
} from './types';

/**
 * Orchestrator options for customizing execution
 */
export interface OrchestratorOptions {
  // Filters
  templeGroups?: string[];
  artifactIds?: string[];
  siteIds?: string[];
  languages?: Language[];
  contentTypes?: ContentType[];
  
  // Execution options
  forceRegenerate?: boolean;
  dryRun?: boolean;
  skipConfirmation?: boolean;
  resumeJobId?: string;
  
  // Output options
  reportFormats?: ('json' | 'csv' | 'html')[];
  outputDir?: string;
}

/**
 * PreGenerationOrchestrator
 * 
 * Main orchestrator class that ties together all components
 */
export class PreGenerationOrchestrator {
  private config: PreGenerationConfig;
  private configLoader: ConfigLoader;
  private artifactLoader: ArtifactLoader;
  private costEstimator: CostEstimator;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private contentValidator: ContentValidator;
  private storageManager: StorageManager;
  private reportGenerator: ReportGenerator;
  private progressTracker?: ProgressTracker;
  
  constructor(configPath?: string) {
    // Initialize configuration loader
    this.configLoader = new ConfigLoader(configPath);
    this.config = this.configLoader.loadConfig();
    
    // Initialize components
    this.artifactLoader = new ArtifactLoader();
    this.costEstimator = new CostEstimator();
    
    // Build RateLimitConfig from config
    const rateLimitConfig = {
      bedrock: {
        requestsPerSecond: this.config.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: this.config.rateLimits.polly,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      s3: {
        requestsPerSecond: this.config.rateLimits.s3,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      dynamodb: {
        requestsPerSecond: this.config.rateLimits.dynamodb,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
    };
    
    this.rateLimiter = new RateLimiter(rateLimitConfig);
    
    // Build RetryConfig from config
    const retryConfig = {
      maxAttempts: this.config.retry.maxAttempts,
      initialDelayMs: this.config.retry.initialDelay,
      maxDelayMs: this.config.retry.maxDelay,
      backoffMultiplier: this.config.retry.backoffMultiplier,
      jitter: this.config.retry.jitter ? 0.1 : 0,
    };
    
    this.retryHandler = new RetryHandler(retryConfig, this.rateLimiter);
    
    // Build ValidationConfig from config
    const validationConfig = {
      audio: this.config.validation.audio,
      video: this.config.validation.video,
      infographic: this.config.validation.infographic,
      qaKnowledgeBase: this.config.validation.qaKnowledgeBase,
    };
    
    this.contentValidator = new ContentValidator(validationConfig);
    this.storageManager = new StorageManager(this.config);
    this.reportGenerator = new ReportGenerator(
      this.config.reporting.outputDir
    );
    
    logger.info('Pre-Generation Orchestrator initialized', {
      executionMode: this.config.execution.mode,
      awsRegion: this.config.aws.region,
      s3Bucket: this.config.aws.s3.bucket,
    });
    
    console.log('✅ Pre-Generation Orchestrator initialized');
    console.log(`   Execution Mode: ${this.config.execution.mode}`);
    console.log(`   AWS Region: ${this.config.aws.region}`);
    console.log(`   S3 Bucket: ${this.config.aws.s3.bucket}`);
  }
  
  /**
   * Execute the pre-generation process
   * 
   * Main entry point for the orchestrator
   */
  async execute(options: OrchestratorOptions = {}): Promise<GenerationResult> {
    const startTime = new Date();
    
    logger.info('Starting pre-generation job', {
      startTime: startTime.toISOString(),
      options: {
        templeGroups: options.templeGroups,
        artifactIds: options.artifactIds,
        languages: options.languages,
        contentTypes: options.contentTypes,
        forceRegenerate: options.forceRegenerate,
        dryRun: options.dryRun,
      },
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('CONTENT PRE-GENERATION SYSTEM');
    console.log('='.repeat(80));
    console.log(`Start Time: ${startTime.toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
    
    try {
      // Step 1: Check for existing incomplete jobs and offer resumption
      const shouldResume = await this.checkForResumption(options);
      
      if (shouldResume && options.resumeJobId) {
        return await this.resumeJob(options.resumeJobId, options);
      }
      
      // Step 2: Load artifacts
      const artifacts = await this.loadArtifacts(options);
      
      if (artifacts.length === 0) {
        console.log('⚠️  No artifacts to process after applying filters.');
        return this.createEmptyResult();
      }
      
      // Step 3: Build generation options
      const generationOptions = this.buildGenerationOptions(options);
      
      // Step 4: Calculate cost estimate
      const costEstimate = await this.calculateCostEstimate(
        artifacts,
        generationOptions
      );
      
      // Step 5: Display cost estimate and require user confirmation
      if (!options.skipConfirmation && !options.dryRun) {
        const confirmed = await this.getUserConfirmation(costEstimate);
        
        if (!confirmed) {
          console.log('\n❌ Generation cancelled by user.');
          return this.createEmptyResult();
        }
      }
      
      // Step 6: Initialize progress tracker
      await this.initializeProgressTracker(artifacts, generationOptions);
      
      // Step 7: Execute content generation
      const result = await this.executeGeneration(
        artifacts,
        generationOptions
      );
      
      // Step 8: Generate reports
      await this.generateReports(
        result,
        costEstimate.breakdown,
        startTime,
        options
      );
      
      // Step 9: Mark job as completed
      if (this.progressTracker) {
        await this.progressTracker.markJobCompleted();
      }
      
      // Step 10: Display final summary
      this.displayFinalSummary(result, costEstimate.breakdown, startTime);
      
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error('Pre-generation job failed', {
        error: errorMessage,
        startTime: startTime.toISOString(),
      }, error as Error);
      
      console.error('\n❌ Pre-generation failed with error:', error);
      
      if (this.progressTracker) {
        await this.progressTracker.markJobFailed();
      }
      
      throw error;
    }
  }
  
  /**
   * Check for existing incomplete jobs and offer resumption
   */
  private async checkForResumption(
    options: OrchestratorOptions
  ): Promise<boolean> {
    // If user explicitly provided a job ID to resume, return true
    if (options.resumeJobId) {
      return true;
    }
    
    // Check for incomplete jobs
    const incompleteJobs = await ProgressTracker.listIncompleteJobs({
      storageMode: this.config.execution.mode === 'lambda' ? 'dynamodb' : 'local',
      localStorageDir: '.pre-generation',
      dynamoDBTableName: this.config.aws.dynamodb.progressTable,
    });
    
    if (incompleteJobs.length === 0) {
      return false;
    }
    
    console.log(`\n📋 Found ${incompleteJobs.length} incomplete job(s):`);
    incompleteJobs.forEach((job, index) => {
      const stats = this.calculateJobStats(job);
      console.log(`\n  ${index + 1}. Job ID: ${job.jobId}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Started: ${new Date(job.startTime).toLocaleString()}`);
      console.log(`     Progress: ${stats.completed}/${stats.total} (${stats.percentComplete.toFixed(1)}%)`);
      console.log(`     Failed: ${stats.failed}`);
    });
    
    // If skip confirmation is enabled, don't prompt for resumption
    if (options.skipConfirmation) {
      return false;
    }
    
    // Ask user if they want to resume
    const shouldResume = await this.promptYesNo(
      '\nWould you like to resume an incomplete job? (y/n): '
    );
    
    if (shouldResume) {
      // If only one job, resume it automatically
      if (incompleteJobs.length === 1) {
        options.resumeJobId = incompleteJobs[0].jobId;
        return true;
      }
      
      // Otherwise, ask which job to resume
      const jobIndex = await this.promptNumber(
        `\nEnter job number to resume (1-${incompleteJobs.length}): `,
        1,
        incompleteJobs.length
      );
      
      options.resumeJobId = incompleteJobs[jobIndex - 1].jobId;
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate job statistics from progress state
   */
  private calculateJobStats(job: any): {
    total: number;
    completed: number;
    failed: number;
    remaining: number;
    percentComplete: number;
  } {
    const total = job.totalItems || 0;
    const completed = job.completedItems?.length || 0;
    const failed = job.failedItems?.length || 0;
    const remaining = job.remainingItems?.length || 0;
    const percentComplete = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, failed, remaining, percentComplete };
  }
  
  /**
   * Resume an incomplete job
   */
  private async resumeJob(
    jobId: string,
    options: OrchestratorOptions
  ): Promise<GenerationResult> {
    console.log(`\n🔄 Resuming job: ${jobId}`);
    
    // Load progress tracker
    this.progressTracker = await ProgressTracker.load(
      {
        storageMode: this.config.execution.mode === 'lambda' ? 'dynamodb' : 'local',
        localStorageDir: '.pre-generation',
        dynamoDBTableName: this.config.aws.dynamodb.progressTable,
      },
      jobId
    );
    
    const state = this.progressTracker.getState();
    const stats = this.progressTracker.getStatistics();
    
    console.log(`\n📊 Job Status:`);
    console.log(`   Total Items: ${stats.totalItems}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Remaining: ${stats.remaining}`);
    console.log(`   Progress: ${stats.percentComplete.toFixed(1)}%\n`);
    
    // Build generation options from remaining items
    const generationOptions = this.buildGenerationOptions(options);
    
    // Create content generator orchestrator
    const contentGeneratorOrchestrator = new ContentGeneratorOrchestrator(
      this.config,
      this.rateLimiter,
      this.retryHandler,
      this.contentValidator,
      this.storageManager,
      this.progressTracker
    );
    
    // Process remaining items
    // We need to reconstruct artifacts from remaining items
    const artifactMap = new Map<string, ArtifactMetadata>();
    
    for (const item of state.remainingItems) {
      if (!artifactMap.has(item.artifactId)) {
        // Create minimal artifact metadata
        artifactMap.set(item.artifactId, {
          artifactId: item.artifactId,
          siteId: item.siteId,
          name: item.artifactId, // Use ID as name for now
          type: 'unknown',
          description: '',
          historicalContext: '',
          culturalSignificance: '',
          templeGroup: '',
        });
      }
    }
    
    const artifacts = Array.from(artifactMap.values());
    
    // Execute generation for remaining items
    const result = await contentGeneratorOrchestrator.generateAll(
      artifacts,
      generationOptions
    );
    
    // Generate reports
    const startTime = new Date(state.startTime);
    const costEstimate = await this.calculateCostEstimate(artifacts, generationOptions);
    
    await this.generateReports(
      result,
      costEstimate.breakdown,
      startTime,
      options
    );
    
    // Mark job as completed
    await this.progressTracker.markJobCompleted();
    
    // Display final summary
    this.displayFinalSummary(result, costEstimate.breakdown, startTime);
    
    return result;
  }
  
  /**
   * Load artifacts with optional filters
   */
  private async loadArtifacts(
    options: OrchestratorOptions
  ): Promise<ArtifactMetadata[]> {
    logger.info('Loading artifacts', {
      filters: {
        templeGroups: options.templeGroups,
        artifactIds: options.artifactIds,
        siteIds: options.siteIds,
      },
    });
    
    console.log('📦 Loading artifacts...');
    
    // Load all artifacts
    const allArtifacts = await this.artifactLoader.loadArtifacts();
    
    // Apply filters if provided
    const filter: ArtifactFilter = {
      templeGroups: options.templeGroups,
      artifactIds: options.artifactIds,
      siteIds: options.siteIds,
    };
    
    const hasFilters = 
      filter.templeGroups?.length || 
      filter.artifactIds?.length || 
      filter.siteIds?.length;
    
    if (hasFilters) {
      const filtered = this.artifactLoader.filterArtifacts(filter);
      logger.info('Artifacts filtered', {
        totalArtifacts: allArtifacts.length,
        filteredArtifacts: filtered.length,
      });
      console.log(`   Filtered: ${allArtifacts.length} → ${filtered.length} artifacts`);
      return filtered;
    }
    
    logger.info('Artifacts loaded', {
      totalArtifacts: allArtifacts.length,
    });
    
    return allArtifacts;
  }
  
  /**
   * Build generation options from orchestrator options
   */
  private buildGenerationOptions(
    options: OrchestratorOptions
  ): GenerationOptions {
    return {
      languages: options.languages || this.config.generation.languages,
      contentTypes: options.contentTypes || this.config.generation.contentTypes,
      forceRegenerate: options.forceRegenerate ?? this.config.generation.forceRegenerate,
      dryRun: options.dryRun ?? false,
      batchSize: this.config.execution.batchSize,
      maxConcurrency: this.config.execution.maxConcurrency,
    };
  }
  
  /**
   * Calculate cost estimate
   */
  private async calculateCostEstimate(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): Promise<CostEstimate> {
    console.log('\n💰 Calculating cost estimate...');
    
    const estimate = this.costEstimator.estimateCost(artifacts, options);
    
    console.log('\n' + '─'.repeat(80));
    console.log('COST ESTIMATE');
    console.log('─'.repeat(80));
    console.log(`Total Items:        ${estimate.itemCount}`);
    console.log(`Estimated Duration: ${this.formatDuration(estimate.estimatedDuration)}`);
    console.log('');
    console.log('Cost Breakdown:');
    console.log(`  Bedrock (AI):     $${estimate.breakdown.bedrockCost.toFixed(4)} USD`);
    console.log(`  Polly (Audio):    $${estimate.breakdown.pollyCost.toFixed(4)} USD`);
    console.log(`  S3 Storage:       $${estimate.breakdown.s3StorageCost.toFixed(4)} USD`);
    console.log(`  S3 Requests:      $${estimate.breakdown.s3RequestCost.toFixed(4)} USD`);
    console.log(`  DynamoDB:         $${estimate.breakdown.dynamoDBCost.toFixed(4)} USD`);
    console.log('  ' + '─'.repeat(40));
    console.log(`  Total (USD):      $${estimate.totalCostUSD.toFixed(4)} USD`);
    console.log(`  Total (INR):      ₹${estimate.totalCostINR.toFixed(2)} INR`);
    console.log('─'.repeat(80) + '\n');
    
    return estimate;
  }
  
  /**
   * Get user confirmation for cost approval
   */
  private async getUserConfirmation(estimate: CostEstimate): Promise<boolean> {
    console.log('⚠️  This operation will incur AWS service costs.');
    console.log(`   Estimated cost: $${estimate.totalCostUSD.toFixed(4)} USD (₹${estimate.totalCostINR.toFixed(2)} INR)`);
    console.log(`   Estimated duration: ${this.formatDuration(estimate.estimatedDuration)}`);
    console.log('');
    
    return await this.promptYesNo('Do you want to proceed? (y/n): ');
  }
  
  /**
   * Initialize progress tracker
   */
  private async initializeProgressTracker(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): Promise<void> {
    console.log('\n📊 Initializing progress tracker...');
    
    // Create progress tracker
    this.progressTracker = new ProgressTracker({
      storageMode: this.config.execution.mode === 'lambda' ? 'dynamodb' : 'local',
      localStorageDir: '.pre-generation',
      dynamoDBTableName: this.config.aws.dynamodb.progressTable,
    });
    
    // Build list of all items to process
    const items: GenerationItem[] = [];
    
    for (const artifact of artifacts) {
      for (const language of options.languages) {
        for (const contentType of options.contentTypes) {
          items.push({
            artifactId: artifact.artifactId,
            siteId: artifact.siteId,
            language,
            contentType,
            status: 'pending',
            retryCount: 0,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
    
    await this.progressTracker.initialize(items);
    
    console.log(`   Job ID: ${this.progressTracker.getJobId()}`);
    console.log(`   Total Items: ${items.length}`);
  }
  
  /**
   * Execute content generation
   */
  private async executeGeneration(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): Promise<GenerationResult> {
    console.log('\n🚀 Starting content generation...\n');
    
    // Create content generator orchestrator
    const contentGeneratorOrchestrator = new ContentGeneratorOrchestrator(
      this.config,
      this.rateLimiter,
      this.retryHandler,
      this.contentValidator,
      this.storageManager,
      this.progressTracker
    );
    
    // Execute generation
    const result = await contentGeneratorOrchestrator.generateAll(
      artifacts,
      options
    );
    
    // Display progress summary
    if (this.progressTracker) {
      this.progressTracker.printSummary();
    }
    
    return result;
  }
  
  /**
   * Generate reports
   */
  private async generateReports(
    result: GenerationResult,
    estimatedCost: any,
    startTime: Date,
    options: OrchestratorOptions
  ): Promise<void> {
    console.log('\n📄 Generating reports...');
    
    const formats = options.reportFormats || this.config.reporting.formats;
    
    const reportPaths = await this.reportGenerator.generateAllReports(
      result,
      estimatedCost,
      startTime,
      formats
    );
    
    console.log(`   Generated ${reportPaths.length} report file(s):`);
    reportPaths.forEach(path => console.log(`   - ${path}`));
  }
  
  /**
   * Display final summary
   */
  private displayFinalSummary(
    result: GenerationResult,
    estimatedCost: any,
    startTime: Date
  ): void {
    const endTime = new Date();
    const actualCost = this.costEstimator.calculateActualCost(result);
    
    const summary = this.reportGenerator.generateConsoleSummary(
      result,
      estimatedCost,
      actualCost,
      startTime,
      endTime
    );
    
    console.log(summary);
  }
  
  /**
   * Create empty result for cancelled or no-op executions
   */
  private createEmptyResult(): GenerationResult {
    return {
      totalItems: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      estimatedCost: 0,
      actualCost: 0,
      failures: [],
    };
  }
  
  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms === 0) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Prompt user for yes/no confirmation
   */
  private async promptYesNo(question: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        const normalized = answer.trim().toLowerCase();
        resolve(normalized === 'y' || normalized === 'yes');
      });
    });
  }
  
  /**
   * Prompt user for a number within a range
   */
  private async promptNumber(
    question: string,
    min: number,
    max: number
  ): Promise<number> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    return new Promise((resolve) => {
      const ask = () => {
        rl.question(question, (answer) => {
          const num = parseInt(answer.trim(), 10);
          
          if (isNaN(num) || num < min || num > max) {
            console.log(`Please enter a number between ${min} and ${max}.`);
            ask();
          } else {
            rl.close();
            resolve(num);
          }
        });
      };
      
      ask();
    });
  }
  
  /**
   * Get configuration
   */
  public getConfig(): PreGenerationConfig {
    return this.config;
  }
  
  /**
   * Get progress tracker (if initialized)
   */
  public getProgressTracker(): ProgressTracker | undefined {
    return this.progressTracker;
  }
}
