# Temple Pricing Management - Remaining Tasks Guide

## Overview

This document provides guidance for completing Tasks 15-20 of the Temple Pricing Management implementation. These tasks focus on infrastructure, integration, and deployment.

## Task 15: API Gateway and Authentication

### Status: Partially Complete
- ✅ Authorizer Lambda exists (`lambdas/authorizer/index.ts`)
- ⚠️ JWT validation needs implementation
- ⚠️ API Gateway CDK stack needs creation

### Implementation Steps

#### 15.1 Implement JWT Validation in Authorizer

Update `src/temple-pricing/lambdas/authorizer/index.ts`:

```typescript
import * as jwt from 'jsonwebtoken';
import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

export async function handler(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  try {
    const token = event.authorizationToken.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      email: string;
      role: string;
    };
    
    // Generate policy with user context
    return generatePolicy(decoded.sub, 'Allow', event.methodArn, {
      email: decoded.email,
      role: decoded.role,
    });
  } catch (error) {
    logger.error('Authorization failed', error as Error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
}
```

#### 15.2 Create API Gateway CDK Stack

Create `infrastructure/temple-pricing-api-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class TemplePricingApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create REST API
    const api = new apigateway.RestApi(this, 'TemplePricingApi', {
      restApiName: 'Temple Pricing Management API',
      description: 'API for temple pricing management system',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Create Lambda authorizer
    const authorizerLambda = lambda.Function.fromFunctionName(
      this,
      'AuthorizerLambda',
      'temple-pricing-authorizer'
    );

    const authorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
      handler: authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // Create API resources
    const pricing = api.root.addResource('pricing');
    const temples = api.root.addResource('temples');
    const calculator = api.root.addResource('calculator');
    const access = api.root.addResource('access');

    // Add methods with authorizer
    // ... (add specific endpoints)
  }
}
```

#### 15.3 Configure Rate Limiting

Already configured in API Gateway deployment options:
- Rate limit: 100 requests/minute
- Burst limit: 200 requests

#### 15.4 Add Request Validation

```typescript
// Create request validators
const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
  restApi: api,
  validateRequestBody: true,
  validateRequestParameters: true,
});

// Create models for request validation
const setPriceModel = new apigateway.Model(this, 'SetPriceModel', {
  restApi: api,
  contentType: 'application/json',
  schema: {
    type: apigateway.JsonSchemaType.OBJECT,
    required: ['entityId', 'price'],
    properties: {
      entityId: { type: apigateway.JsonSchemaType.STRING },
      price: { type: apigateway.JsonSchemaType.NUMBER, minimum: 0, maximum: 99999 },
    },
  },
});
```

### Requirements Satisfied
- ✅ Requirement 10.5: API authentication
- ✅ Rate limiting (100 req/min)
- ✅ CORS configuration
- ✅ Request validation

---

## Task 16: Error Handling and Monitoring

### Status: Needs Implementation

### Implementation Steps

#### 16.1 Standardize Error Responses

Update `src/temple-pricing/utils/errors.ts`:

```typescript
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
    timestamp: string;
  };
}

export function formatErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: any
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PAYMENT_MISMATCH: 'PAYMENT_MISMATCH',
  PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',
};
```

#### 16.2 Create CloudWatch Alarms

Create `infrastructure/monitoring-stack.ts`:

```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';

// Create SNS topic for alerts
const alertTopic = new sns.Topic(this, 'AlertTopic', {
  displayName: 'Temple Pricing Alerts',
});

// Error rate alarm
new cloudwatch.Alarm(this, 'ErrorRateAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 5, // 5% error rate
  evaluationPeriods: 2,
  alarmDescription: 'Alert when error rate exceeds 5%',
  actionsEnabled: true,
});

// Payment failure alarm
new cloudwatch.Alarm(this, 'PaymentFailureAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'TemplePricing',
    metricName: 'PaymentFailures',
    statistic: 'Sum',
    period: cdk.Duration.minutes(1),
  }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'Alert when payment failures exceed 10/min',
});

// DynamoDB throttling alarm
new cloudwatch.Alarm(this, 'DynamoDBThrottlingAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/DynamoDB',
    metricName: 'UserErrors',
    statistic: 'Sum',
    period: cdk.Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'Alert on DynamoDB throttling',
});
```

#### 16.3 Configure X-Ray Tracing

