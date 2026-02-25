#!/usr/bin/env ts-node
/**
 * Test script to verify rate limiter and retry handler functionality
 */

import { RateLimiter } from '../src/pre-generation/utils/rate-limiter';
import { RetryHandler, ErrorType } from '../src/pre-generation/utils/retry-handler';
import { RateLimitConfig, RetryConfig } from '../src/pre-generation/types';

async function testRateLimiter() {
  console.log('🧪 Testing Rate Limiter...\n');

  const config: RateLimitConfig = {
    bedrock: {
      requestsPerSecond: 10,
      throttleBackoffMs: 1000,
      maxBackoffMs: 30000,
    },
    polly: {
      requestsPerSecond: 100,
      throttleBackoffMs: 500,
      maxBackoffMs: 10000,
    },
    s3: {
      requestsPerSecond: 3500,
      throttleBackoffMs: 100,
      maxBackoffMs: 5000,
    },
    dynamodb: {
      requestsPerSecond: 1000,
      throttleBackoffMs: 200,
      maxBackoffMs: 10000,
    },
  };

  const rateLimiter = new RateLimiter(config);

  // Test 1: Check initial token counts
  console.log('📊 Test 1: Initial token counts');
  const stats = rateLimiter.getStats();
  Object.entries(stats).forEach(([service, stat]) => {
    console.log(`   ${service}: ${stat.available}/${stat.max} tokens (${stat.rate}/sec)`);
  });

  // Test 2: Acquire tokens
  console.log('\n🎫 Test 2: Acquiring tokens');
  const startTime = Date.now();
  
  console.log('   Acquiring 5 Bedrock tokens...');
  for (let i = 0; i < 5; i++) {
    await rateLimiter.acquire('bedrock');
  }
  console.log(`   ✅ Acquired 5 tokens in ${Date.now() - startTime}ms`);
  console.log(`   Remaining Bedrock tokens: ${rateLimiter.getAvailableTokens('bedrock')}`);

  // Test 3: Try acquire without waiting
  console.log('\n🚀 Test 3: Try acquire without waiting');
  const acquired = rateLimiter.tryAcquire('bedrock', 3);
  console.log(`   Try acquire 3 tokens: ${acquired ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Remaining Bedrock tokens: ${rateLimiter.getAvailableTokens('bedrock')}`);

  // Test 4: Exponential backoff calculation
  console.log('\n⏱️  Test 4: Exponential backoff calculation');
  for (let attempt = 0; attempt < 5; attempt++) {
    const delay = rateLimiter.calculateBackoff(attempt, 1000, 30000, 0.1);
    console.log(`   Attempt ${attempt + 1}: ${delay}ms delay`);
  }

  // Test 5: Token refill
  console.log('\n🔄 Test 5: Token refill over time');
  console.log(`   Current Bedrock tokens: ${rateLimiter.getAvailableTokens('bedrock')}`);
  console.log('   Waiting 2 seconds for refill...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`   After 2s Bedrock tokens: ${rateLimiter.getAvailableTokens('bedrock')}`);

  console.log('\n✅ Rate limiter tests completed!\n');
}

async function testRetryHandler() {
  console.log('🧪 Testing Retry Handler...\n');

  const retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: 0.1,
  };

  const rateLimitConfig: RateLimitConfig = {
    bedrock: {
      requestsPerSecond: 10,
      throttleBackoffMs: 1000,
      maxBackoffMs: 30000,
    },
    polly: {
      requestsPerSecond: 100,
      throttleBackoffMs: 500,
      maxBackoffMs: 10000,
    },
    s3: {
      requestsPerSecond: 3500,
      throttleBackoffMs: 100,
      maxBackoffMs: 5000,
    },
    dynamodb: {
      requestsPerSecond: 1000,
      throttleBackoffMs: 200,
      maxBackoffMs: 10000,
    },
  };

  const rateLimiter = new RateLimiter(rateLimitConfig);
  const retryHandler = new RetryHandler(retryConfig, rateLimiter);

  // Test 1: Successful operation
  console.log('✅ Test 1: Successful operation');
  let callCount = 0;
  const result1 = await retryHandler.executeWithRetry(
    async () => {
      callCount++;
      return 'success';
    },
    'bedrock',
    'test-operation-1'
  );
  console.log(`   Result: ${result1.success ? '✅' : '❌'}, Attempts: ${result1.attempts}, Data: ${result1.data}`);

  // Test 2: Transient error that succeeds on retry
  console.log('\n🔄 Test 2: Transient error (succeeds on 2nd attempt)');
  callCount = 0;
  const result2 = await retryHandler.executeWithRetry(
    async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Network timeout');
      }
      return 'success after retry';
    },
    'bedrock',
    'test-operation-2'
  );
  console.log(`   Result: ${result2.success ? '✅' : '❌'}, Attempts: ${result2.attempts}, Data: ${result2.data}`);

  // Test 3: Permanent error (no retry)
  console.log('\n❌ Test 3: Permanent error (should not retry)');
  callCount = 0;
  const result3 = await retryHandler.executeWithRetry(
    async () => {
      callCount++;
      throw new Error('Resource not found');
    },
    'bedrock',
    'test-operation-3'
  );
  console.log(`   Result: ${result3.success ? '✅' : '❌'}, Attempts: ${result3.attempts}, Error Type: ${result3.errorType}`);

  // Test 4: Validation error (retry up to 3 times)
  console.log('\n⚠️  Test 4: Validation error (retry up to 3 times)');
  callCount = 0;
  const result4 = await retryHandler.executeWithRetry(
    async () => {
      callCount++;
      throw new Error('Invalid input validation failed');
    },
    'bedrock',
    'test-operation-4'
  );
  console.log(`   Result: ${result4.success ? '✅' : '❌'}, Attempts: ${result4.attempts}, Error Type: ${result4.errorType}`);

  // Test 5: Batch execution
  console.log('\n📦 Test 5: Batch execution');
  const operations = [
    async () => 'result-1',
    async () => 'result-2',
    async () => {
      throw new Error('Transient error');
    },
    async () => 'result-4',
  ];

  const batchResults = await retryHandler.executeBatch(
    operations,
    'bedrock',
    'batch-test',
    true // continue on error
  );

  const stats = retryHandler.getStats(batchResults);
  console.log(`   Total: ${stats.total}, Successful: ${stats.successful}, Failed: ${stats.failed}`);
  console.log(`   Average attempts: ${stats.averageAttempts.toFixed(2)}`);
  console.log(`   Error types:`, stats.errorTypes);

  console.log('\n✅ Retry handler tests completed!\n');
}

async function runTests() {
  try {
    await testRateLimiter();
    await testRetryHandler();
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
