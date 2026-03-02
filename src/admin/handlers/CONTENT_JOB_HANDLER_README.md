# Content Job Handler

This handler implements content generation job monitoring endpoints for the Admin Backend Application.

## Overview

The content job handler provides administrators with the ability to:
- List content generation jobs with pagination and filters
- View detailed job information with logs
- Retry failed jobs
- Cancel in-progress jobs
- View job statistics

## Endpoints

### 1. List Content Jobs
**GET** `/admin/content-jobs`

Lists all content generation jobs with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (comma-separated: PENDING, IN_PROGRESS, COMPLETED, FAILED)
- `dateRange` (optional): Filter by date range (format: start,end)
- `siteId` (optional): Filter by temple ID
- `artifactId` (optional): Filter by artifact ID
- `contentType` (optional): Filter by content type (comma-separated: TEXT, AUDIO, QA, INFOGRAPHIC, VIDEO)

**Response:**
```json
{
  "jobs": [
    {
      "jobId": "job-123",
      "itemKey": "artifact-456#en#TEXT",
      "artifactId": "artifact-456",
      "artifactName": "Test Artifact",
      "siteId": "site-789",
      "templeName": "Test Temple",
      "language": "en",
      "contentType": "TEXT",
      "status": "COMPLETED",
      "startTime": "2024-01-01T10:00:00Z",
      "completionTime": "2024-01-01T10:05:00Z",
      "duration": 300000,
      "outputUrl": "https://s3.amazonaws.com/..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 2. Get Job Details
**GET** `/admin/content-jobs/{jobId}`

Gets detailed information about a specific job including all items and logs.

**Response:**
```json
{
  "job": {
    "jobId": "job-123",
    "summary": {
      "total": 10,
      "completed": 8,
      "failed": 2,
      "inProgress": 0,
      "pending": 0,
      "successRate": 80.0,
      "averageDuration": 250000
    },
    "items": [...]
  },
  "logs": [
    {
      "timestamp": "2024-01-01T10:02:00Z",
      "level": "ERROR",
      "message": "Failed to generate content",
      "itemKey": "artifact-456#hi#TEXT",
      "artifactId": "artifact-456",
      "language": "hi",
      "contentType": "TEXT"
    }
  ]
}
```

### 3. Retry Failed Job
**POST** `/admin/content-jobs/{jobId}/retry`

Retries all failed items in a job by invoking the PreGenerationLambda.

**Response:**
```json
{
  "newJobId": "retry-job-123-20240101120000",
  "originalJobId": "job-123",
  "itemsToRetry": 2,
  "message": "Retry job initiated with 2 items"
}
```

### 4. Cancel In-Progress Job
**POST** `/admin/content-jobs/{jobId}/cancel`

Cancels all in-progress items in a job by updating their status to FAILED.

**Response:**
```json
{
  "jobId": "job-123",
  "cancelledItems": 3,
  "message": "Cancelled 3 in-progress items"
}
```

### 5. Get Job Statistics
**GET** `/admin/content-jobs/stats`

Gets overall job statistics across all jobs.

**Response:**
```json
{
  "total": 1000,
  "byStatus": {
    "COMPLETED": 800,
    "FAILED": 150,
    "IN_PROGRESS": 30,
    "PENDING": 20
  },
  "successRate": 84.21,
  "averageDuration": 275000
}
```

## Data Model

### PreGenerationProgress Table

The handler reads from the `SanaathanaAalayaCharithra-PreGenerationProgress` DynamoDB table:

```typescript
{
  jobId: string;              // Partition Key
  itemKey: string;            // Sort Key (format: artifactId#language#contentType)
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startTime?: string;
  completionTime?: string;
  error?: {
    message: string;
    stackTrace: string;
  };
  outputUrl?: string;
  ttl: number;
  metadata: Record<string, any>;
}
```

## Features

### 1. Job Enrichment
Jobs are automatically enriched with:
- Artifact name (from Artifacts table)
- Temple name (from HeritageSites table)
- Parsed artifact ID, language, and content type from itemKey
- Calculated duration for completed jobs

### 2. Flexible Filtering
Supports multiple filter combinations:
- Single or multiple statuses
- Date range filtering
- Temple and artifact filtering
- Content type filtering

### 3. Job Retry
Failed jobs can be retried by:
- Identifying all failed items
- Extracting artifact IDs and languages
- Invoking PreGenerationLambda with retry payload
- Generating a new job ID with "retry-" prefix

### 4. Job Cancellation
In-progress jobs can be cancelled by:
- Identifying all in-progress items
- Updating their status to FAILED
- Adding cancellation message to error field

### 5. Statistics Calculation
Provides comprehensive statistics:
- Total job count
- Count by status
- Success rate (completed / (completed + failed))
- Average duration for completed jobs

## Error Handling

The handler includes robust error handling:
- Validates job existence before operations
- Handles missing artifacts/temples gracefully
- Returns appropriate error messages
- Logs errors for troubleshooting

## Testing

Comprehensive unit tests are provided in `test_content_job_handler.py`:
- List jobs with various filters
- Get job details with summary and logs
- Retry failed jobs
- Cancel in-progress jobs
- Get job statistics
- Job enrichment with missing data
- Pagination

Run tests:
```bash
pytest test_content_job_handler.py -v
```

## Integration

The handler is integrated into the admin API through `admin_api.py`:

```python
# Content job monitoring endpoints
if path.startswith("/admin/content-jobs"):
    return handle_content_job_request(method, path, body, query_params, user_id)
```

## Audit Logging

All content job operations are automatically logged to the AuditLog table through the admin API handler.

## Requirements Satisfied

This implementation satisfies the following requirements:
- **4.1**: Display list of content generation jobs with status, start time, completion time
- **4.2**: Show job status (pending, in-progress, completed, failed)
- **4.3**: Display job details including artifact, language, content type, error messages
- **4.4**: Display failure reason and stack trace for failed jobs
- **4.5**: Allow retry of failed jobs
- **4.6**: Allow cancellation of in-progress jobs
- **4.8**: Filter jobs by status, date range, temple, artifact
- **4.9**: Display total count of jobs by status

## Future Enhancements

Potential improvements:
1. Add GSI on PreGenerationProgress table for efficient status filtering
2. Implement real-time job status updates via WebSocket
3. Add job scheduling and recurring job support
4. Implement job priority management
5. Add detailed performance metrics per content type
6. Support bulk retry/cancel operations
