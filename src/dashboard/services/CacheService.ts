/**
 * CacheService
 * Feature: real-time-reports-dashboard
 * 
 * Manages ElastiCache Redis operations for performance optimization.
 * Provides get/set methods with TTL support, pattern-based invalidation,
 * and graceful degradation when Redis is unavailable.
 * 
 * Validates: Requirement 10.3
 */

import { getConfig } from '../config';

// Redis types - will be available when redis package is installed
type RedisClientType = any;

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private readonly config = getConfig();

  constructor(client?: RedisClientType) {
    if (client) {
      this.client = client;
      this.isConnected = true;
      this.connectionAttempted = true;
    }
  }

  /**
   * Initialize Redis connection
   * Handles connection failures gracefully
   */
  private async ensureConnection(): Promise<boolean> {
    // If cache is disabled, skip connection
    if (!this.config.cacheEnabled) {
      return false;
    }

    // If already connected, return true
    if (this.isConnected && this.client) {
      return true;
    }

    // If connection was already attempted and failed, don't retry
    if (this.connectionAttempted && !this.isConnected) {
      return false;
    }

    // If no Redis endpoint configured, skip connection
    if (!this.config.redisEndpoint) {
      console.warn('Redis endpoint not configured, cache disabled');
      this.connectionAttempted = true;
      return false;
    }

    try {
      this.connectionAttempted = true;

      // Dynamic import of redis module - will fail gracefully if not installed
      // @ts-ignore - redis module will be installed when needed
      let createClient: any;
      try {
        // @ts-ignore - redis module will be installed when needed
        const redis = await import('redis');
        createClient = redis.createClient;
      } catch (importError) {
        console.warn('Redis module not installed, cache disabled');
        return false;
      }

      // Create Redis client
      this.client = createClient({
        socket: {
          host: this.config.redisEndpoint,
          port: this.config.redisPort || 6379,
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            // Stop reconnecting after 3 attempts
            if (retries > 3) {
              console.error('Redis reconnection failed after 3 attempts');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Set up error handler
      this.client.on('error', (err: Error) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      // Set up reconnect handler
      this.client.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
        this.isConnected = false;
      });

      // Set up ready handler
      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      // Connect to Redis
      await this.client.connect();
      this.isConnected = true;

      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      this.client = null;
      return false;
    }
  }

  /**
   * Get value from cache
   * Requirement 10.3: Cache aggregated metrics
   * 
   * @param key Cache key
   * @returns Cached value or null if not found or cache unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return null;
      }

      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      // Graceful degradation: return null on error
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * Requirement 10.3: Cache aggregated metrics for 30 seconds
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        // Graceful degradation: silently fail if cache unavailable
        return;
      }

      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Graceful degradation: silently fail on error
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * Requirement 10.3: Invalidate cache on data changes
   * 
   * @param pattern Redis key pattern (e.g., "dashboard:metrics:*")
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return;
      }

      // Use SCAN to find matching keys (more efficient than KEYS for production)
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });

        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      // Delete all matching keys
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
      // Graceful degradation: silently fail on error
    }
  }

  /**
   * Invalidate cache entries for a specific feedback item
   * Requirement 10.3: Targeted cache invalidation
   * 
   * This method invalidates all cache entries that might be affected by
   * a new or updated feedback item, including:
   * - Overall dashboard metrics
   * - Temple-specific metrics
   * - Region-specific metrics
   * - Time-range specific metrics
   * 
   * @param feedbackId Feedback item ID
   * @param templeId Temple ID associated with the feedback
   */
  async invalidateForFeedback(feedbackId: string, templeId: string): Promise<void> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return;
      }

      // Invalidate multiple patterns that could be affected
      const patterns = [
        'dashboard:metrics:*',           // All dashboard metrics
        `dashboard:temple:${templeId}:*`, // Temple-specific metrics
        'dashboard:reviews:*',            // Review lists
        'dashboard:visualizations:*'      // Visualization data
      ];

      // Invalidate all patterns in parallel
      await Promise.all(patterns.map(pattern => this.invalidate(pattern)));

      console.log(`Invalidated cache for feedback ${feedbackId} and temple ${templeId}`);
    } catch (error) {
      console.error(`Cache invalidateForFeedback error for feedback ${feedbackId}:`, error);
      // Graceful degradation: silently fail on error
    }
  }

  /**
   * Close Redis connection
   * Should be called when shutting down the service
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        console.log('Redis client disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting Redis client:', error);
    }
  }

  /**
   * Check if cache is available
   * Useful for monitoring and health checks
   */
  async isAvailable(): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      // Ping Redis to check connection
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Cache availability check failed:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   * Useful for testing and maintenance
   */
  async clear(): Promise<void> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return;
      }

      await this.client.flushDb();
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
      // Graceful degradation: silently fail on error
    }
  }
}
