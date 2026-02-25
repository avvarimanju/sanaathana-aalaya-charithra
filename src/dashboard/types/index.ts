/**
 * Core TypeScript interfaces and types for Real-Time Reports Dashboard
 * Feature: real-time-reports-dashboard
 */

// ============================================================================
// Feedback and Review Types
// ============================================================================

export interface Feedback {
  feedbackId: string;           // Partition Key
  timestamp: number;            // Sort Key (Unix timestamp)
  userId: string;
  templeId: string;
  artifactId?: string;
  rating: number;               // 1-5
  reviewText?: string;
  commentText?: string;
  commentType?: CommentType;
  sentimentScore?: number;      // -1.0 to 1.0
  sentimentLabel?: SentimentLabel;
  region: string;
  category: string;
  metadata: FeedbackMetadata;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

export interface FeedbackMetadata {
  deviceType: string;
  appVersion: string;
  language: string;
}

export type CommentType = 'general' | 'suggestion' | 'complaint';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// ============================================================================
// Aggregated Metrics Types
// ============================================================================

export interface AggregatedMetrics {
  metricId: string;             // Partition Key (e.g., "temple:123:2024-01-15")
  metricType: string;           // Sort Key (e.g., "daily_summary")
  averageRating: number;
  totalReviews: number;
  totalComments: number;
  sentimentDistribution: SentimentDistribution;
  ratingDistribution: RatingDistribution;
  calculatedAt: string;
  ttl: number;                  // Auto-expire after 90 days
}

export interface SentimentDistribution {
  positive: number;             // Percentage
  neutral: number;
  negative: number;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

// ============================================================================
// Filter and State Types
// ============================================================================

export interface FilterState {
  timeRange: TimeRange;
  templeIds: string[];
  regions: string[];
  categories: string[];
}

export type TimeRange = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

// ============================================================================
// Dashboard Data Types
// ============================================================================

export interface DashboardData {
  metrics: AggregatedMetrics;
  reviews: Review[];
  comments: Comment[];
  visualizations: VisualizationData;
}

export interface Review {
  feedbackId: string;
  userId: string;
  userName?: string;
  templeId: string;
  templeName: string;
  rating: number;
  reviewText: string;
  sentimentLabel: SentimentLabel;
  timestamp: number;
  createdAt: string;
}

export interface Comment {
  feedbackId: string;
  userId: string;
  templeId: string;
  templeName: string;
  commentText: string;
  commentType: CommentType;
  timestamp: number;
  createdAt: string;
}

export interface VisualizationData {
  ratingTrend: TimeSeriesData[];
  sentimentPie: SentimentDistribution;
  reviewsByTemple: BarChartData[];
  ratingHistogram: HistogramData[];
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  label: string;
}

export interface BarChartData {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface HistogramData {
  bin: number;
  count: number;
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginatedReviews {
  reviews: Review[];
  pagination: PaginationState;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketConnection {
  connectionId: string;         // Partition Key
  userId: string;
  userRole: string;
  region?: string;
  subscribedFilters: FilterState;
  connectedAt: number;
  lastPingAt: number;
  ttl: number;                  // Auto-expire after 24 hours
}

export interface DashboardUpdate {
  type: 'metrics' | 'new_review' | 'new_comment';
  data: Partial<DashboardData>;
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// ============================================================================
// Export Job Types
// ============================================================================

export interface ExportJob {
  jobId: string;                // Partition Key
  userId: string;
  format: ExportFormat;
  filters: FilterState;
  status: ExportStatus;
  s3Key?: string;               // S3 location of generated report
  error?: string;
  createdAt: string;
  completedAt?: string;
  ttl: number;                  // Auto-expire after 7 days
}

export type ExportFormat = 'csv' | 'pdf';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// Sentiment Analysis Types
// ============================================================================

export interface SentimentScore {
  score: number;                // -1.0 to 1.0
  label: SentimentLabel;
  confidence?: number;
}

// ============================================================================
// User and Authentication Types
// ============================================================================

export type UserRole = 'admin' | 'analyst' | 'regional_manager';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  region?: string;
  email?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable error message
    details?: any;             // Additional error context
    requestId: string;         // Request tracking ID
    timestamp: string;         // ISO 8601 timestamp
  };
}

// ============================================================================
// Temple Types (for reference)
// ============================================================================

export interface Temple {
  templeId: string;
  name: string;
  region: string;
  category: string;
}
