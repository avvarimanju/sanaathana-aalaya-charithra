# Implementation Plan: Admin Backend Application

## Overview

This implementation plan breaks down the Admin Backend Application into discrete, manageable tasks. The application is a comprehensive web-based administrative interface for the Sanaathana Aalaya Charithra platform, built with Next.js/React (TypeScript) frontend and AWS Lambda (Python) backend.

The implementation follows an incremental approach: infrastructure setup → backend APIs → frontend components → integration → testing. Each task builds on previous work and includes specific requirements references for traceability.

**Technology Stack:**
- **Backend**: Python 3.11+ Lambda functions with boto3 (AWS SDK)
- **Frontend**: Next.js/React with TypeScript
- **Infrastructure**: AWS CDK with Python
- **Testing**: pytest + Hypothesis (property-based testing) for backend, Jest for frontend

## Tasks

- [x] 1. Set up infrastructure foundation
  - Create new DynamoDB tables (AdminUsers, SystemConfiguration, AuditLog, Notifications, ContentModeration)
  - Set up AWS Cognito User Pool with MFA configuration
  - Create Cognito Identity Pool for AWS SDK access
  - Configure IAM roles and policies for admin operations
  - Set up API Gateway for admin endpoints
  - _Requirements: 1.1, 1.4, 6.1, 7.1, 8.1, 15.1, 17.1, 20.5_

- [x] 2. Implement authentication and authorization system
  - [x] 2.1 Create Cognito custom authorizer Lambda function (Python)
    - Implement JWT token verification using PyJWT
    - Implement session validation logic
    - Implement permission checking middleware
    - Implement rate limiting (100 requests/minute per user)
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [ ]* 2.2 Write property test for authentication (Hypothesis)
    - **Property 1: Authentication with valid credentials creates session**
    - **Property 2: Authentication with invalid credentials is rejected**
    - **Property 3: Expired sessions are rejected**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.6**

  - [x] 2.3 Create AdminAPIHandler Lambda function skeleton (Python)
    - Set up Lambda handler structure with Python
    - Implement error handling middleware
    - Implement CORS headers configuration
    - Implement audit logging helper functions using boto3
    - _Requirements: 1.7, 15.1, 18.5, 18.7_

  - [ ]* 2.4 Write unit tests for authorization middleware (pytest)
    - Test permission checking logic
    - Test rate limiting behavior
    - Test session expiration handling
    - _Requirements: 1.5, 1.6_


- [x] 3. Implement temple management backend APIs (Python)
  - [x] 3.1 Create temple CRUD endpoints (Python Lambda)
    - Implement GET /admin/temples (list with pagination, search, filters) using boto3 DynamoDB
    - Implement GET /admin/temples/{siteId} (get single temple)
    - Implement POST /admin/temples (create temple)
    - Implement PUT /admin/temples/{siteId} (update temple)
    - Implement DELETE /admin/temples/{siteId} (soft delete/archive)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8_

  - [ ]* 3.2 Write property tests for temple operations (Hypothesis)
    - **Property 4: Temple creation includes all required fields**
    - **Property 5: Temple updates are persisted correctly**
    - **Property 6: Temple deletion is soft delete**
    - **Property 7: Temple names are unique**
    - **Property 9: Temple filtering returns matching results**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.7, 2.8**

  - [x] 3.3 Implement temple image upload endpoint (Python Lambda)
    - Create POST /admin/temples/{siteId}/images endpoint
    - Implement S3 upload with progress tracking using boto3
    - Implement image validation (type, size) using Pillow
    - Generate and return S3 URLs
    - _Requirements: 2.6, 18.3_

  - [ ]* 3.4 Write property test for image uploads (Hypothesis)
    - **Property 8: Temple image uploads result in S3 URLs**
    - **Validates: Requirements 2.6**

  - [x] 3.5 Implement temple bulk operations endpoints (Python Lambda)
    - Create POST /admin/temples/bulk-delete endpoint
    - Create POST /admin/temples/bulk-update endpoint
    - Implement progress tracking for bulk operations
    - _Requirements: 14.1, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 3.6 Write property tests for bulk operations (Hypothesis)
    - **Property 35: Bulk operations report accurate results**
    - **Property 36: Bulk operation validation rejects invalid operations**
    - **Validates: Requirements 14.6, 14.7**

- [x] 4. Implement artifact management backend APIs
  - [x] 4.1 Create artifact CRUD endpoints
    - Implement GET /admin/artifacts (list with pagination, search, filters)
    - Implement GET /admin/artifacts/{artifactId} (get single artifact)
    - Implement POST /admin/artifacts (create artifact with QR code generation)
    - Implement PUT /admin/artifacts/{artifactId} (update artifact)
    - Implement DELETE /admin/artifacts/{artifactId} (soft delete/archive)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.10_

  - [ ]* 4.2 Write property tests for artifact operations
    - **Property 10: Artifact creation includes all required fields**
    - **Property 11: QR codes are globally unique**
    - **Property 12: Artifact deletion is soft delete**
    - **Property 13: Artifact updates invalidate cache**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.10**

  - [x] 4.3 Implement artifact media upload endpoint
    - Create POST /admin/artifacts/{artifactId}/media endpoint
    - Implement S3 upload for images and videos
    - Implement media validation (type, size)
    - _Requirements: 3.7, 18.3_

  - [x] 4.4 Implement QR code generation and download endpoint
    - Create GET /admin/artifacts/{artifactId}/qr-code endpoint
    - Implement QR code generation in PNG, SVG, PDF formats
    - Support configurable size and error correction level
    - _Requirements: 3.2, 3.9_

  - [ ]* 4.5 Write property test for QR code generation
    - **Property 14: QR code generation supports multiple formats**
    - **Validates: Requirements 3.9**

  - [x] 4.6 Implement artifact bulk operations endpoints
    - Create POST /admin/artifacts/bulk-delete endpoint
    - Implement progress tracking for bulk operations
    - _Requirements: 14.2, 14.3, 14.5, 14.6_

