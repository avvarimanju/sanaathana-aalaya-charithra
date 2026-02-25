# Implementation Plan: Real-Time Reports and Dashboard

## Overview

This implementation plan breaks down the Real-Time Reports and Dashboard feature into discrete, manageable coding tasks. The feature provides comprehensive analytics and insights into user feedback through real-time updates, sentiment analysis, aggregated metrics, and interactive visualizations.

The implementation follows a serverless architecture using AWS Lambda, API Gateway, DynamoDB, ElastiCache, and AWS Comprehend. The frontend is built with React and TypeScript, while the backend uses Node.js 18 with TypeScript.

## Tasks

- [x] 1. Set up project structure and core infrastructure
  - Create directory structure for backend Lambda functions and frontend components
  - Set up TypeScript configuration for both frontend and backend
  - Configure AWS CDK infrastructure stack definitions
  - Define core TypeScript interfaces and types (Feedback, AggregatedMetrics, FilterState, etc.)
  - Set up Jest testing framework with fast-check for property-based testing
  - _Requirements: All requirements (foundational)_

- [x] 2. Implement data models and DynamoDB schema
  - [x] 2.1 Create DynamoDB table definitions using AWS CDK
    - Define Feedback table with GSIs (templeId-timestamp, region-timestamp, sentimentLabel-timestamp)
    - Define AggregatedMetrics table with TTL configuration
    - Define WebSocketConnections table with TTL and GSIs
    - Define ExportJobs table with TTL and GSI
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 9.1, 10.3_
  
  - [ ]* 2.2 Write property test for data model validation
    - **Property 2: Required Field Display**
    - **Validates: Requirements 1.2, 2.2, 6.3**
  
  - [x] 2.3 Create FeedbackRepository class for DynamoDB operations
    - Implement query methods with pagination support
    - Implement filtering by time range, temple, region, category
    - Implement batch write operations
    - _Requirements: 1.1, 2.1, 7.1, 7.2, 7.3_
  
  - [ ]* 2.4 Write unit tests for FeedbackRepository
    - Test query methods with various filter combinations
    - Test pagination edge cases
    - Test error handling for DynamoDB throttling
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 3. Implement sentiment analysis service
  - [x] 3.1 Create SentimentAnalyzer class with AWS Comprehend integration
    - Implement analyzeSentiment method for single items
    - Implement analyzeBatch method for bulk processing
    - Implement classifySentiment method with threshold logic
    - Handle empty review text scenarios
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ]* 3.2 Write property test for sentiment classification consistency
    - **Property 7: Sentiment Classification Consistency**
    - **Validates: Requirements 3.2**
  
  - [ ]* 3.3 Write property test for sentiment input consideration
    - **Property 8: Sentiment Input Consideration**
    - **Validates: Requirements 3.3**
  
  - [ ]* 3.4 Write property test for sentiment distribution percentage sum
    - **Property 9: Sentiment Distribution Percentage Sum**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.5 Write property test for empty text sentiment calculation
    - **Property 10: Empty Text Sentiment Calculation**
    - **Validates: Requirements 3.5**
  
  - [ ]* 3.6 Write unit tests for SentimentAnalyzer
    - Test AWS Comprehend API integration with mocks
    - Test error handling for API failures
    - Test batch processing logic
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Implement metrics aggregation service
  - [x] 4.1 Create MetricsAggregator class
    - Implement calculateAverageRating with two decimal precision
    - Implement calculateSentimentDistribution
    - Implement calculateReviewCount with time period support
    - Implement calculateRatingTrend with granularity options
    - Implement updateMetricsIncremental for performance optimization
    - _Requirements: 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4, 10.2_
  
  - [ ]* 4.2 Write property test for rating distribution completeness
    - **Property 3: Rating Distribution Completeness**
    - **Validates: Requirements 1.3**
  
  - [ ]* 4.3 Write property test for review count accuracy
    - **Property 6: Review Count Accuracy**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  
  - [ ]* 4.4 Write property test for average rating precision
    - **Property 11: Average Rating Precision**
    - **Validates: Requirements 4.2**
  
  - [ ]* 4.5 Write property test for multi-level aggregation
    - **Property 12: Multi-Level Aggregation**
    - **Validates: Requirements 4.4**
  
  - [ ]* 4.6 Write unit tests for MetricsAggregator
    - Test empty dataset handling
    - Test single item scenarios
    - Test incremental calculation logic
    - _Requirements: 4.1, 4.2, 4.5, 5.1_

