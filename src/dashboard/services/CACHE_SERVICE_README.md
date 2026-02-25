# CacheService Implementation

## Overview

The `CacheService` class manages ElastiCache Redis operations for the Real-Time Reports Dashboard. It provides caching functionality with TTL support, pattern-based invalidation, and graceful degradation when Redis is unavailable.

## Features

### 1. Get/Set with TTL Support
- `get<T>(key: string): Promise<T | null>` - Retrieve cached values
- `set<T>(key: string, value: T, ttlSeconds: number): Promise<void>` - Store values with expiration

### 2. Cache Invalidation
- `invalidate(pattern: string): Promise<void>` - Invalidate entries matching a Redis pattern
- `invalidateForFeedback(feedbackId: string, templeId: string): Promise<void>` - Targeted invalidation for feedback updates

### 3. Graceful Degradation
- Automatically handles Redis connection failures
- Falls back to no-cache mode when Redis is unavailable
- Logs errors but doesn't throw exceptions

### 4. Connection Management
- Lazy connection initialization
- Automatic reconnection with exponential backoff
- Connection health checks via `isAvailable()`

## Configuration

The service uses configuration from `config.ts`:

```typescript
{
  cacheEnabled: boolean,           // Enable/disable caching
  cacheTtlSeconds: number,         // Default TTL (30 seconds)
  redisEndpoint: string,           // Redis host
  redisPort: number                // Redis port (default: 6379)
}
```

## Usage Example

```typescript
import { CacheService } from './services/CacheService';

const cacheService = new CacheService();

// Store data with 30-second TTL
await cacheService.set('dashboard:metrics:overall', metrics, 30);

// Retrieve cached data
const cachedMetrics = await cacheService.get<AggregatedMetrics>('dashboard:metrics:overall');

// Invalidate all dashboard metrics
await cacheService.invalidate('dashboard:metrics:*');

// Invalidate cache for specific feedback
await cacheService.invalidateForFeedback('feedback-123', 'temple-456');

// Check cache availability
const isAvailable = await cacheService.isAvailable();

// Clean up on shutdown
await cacheService.disconnect();
```

## Cache Key Patterns

The service uses the following key patterns:

- `dashboard:metrics:*` - All dashboard metrics
- `dashboard:temple:{templeId}:*` - Temple-specific metrics
- `dashboard:reviews:*` - Review lists
- `dashboard:visualizations:*` - Visualization data

## Error Handling

The service implements graceful degradation:

1. **Redis Not Installed**: Logs warning, operates in no-cache mode
2. **Connection Failure**: Logs error, returns null for gets, silently fails for sets
3. **Operation Errors**: Logs error, continues without throwing

## Dependencies

**Required Package** (to be installed):
```bash
npm install redis
npm install --save-dev @types/redis
```

The service uses dynamic imports to handle the case where Redis is not yet installed.

## Testing Considerations

When testing:
- Mock the Redis client for unit tests
- Test graceful degradation by simulating connection failures
- Verify TTL expiration behavior
- Test pattern matching for invalidation

## Performance

- Uses SCAN instead of KEYS for pattern matching (production-safe)
- Implements connection pooling via Redis client
- Supports batch operations through pattern invalidation
- Minimal overhead when cache is disabled

## Requirement Validation

**Validates: Requirement 10.3**
- Cache aggregated metrics for 30 seconds to reduce database load
- Invalidate cache on data changes
- Graceful degradation when cache unavailable
