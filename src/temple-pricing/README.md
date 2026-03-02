# Temple Pricing Management System

Comprehensive pricing management system for temples and temple groups in the Sanaathana Aalaya Charithra application.

## Overview

This system enables flexible pricing configuration for individual temples and temple groups (tour packages), with automatic price calculation based on QR code counts, complete audit trails, and offline content delivery support.

## Architecture

### Services

1. **Temple Management Service** - CRUD operations for temples, temple groups, and artifacts
2. **Pricing Service** - Price configuration management and retrieval
3. **Price Calculator** - Automatic price calculation using configurable formulas
4. **Access Control Service** - Access grant management and verification
5. **Content Package Service** - Offline content package generation and delivery

### Infrastructure

- **12 DynamoDB Tables** - Temples, TempleGroups, TempleGroupAssociations, Artifacts, PriceConfigurations, PriceHistory, PricingFormulas, FormulaHistory, AccessGrants, PriceOverrides, AuditLog, ContentPackages, DownloadHistory
- **2 S3 Buckets** - QR code images and content packages
- **CloudFront Distribution** - Global content delivery
- **ElastiCache Redis** - Caching layer for performance
- **API Gateway** - REST API with JWT authentication
- **CloudWatch** - Logging and monitoring

## Directory Structure

```
temple-pricing/
├── config/              # Configuration files
├── types/               # TypeScript interfaces and types
├── utils/               # Shared utilities (logger, errors, validators, DynamoDB, Redis)
├── lambdas/             # Lambda function implementations
│   ├── temple-management/
│   ├── pricing-service/
│   ├── price-calculator/
│   ├── access-control/
│   ├── content-package/
│   └── authorizer/
├── repositories/        # Data access layer
├── services/            # Business logic layer
└── tests/               # Unit and property-based tests
```

## Key Features

### Pricing Management
- Individual temple and temple group pricing
- Automatic price calculation based on QR code counts
- Configurable pricing formulas with rounding rules
- Price override tracking and analytics
- Complete price history and audit trails
- Bulk price update operations

### Temple Management
- Temple CRUD with location and description
- Temple group creation with multiple temples
- Artifact management with QR code generation
- Access mode configuration (QR_CODE_SCAN, OFFLINE_DOWNLOAD, HYBRID)
- QR code count tracking

### Access Control
- Payment-based access grant creation
- Hierarchical access verification (group → temples → QR codes)
- Offline download permission management
- Access grant caching for performance

### Offline Content Delivery
- Content package generation with compression
- CloudFront CDN distribution
- Time-limited download URLs (24-hour expiration)
- Version management and update detection
- Download progress tracking
- Package size calculation and warnings

## Configuration

See `config/index.ts` for all configuration options including:
- DynamoDB table names
- S3 bucket names
- Redis cache settings
- Pricing defaults
- Content package settings
- API rate limits

## Development

### Prerequisites
- Node.js 18+
- AWS CLI configured
- TypeScript 5+

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Lint
```bash
npm run lint
```

## Deployment

The infrastructure is defined in `infrastructure/stacks/TemplePricingStack.ts` using AWS CDK.

### Deploy Stack
```bash
cd infrastructure
cdk deploy TemplePricingStack
```

## API Endpoints

### Admin APIs (Authenticated)
- `POST /api/admin/temples` - Create temple
- `GET /api/admin/temples` - List temples
- `GET /api/admin/temples/{templeId}` - Get temple
- `PUT /api/admin/temples/{templeId}` - Update temple
- `DELETE /api/admin/temples/{templeId}` - Delete temple
- `POST /api/admin/pricing/entity/{entityId}` - Set price
- `GET /api/admin/pricing/entity/{entityId}` - Get price

### Mobile APIs (Public)
- `GET /api/mobile/pricing/{entityId}` - Get pricing info
- `POST /api/access/verify` - Verify access
- `POST /api/access/grant` - Create access grant
- `GET /api/mobile/content-packages/{entityId}/info` - Get package info
- `POST /api/mobile/content-packages/{entityId}/download-url` - Get download URL

## Testing Strategy

### Unit Tests
- Specific examples and edge cases
- Error conditions
- Integration points
- Target: 90% code coverage

### Property-Based Tests
- Universal properties across all inputs
- Randomized test data (100+ iterations)
- Framework: fast-check
- All 61 correctness properties from design document

## Monitoring

### CloudWatch Metrics
- API Gateway request count and latency
- Lambda invocation count, duration, and errors
- DynamoDB read/write capacity and throttling
- S3 bucket size and request count
- CloudFront cache hit rate

### CloudWatch Alarms
- API Gateway 5xx errors > 10 in 2 periods
- Lambda errors > 5 in 2 periods
- DynamoDB throttling events
- Content package generation failures > 5%
- Download failure rate > 5%

## Security

- JWT authentication for admin APIs
- IAM roles for Lambda functions
- S3 bucket encryption at rest
- CloudFront signed URLs for content delivery
- VPC isolation for ElastiCache Redis
- Security groups for network access control

## Performance

- Price retrieval: < 200ms for 95% of requests
- Access verification: < 100ms (with caching)
- Suggested price calculation: < 500ms
- Content package generation: < 5 minutes
- Redis cache TTL: 1 hour (prices), 5 minutes (access)

## License

Proprietary - Sanaathana Aalaya Charithra
