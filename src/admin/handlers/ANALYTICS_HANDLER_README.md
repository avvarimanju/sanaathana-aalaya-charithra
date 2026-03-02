# Analytics Handler

This module handles analytics queries and data export for the admin application.

## Overview

The analytics handler provides comprehensive analytics endpoints for monitoring platform usage, including:
- Summary metrics (temples, artifacts, users, active users)
- QR scan statistics with trends
- Content generation statistics
- Language usage distribution
- Geographic distribution of temple visits
- Audio playback statistics
- Q&A interaction statistics
- Data export in CSV and JSON formats

## Endpoints

### GET /admin/analytics/summary

Returns key metrics summary.

**Response:**
```json
{
  "summary": {
    "totalTemples": 10,
    "totalArtifacts": 50,
    "totalUsers": 100,
    "activeUsers": {
      "daily": 20,
      "weekly": 50,
      "monthly": 80
    }
  }
}
```

### GET /admin/analytics/qr-scans

Returns QR scan statistics with trends.

**Query Parameters:**
- `dateRange` (optional): Date range in format "YYYY-MM-DD,YYYY-MM-DD"
- `siteId` (optional): Filter by temple ID
- `artifactId` (optional): Filter by artifact ID

**Response:**
```json
{
  "qrScans": {
    "total": 100,
    "byTemple": {
      "temple1": 60,
      "temple2": 40
    },
    "byArtifact": {
      "artifact1": 30,
      "artifact2": 70
    },
    "trend": [
      {"timestamp": "2024-01-01", "value": 10},
      {"timestamp": "2024-01-02", "value": 15}
    ]
  }
}
```

### GET /admin/analytics/content-generation

Returns content generation statistics.

**Query Parameters:**
- `dateRange` (optional): Date range in format "YYYY-MM-DD,YYYY-MM-DD"

**Response:**
```json
{
  "contentGeneration": {
    "totalJobs": 100,
    "successRate": 95.5,
    "averageDuration": 5000.0,
    "byType": {
      "TEXT": 40,
      "AUDIO": 30,
      "QA": 20,
      "INFOGRAPHIC": 10
    }
  }
}
```

### GET /admin/analytics/language-usage

Returns language usage distribution.

**Response:**
```json
{
  "languageUsage": {
    "en": 100,
    "hi": 80,
    "ta": 60,
    "kn": 50
  }
}
```

### GET /admin/analytics/geographic

Returns geographic distribution of temple visits.

**Response:**
```json
{
  "geographicDistribution": [
    {"state": "Karnataka", "visits": 150},
    {"state": "Tamil Nadu", "visits": 120},
    {"state": "Kerala", "visits": 80}
  ]
}
```

### GET /admin/analytics/audio-playback

Returns audio playback statistics.

**Query Parameters:**
- `dateRange` (optional): Date range in format "YYYY-MM-DD,YYYY-MM-DD"

**Response:**
```json
{
  "audioPlayback": {
    "totalPlays": 500,
    "averageDuration": 120.5,
    "completionRate": 75.0
  }
}
```

### GET /admin/analytics/qa-interactions

Returns Q&A interaction statistics.

**Query Parameters:**
- `dateRange` (optional): Date range in format "YYYY-MM-DD,YYYY-MM-DD"

**Response:**
```json
{
  "qaInteractions": {
    "totalQuestions": 200,
    "averageResponseTime": 1500.0,
    "satisfactionScore": 4.5
  }
}
```

### POST /admin/analytics/export

Exports analytics data in CSV or JSON format.

**Request Body:**
```json
{
  "format": "CSV",
  "dataType": "summary",
  "filters": {
    "dateRange": "2024-01-01,2024-01-31"
  }
}
```

**Supported Data Types:**
- `summary`: Summary metrics
- `qr-scans`: QR scan statistics
- `content-generation`: Content generation statistics
- `language-usage`: Language usage distribution
- `geographic`: Geographic distribution
- `audio-playback`: Audio playback statistics
- `qa-interactions`: Q&A interaction statistics