- [x] 5. Checkpoint - Ensure backend APIs are functional
  - Test all temple and artifact endpoints manually
  - Verify authentication and authorization work correctly
  - Verify audit logging is working
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Implement content generation monitoring backend APIs
  - [x] 6.1 Create content job monitoring endpoints
    - Implement GET /admin/content-jobs (list with pagination and filters)
    - Implement GET /admin/content-jobs/{jobId} (get job details with logs)
    - Implement POST /admin/content-jobs/{jobId}/retry (retry failed job)
    - Implement POST /admin/content-jobs/{jobId}/cancel (cancel in-progress job)
    - Implement GET /admin/content-jobs/stats (job statistics)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 4.9_

  - [ ]* 6.2 Write property tests for content job operations
    - **Property 15: Content jobs have valid status values**
    - **Property 16: Job retry creates new job**
    - **Property 17: Job cancellation updates status**
    - **Property 18: Job filtering returns matching results**
    - **Property 19: Job counts by status are accurate**
    - **Validates: Requirements 4.2, 4.5, 4.6, 4.8, 4.9**

- [x] 7. Implement analytics backend APIs
  - [x] 7.1 Create analytics query endpoints
    - Implement GET /admin/analytics/summary (key metrics)
    - Implement GET /admin/analytics/qr-scans (QR scan statistics)
    - Implement GET /admin/analytics/content-generation (content gen stats)
    - Implement GET /admin/analytics/language-usage (language distribution)
    - Implement GET /admin/analytics/geographic (geographic distribution)
    - Implement GET /admin/analytics/audio-playback (audio stats)
    - Implement GET /admin/analytics/qa-interactions (Q&A stats)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 7.2 Write property test for analytics accuracy
    - **Property 20: Analytics counts match actual data**
    - **Validates: Requirements 5.1**

  - [x] 7.3 Implement analytics export endpoint
    - Create POST /admin/analytics/export endpoint
    - Support CSV and JSON formats
    - Generate pre-signed S3 URLs for downloads
    - _Requirements: 5.9, 13.3_

  - [ ]* 7.4 Write property test for CSV export
    - **Property 21: CSV export format is valid**
    - **Validates: Requirements 5.9, 13.3**

- [x] 8. Implement user management backend APIs
  - [x] 8.1 Create user management endpoints
    - Implement GET /admin/users (list with pagination and filters)
    - Implement GET /admin/users/{userId} (get user details with activity)
    - Implement POST /admin/users (create admin user)
    - Implement PUT /admin/users/{userId} (update user)
    - Implement POST /admin/users/{userId}/deactivate (deactivate user)
    - Implement POST /admin/users/{userId}/activate (activate user)
    - Implement GET /admin/users/{userId}/activity (user activity log)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 6.9_

  - [ ]* 8.2 Write property tests for user management
    - **Property 22: User creation includes required fields**
    - **Property 23: User emails are unique**
    - **Property 24: User deactivation terminates sessions**
    - **Property 25: User management actions are logged**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.6, 6.8, 6.9**

  - [x] 8.3 Implement user activation email sending
    - Integrate with AWS SES or Cognito email
    - Send activation emails to new users
    - _Requirements: 6.7_

- [x] 9. Implement system configuration backend APIs
  - [x] 9.1 Create configuration management endpoints
    - Implement GET /admin/config (list configurations)
    - Implement GET /admin/config/{configId} (get single config)
    - Implement PUT /admin/config/{configId} (update config)
    - Implement GET /admin/config/{configId}/history (config history)
    - Implement POST /admin/config/validate (validate config values)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9_

  - [ ]* 9.2 Write property tests for configuration management
    - **Property 26: Configuration validation rejects invalid values**
    - **Property 27: Configuration history tracks changes**
    - **Validates: Requirements 7.7, 7.9**

  - [x] 9.3 Implement configuration notification to Lambda functions
    - Create EventBridge rule for config changes
    - Notify affected Lambda functions when config updates
    - _Requirements: 7.8_


- [x] 10. Implement content moderation backend APIs
  - [x] 10.1 Create content moderation endpoints
    - Implement GET /admin/moderation/pending (list pending content)
    - Implement GET /admin/moderation/{contentId} (get content details)
    - Implement POST /admin/moderation/{contentId}/approve (approve content)
    - Implement POST /admin/moderation/{contentId}/reject (reject content)
    - Implement POST /admin/moderation/{contentId}/edit (edit and approve)
    - Implement GET /admin/moderation/stats (moderation statistics)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 10.2 Write property tests for content moderation
    - **Property 28: Content approval publishes to mobile app**
    - **Property 29: Content rejection stores feedback**
    - **Property 30: Content filtering returns matching results**
    - **Validates: Requirements 8.2, 8.3, 8.5, 8.9**

