/**
 * Constants for Real-Time Reports Dashboard
 * Feature: real-time-reports-dashboard
 */

// ============================================================================
// Time Range Constants
// ============================================================================

export const TIME_RANGES = {
  TODAY: 'today',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  ALL_TIME: 'all_time'
} as const;

export const TIME_RANGE_MILLISECONDS = {
  [TIME_RANGES.TODAY]: 24 * 60 * 60 * 1000,
  [TIME_RANGES.LAST_7_DAYS]: 7 * 24 * 60 * 60 * 1000,
  [TIME_RANGES.LAST_30_DAYS]: 30 * 24 * 60 * 60 * 1000,
  [TIME_RANGES.LAST_90_DAYS]: 90 * 24 * 60 * 60 * 1000,
  [TIME_RANGES.ALL_TIME]: Number.MAX_SAFE_INTEGER
};

// ============================================================================
// Sentiment Constants
// ============================================================================

export const SENTIMENT_LABELS = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative'
} as const;

export const SENTIMENT_THRESHOLDS = {
  POSITIVE: 0.3,
  NEGATIVE: -0.3
};

// ============================================================================
// Comment Type Constants
// ============================================================================

export const COMMENT_TYPES = {
  GENERAL: 'general',
  SUGGESTION: 'suggestion',
  COMPLAINT: 'complaint'
} as const;

// ============================================================================
// User Role Constants
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  REGIONAL_MANAGER: 'regional_manager'
} as const;

// ============================================================================
// Export Format Constants
// ============================================================================

export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf'
} as const;

// ============================================================================
// Export Status Constants
// ============================================================================

export const EXPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// ============================================================================
// Connection Status Constants
// ============================================================================

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting'
} as const;

// ============================================================================
// WebSocket Message Types
// ============================================================================

export const WEBSOCKET_MESSAGE_TYPES = {
  METRICS: 'metrics',
  NEW_REVIEW: 'new_review',
  NEW_COMMENT: 'new_comment',
  PING: 'ping',
  PONG: 'pong'
} as const;

// ============================================================================
// DynamoDB GSI Names
// ============================================================================

export const GSI_NAMES = {
  TEMPLE_TIMESTAMP: 'templeId-timestamp-index',
  REGION_TIMESTAMP: 'region-timestamp-index',
  SENTIMENT_TIMESTAMP: 'sentimentLabel-timestamp-index',
  USER_ID: 'userId-index',
  USER_ROLE: 'userRole-index',
  USER_CREATED_AT: 'userId-createdAt-index'
};

// ============================================================================
// Pagination Constants
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10
};

// ============================================================================
// Cache Constants
// ============================================================================

export const CACHE = {
  DEFAULT_TTL_SECONDS: 30,
  METRICS_TTL_SECONDS: 30,
  QUERY_TTL_SECONDS: 60,
  KEY_PREFIX: 'dashboard:'
};

export const CACHE_TTL = {
  DASHBOARD_DATA: 30,    // 30 seconds for complete dashboard data
  METRICS: 30,           // 30 seconds for aggregated metrics
  REVIEWS: 60,           // 60 seconds for review lists
  COMMENTS: 60,          // 60 seconds for comment lists
  VISUALIZATIONS: 30     // 30 seconds for visualization data
};

// ============================================================================
// Rating Constants
// ============================================================================

export const RATING = {
  MIN: 1,
  MAX: 5,
  PRECISION: 2 // Decimal places for average rating
};

// ============================================================================
// Performance Constants
// ============================================================================

export const PERFORMANCE = {
  UPDATE_LATENCY_MS: 5000,
  RECONNECT_INTERVAL_MS: 5000,
  MAX_RECONNECT_INTERVAL_MS: 60000,
  EXPORT_TIMEOUT_MS: 10000,
  QUERY_TIMEOUT_MS: 3000
};

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// ============================================================================
// Metric Types
// ============================================================================

export const METRIC_TYPES = {
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_SUMMARY: 'weekly_summary',
  MONTHLY_SUMMARY: 'monthly_summary',
  OVERALL_SUMMARY: 'overall_summary'
};

// ============================================================================
// Chart Types
// ============================================================================

export const CHART_TYPES = {
  LINE: 'line',
  PIE: 'pie',
  BAR: 'bar',
  HISTOGRAM: 'histogram'
};

// ============================================================================
// Granularity Constants
// ============================================================================

export const GRANULARITY = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};