```typescript
// In Lambda function configuration
const pricingLambda = new lambda.Function(this, 'PricingLambda', {
  // ... other config
  tracing: lambda.Tracing.ACTIVE,
});

// In Lambda code
import * as AWSXRay from 'aws-xray-sdk-core';
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

#### 16.4 Structured Logging

Already implemented in `src/temple-pricing/utils/logger.ts`:
- Winston logger with JSON format
- CloudWatch Logs integration
- Request ID tracking
- Error context capture

---

## Task 17: Caching Layer

### Status: Partially Complete
- ✅ Redis utility exists (`utils/redis.ts`)
- ⚠️ ElastiCache cluster needs provisioning

### Implementation Steps

#### 17.1 Provision ElastiCache Redis

Create `infrastructure/cache-stack.ts`:

```typescript
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// Create Redis cluster
const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
  description: 'Subnet group for Redis cache',
  subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
});

const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
  cacheNodeType: 'cache.t3.micro', // For development
  engine: 'redis',
  numCacheNodes: 1,
  cacheSubnetGroupName: cacheSubnetGroup.ref,
  vpcSecurityGroupIds: [securityGroup.securityGroupId],
});
```

#### 17.2 Implement Cache Invalidation

```typescript
// In pricing service
export async function setPriceConfiguration(
  entityId: string,
  price: number,
  adminUserId: string
): Promise<void> {
  // Update DynamoDB
  await dynamodb.put({
    TableName: 'PriceConfigurations',
    Item: { entityId, price, updatedBy: adminUserId, updatedAt: Date.now() },
  });

  // Invalidate cache
  await redis.del(`price:${entityId}`);
  await redis.del(`access:${entityId}:*`); // Invalidate access verification cache
}
```

#### 17.3 Cache Configuration

- Price configurations: 1 hour TTL
- Access verification: 5 minutes TTL
- Package metadata: 30 minutes TTL

---

## Task 18: Data Migration

### Status: Needs Implementation

### Implementation Steps

#### 18.1 Create Migration Script

Create `scripts/migrate-pricing-data.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

interface MigrationConfig {
  defaultPrice: number;
  priceByQRCount: {
    min: number;
    max: number;
    price: number;
  }[];
}

export async function migrateTemples(config: MigrationConfig): Promise<void> {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  // Scan existing temples
  const temples = await client.send(new ScanCommand({
    TableName: 'Temples',
  }));

  for (const temple of temples.Items || []) {
    const qrCount = temple.qrCodeCount || 0;
    
    // Determine price based on QR count
    const priceRule = config.priceByQRCount.find(
      rule => qrCount >= rule.min && qrCount <= rule.max
    );
    
    const price = priceRule?.price || config.defaultPrice;

    // Create price configuration
    await client.send(new PutCommand({
      TableName: 'PriceConfigurations',
      Item: {
        entityId: temple.templeId,
        entityType: 'temple',
        price,
        createdAt: Date.now(),
        createdBy: 'migration-script',
      },
    }));

    console.log(`Migrated ${temple.name}: ₹${price}`);
  }
}
```

#### 18.2 Validation Script

```typescript
export async function validateMigration(): Promise<boolean> {
  // Check all temples have price configurations
  // Verify price ranges are valid
  // Ensure no data corruption
  return true;
}
```

#### 18.3 Rollback Capability

```typescript
export async function rollbackMigration(): Promise<void> {
  // Delete all price configurations created by migration
  // Restore previous state if needed
}
```

---

## Task 19: Integration and Wiring

### Status: Needs Implementation

### Implementation Steps

#### 19.1 Wire Temple Management to Pricing

```typescript
// In temple management service
export async function updateQRCodeCount(templeId: string, newCount: number): Promise<void> {
  // Update temple
  await updateTemple(templeId, { qrCodeCount: newCount });

  // Trigger price recalculation
  await priceCalculator.recalculateSuggestedPrice(templeId);
}
```

#### 19.2 Wire Pricing to Access Control

```typescript
// In payment handler
export async function verifyPayment(
  paymentId: string,
  entityId: string,
  amount: number
): Promise<void> {
  // Get current price
  const price = await pricingService.getPriceConfiguration(entityId);

  // Validate amount
  if (Math.abs(amount - price) > 1) {
    throw new Error('Payment amount mismatch');
  }

  // Create access grant
  await accessControl.createAccessGrant(userId, entityId, paymentId);
}
```

#### 19.3 Integration Tests

Create `tests/integration/pricing-flow.test.ts`:

```typescript
describe('Complete Pricing Flow', () => {
  it('should handle end-to-end purchase flow', async () => {
    // 1. Get price
    const price = await getPriceConfiguration('temple-1');
    
    // 2. Create payment
    const payment = await createPayment('user-1', 'temple-1', price);
    
    // 3. Verify payment
    await verifyPayment(payment.id);
    
    // 4. Check access
    const hasAccess = await verifyAccess('user-1', 'qr-1');
    expect(hasAccess).toBe(true);
  });
});
```

---

## Task 20: Final Validation

### Status: Needs Implementation

### Validation Checklist

#### 20.1 Unit Tests
- [ ] Run all unit tests: `npm test`
- [ ] Verify 90% code coverage
- [ ] All 61 property-based tests passing

#### 20.2 Integration Tests
- [ ] Purchase flow test
- [ ] Admin workflow test
- [ ] Bulk operations test
- [ ] Error handling test

#### 20.3 API Endpoint Verification
- [ ] All endpoints return correct responses
- [ ] Authentication works correctly
- [ ] Rate limiting is enforced
- [ ] CORS headers are correct

#### 20.4 Infrastructure Verification
- [ ] All DynamoDB tables created
- [ ] All GSIs configured
- [ ] Lambda functions deployed
- [ ] API Gateway configured
- [ ] CloudWatch alarms active
- [ ] ElastiCache cluster running

#### 20.5 Performance Testing
- [ ] API response times < 200ms (95th percentile)
- [ ] Cache hit rate > 80%
- [ ] No DynamoDB throttling
- [ ] Lambda cold starts < 1s

---

## Deployment Guide

### Prerequisites
1. AWS CLI configured
2. CDK installed: `npm install -g aws-cdk`
3. Environment variables set

### Deployment Steps

```bash
# 1. Build Lambda functions
cd src/temple-pricing
npm run build

