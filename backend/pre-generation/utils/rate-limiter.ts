// Rate Limiter for Pre-Generation System
// Implements token bucket algorithm with separate buckets per AWS service

import { RateLimitConfig, AWSService } from '../types';

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per second
  lastRefill: number; // timestamp in ms
}

export class RateLimiter {
  private buckets: Map<AWSService, TokenBucket>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.buckets = new Map();
    this.initializeBuckets();
  }

  /**
   * Initialize token buckets for each AWS service
   */
  private initializeBuckets(): void {
    const services: AWSService[] = ['bedrock', 'polly', 's3', 'dynamodb'];
    
    services.forEach(service => {
      const maxTokens = this.config[service].requestsPerSecond;
      this.buckets.set(service, {
        tokens: maxTokens,
        maxTokens,
        refillRate: maxTokens,
        lastRefill: Date.now(),
      });
    });
  }

  /**
   * Refill tokens in a bucket based on elapsed time
   */
  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Acquire a token from the bucket for the specified service
   * Returns a promise that resolves when a token is available
   */
  public async acquire(service: AWSService, tokens: number = 1): Promise<void> {
    const bucket = this.buckets.get(service);
    if (!bucket) {
      throw new Error(`No rate limit bucket configured for service: ${service}`);
    }

    while (true) {
      this.refillBucket(bucket);

      if (bucket.tokens >= tokens) {
        bucket.tokens -= tokens;
        return;
      }

      // Calculate wait time until enough tokens are available
      const tokensNeeded = tokens - bucket.tokens;
      const waitTimeMs = (tokensNeeded / bucket.refillRate) * 1000;
      
      // Add small buffer to ensure tokens are available
      const waitWithBuffer = Math.ceil(waitTimeMs) + 10;
      
      await this.sleep(waitWithBuffer);
    }
  }

  /**
   * Try to acquire a token without waiting
   * Returns true if token was acquired, false otherwise
   */
  public tryAcquire(service: AWSService, tokens: number = 1): boolean {
    const bucket = this.buckets.get(service);
    if (!bucket) {
      throw new Error(`No rate limit bucket configured for service: ${service}`);
    }

    this.refillBucket(bucket);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get current token count for a service
   */
  public getAvailableTokens(service: AWSService): number {
    const bucket = this.buckets.get(service);
    if (!bucket) {
      throw new Error(`No rate limit bucket configured for service: ${service}`);
    }

    this.refillBucket(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * Get rate limit configuration for a service
   */
  public getRateLimit(service: AWSService): number {
    return this.config[service].requestsPerSecond;
  }

  /**
   * Reset all buckets to full capacity
   */
  public reset(): void {
    this.buckets.forEach(bucket => {
      bucket.tokens = bucket.maxTokens;
      bucket.lastRefill = Date.now();
    });
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  public calculateBackoff(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 30000,
    jitterFactor: number = 0.1
  ): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    
    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    
    // Add jitter: random value between -jitterFactor and +jitterFactor
    const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);
    
    return Math.max(0, Math.floor(cappedDelay + jitter));
  }

  /**
   * Wait for throttling error with exponential backoff
   */
  public async waitForThrottling(
    service: AWSService,
    attempt: number
  ): Promise<void> {
    const serviceConfig = this.config[service];
    const backoffDelay = this.calculateBackoff(
      attempt,
      serviceConfig.throttleBackoffMs,
      serviceConfig.maxBackoffMs
    );

    console.log(
      `⏳ Rate limited on ${service}, waiting ${backoffDelay}ms (attempt ${attempt + 1})`
    );

    await this.sleep(backoffDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics for all buckets
   */
  public getStats(): Record<AWSService, { available: number; max: number; rate: number }> {
    const stats: any = {};
    
    this.buckets.forEach((bucket, service) => {
      this.refillBucket(bucket);
      stats[service] = {
        available: Math.floor(bucket.tokens),
        max: bucket.maxTokens,
        rate: bucket.refillRate,
      };
    });

    return stats;
  }
}
