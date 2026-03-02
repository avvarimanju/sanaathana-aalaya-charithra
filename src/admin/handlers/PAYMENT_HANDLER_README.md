# Payment Management Handler

## Overview

The Payment Management Handler provides comprehensive payment transaction management capabilities for the Sanaathana Aalaya Charithra admin application. It integrates with Razorpay payment gateway to handle transactions, refunds, subscriptions, and revenue tracking.

## Features

- **Transaction Management**: List, view, and filter payment transactions
- **Refund Processing**: Issue full or partial refunds through Razorpay API
- **Subscription Management**: View and cancel user subscriptions
- **Revenue Analytics**: Track revenue by day, week, month, and temple
- **Transaction Export**: Export transaction data to CSV format
- **Audit Logging**: All payment operations are logged to audit trail

## API Endpoints

### 1. List Transactions

**Endpoint**: `GET /admin/payments/transactions`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (CREATED, AUTHORIZED, CAPTURED, REFUNDED, FAILED)
- `dateRange` (optional): Filter by date range (format: "start,end")
- `amountRange` (optional): Filter by amount range (format: "min,max")

**Response**:
```json
{
  "transactions": [
    {
      "transactionId": "txn123",
      "razorpayPaymentId": "pay_123",
      "razorpayOrderId": "order_123",
      "userId": "user123",
      "userName": "John Doe",
      "templeId": "temple123",
      "templeName": "Test Temple",
      "amount": 100.0,
      "currency": "INR",
      "status": "CAPTURED",
      "paymentMethod": "card",
      "createdAt": "2024-01-15T10:00:00",
      "capturedAt": "2024-01-15T10:01:00",
      "refundedAt": null,
      "refundAmount": null,
      "refundReason": null,
      "metadata": {}
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2
}
```

### 2. Get Transaction Details

**Endpoint**: `GET /admin/payments/transactions/{transactionId}`

**Response**:
```json
{
  "transaction": {
    "transactionId": "txn123",
    "razorpayPaymentId": "pay_123",
    "razorpayOrderId": "order_123",
    "userId": "user123",
    "userName": "John Doe",
    "templeId": "temple123",
    "templeName": "Test Temple",
    "amount": 100.0,
    "currency": "INR",
    "status": "CAPTURED",
    "paymentMethod": "card",
    "createdAt": "2024-01-15T10:00:00",
    "capturedAt": "2024-01-15T10:01:00",
    "metadata": {},
    "razorpayDetails": {
      "id": "pay_123",
      "method": "card",
      "card": {
        "network": "Visa",
        "last4": "1234"
      }
    }
  }
}
```

### 3. Issue Refund

**Endpoint**: `POST /admin/payments/transactions/{transactionId}/refund`

**Request Body**:
```json
{
  "amount": 50.0,  // Optional: defaults to full amount
  "reason": "Customer request"  // Required
}
```

**Response**:
```json
{
  "success": true,
  "refund": {
    "refundId": "rfnd_123",
    "amount": 50.0,
    "currency": "INR",
    "status": "processed",
    "createdAt": "2024-01-15T11:00:00"
  }
}
```

**Business Rules**:
- Transaction must be in CAPTURED status
- Cannot refund already refunded transactions
- Partial refunds are supported
- Refund amount cannot exceed original transaction amount
- All refunds are processed through Razorpay API

### 4. List Subscriptions

**Endpoint**: `GET /admin/payments/subscriptions`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (active, cancelled, expired)
- `userId` (optional): Filter by user ID