- [x] 11. Implement cost monitoring backend
  - [x] 11.1 Create CostMonitoringLambda function
    - Implement AWS Cost Explorer API integration
    - Fetch current month costs by service
    - Fetch 12-month cost trends
    - Calculate cost forecasts
    - _Requirements: 9.1, 9.2_

  - [x] 11.2 Create cost monitoring endpoints
    - Implement GET /admin/costs/current (current month costs)
    - Implement GET /admin/costs/trend (historical trends)
    - Implement GET /admin/costs/alerts (cost alerts)
    - Implement POST /admin/costs/alerts (create alert)
    - Implement PUT /admin/costs/alerts/{alertId} (update alert)
    - Implement DELETE /admin/costs/alerts/{alertId} (delete alert)
    - Implement GET /admin/costs/resources (resource usage metrics)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 11.3 Write property test for cost alerts
    - **Property 31: Cost alerts trigger when thresholds exceeded**
    - **Validates: Requirements 9.8**

  - [x] 11.4 Set up EventBridge rule for daily cost data refresh
    - Create scheduled rule to run daily
    - Trigger CostMonitoringLambda to fetch and cache cost data
    - _Requirements: 9.10_

- [x] 12. Implement payment management backend APIs
  - [x] 12.1 Create payment management endpoints
    - Implement GET /admin/payments/transactions (list transactions)
    - Implement GET /admin/payments/transactions/{transactionId} (get details)
    - Implement POST /admin/payments/transactions/{transactionId}/refund (issue refund)
    - Implement GET /admin/payments/subscriptions (list subscriptions)
    - Implement POST /admin/payments/subscriptions/{subscriptionId}/cancel (cancel subscription)
    - Implement GET /admin/payments/revenue (revenue statistics)
    - Implement POST /admin/payments/export (export transactions)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ]* 12.2 Write property tests for payment operations
    - **Property 32: Transaction filtering returns matching results**
    - **Property 33: Refund updates transaction status**
    - **Validates: Requirements 10.2, 10.4, 10.5**

  - [x] 12.3 Integrate with Razorpay API
    - Implement Razorpay SDK integration
    - Implement refund processing
    - Implement subscription cancellation
    - Store Razorpay credentials in AWS Secrets Manager
    - _Requirements: 10.4, 10.5, 10.7_

- [ ] 13. Implement logging and audit trail backend
  - [ ] 13.1 Create LogAggregatorLambda function
    - Implement CloudWatch Logs API integration
    - Query logs from all Lambda functions
    - Filter logs by severity, source, date range, keywords
    - Aggregate API Gateway logs
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.8_

  - [ ] 13.2 Create logging endpoints
    - Implement GET /admin/logs (list logs with filters)
    - Implement GET /admin/logs/{logId} (get log details)
    - Implement GET /admin/logs/api-gateway (API Gateway logs)
    - Implement POST /admin/logs/export (export logs)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7, 11.8_

  - [ ]* 13.3 Write property test for log filtering
    - **Property 34: Log filtering returns matching results**
    - **Validates: Requirements 11.2, 11.3**

  - [ ] 13.4 Create audit trail endpoints
    - Implement GET /admin/audit (list audit logs)
    - Implement GET /admin/audit/{auditId} (get audit details)
    - Implement POST /admin/audit/export (export audit logs)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [ ]* 13.5 Write property tests for audit trail
    - **Property 37: All administrative actions create audit logs**
    - **Property 38: Audit logs are chronologically ordered**
    - **Property 39: Audit logs for updates include before/after values**
    - **Property 40: Audit logs are immutable**
    - **Validates: Requirements 15.1, 15.2, 15.4, 15.6**

- [ ] 14. Checkpoint - Ensure all backend APIs are complete
  - Test all endpoints manually with Postman or similar tool
  - Verify all audit logging is working
  - Verify all error handling is working
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 15. Set up Next.js frontend application
  - [ ] 15.1 Initialize Next.js project with TypeScript
    - Create Next.js 14+ project with TypeScript
    - Configure ESLint and Prettier
    - Set up folder structure (components, pages, services, hooks, types)
    - Install dependencies (Material-UI/Ant Design, React Query, Axios, Zod, React Hook Form)
    - _Requirements: 12.1, 12.2, 19.1_

  - [ ] 15.2 Configure AWS Amplify Auth
    - Install and configure AWS Amplify
    - Set up Cognito User Pool and Identity Pool configuration
    - Create AuthProvider context
    - Implement login/logout functionality
    - Implement session management with auto-refresh
    - _Requirements: 1.1, 1.2, 1.5, 1.7_

  - [ ] 15.3 Create authentication pages
    - Create LoginPage component with email/password form
    - Create MFA verification page
    - Implement ProtectedRoute HOC for route protection
    - Implement SessionManager for timeout handling
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7_

  - [ ]* 15.4 Write unit tests for authentication components
    - Test LoginPage rendering and form submission
    - Test ProtectedRoute authorization logic
    - Test SessionManager timeout handling
    - _Requirements: 1.1, 1.5, 1.7_

- [ ] 16. Implement frontend layout and navigation
  - [ ] 16.1 Create main layout components
    - Create AppLayout with sidebar and top bar
    - Create Sidebar navigation component
    - Create TopBar with user profile and notifications
    - Create Breadcrumb navigation component
    - Implement responsive layout for desktop and tablet
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ] 16.2 Create notification system components
    - Create NotificationBell component with unread count
    - Create NotificationPanel dropdown
    - Create NotificationSettings page
    - Implement notification polling or WebSocket connection
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

  - [ ]* 16.3 Write property tests for notifications
    - **Property 42: Notifications are created for critical events**
    - **Property 43: Notification read status can be updated**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.6**

