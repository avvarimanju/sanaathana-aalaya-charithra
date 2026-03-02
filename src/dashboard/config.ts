/**
 * Configuration for Real-Time Reports Dashboard
 * Feature: real-time-reports-dashboard
 */

export interface DashboardConfig {
  // DynamoDB Table Names
  feedbackTableName: string;
  metricsTableName: string;
  connectionsTableName: string;
  exportJobsTableName: string;

  // S3 Configuration
  exportBucketName: string;

  // Redis Configuration
  redisEndpoint?: string;
  redisPort?: number;

  // Cache Configuration
  cacheEnabled: boolean;
  cacheTtlSeconds: number;

  // Real-Time Update Configuration
  updateLatencyMs: number;
  reconnectIntervalMs: number;

  // Performance Configuration
  maxQueryResults: number;
  defaultPageSize: number;
  maxExportRecords: number;

  // Sentiment Analysis Configuration
  sentimentBatchSize: number;
  sentimentPositiveThreshold: number;
  sentimentNegativeThreshold: number;

  // Rate Limiting
  apiRateLimit: number;
  apiBurstLimit: number;
  maxConnectionsPerUser: number;
  maxExportsPerHour: number;

  // AWS Configuration
  region: string;
}

/**
 * Get dashboard configuration from environment variables
 */
export function getDashboardConfig(): DashboardConfig {
  return {
    // DynamoDB Table Names
    feedbackTableName: process.env.FEEDBACK_TABLE_NAME || 'dev-dashboard-feedback',
    metricsTableName: process.env.METRICS_TABLE_NAME || 'dev-dashboard-aggregated-metrics',
    connectionsTableName: process.env.CONNECTIONS_TABLE_NAME || 'dev-dashboard-websocket-connections',
    exportJobsTableName: process.env.EXPORT_JOBS_TABLE_NAME || 'dev-dashboard-export-jobs',

    // S3 Configuration
    exportBucketName: process.env.EXPORT_BUCKET_NAME || 'dev-dashboard-exports',

    // Redis Configuration
    redisEndpoint: process.env.REDIS_ENDPOINT,
    redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,

    // Cache Configuration
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30'),

    // Real-Time Update Configuration
    updateLatencyMs: parseInt(process.env.UPDATE_LATENCY_MS || '5000'),
    reconnectIntervalMs: parseInt(process.env.RECONNECT_INTERVAL_MS || '5000'),

    // Performance Configuration
    maxQueryResults: parseInt(process.env.MAX_QUERY_RESULTS || '10000'),
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '50'),
    maxExportRecords: parseInt(process.env.MAX_EXPORT_RECORDS || '100000'),

    // Sentiment Analysis Configuration
    sentimentBatchSize: parseInt(process.env.SENTIMENT_BATCH_SIZE || '25'),
    sentimentPositiveThreshold: parseFloat(process.env.SENTIMENT_POSITIVE_THRESHOLD || '0.3'),
    sentimentNegativeThreshold: parseFloat(process.env.SENTIMENT_NEGATIVE_THRESHOLD || '-0.3'),

    // Rate Limiting
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
    apiBurstLimit: parseInt(process.env.API_BURST_LIMIT || '200'),
    maxConnectionsPerUser: parseInt(process.env.MAX_CONNECTIONS_PER_USER || '10'),
    maxExportsPerHour: parseInt(process.env.MAX_EXPORTS_PER_HOUR || '5'),

    // AWS Configuration - Default to ap-south-1 (Mumbai) for optimal performance in India
    region: process.env.AWS_REGION || 'ap-south-1'
  };
}

/**
 * Validate dashboard configuration
 */
export function validateDashboardConfig(config: DashboardConfig): void {
  const errors: string[] = [];

  if (!config.feedbackTableName) {
    errors.push('FEEDBACK_TABLE_NAME is required');
  }

  if (!config.metricsTableName) {
    errors.push('METRICS_TABLE_NAME is required');
  }

  if (!config.connectionsTableName) {
    errors.push('CONNECTIONS_TABLE_NAME is required');
  }

  if (!config.exportJobsTableName) {
    errors.push('EXPORT_JOBS_TABLE_NAME is required');
  }

  if (!config.exportBucketName) {
    errors.push('EXPORT_BUCKET_NAME is required');
  }

  if (config.cacheTtlSeconds < 0) {
    errors.push('CACHE_TTL_SECONDS must be non-negative');
  }

  if (config.sentimentPositiveThreshold < -1 || config.sentimentPositiveThreshold > 1) {
    errors.push('SENTIMENT_POSITIVE_THRESHOLD must be between -1 and 1');
  }

  if (config.sentimentNegativeThreshold < -1 || config.sentimentNegativeThreshold > 1) {
    errors.push('SENTIMENT_NEGATIVE_THRESHOLD must be between -1 and 1');
  }

  if (config.sentimentNegativeThreshold >= config.sentimentPositiveThreshold) {
    errors.push('SENTIMENT_NEGATIVE_THRESHOLD must be less than SENTIMENT_POSITIVE_THRESHOLD');
  }

  if (errors.length > 0) {
    throw new Error(`Dashboard configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Export singleton instance
let configInstance: DashboardConfig | null = null;

export function getConfig(): DashboardConfig {
  if (!configInstance) {
    configInstance = getDashboardConfig();
    validateDashboardConfig(configInstance);
  }
  return configInstance;
}
