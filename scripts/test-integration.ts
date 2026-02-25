#!/usr/bin/env ts-node
/**
 * Integration test for pre-generation system components
 * Tests: Config Loader, Artifact Loader, Rate Limiter, Retry Handler
 */

import { ConfigLoader } from '../src/pre-generation/config/config-loader';
import { ArtifactLoader } from '../src/pre-generation/loaders/artifact-loader';
import { RateLimiter } from '../src/pre-generation/utils/rate-limiter';
import { RetryHandler } from '../src/pre-generation/utils/retry-handler';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class IntegrationTester {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      console.error(`❌ ${name}: ${(error as Error).message}`);
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.name}`);
          console.log(`     Error: ${r.error}`);
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\nTotal Duration: ${totalDuration}ms`);
    console.log('='.repeat(80) + '\n');
  }

  hasFailures(): boolean {
    return this.results.some(r => !r.passed);
  }
}

async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests for Pre-Generation System\n');
  console.log('='.repeat(80));
  console.log('COMPONENT TESTS');
  console.log('='.repeat(80) + '\n');

  const tester = new IntegrationTester();

  // Test 1: Config Loader
  await tester.runTest('Config Loader - Load configuration', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();

    if (!config.aws) throw new Error('AWS config missing');
    if (!config.generation) throw new Error('Generation config missing');
    if (!config.rateLimits) throw new Error('Rate limits config missing');
    if (!config.retry) throw new Error('Retry config missing');
  });

  await tester.runTest('Config Loader - Validate AWS settings', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();

    if (!config.aws.region) throw new Error('AWS region missing');
    if (!config.aws.s3.bucket) throw new Error('S3 bucket missing');
    if (!config.aws.bedrock.modelId) throw new Error('Bedrock model ID missing');
  });

  await tester.runTest('Config Loader - Validate generation settings', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();

    if (!Array.isArray(config.generation.languages)) {
      throw new Error('Languages must be an array');
    }
    if (config.generation.languages.length === 0) {
      throw new Error('At least one language must be configured');
    }
    if (!Array.isArray(config.generation.contentTypes)) {
      throw new Error('Content types must be an array');
    }
  });

  // Test 2: Artifact Loader
  await tester.runTest('Artifact Loader - Load all artifacts', async () => {
    const loader = new ArtifactLoader();
    const artifacts = await loader.loadArtifacts();

    if (artifacts.length !== 49) {
      throw new Error(`Expected 49 artifacts, got ${artifacts.length}`);
    }
  });

  await tester.runTest('Artifact Loader - Validate artifact structure', async () => {
    const loader = new ArtifactLoader();
    const artifacts = await loader.loadArtifacts();

    const firstArtifact = artifacts[0];
    if (!firstArtifact.artifactId) throw new Error('Artifact ID missing');
    if (!firstArtifact.siteId) throw new Error('Site ID missing');
    if (!firstArtifact.name) throw new Error('Name missing');
    if (!firstArtifact.type) throw new Error('Type missing');
    if (!firstArtifact.templeGroup) throw new Error('Temple group missing');
  });

  await tester.runTest('Artifact Loader - Get temple groups', async () => {
    const loader = new ArtifactLoader();
    await loader.loadArtifacts();
    const groups = loader.getTempleGroups();

    if (groups.length !== 12) {
      throw new Error(`Expected 12 temple groups, got ${groups.length}`);
    }
  });

  await tester.runTest('Artifact Loader - Filter by temple group', async () => {
    const loader = new ArtifactLoader();
    await loader.loadArtifacts();
    
    const filtered = loader.filterArtifacts({
      templeGroups: ['lepakshi-temple-andhra'],
    });

    if (filtered.length !== 7) {
      throw new Error(`Expected 7 Lepakshi artifacts, got ${filtered.length}`);
    }
  });

  // Test 3: Rate Limiter
  await tester.runTest('Rate Limiter - Initialize buckets', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    const rateLimiter = new RateLimiter({
      bedrock: {
        requestsPerSecond: config.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: config.rateLimits.polly,
        throttleBackoffMs: 500,
        maxBackoffMs: 10000,
      },
      s3: {
        requestsPerSecond: config.rateLimits.s3,
        throttleBackoffMs: 100,
        maxBackoffMs: 5000,
      },
      dynamodb: {
        requestsPerSecond: config.rateLimits.dynamodb,
        throttleBackoffMs: 200,
        maxBackoffMs: 10000,
      },
    });

    const stats = rateLimiter.getStats();
    if (!stats.bedrock) throw new Error('Bedrock bucket not initialized');
    if (!stats.polly) throw new Error('Polly bucket not initialized');
    if (!stats.s3) throw new Error('S3 bucket not initialized');
    if (!stats.dynamodb) throw new Error('DynamoDB bucket not initialized');
  });

  await tester.runTest('Rate Limiter - Acquire tokens', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    const rateLimiter = new RateLimiter({
      bedrock: {
        requestsPerSecond: config.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: config.rateLimits.polly,
        throttleBackoffMs: 500,
        maxBackoffMs: 10000,
      },
      s3: {
        requestsPerSecond: config.rateLimits.s3,
        throttleBackoffMs: 100,
        maxBackoffMs: 5000,
      },
      dynamodb: {
        requestsPerSecond: config.rateLimits.dynamodb,
        throttleBackoffMs: 200,
        maxBackoffMs: 10000,
      },
    });

    const initialTokens = rateLimiter.getAvailableTokens('bedrock');
    await rateLimiter.acquire('bedrock', 3);
    const afterTokens = rateLimiter.getAvailableTokens('bedrock');

    if (afterTokens !== initialTokens - 3) {
      throw new Error(`Token count mismatch: expected ${initialTokens - 3}, got ${afterTokens}`);
    }
  });

  // Test 4: Retry Handler
  await tester.runTest('Retry Handler - Successful operation', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    const retryHandler = new RetryHandler({
      maxAttempts: config.retry.maxAttempts,
      initialDelayMs: config.retry.initialDelay,
      maxDelayMs: config.retry.maxDelay,
      backoffMultiplier: config.retry.backoffMultiplier,
      jitter: 0.1,
    });

    const result = await retryHandler.executeWithRetry(
      async () => 'success',
      'bedrock',
      'test-operation'
    );

    if (!result.success) throw new Error('Operation should succeed');
    if (result.attempts !== 1) throw new Error('Should succeed on first attempt');
  });

  await tester.runTest('Retry Handler - Retry on transient error', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    const retryHandler = new RetryHandler({
      maxAttempts: config.retry.maxAttempts,
      initialDelayMs: 100, // Faster for testing
      maxDelayMs: 1000,
      backoffMultiplier: config.retry.backoffMultiplier,
      jitter: 0.1,
    });

    let attempts = 0;
    const result = await retryHandler.executeWithRetry(
      async () => {
        attempts++;
        if (attempts < 2) throw new Error('Network timeout');
        return 'success';
      },
      'bedrock',
      'test-retry'
    );

    if (!result.success) throw new Error('Should succeed after retry');
    if (result.attempts !== 2) throw new Error(`Expected 2 attempts, got ${result.attempts}`);
  });

  // Test 5: Integration - Config + Artifact Loader
  await tester.runTest('Integration - Config + Artifact Loader', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();

    const artifactLoader = new ArtifactLoader();
    const artifacts = await artifactLoader.loadArtifacts();

    // Verify we can filter artifacts based on config languages
    const languages = config.generation.languages;
    if (languages.length === 0) {
      throw new Error('No languages configured');
    }

    // Calculate total content items to generate
    const totalItems = artifacts.length * languages.length * config.generation.contentTypes.length;
    console.log(`      → Total content items to generate: ${totalItems}`);
  });

  // Test 6: Integration - Rate Limiter + Retry Handler
  await tester.runTest('Integration - Rate Limiter + Retry Handler', async () => {
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    const rateLimiter = new RateLimiter({
      bedrock: {
        requestsPerSecond: config.rateLimits.bedrock,
        throttleBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      polly: {
        requestsPerSecond: config.rateLimits.polly,
        throttleBackoffMs: 500,
        maxBackoffMs: 10000,
      },
      s3: {
        requestsPerSecond: config.rateLimits.s3,
        throttleBackoffMs: 100,
        maxBackoffMs: 5000,
      },
      dynamodb: {
        requestsPerSecond: config.rateLimits.dynamodb,
        throttleBackoffMs: 200,
        maxBackoffMs: 10000,
      },
    });

    const retryHandler = new RetryHandler({
      maxAttempts: config.retry.maxAttempts,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: config.retry.backoffMultiplier,
      jitter: 0.1,
    }, rateLimiter);

    // Simulate multiple operations with rate limiting
    const operations = Array(5).fill(null).map((_, i) => 
      retryHandler.executeWithRetry(
        async () => `result-${i}`,
        'bedrock',
        `operation-${i}`
      )
    );

    const results = await Promise.all(operations);
    const allSucceeded = results.every(r => r.success);
    
    if (!allSucceeded) throw new Error('Not all operations succeeded');
  });

  // Print summary
  tester.printSummary();

  // Exit with error code if any tests failed
  if (tester.hasFailures()) {
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration test suite failed:', error);
  process.exit(1);
});
