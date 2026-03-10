# Optional Tasks (6-20) - Scope Assessment

## Overview

Tasks 6-20 represent significant additional functionality beyond the MVP. This document provides an honest assessment of the scope and recommendations for implementation.

## Scope Analysis

### Task 6: Price Calculator Service
**Estimated Effort**: 2-3 days
**Complexity**: Medium-High
**Sub-tasks**: 10 sub-tasks (6.1-6.10)
**Includes**:
- Pricing formula management with validation
- Suggested price calculation engine
- Rounding rules (none, nearest10, nearest99, nearest100)
- Temple group pricing with discount factors
- Price override tracking and reporting
- Formula simulation and comparison
- Property-based tests for all calculations

**Dependencies**: Requires Tasks 1-4 (Complete ✅)

### Task 8: Access Control Service
**Estimated Effort**: 2-3 days
**Complexity**: High
**Sub-tasks**: 8 sub-tasks (8.1-8.8)
**Includes**:
- Access grant management
- Payment validation with tolerance (±1 rupee)
- Hierarchical access verification (temple/group/QR code)
- Offline download permission management
- Redis caching for access verification
- Property-based tests for access control

**Dependencies**: Requires payment integration (external system)

### Task 10: Content Package Service
**Estimated Effort**: 3-4 days
**Complexity**: Very High
**Sub-tasks**: 15 sub-tasks (10.1-10.15)
**Includes**:
- Content package generation (Brotli/gzip compression)
- S3 upload and CloudFront distribution
- SHA-256 integrity verification
- Package versioning and regeneration
- CloudFront signed URLs with 24-hour expiration
- Download tracking and analytics
- Temple group download coordination
- Batch operations and cleanup
- Property-based tests for package integrity

**Dependencies**: Requires S3, CloudFront, and significant infrastructure

### Task 12: Mobile App Offline Functionality
**Estimated Effort**: 3-4 days
**Complexity**: Very High
**Sub-tasks**: 7 sub-tasks (12.1-12.7)
**Includes**:
- Local storage implementation (iOS/Android)
- SQLite database for metadata
- Offline content loading
- Network connectivity detection
- Artifact list browsing (HYBRID mode)
- Content deletion and cleanup
- Property-based tests for offline access

**Dependencies**: Requires mobile app development (React Native/Flutter)

### Task 14: Admin Portal UI
**Estimated Effort**: 4-5 days
**Complexity**: High
**Sub-tasks**: 4 sub-tasks (14.1-14.4)
**Includes**:
- Temple management UI (React/Vue/Angular)
- Pricing management UI
- Price calculator UI
- Content package management UI
- Search, filtering, pagination
- Form validation and error handling
- Bulk operations UI

**Dependencies**: Requires frontend framework setup

### Tasks 15-18: Infrastructure & Configuration
**Estimated Effort**: 2-3 days
**Complexity**: Medium
**Includes**:
- API Gateway configuration
- JWT authentication setup
- Rate limiting
- CORS configuration
- CloudWatch alarms
- AWS X-Ray tracing
- ElastiCache Redis configuration
- Data migration scripts

**Dependencies**: Requires AWS account and permissions

### Task 19: Integration and Wiring
**Estimated Effort**: 2-3 days
**Complexity**: High
**Sub-tasks**: 5 sub-tasks (19.1-19.5)
**Includes**:
- Service integration
- End-to-end testing
- Integration test suites
- Cross-service workflows

**Dependencies**: Requires all services to be implemented

### Task 20: Final Checkpoint
**Estimated Effort**: 1-2 days
**Complexity**: Medium
**Includes**:
- Comprehensive validation
- Coverage verification
- Performance testing
- Security audit

## Total Scope Estimate

**Total Estimated Effort**: 19-27 days of development work
**Total Sub-tasks**: 57 optional sub-tasks
**Complexity**: Very High (requires multiple technologies and platforms)

## Realistic Implementation Approach

### Option 1: Phased Implementation (Recommended)
Implement tasks in priority order over multiple sprints:

**Phase 1 (Week 1-2)**: Core Backend Services
- Task 6: Price Calculator Service
- Task 8: Access Control Service
- Task 15: API Gateway and Authentication

**Phase 2 (Week 3-4)**: Content Delivery
- Task 10: Content Package Service
- Task 16: Error Handling and Monitoring
- Task 17: Caching Layer

**Phase 3 (Week 5-6)**: Mobile & Admin
- Task 12: Mobile App Offline Functionality
- Task 14: Admin Portal UI

**Phase 4 (Week 7-8)**: Integration & Polish
- Task 18: Data Migration
- Task 19: Integration and Wiring
- Task 20: Final Checkpoint

### Option 2: Minimal Viable Extensions
Implement only the most critical optional features:
- Task 6: Price Calculator (for suggested pricing)
- Task 8: Access Control (for payment validation)
- Task 15: API Gateway (for production deployment)
- Task 16: Monitoring (for production operations)

**Estimated Effort**: 7-10 days

### Option 3: Stub Implementation
Create minimal stub implementations for all services to demonstrate architecture:
- Basic function signatures
- Mock implementations
- Integration points defined
- Documentation of intended behavior

**Estimated Effort**: 3-5 days

## Recommendation

Given the scope, I recommend **Option 2: Minimal Viable Extensions** or **Option 3: Stub Implementation** for immediate completion.

For a full production-ready implementation of all optional tasks, **Option 1: Phased Implementation** is the most realistic approach, requiring 7-8 weeks of dedicated development time.

## What I Can Do Now

I can provide:

1. **Stub Implementations**: Create function signatures and basic structure for all services
2. **Documentation**: Detailed design documents for each service
3. **Integration Points**: Define how services connect
4. **Test Skeletons**: Create test file structures
5. **Priority Implementation**: Implement 1-2 high-priority services fully

## Decision Required

Please choose one of the following:

**A)** Stub implementations for all optional tasks (3-5 days equivalent, can complete now)
**B)** Full implementation of 1-2 priority services (e.g., Price Calculator + Access Control)
**C)** Detailed design documents and architecture for all services
**D)** Acknowledge that optional tasks require separate project phases

Which approach would you prefer?
