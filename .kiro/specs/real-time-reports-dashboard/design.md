# Technical Design Document: Real-Time Reports and Dashboard

## Overview

The Real-Time Reports and Dashboard feature provides comprehensive analytics and insights into user feedback for the Sanaathana-Aalaya-Charithra temple heritage application. This feature enables administrators and stakeholders to monitor user engagement, satisfaction, and sentiment in real-time through an interactive dashboard with visualizations, filtering capabilities, and report export functionality.

The system processes ratings, reviews, comments, and suggestions from users, performs sentiment analysis, aggregates metrics, and presents the data through a responsive web interface with real-time updates via WebSocket connections. The architecture is designed to handle high volumes of feedback data while maintaining sub-5-second update latency and supporting concurrent dashboard users.

### Key Capabilities

- Real-time display of ratings and reviews with sub-5-second latency
- Automated sentiment analysis using AWS Comprehend
- Aggregated metrics (average ratings, review counts, sentiment distribution)
- Interactive visualizations (line charts, pie charts, bar charts, histograms)
- Advanced filtering by time range, temple, region, and category
- Report export in CSV and PDF formats with embedded visualizations
- Role-based access control for administrators and regional managers
- Performance optimization through caching and incremental calculations
- WebSocket-based real-time updates with automatic reconnection

## Architecture

### System Architecture

The dashboard follows a serverless architecture pattern leveraging AWS managed services:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard Web Client                         │
│              (React SPA with Chart.js/Recharts)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS/WSS
                 │
         ┌───────┴────────┐
         │                │
         ↓                ↓
┌─────────────────┐  ┌──────────────────┐
│  API Gateway    │  │  API Gateway     │
│  (REST API)     │  │  (WebSocket API) │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         │                    │
         ↓                    ↓
┌─────────────────┐  ┌──────────────────┐
│  Dashboard      │  │  WebSocket       │
│  Lambda         │  │  Lambda          │
│  (Query/Export) │  │  (Connect/Push)  │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ↓                 ↓
┌─────────────────┐  ┌──────────────────┐
│  DynamoDB       │  │  ElastiCache     │
│  (Feedback Data)│  │  (Redis Cache)   │
└─────────────────┘  └──────────────────┘
         │
         ↓
┌─────────────────┐
│  EventBridge    │
│  (Change Stream)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Sentiment      │
│  Lambda         │
│  (AWS Comprehend)│
└─────────────────┘
```

### Data Flow

1. **Feedback Submission Flow**:
   - User submits rating/review via mobile app
   - Feedback stored in DynamoDB Feedback table
   - DynamoDB Stream triggers EventBridge rule
   - EventBridge invokes Sentiment Analysis Lambda
   - Sentiment Lambda calls AWS Comprehend API
   - Sentiment score stored back in DynamoDB
   - Cache invalidation triggered for affected metrics
   - WebSocket Lambda notified to push updates to connected clients

2. **Dashboard Query Flow**:
   - Dashboard client requests data via REST API
   - API Gateway authenticates request (JWT token)
   - Dashboard Lambda checks ElastiCache for cached results
   - If cache miss, queries DynamoDB and aggregates data
   - Results cached in ElastiCache (30-second TTL)
   - Response returned to client with metrics and visualizations data

3. **Real-Time Update Flow**:
   - Dashboard client establishes WebSocket connection
   - Connection ID stored in DynamoDB Connections table
   - When feedback changes occur, WebSocket Lambda queries affected connections
   - Delta updates pushed to connected clients
   - Client updates UI incrementally without full refresh

### Technology Stack

- **Frontend**: React 18, TypeScript, Chart.js/Recharts, TailwindCSS
- **Backend**: AWS Lambda (Node.js 18), TypeScript
- **Database**: Amazon DynamoDB (on-demand billing)
- **Cache**: Amazon ElastiCache for Redis (t3.micro)
- **Real-Time**: API Gateway WebSocket API
- **AI/ML**: AWS Comprehend (sentiment analysis)
- **API**: API Gateway REST API v2
- **Authentication**: AWS Cognito (JWT tokens)
- **Report Generation**: PDFKit (PDF), csv-stringify (CSV)
- **Testing**: Jest, fast-check (property-based testing)

## Components and Interfaces

### Frontend Components

#### DashboardContainer
Main container component managing state and orchestrating child components.

```typescript
interface DashboardContainerProps {
  userId: string;
  userRole: 'admin' | 'analyst' | 'regional_manager';
  region?: string;
}

