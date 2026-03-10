/**
 * Redis cache utility functions
 */

import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from './logger';

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.endpoint,
          port: config.redis.port,
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', err);
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error', error as Error, { key });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not connected, skipping cache set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error', error as Error, { key });
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not connected, skipping cache delete');
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error', error as Error, { key });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not connected, skipping cache delete pattern');
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Redis delete pattern error', error as Error, { pattern });
    }
  }

  // Cache key generators
  generatePriceKey(entityType: string, entityId: string): string {
    return `price:${entityType}:${entityId}`;
  }

  generateAccessKey(userId: string, qrCodeId: string): string {
    return `access:${userId}:${qrCodeId}`;
  }

  generatePackageMetadataKey(entityType: string, entityId: string): string {
    return `package:${entityType}:${entityId}`;
  }
}

export const redisCache = new RedisCache();
export default redisCache;
