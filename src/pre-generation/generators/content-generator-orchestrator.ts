// Content Generator Orchestrator for Pre-Generation System
// Coordinates content generation across all artifacts, languages, and content types

import {
  ArtifactMetadata,
  GenerationOptions,
  GenerationResult,
  ArtifactGenerationResult,
  GenerationFailure,
  Language,
  ContentType,
  PreGenerationConfig,
} from '../types';
import { RateLimiter } from '../utils/rate-limiter';
import { RetryHandler } from '../utils/retry-handler';
import { ContentValidator } from '../validators/content-validator';
import { StorageManager } from '../storage/storage-manager';
import { ProgressTracker } from '../tracking/progress-tracker';
import { AudioGuideGenerator } from './audio-guide-generator';
import { InfographicGenerator } from './infographic-generator';
import { QAKnowledgeBaseGenerator } from './qa-generator';
import { logger } from '../../utils/logger';

/**
 * ContentGeneratorOrchestrator coordinates the entire content generation process
 * Integrates with rate limiter, retry handler, content validator, storage manager, and progress tracker
 */
export class ContentGeneratorOrchestrator {
  private config: PreGenerationConfig;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private contentValidator: ContentValidator;
  private storageManager: StorageManager;
  private progressTracker?: ProgressTracker;
  private audioGuideGenerator: AudioGuideGenerator;
  private infographicGenerator: InfographicGenerator;
  private qaGenerator: QAKnowledgeBaseGenerator;

  // Language processing order as per requirements
  private readonly LANGUAGE_ORDER: Language[] = [
    Language.ENGLISH,
    Language.HINDI,
    Language.TAMIL,
    Language.TELUGU,
    Language.BENGALI,
    Language.MARATHI,
    Language.GUJARATI,
    Language.KANNADA,
    Language.MALAYALAM,
    Language.PUNJABI,
  ];

  // Content types to generate
  private readonly CONTENT_TYPES: ContentType[] = [
    'audio_guide',
    'video',
    'infographic',
    'qa_knowledge_base'
  ];

  constructor(
    config: PreGenerationConfig,
    rateLimiter: RateLimiter,
    retryHandler: RetryHandler,
    contentValidator: ContentValidator,
    storageManager: StorageManager,
    progressTracker?: ProgressTracker
  ) {
    this.config = config;
    this.rateLimiter = rateLimiter;
    this.retryHandler = retryHandler;
    this.contentValidator = contentValidator;
    this.storageManager = storageManager;
    this.progressTracker = progressTracker;
    this.audioGuideGenerator = new AudioGuideGenerator(config);
    this.infographicGenerator = new InfographicGenerator(config);
    this.qaGenerator = new QAKnowledgeBaseGenerator(config);
  }