- [ ] 17. Implement temple management frontend
  - [ ] 17.1 Create temple list page
    - Create TempleList component with data table
    - Implement pagination (50 records per page)
    - Implement search functionality with debouncing
    - Implement filters (state, status)
    - Implement column sorting
    - Implement bulk selection for bulk operations
    - _Requirements: 2.7, 14.1, 16.1, 16.3, 16.7, 19.6_

  - [ ]* 17.2 Write property test for temple search
    - **Property 41: Search returns matching results**
    - **Validates: Requirements 16.1**

  - [ ] 17.3 Create temple form components
    - Create TempleForm component for create/edit
    - Implement form validation with Zod schema
    - Implement TempleImageUploader with preview
    - Implement multi-image upload with progress bars
    - _Requirements: 2.1, 2.2, 2.6, 18.1, 18.2, 18.3, 19.3_

  - [ ]* 17.4 Write property tests for form validation
    - **Property 44: Required field validation rejects missing fields**
    - **Property 45: Format validation rejects invalid formats**
    - **Property 46: File validation rejects invalid files**
    - **Validates: Requirements 18.1, 18.2, 18.3**

  - [ ] 17.5 Create temple detail page
    - Create TempleDetail component
    - Display temple information and images
    - Display associated artifacts
    - Implement edit and delete actions
    - _Requirements: 2.2, 2.3_

  - [ ] 17.6 Implement temple bulk operations UI
    - Create bulk delete confirmation dialog
    - Create bulk update dialog
    - Implement progress tracking UI
    - Display operation results summary
    - _Requirements: 14.1, 14.3, 14.4, 14.5, 14.6, 14.8_

- [ ] 18. Implement artifact management frontend
  - [ ] 18.1 Create artifact list page
    - Create ArtifactList component grouped by temple
    - Implement pagination and search
    - Implement filters (temple, content availability)
    - Implement bulk selection
    - _Requirements: 3.8, 14.2, 16.2, 16.4_

  - [ ] 18.2 Create artifact form components
    - Create ArtifactForm component for create/edit
    - Implement form validation
    - Create ArtifactMediaUploader for images/videos
    - Implement QR code preview
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 18.1, 18.2, 18.3_

  - [ ] 18.3 Create QR code management UI
    - Create QRCodeGenerator component
    - Implement format selection (PNG, SVG, PDF)
    - Implement size and error correction configuration
    - Implement download functionality
    - _Requirements: 3.2, 3.9_

  - [ ] 18.4 Create artifact detail page
    - Create ArtifactDetail component
    - Display artifact information and media
    - Display content availability status
    - Implement edit and delete actions
    - _Requirements: 3.3, 3.4_


- [ ] 19. Implement content generation monitoring frontend
  - [ ] 19.1 Create content job list page
    - Create JobList component with data table
    - Implement pagination and filters (status, date, temple, artifact, content type)
    - Implement auto-refresh every 30 seconds
    - Display job status with color coding
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 4.9, 16.5_

  - [ ] 19.2 Create job detail page
    - Create JobDetail component
    - Display job information and logs
    - Implement retry and cancel actions
    - Display error messages and stack traces for failed jobs
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ] 19.3 Create job statistics dashboard
    - Display total job counts by status
    - Display success rate and average duration
    - Create charts for job trends
    - _Requirements: 4.9_

- [ ] 20. Implement analytics dashboard frontend
  - [ ] 20.1 Create analytics summary page
    - Create AnalyticsSummary component with key metrics cards
    - Display temple, artifact, and user counts
    - Display active user counts (daily, weekly, monthly)
    - Implement auto-refresh every 5 minutes
    - _Requirements: 5.1, 5.2, 5.10_

  - [ ] 20.2 Create analytics charts
    - Create UsageCharts component with Recharts/Chart.js
    - Implement QR scan trends chart
    - Implement content generation statistics chart
    - Implement audio playback statistics chart
    - Implement Q&A interaction statistics chart
    - _Requirements: 5.3, 5.4, 5.7, 5.8_

  - [ ] 20.3 Create geographic and language distribution visualizations
    - Create GeographicMap component
    - Create LanguageDistribution pie chart
    - _Requirements: 5.5, 5.6_

  - [ ] 20.4 Implement analytics export functionality
    - Create ExportButton component
    - Support CSV format export
    - Generate and download export files
    - _Requirements: 5.9, 13.3_

- [ ] 21. Implement user management frontend
  - [ ] 21.1 Create user list page
    - Create UserList component with data table
    - Implement pagination and filters (role, status)
    - Display last login time
    - _Requirements: 6.5_

  - [ ] 21.2 Create user form components
    - Create UserForm component for create/edit
    - Create RoleSelector component
    - Implement permission assignment based on role
    - Implement form validation
    - _Requirements: 6.1, 6.2, 6.3, 18.1, 18.2_

  - [ ] 21.3 Create user detail page
    - Create UserActivityLog component
    - Display user information and activity history
    - Implement activate/deactivate actions
    - _Requirements: 6.4, 6.5_

- [ ] 22. Implement system configuration frontend
  - [ ] 22.1 Create configuration panel
    - Create ConfigurationPanel with tabbed interface
    - Create LanguageConfig tab
    - Create BedrockConfig tab
    - Create PollyConfig tab
    - Create PaymentConfig tab
    - Create SessionConfig tab
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 22.2 Implement configuration validation
    - Implement client-side validation with Zod
    - Display validation errors inline
    - Prevent submission with invalid values
    - _Requirements: 7.7, 18.1, 18.8_

  - [ ] 22.3 Create configuration history view
    - Create ConfigHistory component
    - Display configuration change history
    - Show before/after values for changes
    - _Requirements: 7.9_