**Response:**
```json
{
  "exportUrl": "https://s3.amazonaws.com/...",
  "expiresAt": "2024-01-01T12:00:00",
  "fileName": "summary-20240101120000.csv",
  "format": "CSV"
}
```

## Implementation Details

### Data Sources

The handler queries data from multiple DynamoDB tables:
- **Analytics**: Event tracking data (QR scans, audio plays, Q&A interactions)
- **HeritageSites**: Temple information
- **Artifacts**: Artifact information
- **PreGenerationProgress**: Content generation job data
- **ContentCache**: Cached content data

### Active Users Calculation

Active users are calculated based on analytics events:
- **Daily**: Users with events in the last 24 hours
- **Weekly**: Users with events in the last 7 days
- **Monthly**: Users with events in the last 30 days

### Export Functionality

Exports are generated and uploaded to S3 with pre-signed URLs:
1. Query data based on filters
2. Convert to CSV or JSON format
3. Upload to S3 bucket under `exports/{exportId}/` prefix
4. Generate pre-signed URL valid for 1 hour
5. Return URL to client

### CSV Format

CSV exports are formatted based on data type:
- **Summary**: Key-value pairs with metrics
- **QR Scans**: Tables for temple and artifact breakdowns
- **Content Generation**: Metrics and type breakdown
- **Language Usage**: Language and count pairs
- **Geographic**: State and visit count pairs
- **Audio Playback**: Key metrics
- **Q&A Interactions**: Key metrics

## Error Handling

The handler includes comprehensive error handling:
- Invalid format validation
- Invalid data type validation
- DynamoDB query errors
- S3 upload errors
- Date parsing errors

All errors are logged and returned with appropriate error messages.

## Testing

The handler includes comprehensive unit tests covering:
- All analytics endpoints
- Export functionality (CSV and JSON)
- CSV conversion for all data types
- Request routing
- Error handling

Run tests with:
```bash
pytest test_analytics_handler.py -v
```

## Performance Considerations

### Current Implementation
- Uses DynamoDB scan operations for flexibility
- Suitable for small to medium datasets (< 10,000 records)

### Future Optimizations
For large datasets, consider:
1. **Global Secondary Indexes (GSI)**: Add GSIs for common query patterns
2. **Caching**: Cache frequently accessed analytics data
3. **Aggregation**: Pre-aggregate data using scheduled Lambda functions
4. **DynamoDB Streams**: Use streams to maintain real-time aggregates
5. **Time-series Database**: Consider Amazon Timestream for time-series data

## Dependencies

- `boto3`: AWS SDK for Python
- `json`: JSON serialization
- `csv`: CSV file generation
- `datetime`: Date/time handling
- `collections.defaultdict`: Data aggregation

## Environment Variables

- `CONTENT_BUCKET`: S3 bucket for exports (default: "sanaathana-aalaya-charithra-content")
- `AWS_REGION`: AWS region (default: "us-east-1")

## Integration

The handler is integrated into the admin API Lambda via routing in `admin_api.py`:

```python
# Analytics endpoints
if path.startswith("/admin/analytics"):
    return handle_analytics_request(method, path, body, query_params, user_id)
```

## Audit Logging

All analytics requests are logged via the audit trail system in `admin_api.py`, including:
- User ID and email
- Request method and path
- Timestamp
- Success/failure status

## Requirements Validation

This implementation satisfies the following requirements:
- **5.1**: Display total counts of temples, artifacts, and mobile users ✓
- **5.2**: Display daily, weekly, and monthly active user counts ✓
- **5.3**: Display QR code scan counts by temple and artifact ✓
- **5.4**: Display content generation statistics ✓
- **5.5**: Display language usage distribution ✓
- **5.6**: Display geographic distribution of temple visits ✓
- **5.7**: Display audio guide playback statistics ✓
- **5.8**: Display Q&A chat interaction counts ✓
- **5.9**: Allow administrators to export analytics data in CSV format ✓
- **13.3**: Export analytics data in CSV and JSON formats ✓
