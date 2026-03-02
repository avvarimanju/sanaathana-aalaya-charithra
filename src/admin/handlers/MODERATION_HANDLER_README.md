# Content Moderation Handler

## Overview

The Content Moderation Handler manages the review and approval workflow for AI-generated content before it is published to the mobile application. This handler ensures content quality and accuracy through a comprehensive moderation system.

## Features

- **Pending Content Review**: List and filter content awaiting moderation
- **Content Approval**: Approve content for publication to mobile app
- **Content Rejection**: Reject content with feedback for quality improvement
- **Content Editing**: Edit and approve content in a single workflow
- **Multi-language Support**: Review all language versions simultaneously
- **Quality Scoring**: Highlight high-quality content eligible for auto-approval
- **Statistics Dashboard**: Track moderation metrics and approval rates
- **Audit Trail**: Log all moderation actions for accountability

## API Endpoints

### 1. GET /admin/moderation/pending

List pending content awaiting moderation with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `siteId` (optional): Filter by temple ID
- `artifactId` (optional): Filter by artifact ID
- `contentType` (optional): Filter by content type (TEXT, AUDIO, QA, INFOGRAPHIC)
- `language` (optional): Filter by language code

**Response:**
```json
{
  "content": [
    {
      "contentId": "content-123",
      "artifactId": "artifact-456",
      "siteId": "site-789",
      "artifactName": "Ancient Sculpture",
      "templeName": "Brihadeeswarar Temple",
      "contentType": "TEXT",
      "languages": [
        {
          "code": "en",
          "content": "This ancient sculpture...",
          "status": "PENDING"
        },
        {
          "code": "hi",
          "content": "यह प्राचीन मूर्ति...",
          "status": "PENDING"
        }
      ],
      "generatedAt": "2024-01-15T10:00:00Z",
      "qualityScore": 0.85,
      "autoApprovalEligible": false,
      "status": "PENDING"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

**Features:**
- Results sorted by quality score (highest first)
- Auto-approval eligible content highlighted at top
- Supports multiple filter combinations
- Efficient pagination for large datasets

---

### 2. GET /admin/moderation/{contentId}

Get detailed content information for review.

**Path Parameters:**
- `contentId`: Content ID

**Response:**
```json
{
  "content": {
    "contentId": "content-123",
    "artifactId": "artifact-456",
    "siteId": "site-789",
    "artifactName": "Ancient Sculpture",
    "templeName": "Brihadeeswarar Temple",
    "contentType": "TEXT",
    "languages": [
      {
        "code": "en",
        "content": "Detailed English content...",
        "status": "PENDING"
      },
      {
        "code": "hi",
        "content": "विस्तृत हिंदी सामग्री...",
        "status": "PENDING"
      },
      {
        "code": "ta",
        "content": "விரிவான தமிழ் உள்ளடக்கம்...",
        "status": "PENDING"
      }
    ],
    "generatedAt": "2024-01-15T10:00:00Z",
    "qualityScore": 0.85,
    "autoApprovalEligible": false,
    "status": "PENDING"
  }
}
```

**Use Cases:**
- Detailed content review
- Side-by-side language comparison
- Quality assessment

---

### 3. POST /admin/moderation/{contentId}/approve

Approve content for publication to mobile app.

**Path Parameters:**
- `contentId`: Content ID

**Request Body:**
```json
{
  "feedback": "Excellent content, approved for publication"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content approved and published successfully",
  "contentId": "content-123",
  "publishedContent": {
    "artifactId": "artifact-456",
    "contentType": "TEXT",
    "publishedItems": [
      {
        "cacheKey": "artifact-456#en#TEXT",
        "language": "en",
        "contentType": "TEXT"
      },
      {
        "cacheKey": "artifact-456#hi#TEXT",
        "language": "hi",
        "contentType": "TEXT"
      }
    ],
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Actions Performed:**
1. Updates content status to APPROVED
2. Records reviewer ID and timestamp
3. Publishes all language versions to ContentCache table
4. Logs action to audit trail
5. Makes content available to mobile app

**Validation:**
- Content must be in PENDING status
- Content must exist

---

### 4. POST /admin/moderation/{contentId}/reject

Reject content with feedback for quality improvement.

**Path Parameters:**
- `contentId`: Content ID

**Request Body:**
```json
{
  "feedback": "Content needs improvement: historical accuracy issues in paragraph 3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content rejected with feedback",
  "contentId": "content-123",
  "feedback": "Content needs improvement: historical accuracy issues in paragraph 3"
}
```

**Actions Performed:**
1. Updates content status to REJECTED
2. Stores feedback for content generation system
3. Records reviewer ID and timestamp
4. Logs action to audit trail
5. Notifies content generation system for improvement

**Validation:**
- Feedback is required (cannot be empty)
- Content must be in PENDING status
- Content must exist

---

### 5. POST /admin/moderation/{contentId}/edit

Edit content and approve for publication in a single workflow.

**Path Parameters:**
- `contentId`: Content ID

**Request Body:**
```json
{
  "editedContent": {
    "en": "This is the edited English content with corrections...",
    "hi": "यह सुधार के साथ संपादित हिंदी सामग्री है..."
  },
  "feedback": "Minor corrections made to improve clarity"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content edited and approved successfully",
  "contentId": "content-123",
  "updatedContent": {
    "contentId": "content-123",
    "languages": [
      {
        "code": "en",
        "content": "This is the edited English content with corrections...",
        "status": "APPROVED",
        "edited": true
      },
      {
        "code": "hi",
        "content": "यह सुधार के साथ संपादित हिंदी सामग्री है...",
        "status": "APPROVED",
        "edited": true
      }
    ],
    "status": "APPROVED"
  },
  "publishedContent": {
    "artifactId": "artifact-456",
    "contentType": "TEXT",
    "publishedItems": [...],
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Actions Performed:**
1. Updates specified language content with edited versions
2. Marks edited languages with `edited: true` flag
3. Updates content status to APPROVED
4. Publishes edited content to ContentCache table
5. Records reviewer ID and timestamp
6. Logs action to audit trail

**Features:**
- Edit all or some languages
- Unedited languages remain unchanged
- Single-step edit and approval workflow
- Tracks which languages were edited

**Validation:**
- editedContent must be a dictionary mapping language codes to content
- Content must be in PENDING status
- Content must exist

---

### 6. GET /admin/moderation/stats

Get moderation statistics and metrics.

**Response:**
```json
{
  "pending": 25,
  "approved": 150,
  "rejected": 10,
  "total": 185,
  "autoApprovalRate": 35.5
}
```

**Metrics:**
- `pending`: Number of content items awaiting review
- `approved`: Number of approved content items
- `rejected`: Number of rejected content items
- `total`: Total content items in system
- `autoApprovalRate`: Percentage of content eligible for auto-approval (quality score > 0.9)

**Use Cases:**
- Dashboard metrics
- Performance monitoring
- Quality tracking

---

## Data Models

### PendingContent

```typescript
interface PendingContent {
  contentId: string;              // Unique content identifier
  artifactId: string;             // Associated artifact ID
  siteId: string;                 // Associated temple ID
  artifactName: string;           // Artifact name for display
  templeName: string;             // Temple name for display
  contentType: 'TEXT' | 'AUDIO' | 'QA' | 'INFOGRAPHIC';
  languages: LanguageContent[];   // Content in all languages
  generatedAt: string;            // ISO timestamp
  qualityScore?: number;          // AI quality score (0-1)
  autoApprovalEligible: boolean;  // True if quality score > 0.9
  reviewedBy?: string;            // Reviewer user ID
  reviewedAt?: string;            // Review timestamp
  feedback?: string;              // Reviewer feedback
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface LanguageContent {
  code: string;                   // Language code (en, hi, ta, etc.)
  content: string;                // Content text
  audioUrl?: string;              // S3 URL for audio content
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  edited?: boolean;               // True if manually edited
}
```

### ContentCache (Published Content)

```typescript
interface ContentCacheItem {
  cacheKey: string;               // Format: artifactId#language#contentType
  content: string;                // Content text
  s3Url?: string;                 // S3 URL for media content
  ttl: number;                    // Unix timestamp for auto-deletion (30 days)
  createdAt: string;              // ISO timestamp
  metadata: {
    artifactId: string;
    siteId: string;
    contentType: string;
    language: string;
    qualityScore?: number;
    reviewedBy?: string;
    reviewedAt?: string;
  };
}
```

---

## Database Schema

### ContentModeration Table

**Primary Key:**
- `contentId` (String) - Partition Key

**Attributes:**
- `artifactId` (String)
- `siteId` (String)
- `artifactName` (String)
- `templeName` (String)
- `contentType` (String)
- `languages` (List)
- `generatedAt` (String)
- `qualityScore` (Number)
- `autoApprovalEligible` (Boolean)
- `reviewedBy` (String)
- `reviewedAt` (String)
- `feedback` (String)
- `status` (String)

**Global Secondary Indexes:**
- **StatusIndex**: `status` (Partition Key), `generatedAt` (Sort Key)
  - Used for querying pending content sorted by generation time

---

## Workflow

### Content Moderation Workflow

```
1. AI generates content → ContentModeration table (status: PENDING)
2. Admin reviews content via /admin/moderation/pending
3. Admin takes action:
   a. Approve → Content published to ContentCache → Mobile app access
   b. Reject → Feedback stored → Content generation system notified
   c. Edit → Content modified → Published to ContentCache → Mobile app access
4. All actions logged to audit trail
```

### Auto-Approval Workflow

```
1. AI generates high-quality content (score > 0.9)
2. Content marked as autoApprovalEligible: true
3. Admin can quickly approve without detailed review
4. System highlights these items at top of pending list
```

---

## Quality Scoring

Content quality is scored by the AI generation system based on:
- Factual accuracy
- Grammatical correctness
- Completeness
- Relevance to artifact
- Cultural sensitivity

**Score Ranges:**
- 0.0 - 0.6: Low quality (requires review)
- 0.6 - 0.9: Good quality (standard review)
- 0.9 - 1.0: Excellent quality (auto-approval eligible)

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Missing required fields (e.g., feedback for rejection)
- Invalid editedContent format
- Content not in PENDING status

**404 Not Found:**
- Content ID does not exist

**500 Internal Server Error:**
- Database operation failure
- Publishing to cache failure

### Error Response Format

```json
{
  "error": "Validation Error",
  "message": "Feedback is required when rejecting content"
}
```

---

## Testing

### Unit Tests

Run unit tests:
```bash
cd src/admin/handlers
pytest test_moderation_handler.py -v
```

### Test Coverage

- Request routing (6 tests)
- Pending content listing with filters (8 tests)
- Content details retrieval (2 tests)
- Content approval (4 tests)
- Content rejection (5 tests)
- Content editing (5 tests)
- Moderation statistics (3 tests)
- Content publishing (3 tests)

**Total: 36 unit tests**

---

## Integration with Other Components

### ContentCache Table
- Approved content is published to ContentCache
- Mobile app reads from ContentCache
- Cache keys format: `artifactId#language#contentType`
- TTL set to 30 days for automatic cleanup

### Audit Log
- All moderation actions logged
- Includes before/after values for edits
- 365-day retention period
- Supports compliance and accountability

### Content Generation System
- Rejection feedback sent to improve future generations
- Quality scores used for auto-approval eligibility
- Integration via EventBridge (future enhancement)

---

## Performance Considerations

### Optimization Strategies

1. **StatusIndex GSI**: Efficient querying of pending content
2. **Client-side Filtering**: Additional filters applied after GSI query
3. **Pagination**: Limits result set size for fast response
4. **Batch Publishing**: Multiple languages published in single operation
5. **Async Audit Logging**: Non-blocking audit trail writes

### Scalability

- Handles 1000+ pending content items efficiently
- Pagination prevents memory issues
- GSI enables fast status-based queries
- TTL on ContentCache prevents unbounded growth

---

## Security

### Authorization

All endpoints require:
- Valid authentication token
- `MODERATE_CONTENT` permission
- Active admin user status

### Audit Trail

All actions logged with:
- User ID and timestamp
- Action type and resource
- Before/after values
- Success/failure status

### Data Validation

- Input sanitization for all user-provided content
- Type checking for editedContent
- Status validation before state transitions
- Required field validation

---

## Future Enhancements

1. **Bulk Approval**: Approve multiple content items at once
2. **Auto-Approval**: Automatic approval for high-quality content
3. **Workflow Rules**: Configurable approval workflows
4. **Notification System**: Alert reviewers of pending content
5. **Review Assignment**: Assign content to specific reviewers
6. **Version History**: Track content edit history
7. **A/B Testing**: Test different content versions
8. **Quality Metrics**: Detailed quality breakdown by category

---

## Troubleshooting

### Common Issues

**Issue: Content not appearing in pending list**
- Check content status is PENDING
- Verify StatusIndex GSI is enabled
- Check filter parameters

**Issue: Approval fails**
- Verify content exists
- Check content status is PENDING
- Ensure ContentCache table is accessible

**Issue: Publishing to cache fails**
- Check ContentCache table permissions
- Verify S3 URLs are valid
- Check TTL calculation

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Support

For issues or questions:
- Check unit tests for usage examples
- Review error messages for specific issues
- Contact: admin-backend-team@sanaathana-aalaya-charithra.com

---

## Version History

- **v1.0.0** (2024-01-15): Initial implementation
  - Pending content listing with filters
  - Approve, reject, edit workflows
  - Multi-language support
  - Quality scoring
  - Statistics dashboard
  - Comprehensive unit tests
