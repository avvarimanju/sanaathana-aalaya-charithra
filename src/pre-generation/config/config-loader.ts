// Configuration Loader for Pre-Generation System
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PreGenerationConfig } from '../types';
import { Language } from '../../models/common';

export class ConfigLoader {
  private config: PreGenerationConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'pre-generation.yaml');
  }

  /**
   * Load configuration from YAML file
   */
  public loadConfig(): PreGenerationConfig {
    if (this.config) {
      return this.config;
    }

    try {
      // Check if config file exists
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Configuration file not found at ${this.configPath}, using defaults`);
        this.config = this.getDefaultConfig();
        return this.config;
      }

      // Read and parse YAML file
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      const rawConfig = yaml.load(fileContents) as any;

      // Merge with defaults and apply environment variable overrides
      this.config = this.mergeWithDefaults(rawConfig);
      this.applyEnvironmentOverrides(this.config);
      
      // Validate configuration
      this.validateConfig(this.config);

      console.log('Configuration loaded successfully from', this.configPath);
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      console.warn('Using default configuration');
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PreGenerationConfig {
    return {
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        s3: {
          bucket: process.env.CONTENT_BUCKET || 'sanaathana-aalaya-charithra-content',
          encryption: 'AES256',
        },
        dynamodb: {
          progressTable: 'PreGenerationProgress',
          cacheTable: 'SanaathanaAalayaCharithra-ContentCache',
        },
        bedrock: {
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          maxTokens: 2048,
          temperature: 0.7,
        },
        polly: {
          engine: 'neural',
          voiceMapping: {
            en: 'Joanna',
            hi: 'Aditi',
            ta: null,
            te: null,
            bn: null,
            mr: null,
            gu: null,
            kn: null,
            ml: null,
            pa: null,
          },
        },
      },
      generation: {
        languages: [
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
        ],
        contentTypes: ['audio_guide', 'video', 'infographic', 'qa_knowledge_base'],
        forceRegenerate: false,
        skipExisting: true,
        cacheMaxAge: 2592000, // 30 days
      },
      rateLimits: {
        bedrock: 10,
        polly: 100,
        s3: 3500,
        dynamodb: 1000,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
      },
      validation: {
        audio: {
          minDuration: 30,
          maxDuration: 300,
        },
        video: {
          minDuration: 60,
          maxDuration: 600,
          expectedDimensions: {
            width: 1920,
            height: 1080,
          },
        },
        infographic: {
          minResolution: {
            width: 1200,
            height: 800,
          },
        },
        qaKnowledgeBase: {
          minQuestionCount: 5,
        },
      },
      execution: {
        mode: 'local',
        batchSize: 10,
        maxConcurrency: 5,
        timeout: 300000,
      },
      reporting: {
        outputDir: './reports',
        formats: ['json', 'csv', 'html'],
      },
    };
  }

  /**
   * Resolve environment variables in string values
   * Supports ${VAR} and ${VAR:default} syntax
   */
  private resolveEnvVars(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    // Match ${VAR} or ${VAR:default}
    return value.replace(/\$\{([^:}]+)(?::([^}]+))?\}/g, (match, varName, defaultValue) => {
      const envValue = process.env[varName];
      if (envValue !== undefined) {
        return envValue;
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      // If no env var and no default, return the original match
      return match;
    });
  }

  /**
   * Merge raw config with defaults
   */
  private mergeWithDefaults(rawConfig: any): PreGenerationConfig {
    const defaults = this.getDefaultConfig();

    return {
      aws: {
        region: rawConfig.aws?.region || defaults.aws.region,
        s3: {
          bucket: this.resolveEnvVars(rawConfig.aws?.s3?.bucket || defaults.aws.s3.bucket),
          encryption: rawConfig.aws?.s3?.encryption || defaults.aws.s3.encryption,
        },
        dynamodb: {
          progressTable: rawConfig.aws?.dynamodb?.progressTable || defaults.aws.dynamodb.progressTable,
          cacheTable: rawConfig.aws?.dynamodb?.cacheTable || defaults.aws.dynamodb.cacheTable,
        },
        bedrock: {
          modelId: rawConfig.aws?.bedrock?.modelId || defaults.aws.bedrock.modelId,
          maxTokens: rawConfig.aws?.bedrock?.maxTokens || defaults.aws.bedrock.maxTokens,
          temperature: rawConfig.aws?.bedrock?.temperature || defaults.aws.bedrock.temperature,
        },
        polly: {
          engine: rawConfig.aws?.polly?.engine || defaults.aws.polly.engine,
          voiceMapping: rawConfig.aws?.polly?.voiceMapping || defaults.aws.polly.voiceMapping,
        },
      },
      generation: {
        languages: rawConfig.generation?.languages || defaults.generation.languages,
        contentTypes: rawConfig.generation?.contentTypes || defaults.generation.contentTypes,
        forceRegenerate: rawConfig.generation?.forceRegenerate ?? defaults.generation.forceRegenerate,
        skipExisting: rawConfig.generation?.skipExisting ?? defaults.generation.skipExisting,
        cacheMaxAge: rawConfig.generation?.cacheMaxAge || defaults.generation.cacheMaxAge,
      },
      rateLimits: {
        bedrock: rawConfig.rateLimits?.bedrock || defaults.rateLimits.bedrock,
        polly: rawConfig.rateLimits?.polly || defaults.rateLimits.polly,
        s3: rawConfig.rateLimits?.s3 || defaults.rateLimits.s3,
        dynamodb: rawConfig.rateLimits?.dynamodb || defaults.rateLimits.dynamodb,
      },
      retry: {
        maxAttempts: rawConfig.retry?.maxAttempts || defaults.retry.maxAttempts,
        initialDelay: rawConfig.retry?.initialDelay || defaults.retry.initialDelay,
        maxDelay: rawConfig.retry?.maxDelay || defaults.retry.maxDelay,
        backoffMultiplier: rawConfig.retry?.backoffMultiplier || defaults.retry.backoffMultiplier,
        jitter: rawConfig.retry?.jitter ?? defaults.retry.jitter,
      },
      validation: {
        audio: {
          minDuration: rawConfig.validation?.audio?.minDuration || defaults.validation.audio.minDuration,
          maxDuration: rawConfig.validation?.audio?.maxDuration || defaults.validation.audio.maxDuration,
        },
        video: {
          minDuration: rawConfig.validation?.video?.minDuration || defaults.validation.video.minDuration,
          maxDuration: rawConfig.validation?.video?.maxDuration || defaults.validation.video.maxDuration,
          expectedDimensions: {
            width: rawConfig.validation?.video?.expectedDimensions?.width || defaults.validation.video.expectedDimensions.width,
            height: rawConfig.validation?.video?.expectedDimensions?.height || defaults.validation.video.expectedDimensions.height,
          },
        },
        infographic: {
          minResolution: {
            width: rawConfig.validation?.infographic?.minResolution?.width || defaults.validation.infographic.minResolution.width,
            height: rawConfig.validation?.infographic?.minResolution?.height || defaults.validation.infographic.minResolution.height,
          },
        },
        qaKnowledgeBase: {
          minQuestionCount: rawConfig.validation?.qaKnowledgeBase?.minQuestionCount || defaults.validation.qaKnowledgeBase.minQuestionCount,
        },
      },
      execution: {
        mode: rawConfig.execution?.mode || defaults.execution.mode,
        batchSize: rawConfig.execution?.batchSize || defaults.execution.batchSize,
        maxConcurrency: rawConfig.execution?.maxConcurrency || defaults.execution.maxConcurrency,
        timeout: rawConfig.execution?.timeout || defaults.execution.timeout,
      },
      reporting: {
        outputDir: rawConfig.reporting?.outputDir || defaults.reporting.outputDir,
        formats: rawConfig.reporting?.formats || defaults.reporting.formats,
      },
    };
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(config: PreGenerationConfig): void {
    // AWS overrides
    if (process.env.AWS_REGION) {
      config.aws.region = process.env.AWS_REGION;
    }
    if (process.env.CONTENT_BUCKET) {
      config.aws.s3.bucket = process.env.CONTENT_BUCKET;
    }
    if (process.env.PROGRESS_TABLE) {
      config.aws.dynamodb.progressTable = process.env.PROGRESS_TABLE;
    }
    if (process.env.CACHE_TABLE) {
      config.aws.dynamodb.cacheTable = process.env.CACHE_TABLE;
    }

    // Generation overrides
    if (process.env.FORCE_REGENERATE) {
      config.generation.forceRegenerate = process.env.FORCE_REGENERATE === 'true';
    }

    // Execution overrides
    if (process.env.EXECUTION_MODE) {
      config.execution.mode = process.env.EXECUTION_MODE as 'local' | 'lambda';
    }
    if (process.env.BATCH_SIZE) {
      config.execution.batchSize = parseInt(process.env.BATCH_SIZE, 10);
    }
    if (process.env.MAX_CONCURRENCY) {
      config.execution.maxConcurrency = parseInt(process.env.MAX_CONCURRENCY, 10);
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: PreGenerationConfig): void {
    const errors: string[] = [];

    // Validate AWS configuration
    if (!config.aws.region) {
      errors.push('AWS region is required');
    }
    if (!config.aws.s3.bucket) {
      errors.push('S3 bucket name is required');
    }
    if (!config.aws.dynamodb.progressTable) {
      errors.push('DynamoDB progress table name is required');
    }
    if (!config.aws.dynamodb.cacheTable) {
      errors.push('DynamoDB cache table name is required');
    }

    // Validate generation configuration
    if (!config.generation.languages || config.generation.languages.length === 0) {
      errors.push('At least one language must be specified');
    }
    if (!config.generation.contentTypes || config.generation.contentTypes.length === 0) {
      errors.push('At least one content type must be specified');
    }

    // Validate rate limits
    if (config.rateLimits.bedrock <= 0) {
      errors.push('Bedrock rate limit must be positive');
    }
    if (config.rateLimits.polly <= 0) {
      errors.push('Polly rate limit must be positive');
    }

    // Validate retry configuration
    if (config.retry.maxAttempts < 1) {
      errors.push('Max retry attempts must be at least 1');
    }
    if (config.retry.initialDelay < 0) {
      errors.push('Initial retry delay must be non-negative');
    }
    if (config.retry.maxDelay < config.retry.initialDelay) {
      errors.push('Max retry delay must be greater than or equal to initial delay');
    }

    // Validate execution configuration
    if (config.execution.mode !== 'local' && config.execution.mode !== 'lambda') {
      errors.push('Execution mode must be either "local" or "lambda"');
    }
    if (config.execution.batchSize < 1) {
      errors.push('Batch size must be at least 1');
    }
    if (config.execution.maxConcurrency < 1) {
      errors.push('Max concurrency must be at least 1');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    console.log('Configuration validation passed');
  }

  /**
   * Get current configuration
   */
  public getConfig(): PreGenerationConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * Reload configuration from file
   */
  public reloadConfig(): PreGenerationConfig {
    this.config = null;
    return this.loadConfig();
  }
}