- [x] 5. Implement caching service with ElastiCache Redis
  - [x] 5.1 Create CacheService class
    - Implement get/set methods with TTL support
    - Implement invalidate method with pattern matching
    - Implement invalidateForFeedback for targeted cache invalidation
    - Handle connection failures with graceful degradation
    - _Requirements: 10.3_
  
  - [ ]* 5.2 Write property test for cache consistency
    - **Property 20: Cache Consistency**
    - **Validates: Requirements 10.3**
  
  - [ ]* 5.3 Write unit tests for CacheService
    - Test cache hit/miss scenarios
    - Test TTL expiration
    - Test connection failure handling
    - _Requirements: 10.3_

- [x] 6. Checkpoint - Ensure core services are functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement dashboard query service
  - [x] 7.1 Create DashboardService class
    - Implement getDashboardData method with caching
    - Implement getReviews method with pagination
    - Implement getComments method with filtering
    - Integrate FeedbackRepository, CacheService, and MetricsAggregator
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 7.2, 10.1, 10.3_
  
  - [ ]* 7.2 Write property test for chronological ordering
    - **Property 4: Chronological Ordering**
    - **Validates: Requirements 2.3**
  
  - [ ]* 7.3 Write property test for pagination behavior
    - **Property 5: Pagination Behavior**
    - **Validates: Requirements 2.4**
  
  - [ ]* 7.4 Write property test for comment type filtering
    - **Property 13: Comment Type Filtering**
    - **Validates: Requirements 6.2, 6.4**
  
  - [ ]* 7.5 Write property test for keyword search accuracy
    - **Property 14: Keyword Search Accuracy**
    - **Validates: Requirements 6.5**
  
  - [ ]* 7.6 Write property test for time range filtering
    - **Property 15: Time Range Filtering**
    - **Validates: Requirements 7.2**
  
  - [ ]* 7.7 Write property test for multiple filter AND logic
    - **Property 16: Multiple Filter AND Logic**
    - **Validates: Requirements 7.4**
  
  - [ ]* 7.8 Write property test for filter persistence
    - **Property 17: Filter Persistence**
    - **Validates: Requirements 7.5**
  
  - [ ]* 7.9 Write unit tests for DashboardService
    - Test integration between components
    - Test cache hit/miss scenarios
    - Test error handling
    - _Requirements: 1.1, 2.1, 6.1, 7.1, 10.1_

