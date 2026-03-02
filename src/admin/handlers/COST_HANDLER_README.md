# Cost Monitoring Handler

## Overview

The Cost Monitoring Handler provides comprehensive AWS cost tracking and alerting capabilities for the Sanaathana Aalaya Charithra admin application. It integrates with AWS Cost Explorer API to fetch cost data, caches results to minimize API costs, and provides resource usage metrics from CloudWatch.

## Features

- **Current Month Costs**: Fetch current month AWS costs broken down by service
- **Cost Trends**: Display 12-month historical cost trends with service breakdown
- **Cost Alerts**: Create, update, and delete cost alert thresholds
- **Resource Usage Metrics**: Track Lambda invocations, DynamoDB capacity, S3 storage, Bedrock, and Polly usage
- **Intelligent Caching**: Cache Cost Explorer results for 24 hours to reduce API costs
- **Daily Refresh**: Scheduled Lambda function refreshes cost data daily

## API Endpoints

### 1. Get Current Month Costs

**Endpoint**: `GET /admin/costs/current`

**Description**: Retrieves current month AWS costs by service.

**Response**:
```json
{
  "currentMonth": {
    "total": 275.75,
    "byService": {
      "lambda": 150.50,
      "dynamodb": 75.25,
      "s3": 50.00,
      "bedrock": 0.00,
      "polly": 0.00,
      "apiGateway": 0.00,
      "cloudfront": 0.00
    }
  },
  "cached": true,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

**Caching**: Results are cached for 24 hours. Cache key: `current_month_YYYY-MM`

---

### 2. Get Cost Trend

**Endpoint**: `GET /admin/costs/trend?months=12`

**Description**: Retrieves historical cost trends for the specified number of months.

**Query Parameters**:
- `months` (optional): Number of months to retrieve (default: 12)

**Response**:
```json
{
  "trend": [
    {
      "month": "2024-01",
      "total": 275.75,
      "byService": {
        "lambda": 150.50,
        "dynamodb": 75.25,
        "s3": 50.00
      }
    },
    {
      "month": "2024-02",
      "total": 300.00,
      "byService": {
        "lambda": 160.00,
        "dynamodb": 80.00,
        "s3": 60.00
      }
    }
  ],
  "cached": true,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

**Caching**: Results are cached for 24 hours. Cache key: `cost_trend_{months}months`

---

### 3. Get Resource Usage Metrics

**Endpoint**: `GET /admin/costs/resources`

**Description**: Retrieves resource usage metrics from CloudWatch for the past 24 hours.

**Response**:
```json
{
  "usage": {
    "lambda": {
      "invocations": 15000,
      "duration": 750000,
      "errors": 5,
      "throttles": 0
    },
    "dynamodb": {
      "readCapacityUnits": 5000,
      "writeCapacityUnits": 2000,
      "storageGB": 0
    },
    "s3": {
      "storageGB": 0,
      "requests": 0,
      "dataTransferGB": 0
    },
    "bedrock": {
      "apiCalls": 0,
      "tokensProcessed": 0
    },
    "polly": {
      "charactersConverted": 0
    }
  },
  "cached": true,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

**Caching**: Results are cached for 1 hour. Cache key: `resource_usage_YYYY-MM-DD`

---

### 4. Get Cost Alerts

**Endpoint**: `GET /admin/costs/alerts`

**Description**: Retrieves all cost alerts with their current status.

**Response**:
```json
{
  "alerts": [
    {
      "alertId": "alert-123",
      "service": "lambda",
      "threshold": 200.0,
      "currentValue": 150.50,
      "triggered": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "user123",
      "enabled": true
    },
    {
      "alertId": "alert-456",
      "service": "dynamodb",
      "threshold": 50.0,
      "currentValue": 75.25,
      "triggered": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "user123",
      "enabled": true
    }
  ]
}
```

---

### 5. Create Cost Alert

**Endpoint**: `POST /admin/costs/alerts`

**Description**: Creates a new cost alert threshold.

**Request Body**:
```json
{
  "service": "lambda",
  "threshold": 200.0
}
```

**Validation**:
- `service` (required): Service name (lambda, dynamodb, s3, bedrock, polly, etc.)
- `threshold` (required): Alert threshold in USD (must be > 0)

**Response**:
```json
{
  "alert": {
    "alertId": "alert-789",
    "service": "lambda",
    "threshold": 200.0,
    "createdAt": "2024-01-15T10:30:00Z",
    "createdBy": "user123",
    "enabled": true
  }
}
```

**Audit Log**: Creates audit log entry with action `CREATE_COST_ALERT`

---

### 6. Update Cost Alert

**Endpoint**: `PUT /admin/costs/alerts/{alertId}`

**Description**: Updates an existing cost alert threshold.

**Request Body**:
```json
{
  "threshold": 250.0
}
```

**Validation**:
- `threshold` (required): New alert threshold in USD (must be > 0)

**Response**:
```json
{
  "alert": {
    "alertId": "alert-789",
    "service": "lambda",
    "threshold": 250.0,
    "updatedAt": "2024-01-15T10:35:00Z",
    "updatedBy": "user123",
    "enabled": true
  }
}
```

**Audit Log**: Creates audit log entry with action `UPDATE_COST_ALERT` including before/after values

---

### 7. Delete Cost Alert

**Endpoint**: `DELETE /admin/costs/alerts/{alertId}`

**Description**: Deletes a cost alert.

**Response**:
```json
{
  "success": true,
  "message": "Alert alert-789 deleted successfully"
}
```

**Audit Log**: Creates audit log entry with action `DELETE_COST_ALERT`

---

## DynamoDB Tables

### CostCache Table

**Purpose**: Cache Cost Explorer API results to reduce API costs

**Schema**:
```
Partition Key: cacheKey (String)
Attributes:
  - data (Map): Cached cost data
  - timestamp (String): ISO timestamp of cache creation
  - ttl (Number): Unix timestamp for auto-deletion (7 days)
```

**Cache Keys**:
- `current_month_YYYY-MM`: Current month costs
- `cost_trend_{months}months`: Historical cost trends
- `resource_usage_YYYY-MM-DD`: Resource usage metrics

### CostAlerts Table

**Purpose**: Store cost alert thresholds

**Schema**:
```
Partition Key: alertId (String)
Attributes:
  - service (String): AWS service name
  - threshold (Number): Alert threshold in USD
  - createdAt (String): ISO timestamp
  - createdBy (String): User ID
  - updatedAt (String): ISO timestamp (optional)
  - updatedBy (String): User ID (optional)
  - enabled (Boolean): Alert enabled status
```

---

## Cost Monitoring Lambda

### Purpose

The Cost Monitoring Lambda function is triggered daily by EventBridge to fetch and cache AWS cost data from Cost Explorer API. This reduces the number of API calls and associated costs.

### Schedule

Runs daily at 2:00 AM UTC

### Operations

1. Fetches current month costs by service
2. Fetches 12-month cost trend
3. Fetches 6-month cost trend
4. Fetches 3-month cost trend
5. Caches all results in DynamoDB

### Environment Variables

- `COST_CACHE_TABLE`: DynamoDB table name for cost cache

### IAM Permissions Required

- `ce:GetCostAndUsage`: Fetch cost data from Cost Explorer
- `ce:GetCostForecast`: Fetch cost forecasts
- `dynamodb:PutItem`: Cache results in DynamoDB
- `dynamodb:GetItem`: Read cached results

---

## Service Name Mapping

The handler maps AWS service names to friendly names:

| AWS Service Name | Friendly Name |
|-----------------|---------------|
| AWS Lambda | lambda |
| Amazon DynamoDB | dynamodb |
| Amazon Simple Storage Service | s3 |
| Amazon Bedrock | bedrock |
| Amazon Polly | polly |
| Amazon API Gateway | apiGateway |
| Amazon CloudFront | cloudfront |
| Amazon CloudWatch | cloudwatch |
| AWS Cost Explorer | costExplorer |
| Amazon Cognito | cognito |
| Amazon EventBridge | eventbridge |
| AWS Secrets Manager | secretsManager |
| Amazon SES | ses |

---

## Error Handling

### Cost Explorer API Errors

If Cost Explorer API fails, the handler returns empty cost data with an error message:

```json
{
  "currentMonth": {
    "total": 0.0,
    "byService": {}
  },
  "error": "API error message",
  "cached": false
}
```

### CloudWatch API Errors

If CloudWatch API fails, the handler returns zero values for metrics:

```json
{
  "usage": {
    "lambda": {
      "invocations": 0,
      "duration": 0,
      "errors": 0,
      "throttles": 0
    }
  },
  "error": "API error message",
  "cached": false
}
```

### Alert Not Found

Returns 400 error with message: `Alert not found: {alertId}`

### Invalid Threshold

Returns 400 error with message: `Threshold must be greater than 0`

---

## Cost Optimization

### API Call Reduction

Cost Explorer API charges approximately $0.01 per API call. The handler implements aggressive caching:

- **Current month costs**: Cached for 24 hours
- **Cost trends**: Cached for 24 hours
- **Resource usage**: Cached for 1 hour

### Daily Refresh

The scheduled Lambda function refreshes all cached data once per day, ensuring:
- Maximum of 4 Cost Explorer API calls per day (~$0.04/day)
- Fresh data available for admin users
- No API calls during user interactions

### Estimated Monthly Cost

- Daily refresh: 4 API calls × 30 days = 120 calls/month
- Cost: 120 × $0.01 = $1.20/month

---

## Testing

### Unit Tests

Run unit tests with pytest:

```bash
cd src/admin/handlers
pytest test_cost_handler.py -v
```

### Test Coverage

- Route handling for all 7 endpoints
- Cache hit/miss scenarios
- Cost Explorer API integration
- CloudWatch metrics integration
- Alert CRUD operations
- Error handling
- Service name mapping

### Manual Testing

Use the provided test script or Postman collection to test endpoints manually.

---

## Requirements Validation

This implementation satisfies the following requirements:

- **9.1**: Display current month AWS costs by service ✓
- **9.2**: Display cost trends over the past 12 months ✓
- **9.3**: Display Lambda invocation counts and duration statistics ✓
- **9.4**: Display DynamoDB read and write capacity unit consumption ✓
- **9.5**: Display S3 storage usage and data transfer statistics ✓
- **9.6**: Display AWS Bedrock API call counts and token usage ✓
- **9.7**: Display AWS Polly character conversion counts ✓
- **9.8**: Display alerts when costs exceed predefined thresholds ✓
- **9.9**: Allow administrators to set cost alert thresholds ✓
- **9.10**: Refresh cost data every 24 hours ✓

---

## Future Enhancements

1. **Cost Forecasting**: Integrate Cost Explorer forecast API
2. **Email Notifications**: Send email alerts when thresholds are exceeded
3. **Budget Integration**: Integrate with AWS Budgets API
4. **Cost Anomaly Detection**: Detect unusual cost spikes
5. **Detailed S3 Metrics**: Query S3 bucket sizes and request counts
6. **Bedrock/Polly Tracking**: Implement custom metrics for AI service usage
7. **Cost Allocation Tags**: Support cost filtering by tags
8. **Multi-Account Support**: Aggregate costs across multiple AWS accounts

---

## Troubleshooting

### Cache Not Working

Check DynamoDB table permissions and TTL configuration.

### Cost Explorer API Errors

Verify IAM permissions include `ce:GetCostAndUsage` and `ce:GetCostForecast`.

### Missing Metrics

CloudWatch metrics may have delays. Wait 5-10 minutes for metrics to appear.

### Alert Not Triggering

Verify alert threshold is correctly set and current costs exceed the threshold.

---

## Support

For issues or questions, contact the development team or refer to the main Admin Backend Application documentation.