- [ ] 23. Implement content moderation frontend
  - [ ] 23.1 Create pending content list page
    - Create PendingContentList component
    - Implement filters (temple, artifact, language, content type)
    - Display quality scores
    - Highlight auto-approval eligible content
    - _Requirements: 8.1, 8.8, 8.9_

  - [ ] 23.2 Create content review panel
    - Create ContentReviewPanel with side-by-side language view
    - Create ContentEditor with rich text editing
    - Display all language versions simultaneously
    - _Requirements: 8.4, 8.7_

  - [ ] 23.3 Implement approval actions
    - Create ApprovalActions component
    - Implement approve, reject, and edit actions
    - Implement feedback input for rejection
    - _Requirements: 8.2, 8.3, 8.4, 8.6_


- [ ] 24. Implement cost monitoring frontend
  - [ ] 24.1 Create cost summary page
    - Create CostSummary component
    - Display current month costs by service
    - Display cost breakdown with charts
    - _Requirements: 9.1_

  - [ ] 24.2 Create cost trend visualization
    - Create CostTrendChart component
    - Display 12-month cost trends
    - Implement service-specific trend views
    - _Requirements: 9.2_

  - [ ] 24.3 Create resource usage metrics page
    - Create ResourceUsageMetrics component
    - Display Lambda invocation and duration stats
    - Display DynamoDB capacity consumption
    - Display S3 storage and transfer stats
    - Display Bedrock and Polly usage
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 24.4 Implement cost alert management
    - Create AlertConfiguration component
    - Implement alert threshold setting
    - Display triggered alerts with highlighting
    - _Requirements: 9.8, 9.9_

- [ ] 25. Implement payment management frontend
  - [ ] 25.1 Create transaction list page
    - Create TransactionList component with data table
    - Implement pagination and filters (status, date range, amount range)
    - Display transaction status with color coding
    - _Requirements: 10.1, 10.2, 16.6_

  - [ ] 25.2 Create transaction detail page
    - Create TransactionDetail component
    - Display transaction information
    - Implement refund action with confirmation dialog
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ] 25.3 Create subscription management page
    - Create SubscriptionManager component
    - Display active subscriptions
    - Implement subscription cancellation
    - _Requirements: 10.6, 10.7_

  - [ ] 25.4 Create revenue dashboard
    - Create RevenueChart component
    - Display daily, weekly, monthly revenue trends
    - Display revenue by temple and plan
    - _Requirements: 10.8_

  - [ ] 25.5 Implement transaction export
    - Implement CSV export for transactions
    - _Requirements: 10.9, 13.4_

- [ ] 26. Implement logging and audit trail frontend
  - [ ] 26.1 Create log viewer page
    - Create LogStream component with real-time updates
    - Create LogFilters component (severity, source, date, keywords)
    - Implement auto-refresh every 60 seconds
    - Highlight critical errors
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.9_

  - [ ] 26.2 Create log detail view
    - Create LogDetail component
    - Display expanded log entry with context
    - Display stack traces for errors
    - _Requirements: 11.4_

  - [ ] 26.3 Create API Gateway log viewer
    - Display API Gateway request logs
    - Show response codes and latency
    - _Requirements: 11.7_

  - [ ] 26.4 Implement log export
    - Implement text and JSON format export
    - _Requirements: 11.6, 13.5_

  - [ ] 26.5 Create audit trail page
    - Create AuditLogList component
    - Implement filters (user, action, resource, date)
    - Display before/after values for updates
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 26.6 Implement audit log export
    - Implement CSV export for audit logs
    - _Requirements: 15.7_

- [ ] 27. Checkpoint - Ensure all frontend pages are functional
  - Test all pages manually in browser
  - Verify responsive design on desktop and tablet
  - Verify all forms and validations work
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 28. Implement shared UI components and utilities
  - [ ] 28.1 Create reusable UI components
    - Create LoadingSpinner component
    - Create SkeletonScreen component for tables and cards
    - Create ProgressBar component for uploads
    - Create ErrorBoundary component
    - Create ConfirmationDialog component
    - Create Toast notification component
    - _Requirements: 18.5, 19.2, 19.3, 19.4_

  - [ ] 28.2 Create data table component
    - Create reusable DataTable component
    - Implement pagination, sorting, filtering
    - Implement row selection for bulk operations
    - Implement responsive horizontal scrolling
    - Implement export to CSV/JSON
    - _Requirements: 12.5, 13.1, 13.2, 13.6, 16.7, 19.6_

  - [ ] 28.3 Implement API client utilities
    - Create Axios instance with interceptors
    - Implement authentication token injection
    - Implement error handling with retry logic
    - Implement request/response logging
    - _Requirements: 18.5, 18.6, 18.7_

  - [ ]* 28.4 Write property tests for error handling
    - **Property 47: Network errors trigger retry with backoff**
    - **Property 48: Errors are logged to CloudWatch**
    - **Validates: Requirements 18.6, 18.7**

  - [ ] 28.5 Implement caching utilities
    - Create React Query configuration
    - Implement cache invalidation strategies
    - Configure cache TTLs for different data types
    - _Requirements: 19.5_

  - [ ]* 28.6 Write property test for caching
    - **Property 49: Caching reduces redundant API calls**
    - **Validates: Requirements 19.5**

  - [ ] 28.7 Implement form utilities
    - Create reusable form validation schemas with Zod
    - Create form field components (Input, Select, Checkbox, etc.)
    - Implement file upload component with validation
    - _Requirements: 18.1, 18.2, 18.3_