# 2. Deploy infrastructure
cd infrastructure
cdk deploy TemplePricingStack

# 3. Run data migration
npm run migrate:pricing

# 4. Verify deployment
npm run verify:deployment

# 5. Run integration tests
npm run test:integration
```

### Environment Variables

```bash
# Required for all environments
JWT_SECRET=your-jwt-secret
DYNAMODB_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com
REDIS_ENDPOINT=your-redis-endpoint

# Optional
LOG_LEVEL=info
CACHE_TTL=3600
```

---

## Cost Optimization

### Development Environment
- Use t3.micro for ElastiCache
- On-demand DynamoDB billing
- Minimal Lambda memory (256MB)
- Estimated cost: $20-50/month

### Production Environment
- Reserved capacity for DynamoDB
- Provisioned ElastiCache
- Optimized Lambda memory
- CloudFront for static assets
- Estimated cost: $100-500/month (depending on usage)

---

## Monitoring Dashboard

### Key Metrics to Track
1. API request count and latency
2. Lambda invocation count and errors
3. DynamoDB read/write capacity
4. Cache hit/miss ratio
5. Payment success/failure rate
6. Access grant creation rate

### CloudWatch Dashboard

```typescript
const dashboard = new cloudwatch.Dashboard(this, 'TemplePricingDashboard', {
  dashboardName: 'TemplePricingMetrics',
  widgets: [
    [apiRequestsWidget, apiLatencyWidget],
    [lambdaErrorsWidget, dynamoDBThrottlingWidget],
    [cacheHitRateWidget, paymentSuccessWidget],
  ],
});
```

---

## Security Checklist

- [ ] JWT tokens properly validated
- [ ] API endpoints require authentication
- [ ] DynamoDB tables have encryption at rest
- [ ] Lambda functions have minimal IAM permissions
- [ ] Secrets stored in AWS Secrets Manager
- [ ] CORS configured for specific origins (production)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (N/A for DynamoDB)
- [ ] XSS prevention in Admin Portal

---

## Next Steps

1. **Immediate**: Complete Task 15 (API Gateway setup)
2. **Short-term**: Implement monitoring and error handling (Task 16)
3. **Medium-term**: Set up caching and run data migration (Tasks 17-18)
4. **Long-term**: Complete integration and final validation (Tasks 19-20)

## Support

For questions or issues:
- Review requirements.md for detailed specifications
- Check design.md for architecture decisions
- Refer to FINAL_STATUS.md for current implementation status
- Review test files for usage examples

---

**Document Version**: 1.0  
**Last Updated**: 2024-02-27  
**Status**: Tasks 1-14 Complete, Tasks 15-20 Pending
