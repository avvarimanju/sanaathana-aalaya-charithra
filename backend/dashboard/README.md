# Real-Time Reports Dashboard

This directory contains the implementation of the Real-Time Reports and Dashboard feature for the Sanaathana-Aalaya-Charithra temple heritage application.

## Overview

The Real-Time Reports Dashboard provides comprehensive analytics and insights into user feedback through:
- Real-time ratings and reviews display
- Automated sentiment analysis using AWS Comprehend
- Aggregated metrics and visualizations
- Advanced filtering capabilities
- Report export in CSV and PDF formats
- Role-based access control
- WebSocket-based real-time updates

## Directory Structure

```
src/dashboard/
├── types/              # TypeScript interfaces and types
├── services/           # Business logic services
│   ├── DashboardService.ts
│   ├── MetricsAggregator.ts
│   ├── SentimentAnalyzer.ts
│   ├── ReportGenerator.ts
│   ├── WebSocketManager.ts
│   └── CacheService.ts
├── repositories/       # Data access layer
│   └── FeedbackRepository.ts
├── lambdas/           # Lambda function handlers
│   ├── dashboard-query/
│   ├── export/
│   ├── sentiment-analysis/
│   └── websocket/
├── utils/             # Utility functions
└── README.md          # This file

tests/dashboard/
├── services/          # Service unit tests
├── repositories/      # Repository unit tests
├── lambdas/          # Lambda handler tests
├── properties/       # Property-based tests
├── fixtures/         # Test fixtures and arbitraries
└── setup.ts          # Test configuration
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18 with TypeScript
- **Framework**: AWS Lambda (serverless)
- **Database**: Amazon DynamoDB
- **Cache**: Amazon ElastiCache for Redis
- **AI/ML**: AWS Comprehend (sentiment analysis)
- **Real-Time**: API Gateway WebSocket API
- **API**: API Gateway REST API v2
- **Authentication**: AWS Cognito (JWT tokens)

### Testing
- **Unit Tests**: Jest
- **Property-Based Tests**: fast-check
- **Coverage**: 80% line coverage target

## Key Components

### Services

#### DashboardService
Core service for querying and aggregating dashboard data. Integrates with FeedbackRepository, CacheService, and MetricsAggregator.

#### MetricsAggregator
Calculates aggregated metrics from raw feedback data. Implements incremental calculation for performance optimization.

#### SentimentAnalyzer
Analyzes sentiment using AWS Comprehend. Supports both single-item and batch processing.

#### ReportGenerator
Generates exportable reports in CSV and PDF formats with embedded visualizations.

#### WebSocketManager
Manages WebSocket connections and real-time updates to connected clients.

#### CacheService
Manages ElastiCache Redis operations for performance optimization with 30-second TTL.

### Repositories

#### FeedbackRepository
Data access layer for DynamoDB operations. Implements query methods with pagination and filtering support.

## Testing Strategy

### Dual Testing Approach
- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using fast-check

### Property-Based Testing
All property tests use fast-check with a minimum of 100 iterations. Each test references its corresponding design document property using the format:

```typescript
// Feature: real-time-reports-dashboard, Property {number}: {property_text}
```

### Running Tests

```bash
# Run all dashboard tests
npm test -- tests/dashboard

# Run only property tests
npm test -- tests/dashboard/properties

# Run with coverage
npm test -- tests/dashboard --coverage

# Run in watch mode
npm test -- tests/dashboard --watch
```

## Configuration

### Environment Variables
- `FEEDBACK_TABLE_NAME`: DynamoDB Feedback table name
- `METRICS_TABLE_NAME`: DynamoDB Aggregated Metrics table name
- `CONNECTIONS_TABLE_NAME`: DynamoDB WebSocket Connections table name
- `EXPORT_JOBS_TABLE_NAME`: DynamoDB Export Jobs table name
- `EXPORT_BUCKET_NAME`: S3 bucket for export reports
- `REDIS_ENDPOINT`: ElastiCache Redis endpoint
- `REDIS_PORT`: ElastiCache Redis port
- `AWS_REGION`: AWS region

## API Endpoints

### REST API
- `GET /dashboard/metrics` - Get aggregated metrics
- `GET /dashboard/reviews` - Get paginated reviews
- `GET /dashboard/comments` - Get filtered comments
- `GET /dashboard/visualizations` - Get chart data
- `POST /dashboard/export` - Generate and download report

### WebSocket API
- `$connect` - Establish WebSocket connection
- `$disconnect` - Close WebSocket connection
- `$default` - Handle ping/pong and custom messages
- `subscribe` - Subscribe to data updates
- `unsubscribe` - Unsubscribe from updates

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5.3+
- AWS CLI configured
- AWS CDK 2.108+

### Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Deploy infrastructure
npm run deploy
```

## Architecture

The dashboard follows a serverless architecture pattern:
1. User submits feedback via mobile app
2. Feedback stored in DynamoDB
3. DynamoDB Stream triggers EventBridge
4. EventBridge invokes Sentiment Analysis Lambda
5. Sentiment Lambda calls AWS Comprehend
6. Results stored back in DynamoDB
7. Cache invalidation triggered
8. WebSocket Lambda pushes updates to connected clients
9. Dashboard displays real-time updates

## Performance Optimization

- **Caching**: 30-second TTL for aggregated metrics
- **Incremental Calculations**: Avoid full recalculation on updates
- **Database Indexing**: GSIs for efficient querying
- **WebSocket Delta Updates**: Send only changed data
- **Parallel Scans**: For large dataset queries

## Security

- **Authentication**: JWT tokens with 1-hour expiration
- **Authorization**: Role-based access control (admin, analyst, regional_manager)
- **Encryption**: At rest (DynamoDB, S3) and in transit (TLS 1.3)
- **Audit Logging**: All access attempts logged
- **Rate Limiting**: API Gateway throttling

## Monitoring

- Dashboard load time metrics
- Real-time update latency
- Cache hit rate
- WebSocket connection count
- API error rate
- CloudWatch alarms for critical thresholds

## References

- [Requirements Document](../../../.kiro/specs/real-time-reports-dashboard/requirements.md)
- [Design Document](../../../.kiro/specs/real-time-reports-dashboard/design.md)
- [Implementation Tasks](../../../.kiro/specs/real-time-reports-dashboard/tasks.md)