- [ ] 29. Implement performance optimizations
  - [ ] 29.1 Implement code splitting and lazy loading
    - Configure Next.js dynamic imports for routes
    - Implement lazy loading for heavy components
    - Implement image lazy loading
    - _Requirements: 19.1, 19.7_

  - [ ] 29.2 Implement virtual scrolling for large lists
    - Integrate react-window or react-virtualized
    - Apply to large data tables
    - _Requirements: 19.6_

  - [ ] 29.3 Optimize bundle size
    - Analyze bundle with webpack-bundle-analyzer
    - Remove unused dependencies
    - Implement tree shaking
    - _Requirements: 19.1_

  - [ ]* 29.4 Write property test for pagination
    - **Property 50: Pagination returns correct page size**
    - **Validates: Requirements 19.6**

- [ ] 30. Implement data export functionality
  - [ ] 30.1 Create export service
    - Implement CSV generation utility
    - Implement JSON generation utility
    - Implement export progress tracking
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 30.2 Implement export time limits
    - Ensure exports complete within 30 seconds for <10k records
    - Display progress indicator for large exports
    - _Requirements: 13.7_

- [ ] 31. Implement bulk operations processor
  - [ ] 31.1 Create BulkOperationsLambda function
    - Implement SQS-based bulk operation processing
    - Implement progress tracking in DynamoDB
    - Implement error handling and retry logic
    - Support bulk delete and bulk update operations
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [ ] 31.2 Create bulk operation status endpoints
    - Implement GET /admin/bulk/{jobId} (get bulk job status)
    - Implement POST /admin/bulk/{jobId}/cancel (cancel bulk job)
    - _Requirements: 14.5, 14.8_

- [ ] 32. Implement notification processor
  - [ ] 32.1 Create NotificationProcessorLambda function
    - Implement DynamoDB Streams trigger for critical events
    - Implement EventBridge trigger for scheduled checks
    - Create notifications for job failures, cost alerts, payment failures, critical errors
    - Store notifications in Notifications table
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [ ] 32.2 Create notification endpoints
    - Implement GET /admin/notifications (list notifications)
    - Implement PUT /admin/notifications/{notificationId}/read (mark as read)
    - Implement PUT /admin/notifications/mark-all-read (mark all as read)
    - Implement GET /admin/notifications/preferences (get preferences)
    - Implement PUT /admin/notifications/preferences (update preferences)
    - _Requirements: 17.5, 17.6, 17.7, 17.8_


- [ ] 33. Implement search functionality
  - [ ] 33.1 Implement backend search
    - Add full-text search support for temples (name, description)
    - Add full-text search support for artifacts (name, description)
    - Implement search result highlighting
    - Optimize search queries with DynamoDB GSIs
    - _Requirements: 16.1, 16.2, 16.7, 16.8_

  - [ ] 33.2 Implement frontend search
    - Create global search component in top bar
    - Implement debounced search input (300ms)
    - Display search results with highlighting
    - _Requirements: 16.1, 16.2, 16.7, 16.8_

- [ ] 34. Implement integration with existing infrastructure
  - [ ] 34.1 Integrate with existing DynamoDB tables
    - Verify read/write access to HeritageSites table
    - Verify read/write access to Artifacts table
    - Verify read access to ContentCache table
    - Verify read access to Analytics table
    - Verify read access to Purchases table
    - Verify read access to PreGenerationProgress table
    - _Requirements: 20.1, 20.2_

  - [ ] 34.2 Integrate with existing S3 bucket
    - Verify upload access to temples/ prefix
    - Verify upload access to artifacts/ prefix
    - Verify read access to content/ prefix
    - Implement S3 pre-signed URL generation
    - _Requirements: 20.2_

  - [ ] 34.3 Integrate with existing Lambda functions
    - Test invocation of QRProcessingLambda
    - Test invocation of ContentGenerationLambda
    - Test invocation of PreGenerationLambda
    - _Requirements: 20.3_

  - [ ] 34.4 Integrate with existing API Gateway
    - Verify access to existing endpoints
    - Test authentication with existing APIs
    - _Requirements: 20.4_

  - [ ] 34.5 Set up CloudWatch integration
    - Verify log access from all Lambda functions
    - Verify metrics access
    - Set up custom metrics for admin operations
    - _Requirements: 20.6_

  - [ ] 34.6 Set up AWS Cost Explorer integration
    - Verify Cost Explorer API access
    - Test cost data retrieval
    - _Requirements: 20.7_

  - [ ] 34.7 Set up Razorpay integration
    - Verify Razorpay API credentials
    - Test transaction retrieval
    - Test refund processing
    - _Requirements: 20.8_

  - [ ] 34.8 Implement error handling for unavailable infrastructure
    - Display appropriate error messages when services unavailable
    - Implement fallback options where possible
    - _Requirements: 20.9_

- [ ] 35. Implement security hardening
  - [ ] 35.1 Configure AWS WAF for API Gateway
    - Set up rate limiting rules
    - Set up SQL injection protection
    - Set up XSS protection
    - Configure IP blacklisting capability
    - _Requirements: 1.1, 18.1, 18.2_

  - [ ] 35.2 Implement input validation and sanitization
    - Implement Joi validation schemas for all API endpoints
    - Implement XSS prevention on frontend
    - Implement path traversal prevention for S3 keys
    - Implement file upload validation (MIME type, size)
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ] 35.3 Configure secrets management
    - Store Razorpay credentials in AWS Secrets Manager
    - Store third-party API keys in Secrets Manager
    - Implement secret rotation policies
    - _Requirements: 7.6_

  - [ ] 35.4 Set up security monitoring
    - Configure CloudWatch alarms for failed login attempts
    - Configure alarms for unauthorized API access
    - Enable AWS GuardDuty for threat detection
    - _Requirements: 1.3_

