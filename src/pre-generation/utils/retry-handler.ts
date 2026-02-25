// Retry Handler for Pre-Generation System
// Handles retries with exponential backoff and error classification

import { RetryConfig, AWSService } from '../types';
import { RateLimiter } from './rate-limiter';

export enum ErrorType {
  TRANSIENT = 'transient',       // Network errors, timeouts - retry
  THROTTLING = 'throttling',     // Rate limit errors - retry with backoff
  VALIDATION = 'validation',     // Invalid input - retry up to 3 times
  PERMANENT = 'permanent',       // Invalid credentials, not found - skip
  CRITICAL = 'critical',         // System errors - abort
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  errorType?: ErrorType;
}

export class RetryHandler {
  private config: RetryConfig;
  private rateLimiter?: RateLimiter;

  constructor(config: RetryConfig, rateLimiter?: RateLimiter) {
    this.config = config;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Execute a function with retry logic
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    service: AWSService,
    context: string = 'operation'
  ): Promise<RetryResult<T>> {
    let lastError: Error | undefined;
    let attempts = 0;

    while (attempts < this.config.maxAttempts) {
      try {
        // Acquire rate limit token before attempting
        if (this.rateLimiter) {
          await this.rateLimiter.acquire(service);
        }

        const result = await fn();
        
        if (attempts > 0) {
          console.log(`✅ ${context} succeeded after ${attempts + 1} attempts`);
        }

        return {
          success: true,
          data: result,
          attempts: attempts + 1,
        };
      } catch (error) {
        lastError = error as Error;
        attempts++;

        const errorType = this.classifyError(error as Error);
        console.log(
          `⚠️  ${context} failed (attempt ${attempts}/${this.config.maxAttempts}): ${errorType} - ${lastError.message}`
        );

        // Handle different error types
        if (errorType === ErrorType.CRITICAL) {
          console.error(`❌ Critical error in ${context}, aborting`);
          return {
            success: false,
            error: lastError,
            attempts,
            errorType,
          };
        }

        if (errorType === ErrorType.PERMANENT) {
          console.error(`❌ Permanent error in ${context}, skipping`);
          return {
            success: false,
            error: lastError,
            attempts,
            errorType,
          };
        }

        if (errorType === ErrorType.VALIDATION && attempts >= 3) {
          console.error(`❌ Validation error persists after 3 attempts in ${context}, skipping`);
          return {
            success: false,
            error: lastError,
            attempts,
            errorType,
          };
        }

        // Don't retry if we've exhausted attempts
        if (attempts >= this.config.maxAttempts) {
          console.error(`❌ Max retry attempts (${this.config.maxAttempts}) exceeded for ${context}`);
          break;
        }

        // Calculate backoff delay
        let delayMs: number;
        if (errorType === ErrorType.THROTTLING && this.rateLimiter) {
          // Use rate limiter's backoff for throttling errors
          await this.rateLimiter.waitForThrottling(service, attempts - 1);
          continue; // Skip the regular sleep below
        } else {
          delayMs = this.calculateBackoff(attempts - 1);
        }

        console.log(`⏳ Retrying ${context} in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      errorType: this.classifyError(lastError!),
    };
  }

  /**
   * Classify error type for retry strategy
   */
  private classifyError(error: Error): ErrorType {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Throttling errors
    if (
      errorMessage.includes('throttl') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorName.includes('throttl')
    ) {
      return ErrorType.THROTTLING;
    }

    // Transient errors (network, timeout)
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('socket hang up') ||
      errorName.includes('timeout')
    ) {
      return ErrorType.TRANSIENT;
    }

    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid input') ||
      errorMessage.includes('bad request') ||
      errorMessage.includes('malformed')
    ) {
      return ErrorType.VALIDATION;
    }

    // Permanent errors
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('access denied') ||
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('does not exist')
    ) {
      return ErrorType.PERMANENT;
    }

    // Critical errors
    if (
      errorMessage.includes('out of memory') ||
      errorMessage.includes('system error') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('service unavailable')
    ) {
      return ErrorType.CRITICAL;
    }

    // Default to transient for unknown errors
    return ErrorType.TRANSIENT;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoff(attempt: number): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(
      this.config.backoffMultiplier,
      attempt
    );

    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter
    const jitter = cappedDelay * this.config.jitter * (Math.random() * 2 - 1);

    return Math.max(0, Math.floor(cappedDelay + jitter));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute multiple operations with retry, stopping on first success
   */
  public async executeWithFallback<T>(
    operations: Array<() => Promise<T>>,
    service: AWSService,
    context: string = 'operation'
  ): Promise<RetryResult<T>> {
    let lastResult: RetryResult<T> | undefined;

    for (let i = 0; i < operations.length; i++) {
      console.log(`🔄 Trying fallback option ${i + 1}/${operations.length} for ${context}`);
      
      lastResult = await this.executeWithRetry(
        operations[i],
        service,
        `${context} (fallback ${i + 1})`
      );

      if (lastResult.success) {
        return lastResult;
      }

      // Don't try next fallback if error is critical
      if (lastResult.errorType === ErrorType.CRITICAL) {
        break;
      }
    }

    return lastResult || {
      success: false,
      error: new Error('All fallback options failed'),
      attempts: 0,
    };
  }

  /**
   * Batch execute operations with retry
   */
  public async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    service: AWSService,
    context: string = 'batch operation',
    continueOnError: boolean = true
  ): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];

    for (let i = 0; i < operations.length; i++) {
      const result = await this.executeWithRetry(
        operations[i],
        service,
        `${context} [${i + 1}/${operations.length}]`
      );

      results.push(result);

      // Stop on first failure if continueOnError is false
      if (!continueOnError && !result.success) {
        console.error(`❌ Batch operation stopped at item ${i + 1} due to failure`);
        break;
      }

      // Stop on critical error even if continueOnError is true
      if (result.errorType === ErrorType.CRITICAL) {
        console.error(`❌ Batch operation stopped at item ${i + 1} due to critical error`);
        break;
      }
    }

    return results;
  }

  /**
   * Get retry statistics from results
   */
  public getStats(results: Array<RetryResult<any>>): {
    total: number;
    successful: number;
    failed: number;
    totalAttempts: number;
    averageAttempts: number;
    errorTypes: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      successful: 0,
      failed: 0,
      totalAttempts: 0,
      averageAttempts: 0,
      errorTypes: {} as Record<string, number>,
    };

    results.forEach(result => {
      stats.totalAttempts += result.attempts;
      
      if (result.success) {
        stats.successful++;
      } else {
        stats.failed++;
        if (result.errorType) {
          stats.errorTypes[result.errorType] = (stats.errorTypes[result.errorType] || 0) + 1;
        }
      }
    });

    stats.averageAttempts = stats.total > 0 ? stats.totalAttempts / stats.total : 0;

    return stats;
  }
}