- [x] 8. Implement report generation service
  - [x] 8.1 Create ReportGenerator class
    - Implement generateCSV method with proper escaping
    - Implement generatePDF method with PDFKit
    - Implement renderChartToImage for embedding charts in PDF
    - Handle large datasets efficiently
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 8.2 Write property test for export format validity
    - **Property 18: Export Format Validity**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ]* 8.3 Write property test for export completeness
    - **Property 19: Export Completeness**
    - **Validates: Requirements 8.4, 8.5**
  
  - [ ]* 8.4 Write unit tests for ReportGenerator
    - Test CSV generation with special characters
    - Test PDF generation with charts
    - Test timeout handling for large datasets
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. Implement WebSocket connection management
  - [x] 9.1 Create WebSocketManager class
    - Implement handleConnect for connection establishment
    - Implement handleDisconnect for cleanup
    - Implement pushUpdate for sending updates to clients
    - Implement broadcastToRole for role-based broadcasting
    - Store connections in DynamoDB WebSocketConnections table
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 9.2 Write property test for connection state display
    - **Property 21: Connection State Display**
    - **Validates: Requirements 9.5**
  
  - [ ]* 9.3 Write property test for reconnection behavior
    - **Property 22: Reconnection Behavior**
    - **Validates: Requirements 9.3**
  
  - [ ]* 9.4 Write property test for data refresh on reconnection
    - **Property 23: Data Refresh on Reconnection**
    - **Validates: Requirements 9.4**
  
  - [ ]* 9.5 Write unit tests for WebSocketManager
    - Test connection lifecycle
    - Test message delivery
    - Test error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 10. Implement Lambda function handlers
  - [x] 10.1 Create dashboard query Lambda handler
    - Implement REST API endpoint handlers (GET /dashboard/metrics, GET /dashboard/reviews, GET /dashboard/comments, GET /dashboard/visualizations)
    - Integrate authentication and authorization middleware
    - Integrate DashboardService
    - Implement error handling and logging
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2_
  
  - [x] 10.2 Create export Lambda handler
    - Implement POST /dashboard/export endpoint
    - Integrate ReportGenerator
    - Handle S3 upload for generated reports
    - Implement timeout handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 10.3 Create WebSocket Lambda handlers
    - Implement $connect handler with authentication
    - Implement $disconnect handler with cleanup
    - Implement $default handler for ping/pong
    - Implement subscribe/unsubscribe handlers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 10.4 Create sentiment analysis Lambda handler
    - Implement EventBridge trigger handler
    - Integrate SentimentAnalyzer
    - Update feedback records with sentiment scores
    - Trigger cache invalidation
    - Notify WebSocket clients of updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1_
  
  - [ ]* 10.5 Write property test for real-time update latency
    - **Property 1: Real-Time Update Latency**
    - **Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1, 9.1**
  
  - [ ]* 10.6 Write unit tests for Lambda handlers
    - Test request validation
    - Test authentication/authorization
    - Test error responses
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 11. Checkpoint - Ensure backend services are complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement authentication and authorization
  - [ ] 12.1 Create authentication middleware
    - Implement JWT token validation
    - Integrate with AWS Cognito
    - Handle token expiration and refresh
    - _Requirements: 12.1, 12.3_
  
  - [ ] 12.2 Create authorization middleware
    - Implement role-based access control (admin, analyst, regional_manager)
    - Implement regional data filtering for regional managers
    - _Requirements: 12.2, 12.4_
  
  - [ ] 12.3 Create audit logging service
    - Log all access attempts with user ID and timestamp
    - Log authentication failures
    - Log authorization failures
    - _Requirements: 12.5_
  
  - [ ]* 12.4 Write property test for authentication requirement
    - **Property 24: Authentication Requirement**
    - **Validates: Requirements 12.1, 12.3**
  
  - [ ]* 12.5 Write property test for role-based authorization
    - **Property 25: Role-Based Authorization**
    - **Validates: Requirements 12.2**
  
  - [ ]* 12.6 Write property test for role-based data filtering
    - **Property 26: Role-Based Data Filtering**
    - **Validates: Requirements 12.4**
  
  - [ ]* 12.7 Write property test for access audit logging
    - **Property 27: Access Audit Logging**
    - **Validates: Requirements 12.5**
  
  - [ ]* 12.8 Write unit tests for authentication and authorization
    - Test JWT validation with expired tokens
    - Test role verification
    - Test regional data filtering
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 13. Implement frontend React components
  - [ ] 13.1 Create DashboardContainer component
    - Implement state management for metrics, filters, and connection status
    - Integrate WebSocket connection for real-time updates
    - Implement error handling and loading states
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 9.1, 9.2, 9.5, 10.5_
  
  - [ ] 13.2 Create MetricsPanel component
    - Display average rating with star icons
    - Display total review count
    - Display sentiment distribution
    - Handle empty state display
    - _Requirements: 1.2, 1.3, 1.4, 4.3, 4.5, 5.2, 5.3, 5.4_
  
  - [ ] 13.3 Create VisualizationPanel component
    - Implement line chart for rating trends using Chart.js or Recharts
    - Implement pie chart for sentiment distribution
    - Implement bar chart for reviews by temple
    - Implement histogram for rating distribution
    - Implement drill-down on chart click
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 13.4 Create FilterPanel component
    - Implement time range filter controls
    - Implement temple/region/category filter controls
    - Implement filter persistence in session
    - Trigger dashboard updates on filter changes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 13.5 Create ReviewList component
    - Display paginated list of reviews
    - Display review metadata (author, timestamp, rating, sentiment)
    - Implement pagination controls
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 13.6 Create ExportPanel component
    - Implement export button with format selection (CSV/PDF)
    - Display loading indicator during export
    - Handle export download
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 13.7 Write property test for loading state management
    - **Property 28: Loading State Management**
    - **Validates: Requirements 10.5**
  
  - [ ]* 13.8 Write unit tests for React components
    - Test component rendering with various props
    - Test user interactions (filter changes, pagination, export)
    - Test WebSocket connection state handling
    - Test empty state display
    - _Requirements: 1.4, 2.4, 4.5, 9.5, 10.5_

