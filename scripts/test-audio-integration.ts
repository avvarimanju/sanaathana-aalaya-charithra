#!/usr/bin/env ts-node

/**
 * Integration test for Audio Guide Generator with Content Generator Orchestrator
 * Tests real AWS Polly integration (not dry-run)
 */

import { ContentGeneratorOrchestrator } from '../src/pre-generation/generators/content-generator-orchestrator';
import { ConfigLoader } from '../src/pre-generation/config/config-loader';
import { RateLimiter } from '../src/pre-generation/utils/rate-limiter';
import { RetryHandler } from '../src/pre-generation/utils/retry-handler';
import { ContentValidator } from '../src/pre-generation/validators/content-validator';
import { StorageManager } from '../src/pre-generation/storage/storage-manager';
import {
  ArtifactMetadata,
  GenerationOptions,
  Language,
} from '../src/pre-generation/types';
import * as fs from 'fs';
import * as path from 'path';

async function testAudioIntegration() {
  console.log('🧪 Testing Audio Guide Integration with Orchestrator\n');

  try {
    // Load real configuration
    console.log('📦 Loading configuration...');
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    console.log('✅ Configuration loaded\n');

    // Initialize components
    console.log('📦 Initializing components...');
    const rateLimiter = new RateLimiter({
      bedrock: {
        requestsPerSecond: config.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: config.rateLimits.polly,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      s3: {
        requestsPerSecond: config.rateLimits.s3,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      dynamodb: {
        requestsPerSecond: config.rateLimits.dynamodb,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
    });

    const retryHandler = new RetryHandler(
      {
        maxAttempts: config.retry.maxAttempts,
        initialDelayMs: config.retry.initialDelay,
        maxDelayMs: config.retry.maxDelay,
        backoffMultiplier: config.retry.backoffMultiplier,
        jitter: config.retry.jitter ? 0.1 : 0,
      },
      rateLimiter
    );

    const contentValidator = new ContentValidator({
      audio: config.validation.audio,
      video: config.validation.video,
      infographic: config.validation.infographic,
      qaKnowledgeBase: config.validation.qaKnowledgeBase,
    });

    const storageManager = new StorageManager(config);
    
    const orchestrator = new ContentGeneratorOrchestrator(
      config,
      rateLimiter,
      retryHandler,
      contentValidator,
      storageManager
    );
    console.log('✅ Components initialized\n');

    // Create test artifact with longer content to meet duration requirements
    const testArtifact: ArtifactMetadata = {
      artifactId: 'integration-test-001',
      siteId: 'integration-test-site',
      name: 'Integration Test Heritage Sculpture',
      type: 'sculpture',
      description: 'This magnificent sculpture represents one of the finest examples of ancient Indian temple art. The intricate carvings showcase the exceptional skill of the artisans who created this masterpiece. Every detail has been carefully crafted to tell a story of devotion and artistic excellence. The sculpture features elaborate ornamentation and symbolic elements that reflect the religious and cultural values of the period.',
      historicalContext: 'This remarkable artifact dates back to the 12th century during the golden age of temple construction in South India. It was created during the reign of the Hoysala dynasty, a period known for its architectural innovations and artistic achievements. The sculpture was originally part of a larger temple complex that served as a center of religious and cultural activity. Historical records indicate that skilled craftsmen from across the region contributed to its creation, working for several years to complete this masterpiece.',
      culturalSignificance: 'The sculpture holds immense cultural and religious importance for the local community and represents a vital link to our ancient heritage. It depicts scenes from Hindu mythology that have been passed down through generations, serving as a visual representation of sacred stories and teachings. The artwork demonstrates the sophisticated understanding of proportion, symmetry, and aesthetic principles that characterized this period of Indian art history. Today, it continues to inspire artists, scholars, and visitors from around the world who come to appreciate its beauty and historical significance.',
      templeGroup: 'test-temple-group',
    };

    // Test with English only (to save API calls)
    const options: GenerationOptions = {
      languages: [Language.ENGLISH],
      contentTypes: ['audio_guide'],
      forceRegenerate: true,
      dryRun: false, // Real generation
      batchSize: 1,
      maxConcurrency: 1,
    };

    console.log('🚀 Starting real audio generation via orchestrator...');
    console.log('   This will make actual AWS Polly API calls\n');

    const startTime = Date.now();
    const result = await orchestrator.generateAll([testArtifact], options);
    const duration = Date.now() - startTime;

    console.log('\n📊 Generation Results:');
    console.log(`   Total Items: ${result.totalItems}`);
    console.log(`   Succeeded: ${result.succeeded}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Duration: ${duration}ms`);

    if (result.failures.length > 0) {
      console.log('\n❌ Failures:');
      result.failures.forEach((failure) => {
        console.log(`   - ${failure.artifactId} (${failure.language}, ${failure.contentType}): ${failure.error}`);
      });
    }

    // Verify the generated content was stored
    console.log('\n🔍 Verifying stored content...');
    
    // Check if files were created in S3 (or local storage)
    const outputDir = path.join(process.cwd(), '.pre-generation', 'integration-test');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log(`   Found ${files.length} file(s) in output directory`);
      files.forEach((file) => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   - ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
      });
    }

    // Summary
    console.log('\n════════════════════════════════════════════════════════════════');
    if (result.succeeded === result.totalItems && result.failed === 0) {
      console.log('✅ Integration test PASSED');
      console.log('   Audio guide generator successfully integrated with orchestrator');
      console.log('   AWS Polly integration working correctly');
    } else {
      console.log('❌ Integration test FAILED');
      console.log('   Some items failed to generate');
    }
    console.log('════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testAudioIntegration().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