**Response**:
```json
{
  "subscriptions": [
    {
      "subscriptionId": "sub_123",
      "userId": "user123",
      "planId": "plan_123",
      "planName": "Premium Plan",
      "status": "active",
      "startDate": "2024-01-01T00:00:00",
      "endDate": "2024-02-01T00:00:00",
      "autoRenew": true,
      "amount": 500.0
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### 5. Cancel Subscription

**Endpoint**: `POST /admin/payments/subscriptions/{subscriptionId}/cancel`

**Request Body**:
```json
{
  "reason": "User request"  // Optional
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "subscriptionId": "sub_123",
    "status": "cancelled",
    "cancelledAt": "2024-01-15T11:00:00"
  }
}
```

**Business Rules**:
- Subscription is cancelled immediately (not at cycle end)
- Cancelled subscriptions cannot be reactivated
- User will not be charged for future billing cycles

### 6. Get Revenue Statistics

**Endpoint**: `GET /admin/payments/revenue`

**Query Parameters**:
- `period` (required): Aggregation period (daily, weekly, monthly)
- `dateRange` (optional): Date range (format: "start,end", defaults to last 30 days)

**Response**:
```json
{
  "revenue": {
    "daily": [
      {
        "timestamp": "2024-01-15",
        "value": 1500.0
      }
    ],
    "weekly": [
      {
        "timestamp": "2024-01-08",
        "value": 10000.0
      }
    ],
    "monthly": [
      {
        "timestamp": "2024-01",
        "value": 45000.0
      }
    ],
    "byTemple": {
      "temple123": 15000.0,
      "temple456": 30000.0
    },
    "total": 45000.0
  }
}
```

### 7. Export Transactions

**Endpoint**: `POST /admin/payments/export`

**Request Body**:
```json
{
  "format": "CSV",  // Required: only CSV supported
  "dateRange": {    // Optional
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**Response**:
```json
{
  "exportUrl": "https://s3.example.com/exports/transactions_export_20240115_110000.csv",
  "expiresAt": "2024-01-15T12:00:00",
  "filename": "transactions_export_20240115_110000.csv",
  "count": 150
}
```

**CSV Format**:
```csv
transactionId,razorpayPaymentId,userId,userName,templeId,templeName,amount,currency,status,paymentMethod,createdAt,capturedAt,refundedAt,refundAmount,refundReason
txn123,pay_123,user123,John Doe,temple123,Test Temple,100.0,INR,CAPTURED,card,2024-01-15T10:00:00,2024-01-15T10:01:00,,,
```

## Razorpay Integration

### Configuration

Razorpay credentials are stored in AWS Secrets Manager:

**Secret Name**: `razorpay/admin/credentials`

**Secret Format**:
```json
{
  "key_id": "rzp_test_xxxxx",
  "key_secret": "xxxxx"
}
```

### SDK Usage

The handler uses the official Razorpay Python SDK:

```python
import razorpay

client = razorpay.Client(auth=(key_id, key_secret))

# Fetch payment details
payment = client.payment.fetch(payment_id)

# Issue refund
refund = client.payment.refund(payment_id, {
    "amount": 5000,  # Amount in paise (50.00 INR)
    "notes": {
        "reason": "Customer request"
    }
})

# List subscriptions
subscriptions = client.subscription.all({
    "count": 50,
    "skip": 0
})

# Cancel subscription
cancelled = client.subscription.cancel(subscription_id, {
    "cancel_at_cycle_end": 0  # Cancel immediately
})
```

### Error Handling

All Razorpay API calls are wrapped in try-catch blocks:

- **Authentication Errors**: Raised if credentials are invalid
- **Payment Not Found**: Raised if payment ID doesn't exist
- **Refund Errors**: Raised if refund fails (insufficient balance, invalid amount, etc.)
- **Network Errors**: Logged and re-raised with user-friendly message

## Database Schema

### Purchases Table

**Table Name**: `SanaathanaAalayaCharithra-Purchases`

**Keys**:
- Partition Key: `userId` (String)
- Sort Key: `purchaseId` (String)

**Attributes**:
```typescript
{
  userId: string;
  purchaseId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  templeId: string;
  templeName: string;
  userName: string;
  amount: number;
  currency: string;
  status: string;  // CREATED, AUTHORIZED, CAPTURED, REFUNDED, FAILED
  paymentMethod: string;
  purchaseDate: string;  // ISO timestamp
  capturedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata: object;
}
```

**GSI**: `TempleIdIndex` (templeId, purchaseDate)

## Audit Logging

All payment operations are logged to the audit trail:

**Actions Logged**:
- `ISSUE_REFUND`: When a refund is issued
- `CANCEL_SUBSCRIPTION`: When a subscription is cancelled
- `EXPORT_TRANSACTIONS`: When transactions are exported

**Audit Entry Format**:
```json
{
  "auditId": "uuid",
  "timestamp": "2024-01-15T11:00:00",
  "userId": "admin123",
  "userName": "admin@example.com",
  "action": "ISSUE_REFUND",
  "resource": "transaction",
  "resourceId": "txn123",
  "before": {
    "status": "CAPTURED"
  },
  "after": {
    "status": "REFUNDED",
    "refundAmount": 100.0,
    "refundReason": "Customer request"
  },
  "success": true,
  "ttl": 1736942400
}
```

## Error Handling

### Validation Errors (400)

- Missing required fields
- Invalid amount values
- Invalid date formats
- Unsupported export formats

### Not Found Errors (404)

- Transaction not found
- Subscription not found

### Business Logic Errors (400)

- Cannot refund already refunded transaction
- Cannot refund transaction with invalid status
- Refund amount exceeds transaction amount

### External Service Errors (500)

- Razorpay API errors
- AWS Secrets Manager errors
- DynamoDB errors
- S3 upload errors

## Testing

### Unit Tests

Run unit tests:
```bash
cd src/admin/handlers
pytest test_payment_handler.py -v
```

**Test Coverage**:
- Request routing
- Transaction listing with filters
- Transaction details retrieval
- Refund processing (full and partial)
- Subscription management
- Revenue statistics calculation
- Transaction export
- Error handling
- Razorpay integration

### Manual Testing

Use the following curl commands to test endpoints:

```bash
# List transactions
curl -X GET "https://api.example.com/admin/payments/transactions?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Get transaction details
curl -X GET "https://api.example.com/admin/payments/transactions/txn123" \
  -H "Authorization: Bearer $TOKEN"

# Issue refund
curl -X POST "https://api.example.com/admin/payments/transactions/txn123/refund" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50.0, "reason": "Customer request"}'

# List subscriptions
curl -X GET "https://api.example.com/admin/payments/subscriptions" \
  -H "Authorization: Bearer $TOKEN"

# Cancel subscription
curl -X POST "https://api.example.com/admin/payments/subscriptions/sub_123/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "User request"}'

# Get revenue statistics
curl -X GET "https://api.example.com/admin/payments/revenue?period=monthly" \
  -H "Authorization: Bearer $TOKEN"

# Export transactions
curl -X POST "https://api.example.com/admin/payments/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "CSV"}'
```

## Security Considerations

1. **Credentials Storage**: Razorpay credentials are stored in AWS Secrets Manager, never in code
2. **Authentication**: All endpoints require valid JWT token from Cognito
3. **Authorization**: Only users with `MANAGE_PAYMENTS` permission can access these endpoints
4. **Audit Trail**: All payment operations are logged with user ID and timestamp
5. **Data Encryption**: All data is encrypted at rest in DynamoDB and S3
6. **HTTPS Only**: All API calls use HTTPS
7. **Rate Limiting**: API Gateway enforces rate limits to prevent abuse

## Performance Considerations

1. **Pagination**: All list endpoints support pagination to handle large datasets
2. **Caching**: Consider caching revenue statistics for frequently accessed periods
3. **Async Processing**: Large exports are processed asynchronously
4. **DynamoDB Scans**: Use GSI for better query performance in production
5. **Razorpay Rate Limits**: Be aware of Razorpay API rate limits (varies by plan)

## Monitoring

### CloudWatch Metrics

Monitor the following metrics:
- Lambda invocation count
- Lambda error rate
- Lambda duration
- DynamoDB read/write capacity
- S3 upload success rate

### CloudWatch Alarms

Set up alarms for:
- High error rate (> 5%)
- High latency (> 3 seconds)
- Failed refunds
- Failed exports

### Logs

All operations are logged to CloudWatch Logs:
```
[INFO] Request: GET /admin/payments/transactions by admin@example.com
[INFO] Listing transactions with filters: status=CAPTURED
[INFO] Found 150 transactions
[ERROR] Error issuing refund: Razorpay API error
```

## Troubleshooting

### Common Issues

**Issue**: "Missing Razorpay credentials in Secrets Manager"
- **Solution**: Ensure secret `razorpay/admin/credentials` exists with `key_id` and `key_secret`

**Issue**: "Transaction not found"
- **Solution**: Verify transaction ID is correct and exists in Purchases table

**Issue**: "Cannot refund transaction with status: PENDING"
- **Solution**: Only CAPTURED transactions can be refunded

**Issue**: "Razorpay API error"
- **Solution**: Check Razorpay credentials, API status, and rate limits

**Issue**: "Export URL expired"
- **Solution**: Pre-signed URLs expire after 1 hour, generate new export

## Future Enhancements

1. **Webhook Integration**: Handle Razorpay webhooks for real-time payment updates
2. **Dispute Management**: Add support for handling payment disputes
3. **Bulk Refunds**: Support bulk refund operations
4. **Payment Analytics**: Add more detailed payment analytics and insights
5. **Multi-Currency**: Support multiple currencies beyond INR
6. **Scheduled Reports**: Generate and email payment reports automatically
7. **Fraud Detection**: Integrate fraud detection and prevention
8. **Payment Links**: Generate payment links for manual transactions

## Support

For issues or questions:
- Check CloudWatch Logs for error details
- Review Razorpay dashboard for payment status
- Contact development team with audit log entries
- Refer to Razorpay API documentation: https://razorpay.com/docs/api/