  /**
   * Generate all content for all artifacts
   */
  async generateAll(
    artifacts: ArtifactMetadata[],
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const failures: GenerationFailure[] = [];
    
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    
    // Track actual metrics for cost calculation
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCharacters = 0;
    let totalFileSizeBytes = 0;
    let totalS3Requests = 0;
    let totalDynamoDBWrites = 0;

    logger.info('Starting content generation', {
      artifactCount: artifacts.length,
      languages: options.languages,
      contentTypes: options.contentTypes,
      forceRegenerate: options.forceRegenerate,
      dryRun: options.dryRun,
      jobId: this.progressTracker?.getJobId(),
    });

    console.log('\n🚀 Starting content generation...');
    console.log(`   Artifacts: ${artifacts.length}`);
    console.log(`   Languages: ${options.languages.join(', ')}`);
    console.log(`   Content Types: ${options.contentTypes.join(', ')}`);
    console.log(`   Force Regenerate: ${options.forceRegenerate}`);
    console.log(`   Dry Run: ${options.dryRun}\n`);

    // Process artifacts in order
    for (const artifact of artifacts) {
      logger.info('Processing artifact', {
        artifactId: artifact.artifactId,
        artifactName: artifact.name,
        siteId: artifact.siteId,
        templeGroup: artifact.templeGroup,
      });
      
      console.log(`\n📦 Processing artifact: ${artifact.name} (${artifact.artifactId})`);
      
      // Process languages in specified order
      const languagesToProcess = this.LANGUAGE_ORDER.filter(lang => 
        options.languages.includes(lang)
      );

      for (const language of languagesToProcess) {
        console.log(`  🌐 Language: ${language}`);
        
        // Process all content types for this artifact-language combination
        const contentTypesToProcess = options.contentTypes;

        for (const contentType of contentTypesToProcess) {
          try {
            logger.debug('Generating content', {
              artifactId: artifact.artifactId,
              language,
              contentType,
            });
            
            const result = await this.generateForArtifactLanguageContent(
              artifact,
              language,
              contentType,
              options
            );

            if (result.success) {
              if (result.skipped) {
                skipped++;
                logger.info('Content skipped (cached)', {
                  artifactId: artifact.artifactId,
                  language,
                  contentType,
                });
                console.log(`    ⏭️  ${contentType}: Skipped (cached)`);
              } else {
                succeeded++;
                logger.info('Content generated successfully', {
                  artifactId: artifact.artifactId,
                  language,
                  contentType,
                  duration: result.duration,
                  s3Key: result.s3Key,
                });
                console.log(`    ✅ ${contentType}: Generated (${result.duration}ms)`);
                
                // Aggregate actual metrics
                if (result.actualMetrics) {
                  totalInputTokens += result.actualMetrics.inputTokens || 0;
                  totalOutputTokens += result.actualMetrics.outputTokens || 0;
                  totalCharacters += result.actualMetrics.characters || 0;
                  totalFileSizeBytes += result.actualMetrics.fileSizeBytes || 0;
                  totalS3Requests += 1; // One PUT request per successful upload
                  totalDynamoDBWrites += 2; // Cache entry + progress entry
                }
              }
            } else {
              failed++;
              logger.error('Content generation failed', {
                artifactId: artifact.artifactId,
                language,
                contentType,
                error: result.error,
                retryCount: result.retryCount,
              });
              console.log(`    ❌ ${contentType}: Failed - ${result.error}`);
              
              failures.push({
                artifactId: artifact.artifactId,
                language,
                contentType,
                error: result.error || 'Unknown error',
                retryCount: result.retryCount,
                timestamp: new Date().toISOString(),
              });
            }

            // Update progress tracker if available
            if (this.progressTracker) {
              if (result.success) {
                if (result.skipped) {
                  await this.progressTracker.markSkipped({
                    artifactId: artifact.artifactId,
                    siteId: artifact.siteId,
                    language,
                    contentType,
                    status: 'skipped',
                    s3Key: result.s3Key,
                    retryCount: 0,
                    timestamp: new Date().toISOString(),
                  });
                } else {
                  await this.progressTracker.markCompleted({
                    artifactId: artifact.artifactId,
                    siteId: artifact.siteId,
                    language,
                    contentType,
                    status: 'completed',
                    s3Key: result.s3Key,
                    retryCount: result.retryCount,
                    timestamp: new Date().toISOString(),
                  });
                }
              } else {
                await this.progressTracker.markFailed(
                  {
                    artifactId: artifact.artifactId,
                    siteId: artifact.siteId,
                    language,
                    contentType,
                    status: 'failed',
                    retryCount: result.retryCount,
                    timestamp: new Date().toISOString(),
                  },
                  result.error
                );
              }
            }
          } catch (error) {
            failed++;
            const errorMessage = (error as Error).message;
            logger.error('Content generation exception', {
              artifactId: artifact.artifactId,
              language,
              contentType,
              error: errorMessage,
            }, error as Error);
            console.log(`    ❌ ${contentType}: Exception - ${errorMessage}`);
            
            failures.push({
              artifactId: artifact.artifactId,
              language,
              contentType,
              error: errorMessage,
              retryCount: 0,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    const totalItems = artifacts.length * options.languages.length * options.contentTypes.length;

    logger.info('Content generation complete', {
      totalItems,
      succeeded,
      failed,
      skipped,
      duration,
      jobId: this.progressTracker?.getJobId(),
    });

    console.log('\n' + '='.repeat(80));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total Items: ${totalItems}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Duration: ${this.formatDuration(duration)}`);
    console.log('='.repeat(80) + '\n');

    return {
      totalItems,
      succeeded,
      failed,
      skipped,
      duration,
      estimatedCost: 0, // Will be calculated by cost estimator
      actualCost: 0, // Will be calculated based on actual usage
      failures,
      actualMetrics: {
        totalInputTokens,
        totalOutputTokens,
        totalCharacters,
        totalFileSizeBytes,
        totalS3Requests,
        totalDynamoDBWrites,
      },
    };
  }

  /**
   * Generate content for specific artifact, language, and content type
   */
  private async generateForArtifactLanguageContent(
    artifact: ArtifactMetadata,
    language: Language,
    contentType: ContentType,
    options: GenerationOptions
  ): Promise<ArtifactGenerationResult & { skipped?: boolean }> {
    const startTime = Date.now();

    // Check if dry run
    if (options.dryRun) {
      return {
        artifactId: artifact.artifactId,
        language,
        contentType,
        success: true,
        skipped: false,
        retryCount: 0,
        duration: Date.now() - startTime,
      };
    }

    try {
      // Check cache before generation (skip if < 30 days old unless force mode enabled)
      const shouldRegenerate = await this.storageManager.shouldRegenerate(
        artifact.siteId,
        artifact.artifactId,
        language,
        contentType,
        options.forceRegenerate
      );

      if (!shouldRegenerate) {
        logger.debug('Content already cached, skipping regeneration', {
          artifactId: artifact.artifactId,
          language,
          contentType,
        });
        
        return {
          artifactId: artifact.artifactId,
          language,
          contentType,
          success: true,
          skipped: true,
          retryCount: 0,
          duration: Date.now() - startTime,
        };
      }

      // Generate content with retry logic
      const result = await this.retryHandler.executeWithRetry(
        async () => {
          // Generate content based on type
          const content = await this.generateContent(artifact, language, contentType);

          // Validate content
          const validation = await this.contentValidator.validate(
            content,
            contentType,
            language
          );

          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }

          // Store content
          const storageResult = await this.storageManager.storeContent({
            content,
            artifactId: artifact.artifactId,
            siteId: artifact.siteId,
            templeGroup: artifact.templeGroup,
            language,
            contentType,
            mimeType: this.getMimeType(contentType),
            generationJobId: this.progressTracker?.getJobId() || 'unknown',
            generationDuration: Date.now() - startTime,
            bedrockModelId: this.config.aws.bedrock.modelId,
          });

          return { storageResult, content };
        },
        this.getServiceForContentType(contentType),
        `Generate ${contentType} for ${artifact.artifactId} (${language})`
      );

      if (result.success && result.data) {
        const { storageResult, content } = result.data;
        
        // Estimate actual metrics for cost calculation
        const actualMetrics = this.estimateActualMetrics(
          content,
          contentType,
          storageResult.fileSize
        );
        
        return {
          artifactId: artifact.artifactId,
          language,
          contentType,
          success: true,
          s3Key: storageResult.s3Key,
          cdnUrl: storageResult.cdnUrl,
          retryCount: result.attempts - 1,
          duration: Date.now() - startTime,
          actualMetrics,
        };
      } else {
        return {
          artifactId: artifact.artifactId,
          language,
          contentType,
          success: false,
          error: result.error?.message || 'Unknown error',
          retryCount: result.attempts - 1,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      // Catch any unexpected errors not handled by retry logic
      const errorMessage = (error as Error).message;
      logger.error('Unexpected error in content generation', {
        artifactId: artifact.artifactId,
        language,
        contentType,
        error: errorMessage,
      }, error as Error);
      
      return {
        artifactId: artifact.artifactId,
        language,
        contentType,
        success: false,
        error: errorMessage,
        retryCount: 0,
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Estimate actual metrics for cost calculation
   * 
   * Uses heuristics to estimate token counts and character counts based on content type
   * File size is actual from storage
   */
  private estimateActualMetrics(
    content: Buffer,
    contentType: ContentType,
    fileSizeBytes: number
  ): {
    inputTokens?: number;
    outputTokens?: number;
    characters?: number;
    fileSizeBytes: number;
  } {
    const metrics: {
      inputTokens?: number;
      outputTokens?: number;
      characters?: number;
      fileSizeBytes: number;
    } = {
      fileSizeBytes,
    };
    
    // Estimate based on content type
    switch (contentType) {
      case 'audio_guide':
        // Audio uses Polly, estimate character count
        // Typical audio guide script: ~1000 characters
        metrics.characters = 1000;
        break;
        
      case 'video':
      case 'infographic':
      case 'qa_knowledge_base':
        // These use Bedrock, estimate token counts
        // Input: artifact metadata (~500 tokens)
        // Output: generated content (~1500 tokens)
        metrics.inputTokens = 500;
        metrics.outputTokens = 1500;
        break;
    }
    
    return metrics;
  }

  /**
   * Generate content based on type (placeholder implementations)
   * These will be replaced with actual generators in subsequent tasks
   */
  private async generateContent(
    artifact: ArtifactMetadata,
    language: Language,
    contentType: ContentType
  ): Promise<Buffer> {
    switch (contentType) {
      case 'audio_guide':
        return this.generateAudioGuide(artifact, language);
      case 'video':
        return this.generateVideo(artifact, language);
      case 'infographic':
        return this.generateInfographic(artifact, language);
      case 'qa_knowledge_base':
        return this.generateQAKnowledgeBase(artifact, language);
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
  }

  /**
   * Generate audio guide (placeholder)
   * TODO: Implement actual audio generation using AWS Polly
   */
  private async generateAudioGuide(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Use AudioGuideGenerator to generate audio guide via AWS Polly
    return await this.audioGuideGenerator.generateAudioGuide(artifact, language);
  }

  /**
   * Generate video (placeholder)
   * TODO: Implement actual video generation using AWS Bedrock
   */
  private async generateVideo(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Placeholder: Generate mock MP4 content
    // In actual implementation, this will use AWS Bedrock for video generation
    
    const mockMP4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, // Box size
      0x66, 0x74, 0x79, 0x70, // 'ftyp' box
      0x69, 0x73, 0x6F, 0x6D, // 'isom' brand
    ]);
    
    // Create a buffer with MP4 header and some mock data
    const mockData = Buffer.alloc(500000); // ~500KB for ~80 seconds at 5Mbps
    mockMP4Header.copy(mockData, 0);
    
    return mockData;
  }

  /**
   * Generate infographic using InfographicGenerator
   */
  private async generateInfographic(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Use InfographicGenerator to generate infographic via AWS Bedrock
    return await this.infographicGenerator.generateInfographic(artifact, language);
  }

  /**
   * Generate Q&A knowledge base using QAKnowledgeBaseGenerator
   */
  private async generateQAKnowledgeBase(
    artifact: ArtifactMetadata,
    language: Language
  ): Promise<Buffer> {
    // Use QAKnowledgeBaseGenerator to generate Q&A pairs via AWS Bedrock
    return await this.qaGenerator.generateQAKnowledgeBase(artifact, language);
  }

  /**
   * Get MIME type for content type
   */
  private getMimeType(contentType: ContentType): string {
    const mimeTypes: Record<ContentType, string> = {
      audio_guide: 'audio/mpeg',
      video: 'video/mp4',
      infographic: 'image/png',
      qa_knowledge_base: 'application/json',
    };

    return mimeTypes[contentType];
  }

  /**
   * Get AWS service for content type (for rate limiting)
   */
  private getServiceForContentType(contentType: ContentType): 'bedrock' | 'polly' | 's3' | 'dynamodb' {
    switch (contentType) {
      case 'audio_guide':
        return 'polly';
      case 'video':
      case 'infographic':
      case 'qa_knowledge_base':
        return 'bedrock';
      default:
        return 'bedrock';
    }
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
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