- [ ] 14. Implement WebSocket client integration
  - [ ] 14.1 Create WebSocketClient service
    - Implement connection establishment with authentication
    - Implement automatic reconnection with exponential backoff
    - Implement message handling for dashboard updates
    - Implement connection state management
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 14.2 Integrate WebSocketClient with DashboardContainer
    - Subscribe to updates on component mount
    - Handle incoming updates and update state
    - Display connection status indicator
    - Refresh data on reconnection
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 14.3 Write unit tests for WebSocketClient
    - Test connection lifecycle
    - Test reconnection logic
    - Test message handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 15. Implement API client service
  - [ ] 15.1 Create DashboardApiClient class
    - Implement methods for all REST API endpoints
    - Implement authentication header injection
    - Implement error handling and retry logic
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 8.1, 12.1_
  
  - [ ]* 15.2 Write unit tests for DashboardApiClient
    - Test API request formatting
    - Test authentication header injection
    - Test error handling
    - _Requirements: 12.1, 12.3_

- [ ] 16. Checkpoint - Ensure frontend components are functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement AWS infrastructure with CDK
  - [ ] 17.1 Create CDK stack for DynamoDB tables
    - Define all tables with GSIs and TTL configurations
    - Configure on-demand billing mode
    - _Requirements: All requirements (infrastructure)_
  
  - [ ] 17.2 Create CDK stack for Lambda functions
    - Define all Lambda functions with appropriate memory and timeout settings
    - Configure environment variables
    - Set up IAM roles and permissions
    - _Requirements: All requirements (infrastructure)_
  
  - [ ] 17.3 Create CDK stack for API Gateway
    - Define REST API with endpoints
    - Define WebSocket API with routes
    - Configure authentication with Cognito
    - Configure throttling and rate limiting
    - _Requirements: 9.1, 9.2, 12.1_
  
  - [ ] 17.4 Create CDK stack for ElastiCache Redis
    - Define Redis cluster (t3.micro)
    - Configure security groups and VPC settings
    - _Requirements: 10.3_
  
  - [ ] 17.5 Create CDK stack for EventBridge
    - Define DynamoDB Stream trigger rule
    - Connect to sentiment analysis Lambda
    - _Requirements: 3.1, 9.1_
  
  - [ ] 17.6 Create CDK stack for S3 bucket
    - Define bucket for export reports
    - Configure lifecycle policies for auto-deletion after 7 days
    - _Requirements: 8.1, 8.2_

- [ ] 18. Wire all components together
  - [ ] 18.1 Integrate frontend with backend APIs
    - Configure API endpoint URLs
    - Test end-to-end data flow from frontend to backend
    - _Requirements: All requirements_
  
  - [ ] 18.2 Configure EventBridge to trigger sentiment analysis
    - Set up DynamoDB Stream on Feedback table
    - Connect stream to EventBridge rule
    - Test sentiment analysis trigger on feedback submission
    - _Requirements: 3.1, 9.1_
  
  - [ ] 18.3 Configure WebSocket notifications
    - Connect sentiment analysis Lambda to WebSocket manager
    - Test real-time updates flow from feedback submission to dashboard display
    - _Requirements: 9.1, 9.2_
  
  - [ ] 18.4 Configure cache invalidation
    - Set up cache invalidation triggers on data changes
    - Test cache consistency
    - _Requirements: 10.3_

- [ ]* 19. Write integration tests
  - Test end-to-end feedback submission to dashboard display flow
  - Test real-time update delivery via WebSocket
  - Test export generation and download
  - Test authentication and authorization flows
  - Test filter application and data refresh
  - _Requirements: All requirements_

- [ ]* 20. Write performance tests
  - Test dashboard load time with 100,000 records
  - Test real-time update latency
  - Test export generation time with 10,000 records
  - Test WebSocket message delivery latency
  - Test cache hit rate
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 21. Final checkpoint - Ensure all components are integrated and functional
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows across components
- Performance tests validate scalability and latency requirements
- The implementation uses TypeScript for both frontend (React) and backend (Node.js 18 Lambda)
- AWS CDK is used for infrastructure as code
- All 28 correctness properties from the design document are covered by property-based tests