- [ ] 36. Checkpoint - Ensure integration and security are complete
  - Test all integrations with existing infrastructure
  - Verify security configurations are working
  - Test error handling for unavailable services
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 37. Write comprehensive integration tests
  - [ ]* 37.1 Write integration tests for authentication flow
    - Test complete login flow with MFA
    - Test session expiration and renewal
    - Test logout and session termination
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7_

  - [ ]* 37.2 Write integration tests for temple management
    - Test complete CRUD operations for temples
    - Test image upload and retrieval
    - Test bulk operations
    - Test search and filtering
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 14.1_

  - [ ]* 37.3 Write integration tests for artifact management
    - Test complete CRUD operations for artifacts
    - Test QR code generation and download
    - Test media upload
    - Test bulk operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.9, 14.2_

  - [ ]* 37.4 Write integration tests for content monitoring
    - Test job listing and filtering
    - Test job retry and cancellation
    - Test job statistics
    - _Requirements: 4.1, 4.5, 4.6, 4.8, 4.9_

  - [ ]* 37.5 Write integration tests for analytics
    - Test analytics data retrieval
    - Test analytics export
    - _Requirements: 5.1, 5.9_

  - [ ]* 37.6 Write integration tests for user management
    - Test user CRUD operations
    - Test user activation/deactivation
    - Test session termination on deactivation
    - _Requirements: 6.1, 6.4, 6.8_

  - [ ]* 37.7 Write integration tests for configuration management
    - Test configuration updates
    - Test configuration validation
    - Test configuration history
    - _Requirements: 7.7, 7.9_

  - [ ]* 37.8 Write integration tests for content moderation
    - Test content approval flow
    - Test content rejection flow
    - Test content editing
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 37.9 Write integration tests for payment management
    - Test transaction retrieval
    - Test refund processing
    - Test subscription management
    - _Requirements: 10.1, 10.4, 10.7_

  - [ ]* 37.10 Write integration tests for logging and audit
    - Test log retrieval and filtering
    - Test audit log creation
    - Test audit log immutability
    - _Requirements: 11.1, 11.2, 15.1, 15.6_

- [ ] 38. Set up deployment infrastructure
  - [ ] 38.1 Create CDK stack for admin application (Python CDK)
    - Define AdminApplicationStack using AWS CDK Python
    - Create Cognito User Pool and Identity Pool
    - Create new DynamoDB tables
    - Create Lambda functions (Python 3.11 runtime)
    - Create API Gateway with custom authorizer
    - Configure IAM roles and policies
    - _Requirements: 1.1, 1.4, 6.1, 7.1, 8.1, 15.1, 17.1_

  - [ ] 38.2 Configure AWS Amplify hosting
    - Set up Amplify app for frontend hosting
    - Configure build settings for Next.js
    - Set up environment variables
    - Configure custom domain (optional)
    - _Requirements: 12.1_

  - [ ] 38.3 Set up CI/CD pipeline
    - Create GitHub Actions workflow
    - Configure automated testing (pytest for backend, Jest for frontend)
    - Configure automated deployment to dev/staging/prod
    - Set up manual approval for production
    - _Requirements: 19.1_

- [ ] 39. Set up monitoring and alerting
  - [ ] 39.1 Create CloudWatch dashboards
    - Create dashboard for admin API metrics
    - Create dashboard for Lambda function metrics
    - Create dashboard for DynamoDB metrics
    - Create dashboard for Cognito metrics
    - Create dashboard for custom business metrics
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 39.2 Configure CloudWatch alarms
    - Set up alarm for API error rate > 5%
    - Set up alarm for Lambda error rate > 1%
    - Set up alarm for DynamoDB throttled requests
    - Set up alarm for failed login attempts > 10 in 5 minutes
    - Set up alarm for bulk operation failures > 10%
    - _Requirements: 1.3, 17.1, 17.2, 17.3, 17.4_

  - [ ] 39.3 Set up SNS topics for notifications
    - Create SNS topic for critical alerts
    - Create SNS topic for warning alerts
    - Create SNS topic for info alerts
    - Configure email subscriptions
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 40. Implement backup and disaster recovery
  - [ ] 40.1 Configure DynamoDB backups
    - Enable point-in-time recovery for all tables
    - Set up daily backup schedule
    - Configure backup retention (30 days)
    - _Requirements: 20.1_

  - [ ] 40.2 Configure S3 versioning and replication
    - Enable versioning on content bucket
    - Set up lifecycle policies for cost optimization
    - Configure cross-region replication (optional)
    - _Requirements: 20.2_


- [ ] 41. Create documentation
  - [ ] 41.1 Write API documentation
    - Document all admin API endpoints with OpenAPI/Swagger
    - Include request/response examples
    - Document authentication requirements
    - Document error codes and messages
    - _Requirements: All API endpoints_

  - [ ] 41.2 Write user guide
    - Create user guide with screenshots
    - Document common administrative tasks
    - Document troubleshooting steps
    - Create video tutorials for key workflows (optional)
    - _Requirements: All user-facing features_

  - [ ] 41.3 Write developer documentation
    - Document architecture and design decisions
    - Document deployment procedures
    - Document testing procedures
    - Create developer onboarding guide
    - _Requirements: All technical components_

  - [ ] 41.4 Create README files
    - Create README for frontend project
    - Create README for backend Lambda functions
    - Create README for CDK infrastructure
    - _Requirements: All code repositories_

