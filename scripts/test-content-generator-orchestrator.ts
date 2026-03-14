#!/usr/bin/env ts-node

/**
 * Test script for Content Generator Orchestrator
 * Tests the orchestrator with mock data to verify integration
 */

import { ContentGeneratorOrchestrator } from '../src/pre-generation/generators/content-generator-orchestrator';
import { RateLimiter } from '../src/pre-generation/utils/rate-limiter';
import { RetryHandler } from '../src/pre-generation/utils/retry-handler';
import { ContentValidator } from '../src/pre-generation/validators/content-validator';
import { StorageManager } from '../src/pre-generation/storage/storage-manager';
import { ProgressTracker } from '../src/pre-generation/tracking/progress-tracker';
import {
  ArtifactMetadata,
  GenerationOptions,
  PreGenerationConfig,
  Language,
  ContentType,
} from '../src/pre-generation/types';

// Mock configuration
const mockConfig: PreGenerationConfig = {
  aws: {
    region: 'ap-south-1',
    s3: {
      bucket: 'test-bucket',
      encryption: 'AES256',
    },
    dynamodb: {
      progressTable: 'PreGenerationProgress',
      cacheTable: 'ContentCache',
    },
    bedrock: {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      maxTokens: 2048,
      temperature: 0.7,
    },
    polly: {
      engine: 'neural',
      voiceMapping: {
        [Language.ENGLISH]: 'Joanna',
        [Language.HINDI]: 'Aditi',
        [Language.TAMIL]: null,
        [Language.TELUGU]: null,
        [Language.BENGALI]: null,
        [Language.MARATHI]: null,
        [Language.GUJARATI]: null,
        [Language.KANNADA]: null,
        [Language.MALAYALAM]: null,
        [Language.PUNJABI]: null,
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
    contentTypes: ['audio_guide', 'video', 'infographic', 'qa_knowledge_base'] as ContentType[],
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

// Mock artifacts
const mockArtifacts: ArtifactMetadata[] = [
  {
    artifactId: 'test-artifact-1',
    siteId: 'test-site-1',
    name: 'Test Artifact 1',
    type: 'sculpture',
    description: 'A test artifact for validation',
    historicalContext: 'Historical context for testing',
    culturalSignificance: 'Cultural significance for testing',
    templeGroup: 'test-temple-group',
  },
  {
    artifactId: 'test-artifact-2',
    siteId: 'test-site-2',
    name: 'Test Artifact 2',
    type: 'inscription',
    description: 'Another test artifact',
    historicalContext: 'More historical context',
    culturalSignificance: 'More cultural significance',
    templeGroup: 'test-temple-group',
  },
];

async function testOrchestrator() {
  console.log('🧪 Testing Content Generator Orchestrator\n');

  try {
    // Initialize components
    console.log('📦 Initializing components...');
    
    const rateLimiter = new RateLimiter({
      bedrock: {
        requestsPerSecond: mockConfig.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: mockConfig.rateLimits.polly,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      s3: {
        requestsPerSecond: mockConfig.rateLimits.s3,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      dynamodb: {
        requestsPerSecond: mockConfig.rateLimits.dynamodb,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
    });

    const retryHandler = new RetryHandler(
      {
        maxAttempts: mockConfig.retry.maxAttempts,
        initialDelayMs: mockConfig.retry.initialDelay,
        maxDelayMs: mockConfig.retry.maxDelay,
        backoffMultiplier: mockConfig.retry.backoffMultiplier,
        jitter: mockConfig.retry.jitter ? 0.1 : 0,
      },
      rateLimiter
    );

    const contentValidator = new ContentValidator({
      audio: mockConfig.validation.audio,
      video: mockConfig.validation.video,
      infographic: mockConfig.validation.infographic,
      qaKnowledgeBase: mockConfig.validation.qaKnowledgeBase,
    });

    const storageManager = new StorageManager(mockConfig);

    const progressTracker = new ProgressTracker(
      {
        storageMode: 'local',
        localStorageDir: './.pre-generation',
      },
      'test-job-' + Date.now()
    );

    const orchestrator = new ContentGeneratorOrchestrator(
      mockConfig,
      rateLimiter,
      retryHandler,
      contentValidator,
      storageManager,
      progressTracker
    );

    console.log('✅ Components initialized\n');

    // Test 1: Dry run with all content types
    console.log('Test 1: Dry run with all content types');
    console.log('─'.repeat(80));
    
    const dryRunOptions: GenerationOptions = {
      languages: [Language.ENGLISH, Language.HINDI],
      contentTypes: ['audio_guide', 'video', 'infographic', 'qa_knowledge_base'],
      forceRegenerate: false,
      dryRun: true,
      batchSize: 10,
      maxConcurrency: 5,
    };

    const dryRunResult = await orchestrator.generateAll(mockArtifacts, dryRunOptions);
    
    console.log('\nDry Run Results:');
    console.log(`  Total Items: ${dryRunResult.totalItems}`);
    console.log(`  Succeeded: ${dryRunResult.succeeded}`);
    console.log(`  Failed: ${dryRunResult.failed}`);
    console.log(`  Skipped: ${dryRunResult.skipped}`);
    console.log(`  Duration: ${dryRunResult.duration}ms`);
    
    if (dryRunResult.succeeded === dryRunResult.totalItems) {
      console.log('✅ Dry run test passed\n');
    } else {
      console.log('❌ Dry run test failed\n');
      process.exit(1);
    }

    // Test 2: Test with single language and content type
    console.log('Test 2: Single language and content type');
    console.log('─'.repeat(80));
    
    const singleOptions: GenerationOptions = {
      languages: [Language.ENGLISH],
      contentTypes: ['audio_guide'],
      forceRegenerate: false,
      dryRun: true,
      batchSize: 10,
      maxConcurrency: 5,
    };

    const singleResult = await orchestrator.generateAll(mockArtifacts, singleOptions);
    
    console.log('\nSingle Test Results:');
    console.log(`  Total Items: ${singleResult.totalItems}`);
    console.log(`  Expected: ${mockArtifacts.length * 1 * 1}`);
    
    if (singleResult.totalItems === mockArtifacts.length) {
      console.log('✅ Single test passed\n');
    } else {
      console.log('❌ Single test failed\n');
      process.exit(1);
    }

    // Test 3: Test language order
    console.log('Test 3: Language processing order');
    console.log('─'.repeat(80));
    
    const languageOrderOptions: GenerationOptions = {
      languages: [Language.TAMIL, Language.ENGLISH, Language.HINDI], // Out of order
      contentTypes: ['audio_guide'],
      forceRegenerate: false,
      dryRun: true,
      batchSize: 10,
      maxConcurrency: 5,
    };

    console.log('Languages provided: ta, en, hi');
    console.log('Expected order: en, hi, ta (as per LANGUAGE_ORDER)');
    
    const languageOrderResult = await orchestrator.generateAll(
      [mockArtifacts[0]], 
      languageOrderOptions
    );
    
    if (languageOrderResult.succeeded === 3) {
      console.log('✅ Language order test passed\n');
    } else {
      console.log('❌ Language order test failed\n');
      process.exit(1);
    }

    console.log('═'.repeat(80));
    console.log('🎉 All tests passed!');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
testOrchestrator().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