interface DashboardState {
  metrics: AggregatedMetrics;
  filters: FilterState;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  loading: boolean;
  error: Error | null;
}
```

#### MetricsPanel
Displays key metrics (average rating, review count, sentiment distribution).

```typescript
interface MetricsPanelProps {
  averageRating: number;
  totalReviews: number;
  sentimentDistribution: SentimentDistribution;
  timeRange: TimeRange;
}
```

#### VisualizationPanel
Renders charts and graphs using Chart.js or Recharts.

```typescript
interface VisualizationPanelProps {
  ratingTrend: TimeSeriesData[];
  sentimentPie: SentimentDistribution;
  reviewsByTemple: BarChartData[];
  ratingHistogram: HistogramData[];
  onChartClick: (dataPoint: ChartDataPoint) => void;
}
```

#### FilterPanel
Provides filtering controls for time range, temple, region, category.

```typescript
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableTemples: Temple[];
  availableRegions: string[];
}

interface FilterState {
  timeRange: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
  templeIds: string[];
  regions: string[];
  categories: string[];
}
```

#### ReviewList
Displays paginated list of reviews with sentiment indicators.

```typescript
interface ReviewListProps {
  reviews: Review[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}
```

#### ExportPanel
Handles report export functionality.

```typescript
interface ExportPanelProps {
  onExport: (format: 'csv' | 'pdf') => Promise<void>;
  isExporting: boolean;
}
```

### Backend Components

#### DashboardService
Core service for querying and aggregating dashboard data.

```typescript
class DashboardService {
  constructor(
    private feedbackRepository: FeedbackRepository,
    private cacheService: CacheService,
    private metricsAggregator: MetricsAggregator
  ) {}

  async getDashboardData(
    filters: FilterState,
    userId: string,
    userRole: string
  ): Promise<DashboardData>;

  async getReviews(
    filters: FilterState,
    pagination: PaginationState
  ): Promise<PaginatedReviews>;

  async getComments(
    filters: FilterState,
    commentType?: CommentType
  ): Promise<Comment[]>;
}
```

#### MetricsAggregator
Calculates aggregated metrics from raw feedback data.

```typescript
class MetricsAggregator {
  async calculateAverageRating(
    feedbackItems: Feedback[]
  ): Promise<number>;

  async calculateSentimentDistribution(
    feedbackItems: Feedback[]
  ): Promise<SentimentDistribution>;

  async calculateReviewCount(
    filters: FilterState
  ): Promise<ReviewCountByPeriod>;

  async calculateRatingTrend(
    filters: FilterState,
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Promise<TimeSeriesData[]>;

  // Incremental calculation to avoid full recalculation
  async updateMetricsIncremental(
    previousMetrics: AggregatedMetrics,
    newFeedback: Feedback
  ): Promise<AggregatedMetrics>;
}
```

#### SentimentAnalyzer
Analyzes sentiment using AWS Comprehend.

```typescript
class SentimentAnalyzer {
  constructor(private comprehendClient: ComprehendClient) {}

  async analyzeSentiment(
    text: string,
    rating: number
  ): Promise<SentimentScore>;

  async classifySentiment(
    score: number
  ): Promise<'positive' | 'neutral' | 'negative'>;

  // Batch processing for efficiency
  async analyzeBatch(
    items: Array<{ text: string; rating: number }>
  ): Promise<SentimentScore[]>;
}
```

#### ReportGenerator
Generates exportable reports in CSV and PDF formats.

```typescript
class ReportGenerator {
  async generateCSV(
    data: DashboardData,
    filters: FilterState
  ): Promise<Buffer>;

  async generatePDF(
    data: DashboardData,
    filters: FilterState,
    charts: ChartImage[]
  ): Promise<Buffer>;

  private async renderChartToImage(
    chartData: ChartData
  ): Promise<Buffer>;
}
```

#### WebSocketManager
Manages WebSocket connections and real-time updates.

```typescript
class WebSocketManager {
  async handleConnect(
    connectionId: string,
    userId: string
  ): Promise<void>;

  async handleDisconnect(
    connectionId: string
  ): Promise<void>;