- [ ] 42. Perform end-to-end testing
  - [ ]* 42.1 Test complete authentication workflow
    - Test login with valid credentials
    - Test MFA verification
    - Test session timeout
    - Test logout
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7_

  - [ ]* 42.2 Test temple management workflow
    - Create new temple with images
    - Update temple information
    - Search and filter temples
    - Delete temple (verify soft delete)
    - Perform bulk operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 14.1_

  - [ ]* 42.3 Test artifact management workflow
    - Create new artifact with QR code
    - Upload artifact media
    - Download QR code in different formats
    - Update artifact information
    - Delete artifact (verify soft delete)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.9_

  - [ ]* 42.4 Test content generation monitoring workflow
    - View content generation jobs
    - Filter jobs by status and date
    - Retry failed job
    - Cancel in-progress job
    - View job statistics
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.8, 4.9_

  - [ ]* 42.5 Test analytics workflow
    - View analytics summary
    - View QR scan statistics
    - View content generation statistics
    - Export analytics data to CSV
    - _Requirements: 5.1, 5.3, 5.4, 5.9_

  - [ ]* 42.6 Test user management workflow
    - Create new admin user
    - Assign role and permissions
    - Deactivate user (verify session termination)
    - View user activity log
    - _Requirements: 6.1, 6.2, 6.4, 6.8_

  - [ ]* 42.7 Test system configuration workflow
    - Update language configuration
    - Update Bedrock configuration
    - View configuration history
    - Test configuration validation
    - _Requirements: 7.1, 7.2, 7.7, 7.9_

  - [ ]* 42.8 Test content moderation workflow
    - View pending content
    - Approve content
    - Reject content with feedback
    - Edit and approve content
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 42.9 Test cost monitoring workflow
    - View current month costs
    - View cost trends
    - Set cost alert threshold
    - View resource usage metrics
    - _Requirements: 9.1, 9.2, 9.8, 9.9_

  - [ ]* 42.10 Test payment management workflow
    - View transactions
    - Filter transactions by status and date
    - Issue refund
    - View revenue statistics
    - Export transactions to CSV
    - _Requirements: 10.1, 10.2, 10.4, 10.8, 10.9_

  - [ ]* 42.11 Test logging and audit workflow
    - View system logs
    - Filter logs by severity and source
    - View API Gateway logs
    - Export logs
    - View audit trail
    - Export audit logs
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 15.1, 15.7_

  - [ ]* 42.12 Test notification workflow
    - Trigger notification (simulate job failure)
    - View notification in notification panel
    - Mark notification as read
    - Configure notification preferences
    - _Requirements: 17.1, 17.5, 17.6, 17.8_

  - [ ]* 42.13 Test responsive design
    - Test all pages on desktop (1920x1080)
    - Test all pages on laptop (1440x900)
    - Test all pages on tablet (1024x768)
    - Verify touch-friendly controls on tablet
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

  - [ ]* 42.14 Test error handling
    - Test form validation errors
    - Test network error handling with retry
    - Test API error responses
    - Test file upload validation
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [ ]* 42.15 Test performance
    - Verify initial page load < 3 seconds
    - Verify API response time < 500ms (p95)
    - Verify large dataset pagination works smoothly
    - Verify image lazy loading works
    - _Requirements: 19.1, 19.6, 19.7_

- [ ] 43. Final checkpoint - Complete system verification
  - Run all unit tests and verify 100% pass
  - Run all property-based tests and verify 100% pass
  - Run all integration tests and verify 100% pass
  - Perform security audit
  - Perform performance testing
  - Verify all documentation is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 44. Deploy to production
  - [ ] 44.1 Deploy infrastructure to production
    - Deploy CDK stack to production AWS account
    - Verify all resources created successfully
    - Configure production environment variables
    - _Requirements: All infrastructure_

  - [ ] 44.2 Deploy frontend to production
    - Deploy Next.js application to Amplify
    - Configure production domain
    - Verify application is accessible
    - _Requirements: 12.1_

  - [ ] 44.3 Create initial admin users
    - Create super admin account
    - Configure MFA for admin account
    - Test login with production credentials
    - _Requirements: 1.1, 1.4, 6.1_

  - [ ] 44.4 Perform smoke tests in production
    - Test authentication
    - Test temple CRUD operations
    - Test artifact CRUD operations
    - Test analytics dashboard
    - Verify monitoring and alerting are working
    - _Requirements: All critical features_

  - [ ] 44.5 Monitor production deployment
    - Monitor CloudWatch dashboards for errors
    - Monitor application logs
    - Monitor user feedback
    - _Requirements: All monitoring_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- **Backend uses Python 3.11+ for all Lambda functions** - easier to write and maintain
- **Frontend uses TypeScript/React** - industry standard for web UIs
- **Infrastructure uses Python CDK** - consistent with backend language
- **Testing**: Hypothesis (property-based) + pytest (unit) for Python backend, Jest for TypeScript frontend
- Property-based tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows an incremental approach: infrastructure → backend → frontend → integration → testing → deployment
- All administrative actions are logged to the audit trail for accountability
- Security is prioritized throughout with authentication, authorization, input validation, and monitoring
- Performance optimizations include caching, pagination, lazy loading, and code splitting
- The application integrates seamlessly with existing AWS infrastructure to avoid duplication

**Python Libraries to Use:**
- `boto3` - AWS SDK for Python
- `PyJWT` - JWT token handling
- `pydantic` - Data validation
- `pytest` - Unit testing
- `hypothesis` - Property-based testing
- `Pillow` - Image processing
- `qrcode` - QR code generation
- `python-dateutil` - Date/time utilities

