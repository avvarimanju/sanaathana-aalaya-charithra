# Temple Pricing Management - Deployment Guide

## Infrastructure Overview

This deployment guide covers the complete infrastructure setup for the Temple Pricing Management system.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js 18+** installed
4. **AWS CDK** installed (`npm install -g aws-cdk`)
5. **TypeScript** installed

## Infrastructure Components

### DynamoDB Tables (12)
1. Temples - Temple metadata and configuration
2. TempleGroups - Temple group definitions
3. TempleGroupAssociations - Many-to-many temple-group relationships
4. Artifacts - Artifact metadata and QR code mappings
5. PriceConfigurations - Current price configurations
6. PriceHistory - Historical price records
7. PricingFormulas - Pricing formula configurations
8. FormulaHistory - Historical formula records
9. AccessGrants - User access permissions
10. PriceOverrides - Price override tracking
11. AuditLog - Complete audit trail
12. ContentPackages - Content package metadata
13. DownloadHistory - Download tracking and analytics

### S3 Buckets (2)
1. QR Code Images - Stores generated QR code images
2. Content Packages - Stores compressed content packages

### CloudFront Distribution
- Global CDN for content package delivery
- Signed URLs for access control
- 24-hour cache TTL

### ElastiCache Redis
- Cache cluster for performance optimization
- VPC-isolated for security
- 5-minute TTL for access verification
- 1-hour TTL for price data

### Lambda Functions (5)
1. Temple Management Service
2. Pricing Service
3. Price Calculator
4. Access Control Service
5. Content Package Service

### API Gateway
- REST API with JWT authentication
- CORS enabled
- Rate limiting (100 req/min)
- CloudWatch logging enabled

## Deployment Steps

### 1. Install Dependencies

```bash
cd Sanaathana-Aalaya-Charithra/src/temple-pricing
npm install
```

### 2. Build TypeScript Code

```bash
npm run build
```

### 3. Bootstrap CDK (First Time Only)

```bash
cd ../../infrastructure
cdk bootstrap
```

### 4. Deploy Infrastructure Stack

```bash
cdk deploy TemplePricingStack
```

This will create:
- All 12 DynamoDB tables with GSIs
- S3 buckets with lifecycle policies
- CloudFront distribution
- VPC and ElastiCache Redis cluster
- Lambda functions with proper IAM roles
- API Gateway with endpoints
- CloudWatch log groups and alarms

### 5. Note Output Values

After deployment, CDK will output:
- API Gateway endpoint URL
- CloudFront distribution domain
- Redis endpoint address

Save these values for configuration.

### 6. Configure Environment Variables

Update Lambda environment variables if needed:
```bash
aws lambda update-function-configuration \
  --function-name TemplePricingStack-TempleManagementFunction \
  --environment Variables={LOG_LEVEL=info,ENABLE_XRAY=true}
```

### 7. Initialize Default Pricing Formula

Run the initialization script to set up default pricing formula:
```bash
# TODO: Create initialization script in subsequent tasks
```

## Post-Deployment Configuration

### 1. CloudFront Distribution
- Configure custom domain (optional)
- Set up SSL certificate
- Configure geo-restrictions if needed

### 2. API Gateway
- Configure custom domain (optional)
- Set up API keys for additional security
- Configure usage plans

### 3. CloudWatch Alarms
- Configure SNS topics for alarm notifications
- Set up email/SMS alerts
- Configure PagerDuty integration (optional)

### 4. Redis Cache
- Monitor memory usage
- Adjust cache TTL values if needed
- Configure backup schedule

## Monitoring

### CloudWatch Dashboards

Create a custom dashboard to monitor:
- API Gateway request count and latency
- Lambda invocation metrics
- DynamoDB read/write capacity
- S3 bucket size and requests
- CloudFront cache hit rate
- Redis memory usage

### CloudWatch Alarms

Pre-configured alarms:
- API Gateway 5xx errors > 10
- Lambda errors > 5
- DynamoDB throttling events
- Content package generation failures > 5%
- Download failure rate > 5%

### X-Ray Tracing

Enable X-Ray for distributed tracing:
```bash
aws lambda update-function-configuration \
  --function-name <function-name> \
  --tracing-config Mode=Active
```

## Security Considerations

### IAM Roles
- Lambda functions have least-privilege IAM roles
- S3 buckets are private with encryption at rest
- DynamoDB tables have point-in-time recovery enabled

### Network Security
- ElastiCache Redis is VPC-isolated
- Security groups restrict access to VPC CIDR only
- Lambda functions run in VPC for Redis access

### Data Security
- All data encrypted at rest (S3, DynamoDB)
- CloudFront uses HTTPS only
- Signed URLs for content package downloads

### Authentication
- JWT authentication for admin APIs
- API Gateway custom authorizer
- Token validation with configurable expiration

## Backup and Recovery

### DynamoDB
- Point-in-time recovery enabled on all tables
- Automatic backups retained for 35 days
- Manual backups for major releases

### S3
- Versioning enabled on both buckets
- Lifecycle policies for old version cleanup
- Cross-region replication (optional)

### Disaster Recovery
- Infrastructure as Code (CDK) for quick rebuild
- Regular backup testing
- Documented recovery procedures

## Cost Optimization

### DynamoDB
- Pay-per-request billing mode
- No provisioned capacity costs
- Scales automatically with demand

### S3
- Intelligent-Tiering for automatic cost optimization
- Lifecycle policies to archive old versions
- CloudFront reduces S3 data transfer costs

### Lambda
- Right-sized memory allocation
- Efficient code to minimize execution time
- VPC endpoints to avoid NAT Gateway costs

### ElastiCache
- t3.micro instance for development
- Scale up for production based on metrics
- Consider reserved instances for production

## Troubleshooting

### Lambda Timeout Issues
- Check CloudWatch logs for execution time
- Increase timeout if needed (max 15 minutes)
- Optimize code for better performance

### DynamoDB Throttling
- Check CloudWatch metrics for throttling events
- Verify GSI usage patterns
- Consider on-demand billing mode

### Redis Connection Issues
- Verify Lambda is in correct VPC
- Check security group rules
- Verify Redis endpoint and port

### Content Package Generation Failures
- Check S3 bucket permissions
- Verify Lambda has sufficient memory
- Check CloudWatch logs for errors

## Rollback Procedures

### CDK Stack Rollback
```bash
cdk deploy TemplePricingStack --rollback
```

### Lambda Function Rollback
```bash
aws lambda update-function-code \
  --function-name <function-name> \
  --s3-bucket <previous-version-bucket> \
  --s3-key <previous-version-key>
```

### DynamoDB Point-in-Time Recovery
```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name <table-name> \
  --target-table-name <table-name-restored> \
  --restore-date-time <timestamp>
```

## Maintenance

### Regular Tasks
- Review CloudWatch logs weekly
- Monitor cost metrics monthly
- Update Lambda runtimes as needed
- Review and optimize DynamoDB indexes
- Clean up old S3 versions quarterly

### Updates
- Test infrastructure changes in staging first
- Use CDK diff to preview changes
- Deploy during low-traffic periods
- Monitor metrics after deployment

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review this deployment guide
3. Consult AWS documentation
4. Contact DevOps team

## Next Steps

After infrastructure deployment:
1. Implement Lambda function business logic (Tasks 2-6)
2. Set up Admin Portal integration
3. Configure mobile app endpoints
4. Run integration tests
5. Perform load testing
6. Deploy to production