  async pushUpdate(
    update: DashboardUpdate,
    targetUsers?: string[]
  ): Promise<void>;

  async broadcastToRole(
    update: DashboardUpdate,
    role: string
  ): Promise<void>;
}
```

#### CacheService
Manages ElastiCache Redis operations for performance optimization.

```typescript
class CacheService {
  async get<T>(key: string): Promise<T | null>;

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number
  ): Promise<void>;

  async invalidate(pattern: string): Promise<void>;

  async invalidateForFeedback(
    feedbackId: string,
    templeId: string
  ): Promise<void>;
}
```

### API Endpoints

#### REST API Endpoints

```
GET /dashboard/metrics
  Query Parameters:
    - timeRange: string
    - templeIds: string[] (comma-separated)
    - regions: string[] (comma-separated)
    - categories: string[] (comma-separated)
  Headers:
    - Authorization: Bearer <JWT>
  Response: AggregatedMetrics

GET /dashboard/reviews
  Query Parameters:
    - timeRange: string
    - templeIds: string[]
    - page: number
    - pageSize: number
  Headers:
    - Authorization: Bearer <JWT>
  Response: PaginatedReviews

GET /dashboard/comments
  Query Parameters:
    - timeRange: string
    - commentType: 'general' | 'suggestion' | 'complaint'
    - search: string
  Headers:
    - Authorization: Bearer <JWT>
  Response: Comment[]

POST /dashboard/export
  Body:
    - format: 'csv' | 'pdf'
    - filters: FilterState
    - includeCharts: boolean
  Headers:
    - Authorization: Bearer <JWT>
  Response: Binary file download

GET /dashboard/visualizations
  Query Parameters:
    - timeRange: string
    - templeIds: string[]
    - chartType: 'trend' | 'sentiment' | 'distribution' | 'histogram'
  Headers:
    - Authorization: Bearer <JWT>
  Response: ChartData
```

#### WebSocket API Routes

```
$connect
  - Authenticate connection
  - Store connection ID with user metadata
  - Return connection acknowledgment

$disconnect
  - Remove connection from tracking table
  - Clean up resources

$default
  - Handle ping/pong for keep-alive
  - Route custom messages

subscribe
  Body:
    - filters: FilterState
  - Subscribe connection to specific data updates

unsubscribe
  - Unsubscribe from updates
```

## Data Models

### Feedback Table

```typescript
interface Feedback {
  feedbackId: string;           // Partition Key
  timestamp: number;            // Sort Key (Unix timestamp)
  userId: string;
  templeId: string;
  artifactId?: string;
  rating: number;               // 1-5
  reviewText?: string;
  commentText?: string;
  commentType?: 'general' | 'suggestion' | 'complaint';
  sentimentScore?: number;      // -1.0 to 1.0
  sentimentLabel?: 'positive' | 'neutral' | 'negative';
  region: string;
  category: string;
  metadata: {
    deviceType: string;
    appVersion: string;
    language: string;
  };
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

// GSI: templeId-timestamp-index
// GSI: region-timestamp-index
// GSI: sentimentLabel-timestamp-index
```

### AggregatedMetrics Table

```typescript
interface AggregatedMetrics {
  metricId: string;             // Partition Key (e.g., "temple:123:2024-01-15")
  metricType: string;           // Sort Key (e.g., "daily_summary")
  averageRating: number;
  totalReviews: number;
  totalComments: number;
  sentimentDistribution: {
    positive: number;           // Percentage
    neutral: number;
    negative: number;
  };
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  calculatedAt: string;
  ttl: number;                  // Auto-expire after 90 days
}
```

### WebSocketConnections Table

```typescript
interface WebSocketConnection {
  connectionId: string;         // Partition Key
  userId: string;
  userRole: string;
  region?: string;
  subscribedFilters: FilterState;
  connectedAt: number;
  lastPingAt: number;
  ttl: number;                  // Auto-expire after 24 hours
}

// GSI: userId-index
// GSI: userRole-index
```

### ExportJobs Table

```typescript
interface ExportJob {
  jobId: string;                // Partition Key
  userId: string;
  format: 'csv' | 'pdf';
  filters: FilterState;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  s3Key?: string;               // S3 location of generated report
  error?: string;
  createdAt: string;
  completedAt?: string;
  ttl: number;                  // Auto-expire after 7 days
}

// GSI: userId-createdAt-index
```

### Supporting Types

```typescript
interface TimeSeriesData {
  timestamp: number;
  value: number;
  label: string;
}

interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

interface BarChartData {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

interface HistogramData {
  bin: number;
  count: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

interface PaginatedReviews {
  reviews: Review[];
  pagination: PaginationState;
}

interface Review {
  feedbackId: string;
  userId: string;
  userName?: string;
  templeId: string;
  templeName: string;
  rating: number;
  reviewText: string;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  timestamp: number;
  createdAt: string;
}

interface Comment {
  feedbackId: string;
  userId: string;
  templeId: string;
  templeName: string;
  commentText: string;
  commentType: 'general' | 'suggestion' | 'complaint';
  timestamp: number;
  createdAt: string;
}

interface DashboardData {
  metrics: AggregatedMetrics;
  reviews: Review[];
  comments: Comment[];
  visualizations: {
    ratingTrend: TimeSeriesData[];
    sentimentPie: SentimentDistribution;
    reviewsByTemple: BarChartData[];
    ratingHistogram: HistogramData[];
  };
}

interface DashboardUpdate {
  type: 'metrics' | 'new_review' | 'new_comment';
  data: Partial<DashboardData>;
  timestamp: number;
}

type TimeRange = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
type CommentType = 'general' | 'suggestion' | 'complaint';
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all 60 acceptance criteria, I identified the following redundancies and consolidations:

- Properties 1.1, 2.1, 6.1, 9.1 all test real-time update timing (5 seconds) - consolidated into Property 1
- Properties 1.2, 2.2, 6.3 all test required field display - consolidated into Property 2
- Properties 5.2, 5.3 both test review counting - consolidated into Property 6
- Properties 4.1, 5.1 both test metric update timing - consolidated into Property 1
- Properties 12.1, 12.2, 12.3 all test authentication/authorization - consolidated into Property 18
- Properties 8.1, 8.2 both test export formats - consolidated into Property 14

This reduces 60 criteria to 20 unique, non-redundant properties.

### Property 1: Real-Time Update Latency

For any feedback item (rating, review, or comment), when submitted to the system, the dashboard SHALL reflect the update within 5 seconds for all connected clients.

**Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1, 9.1**

### Property 2: Required Field Display

For any feedback item displayed on the dashboard, all required fields (rating value, review text, author identifier, timestamp, temple association, and sentiment label) SHALL be present in the rendered output.

**Validates: Requirements 1.2, 2.2, 6.3**

### Property 3: Rating Distribution Completeness

For any set of ratings, the displayed distribution SHALL include all rating levels (1-5 stars) with their respective counts, and the sum of all counts SHALL equal the total number of ratings.

**Validates: Requirements 1.3**

### Property 4: Chronological Ordering

For any list of reviews or comments, the items SHALL be ordered by timestamp in descending order (newest first).

**Validates: Requirements 2.3**

### Property 5: Pagination Behavior

For any dataset with more than 50 reviews, the dashboard SHALL provide pagination controls, and each page SHALL contain at most 50 items, except possibly the last page.

**Validates: Requirements 2.4**

### Property 6: Review Count Accuracy

For any set of reviews and any time period filter (today, this week, this month, all time), the displayed count SHALL equal the actual number of reviews within that time period, both overall and per temple.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 7: Sentiment Classification Consistency

For any sentiment score, the classification SHALL be positive if score >= 0.3, neutral if -0.3 < score < 0.3, and negative if score <= -0.3.

**Validates: Requirements 3.2**

### Property 8: Sentiment Input Consideration

For any rating and review text pair, changing either the rating or the text SHALL potentially affect the calculated sentiment score, demonstrating both inputs are considered.

**Validates: Requirements 3.3**

### Property 9: Sentiment Distribution Percentage Sum

For any sentiment distribution, the sum of positive, neutral, and negative percentages SHALL equal 100% (within floating-point precision tolerance).

**Validates: Requirements 3.4**

### Property 10: Empty Text Sentiment Calculation

For any rating with empty or whitespace-only review text, the sentiment score SHALL be calculated based solely on the rating value.

**Validates: Requirements 3.5**

### Property 11: Average Rating Precision

For any set of ratings, the calculated average SHALL be rounded to exactly two decimal places.

**Validates: Requirements 4.2**

### Property 12: Multi-Level Aggregation

For any set of ratings across multiple temples, the system SHALL correctly calculate both the overall average rating and per-temple average ratings, where the overall average equals the weighted average of per-temple averages.

**Validates: Requirements 4.4**

### Property 13: Comment Type Filtering

For any set of comments and any comment type filter (general, suggestion, complaint), the filtered results SHALL contain only comments matching the specified type.

**Validates: Requirements 6.2, 6.4**

### Property 14: Keyword Search Accuracy

For any set of comments and any search keyword, the search results SHALL contain only comments where the comment text contains the keyword (case-insensitive).

**Validates: Requirements 6.5**

### Property 15: Time Range Filtering

For any dataset and any time range filter, all returned data SHALL have timestamps within the specified range, and no data within the range SHALL be excluded.

**Validates: Requirements 7.2**

### Property 16: Multiple Filter AND Logic

For any dataset and any combination of filters (time range, temple, region, category), the results SHALL satisfy ALL applied filters simultaneously.

**Validates: Requirements 7.4**

### Property 17: Filter Persistence

For any user session, filter selections SHALL remain unchanged across dashboard operations until explicitly modified by the user.

**Validates: Requirements 7.5**


### Property 18: Export Format Validity

For any dashboard data, exporting in CSV format SHALL produce valid CSV with proper escaping, and exporting in PDF format SHALL produce a valid PDF document with embedded charts.

**Validates: Requirements 8.1, 8.2**

### Property 19: Export Completeness

For any export request with applied filters, the exported report SHALL include all visible metrics, the applied filter values, a timestamp, and the date range.

**Validates: Requirements 8.4, 8.5**

### Property 20: Cache Consistency

For any aggregated metric, repeated requests within 30 seconds SHALL return identical cached results, and requests after cache expiration SHALL return fresh data.

**Validates: Requirements 10.3**

### Property 21: Connection State Display

For any WebSocket connection state (connected, disconnected, reconnecting), the dashboard SHALL display the corresponding status indicator.

**Validates: Requirements 9.5**

### Property 22: Reconnection Behavior

For any lost WebSocket connection, the dashboard SHALL attempt reconnection at 5-second intervals until connection is restored.

**Validates: Requirements 9.3**

### Property 23: Data Refresh on Reconnection

For any WebSocket reconnection event, the dashboard SHALL fetch and display fresh data for all visible metrics.

**Validates: Requirements 9.4**

### Property 24: Authentication Requirement

For any dashboard API request without valid authentication credentials, the service SHALL reject the request with an authentication error.

**Validates: Requirements 12.1, 12.3**

### Property 25: Role-Based Authorization

For any authenticated user without administrator or analyst role, dashboard data requests SHALL be rejected with an authorization error.

**Validates: Requirements 12.2**

### Property 26: Role-Based Data Filtering

For any regional manager user, the dashboard SHALL return only data for temples within their assigned region.

**Validates: Requirements 12.4**

### Property 27: Access Audit Logging

For any dashboard access attempt (successful or failed), the system SHALL create a log entry containing the user identifier, timestamp, and access result.

**Validates: Requirements 12.5**

### Property 28: Loading State Management

For any asynchronous data fetch operation, the dashboard SHALL display a loading indicator from the start of the operation until completion or error.

**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid or expired JWT token
   - Missing authentication header
   - Response: 401 Unauthorized with error message

2. **Authorization Errors**
   - User lacks required role (admin/analyst)
   - User attempting to access data outside their region
   - Response: 403 Forbidden with error message

3. **Validation Errors**
   - Invalid filter parameters
   - Invalid time range specification
   - Invalid export format
   - Response: 400 Bad Request with validation details

4. **Data Errors**
   - Feedback item not found
   - Temple not found
   - Response: 404 Not Found with error message

5. **Service Errors**
   - AWS Comprehend API failure
   - DynamoDB throttling
   - ElastiCache connection failure
   - Response: 503 Service Unavailable with retry-after header

6. **Timeout Errors**
   - Query exceeds timeout threshold
   - Export generation exceeds timeout
   - Response: 504 Gateway Timeout

7. **WebSocket Errors**
   - Connection failure
   - Message delivery failure
   - Client handling: Automatic reconnection with exponential backoff

### Error Handling Strategies

#### Graceful Degradation
- If sentiment analysis fails, display feedback without sentiment label
- If cache is unavailable, query database directly
- If real-time updates fail, fall back to polling every 30 seconds

#### Retry Logic
- DynamoDB throttling: Exponential backoff with jitter (max 3 retries)
- AWS Comprehend rate limits: Queue requests and batch process
- WebSocket reconnection: Exponential backoff starting at 5 seconds (max 60 seconds)

#### Circuit Breaker Pattern
- If AWS Comprehend fails 5 times in 60 seconds, open circuit for 5 minutes
- If ElastiCache fails 3 times in 30 seconds, bypass cache for 2 minutes
- Monitor circuit state and alert operations team

#### Error Logging
- All errors logged to CloudWatch Logs with structured JSON format
- Include request ID, user ID, error type, stack trace, and context
- Critical errors trigger CloudWatch alarms

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable error message
    details?: any;             // Additional error context
    requestId: string;         // Request tracking ID
    timestamp: string;         // ISO 8601 timestamp
  };
}
```

### Client-Side Error Handling

```typescript
// Dashboard client error handling
try {
  const data = await dashboardService.getMetrics(filters);
  setDashboardData(data);
} catch (error) {
  if (error.code === 'AUTHENTICATION_REQUIRED') {
    redirectToLogin();
  } else if (error.code === 'AUTHORIZATION_FAILED') {
    showErrorMessage('You do not have permission to view this data');
  } else if (error.code === 'SERVICE_UNAVAILABLE') {
    showErrorMessage('Service temporarily unavailable. Retrying...');
    scheduleRetry();
  } else {
    showErrorMessage('An unexpected error occurred');
    logErrorToMonitoring(error);
  }
}
```


## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing

#### Library Selection
We will use **fast-check** for property-based testing in TypeScript/JavaScript. Fast-check is a mature, well-maintained library with excellent TypeScript support and integration with Jest.

#### Configuration
- Each property test MUST run a minimum of 100 iterations
- Each property test MUST reference its design document property via comment tag
- Tag format: `// Feature: real-time-reports-dashboard, Property {number}: {property_text}`

#### Property Test Examples

```typescript
import fc from 'fast-check';

// Feature: real-time-reports-dashboard, Property 3: Rating Distribution Completeness
describe('Rating Distribution', () => {
  it('should include all rating levels and sum to total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 1000 }),
        (ratings) => {
          const distribution = calculateRatingDistribution(ratings);
          
          // All levels 1-5 should be present
          expect(distribution).toHaveProperty('1');
          expect(distribution).toHaveProperty('2');
          expect(distribution).toHaveProperty('3');
          expect(distribution).toHaveProperty('4');
          expect(distribution).toHaveProperty('5');
          
          // Sum should equal total ratings
          const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
          expect(sum).toBe(ratings.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: real-time-reports-dashboard, Property 7: Sentiment Classification Consistency
describe('Sentiment Classification', () => {
  it('should classify sentiment consistently based on score thresholds', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1.0, max: 1.0 }),
        (score) => {
          const classification = classifySentiment(score);
          
          if (score >= 0.3) {
            expect(classification).toBe('positive');
          } else if (score <= -0.3) {
            expect(classification).toBe('negative');
          } else {
            expect(classification).toBe('neutral');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: real-time-reports-dashboard, Property 11: Average Rating Precision
describe('Average Rating Calculation', () => {
  it('should round to exactly two decimal places', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 100 }),
        (ratings) => {
          const average = calculateAverageRating(ratings);
          
          // Check precision: should have at most 2 decimal places
          const decimalPlaces = (average.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
          
          // Verify it's actually rounded, not truncated
          const sum = ratings.reduce((a, b) => a + b, 0);
          const expected = Math.round((sum / ratings.length) * 100) / 100;
          expect(average).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: real-time-reports-dashboard, Property 16: Multiple Filter AND Logic
describe('Filter Combination', () => {
  it('should apply multiple filters with AND logic', () => {
    fc.assert(
      fc.property(
        fc.array(feedbackArbitrary(), { minLength: 10, maxLength: 100 }),
        fc.record({
          timeRange: fc.constantFrom('today', 'last_7_days', 'last_30_days'),
          templeIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
          regions: fc.array(fc.constantFrom('North', 'South', 'East', 'West'), { minLength: 1, maxLength: 2 })
        }),
        (feedbackItems, filters) => {
          const filtered = applyFilters(feedbackItems, filters);
          
          // Every result should match ALL filters
          filtered.forEach(item => {
            expect(filters.templeIds).toContain(item.templeId);
            expect(filters.regions).toContain(item.region);
            expect(isWithinTimeRange(item.timestamp, filters.timeRange)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

#### Focus Areas for Unit Tests

1. **Specific Examples**
   - Empty state handling (no ratings, no reviews)
   - Single item scenarios
   - Boundary values (exactly 50 reviews for pagination)

2. **Edge Cases**
   - Empty review text with rating
   - Maximum dataset sizes
   - Special characters in search keywords
   - Invalid date ranges

3. **Error Conditions**
   - Authentication failures
   - Authorization failures
   - Service unavailability
   - Timeout scenarios

4. **Integration Points**
   - AWS Comprehend API integration
   - DynamoDB query patterns
   - ElastiCache operations
   - WebSocket message handling

#### Unit Test Examples

```typescript
// Empty state handling
describe('Dashboard Empty States', () => {
  it('should display "No ratings yet" when no ratings exist', () => {
    const metrics = calculateMetrics([]);
    expect(metrics.averageRatingDisplay).toBe('No ratings yet');
  });

  it('should display "No data available" message when no ratings exist', () => {
    const component = render(<MetricsPanel averageRating={null} />);
    expect(component.getByText('No data available')).toBeInTheDocument();
  });
});

// Pagination boundary
describe('Review Pagination', () => {
  it('should enable pagination when exactly 51 reviews exist', () => {
    const reviews = generateReviews(51);
    const result = paginateReviews(reviews, { page: 1, pageSize: 50 });
    
    expect(result.pagination.totalPages).toBe(2);
    expect(result.reviews).toHaveLength(50);
  });

  it('should not enable pagination when exactly 50 reviews exist', () => {
    const reviews = generateReviews(50);
    const result = paginateReviews(reviews, { page: 1, pageSize: 50 });
    
    expect(result.pagination.totalPages).toBe(1);
    expect(result.reviews).toHaveLength(50);
  });
});

// Authentication error handling
describe('Authentication', () => {
  it('should reject requests without authentication token', async () => {
    const request = createRequest({ headers: {} });
    
    await expect(dashboardHandler(request)).rejects.toThrow('Authentication required');
  });

  it('should reject requests with expired token', async () => {
    const expiredToken = createExpiredToken();
    const request = createRequest({ 
      headers: { Authorization: `Bearer ${expiredToken}` } 
    });
    
    await expect(dashboardHandler(request)).rejects.toThrow('Token expired');
  });
});

// Chart rendering
describe('Visualization Charts', () => {
  it('should render line chart for rating trends', () => {
    const data = generateTrendData();
    const component = render(<VisualizationPanel ratingTrend={data} />);
    
    expect(component.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should render pie chart for sentiment distribution', () => {
    const data = { positive: 60, neutral: 30, negative: 10 };
    const component = render(<VisualizationPanel sentimentPie={data} />);
    
    expect(component.getByTestId('pie-chart')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Property Test Coverage**: All 28 correctness properties implemented

### Integration Testing

Integration tests will verify:
- End-to-end data flow from feedback submission to dashboard display
- WebSocket connection lifecycle and message delivery
- AWS service integrations (Comprehend, DynamoDB, ElastiCache)
- Report generation and export functionality
- Authentication and authorization flows

### Performance Testing

Performance tests will verify:
- Dashboard load time under 3 seconds for 100,000 records
- Real-time update latency under 5 seconds
- Export generation time under 10 seconds for 10,000 records
- WebSocket message delivery latency under 1 second
- Cache hit rate above 80% for repeated queries

### Test Data Generation

```typescript
// Arbitraries for property-based testing
const feedbackArbitrary = () => fc.record({
  feedbackId: fc.uuid(),
  timestamp: fc.integer({ min: Date.now() - 90 * 24 * 60 * 60 * 1000, max: Date.now() }),
  userId: fc.uuid(),
  templeId: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  reviewText: fc.option(fc.lorem({ maxCount: 50 }), { nil: undefined }),
  region: fc.constantFrom('North', 'South', 'East', 'West'),
  category: fc.constantFrom('Architecture', 'History', 'Rituals', 'Festivals')
});

const sentimentScoreArbitrary = () => fc.float({ min: -1.0, max: 1.0 });

const timeRangeArbitrary = () => fc.constantFrom(
  'today', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time'
);
```

## Implementation Notes

### Performance Optimization

1. **Database Indexing**
   - GSI on templeId-timestamp for temple-specific queries
   - GSI on region-timestamp for regional filtering
   - GSI on sentimentLabel-timestamp for sentiment filtering

2. **Caching Strategy**
   - Cache aggregated metrics for 30 seconds
   - Cache individual queries for 60 seconds
   - Invalidate cache on data changes using EventBridge

3. **Query Optimization**
   - Use DynamoDB parallel scans for large datasets
   - Implement pagination with LastEvaluatedKey
   - Pre-aggregate daily/weekly/monthly metrics

4. **WebSocket Optimization**
   - Send delta updates instead of full data refreshes
   - Batch multiple updates within 1-second window
   - Compress large messages using gzip

### Security Considerations

1. **Authentication**
   - JWT tokens with 1-hour expiration
   - Refresh tokens with 7-day expiration
   - Token rotation on each refresh

2. **Authorization**
   - Role-based access control (RBAC)
   - Regional data isolation for regional managers
   - Audit logging for all access attempts

3. **Data Protection**
   - Encryption at rest (DynamoDB, S3)
   - Encryption in transit (TLS 1.3)
   - PII masking in logs and exports

4. **Rate Limiting**
   - API Gateway throttling: 100 requests/second per user
   - WebSocket connection limit: 10 connections per user
   - Export generation limit: 5 exports per hour per user

### Scalability Considerations

1. **Horizontal Scaling**
   - Lambda auto-scales to handle concurrent requests
   - DynamoDB on-demand scaling for variable workloads
   - ElastiCache cluster mode for distributed caching

2. **Data Partitioning**
   - Partition feedback data by month for efficient queries
   - Archive data older than 2 years to S3 Glacier
   - Use composite partition keys to distribute load

3. **Connection Management**
   - WebSocket connection pooling
   - Automatic connection cleanup after 24 hours
   - Graceful degradation when connection limits reached

### Monitoring and Observability

1. **Metrics**
   - Dashboard load time (p50, p95, p99)
   - Real-time update latency
   - Cache hit rate
   - WebSocket connection count
   - API error rate

2. **Alarms**
   - Dashboard load time > 5 seconds
   - Real-time update latency > 10 seconds
   - Cache hit rate < 70%
   - API error rate > 5%
   - WebSocket connection failures > 10/minute

3. **Dashboards**
   - CloudWatch dashboard for key metrics
   - X-Ray tracing for request flow analysis
   - Custom dashboard for business metrics

### Deployment Strategy

1. **Infrastructure as Code**
   - AWS CDK for infrastructure provisioning
   - Separate stacks for different environments (dev, staging, prod)
   - Automated deployment pipeline with GitHub Actions

2. **Blue-Green Deployment**
   - Deploy new version alongside existing version
   - Gradually shift traffic to new version
   - Automatic rollback on error threshold

3. **Database Migrations**
   - Use DynamoDB table versioning
   - Maintain backward compatibility during migrations
   - Zero-downtime schema changes

## Summary

This design document provides a comprehensive technical specification for the Real-Time Reports and Dashboard feature. The architecture leverages AWS serverless services for scalability and cost-effectiveness, implements real-time updates via WebSocket, and includes robust error handling and performance optimization strategies.

The design addresses all 12 requirements with 28 correctness properties that will be validated through property-based testing using fast-check. The dual testing approach (unit tests + property tests) ensures both specific scenarios and general correctness are verified.

Key technical decisions include:
- Serverless architecture using AWS Lambda and API Gateway
- DynamoDB for flexible data storage with GSIs for efficient querying
- ElastiCache Redis for performance optimization
- AWS Comprehend for sentiment analysis
- WebSocket API for real-time updates with automatic reconnection
- Role-based access control with JWT authentication
- Comprehensive error handling with graceful degradation

The system is designed to handle high volumes of feedback data while maintaining sub-5-second update latency and supporting concurrent dashboard users with proper authentication, authorization, and audit logging.
