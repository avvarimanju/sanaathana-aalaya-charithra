# Artifact Handler Implementation

## Overview

The artifact handler provides CRUD operations for managing artifacts in the Sanaathana Aalaya Charithra admin backend. It includes QR code generation, media upload, and content cache invalidation.

## Implemented Endpoints

### 1. List Artifacts
- **Endpoint**: `GET /admin/artifacts`
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 50)
  - `search` - Search in artifact name and description
  - `siteId` - Filter by temple
  - `status` - Filter by status (ACTIVE, ARCHIVED, DRAFT)
  - `sortBy` - Sort field (name, createdAt, updatedAt)
  - `sortOrder` - Sort order (asc, desc)
- **Response**: Paginated list of artifacts

### 2. Get Single Artifact
- **Endpoint**: `GET /admin/artifacts/{artifactId}`
- **Response**: Single artifact details

### 3. Create Artifact
- **Endpoint**: `POST /admin/artifacts`
- **Request Body**:
  ```json
  {
    "artifactName": "string (required)",
    "siteId": "string (required)",
    "description": "string (required)",
    "images": ["string[]"],
    "videos": ["string[]"],
    "status": "ACTIVE|ARCHIVED|DRAFT",
    "category": "string",
    "historicalPeriod": "string"
  }
  ```
- **Response**: Created artifact with QR code
- **Features**:
  - Validates temple exists
  - Generates unique QR code automatically
  - Uploads QR code image to S3
  - Returns QR code URL

### 4. Update Artifact
- **Endpoint**: `PUT /admin/artifacts/{artifactId}`
- **Request Body**: Partial artifact data to update
- **Response**: Updated artifact
- **Features**:
  - Validates artifact exists
  - Invalidates content cache for the artifact
  - Updates modification timestamp and user

### 5. Delete Artifact (Soft Delete)
- **Endpoint**: `DELETE /admin/artifacts/{artifactId}`
- **Response**: Success message
- **Features**:
  - Soft delete (sets `deleted` flag)
  - Invalidates content cache
  - Preserves data for audit trail

### 6. Upload Artifact Media
- **Endpoint**: `POST /admin/artifacts/{artifactId}/media`
- **Request Body**:
  ```json
  {
    "mediaType": "image|video",
    "fileExtension": "jpg|png|mp4|etc",
    "base64Data": "base64-encoded-file-data"
  }
  ```
- **Response**: S3 URL of uploaded media
- **Features**:
  - Validates file size (10MB for images, 100MB for videos)
  - Uploads to S3 with proper content type
  - Updates artifact media array

### 7. Download QR Code
- **Endpoint**: `GET /admin/artifacts/{artifactId}/qr-code`
- **Query Parameters**:
  - `format` - PNG, SVG, or PDF (default: PNG)
  - `size` - QR code size in pixels (default: 300)
- **Response**: QR code data in requested format
- **Supported Formats**:
  - PNG: Returns base64-encoded image
  - SVG: Returns SVG XML data
  - PDF: Not yet implemented (returns PNG URL)

### 8. Bulk Delete Artifacts
- **Endpoint**: `POST /admin/artifacts/bulk-delete`
- **Request Body**:
  ```json
  {
    "artifactIds": ["string[]"]
  }
  ```
- **Response**: Bulk operation results with success/failure counts
- **Limits**: Maximum 100 artifacts per request

## Key Features

### QR Code Generation
- Unique QR code identifier format: `QR-{artifactId-prefix}-{random-hex}`
- High error correction level (H)
- Automatic upload to S3
- Multiple format support (PNG, SVG)

### Content Cache Invalidation
- Automatically invalidates cached content when artifact is updated or deleted
- Scans ContentCache table for entries matching the artifact
- Ensures mobile app receives fresh content

### Soft Delete
- Artifacts are never permanently deleted
- Sets `deleted` flag and adds `deletedAt` timestamp
- Maintains data integrity for audit trail

### Audit Logging
- All operations are logged via the admin_api.py handler
- Includes user ID, timestamp, action, and success status
- 365-day retention period

## Data Model

### Artifact Schema
```python
{
    "artifactId": "uuid",
    "siteId": "uuid",
    "artifactName": "string",
    "description": "string",
    "qrCode": "string",  # Unique QR identifier
    "qrCodeUrl": "string",  # S3 URL
    "media": {
        "images": ["string[]"],
        "videos": ["string[]"]
    },
    "content": {
        "hasTextContent": bool,
        "hasAudioGuide": bool,
        "hasQA": bool,
        "hasInfographic": bool,
        "languages": ["string[]"]
    },
    "status": "ACTIVE|ARCHIVED|DRAFT",
    "category": "string",
    "historicalPeriod": "string",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "createdBy": "userId",
    "deleted": bool,
    "deletedAt": "ISO timestamp",
    "deletedBy": "userId"
}
```

## Dependencies

- `boto3` - AWS SDK for DynamoDB and S3 operations
- `qrcode[pil]` - QR code generation
- `Pillow` - Image processing

## Error Handling

All functions raise `ValueError` for validation errors:
- Missing required fields
- Artifact not found
- Temple not found
- Invalid file size
- Invalid format

Errors are caught by the admin_api.py handler and returned as appropriate HTTP status codes:
- 400: Validation errors
- 403: Permission errors
- 500: Internal server errors

## Testing

Unit tests are provided in `test_artifact_handler.py`:
- List artifacts with pagination
- Get single artifact
- Create artifact with QR code
- Update artifact
- Delete artifact (soft delete)
- QR code generation
- Error handling

## Integration

The artifact handler is integrated into the admin API via `admin_api.py`:
```python
from handlers.artifact_handler import handle_artifact_request

# In route_request function:
if path.startswith("/admin/artifacts"):
    return handle_artifact_request(method, path, body, query_params, user_id)
```

## S3 Structure

```
sanaathana-aalaya-charithra-content/
└── artifacts/
    └── {artifactId}/
        ├── images/
        │   └── {imageId}.{ext}
        ├── videos/
        │   └── {videoId}.{ext}
        └── qr-codes/
            └── {qrCode}.png
```

## Requirements Validation

This implementation satisfies the following requirements from the spec:
- **3.1**: Create artifact records with QR code generation ✓
- **3.2**: Generate unique QR codes ✓
- **3.3**: Update artifact records ✓
- **3.4**: Delete artifact records (soft delete) ✓
- **3.5**: Archive artifacts instead of permanent deletion ✓
- **3.8**: Display artifacts with search capabilities ✓
- **3.10**: Invalidate cached content on modification ✓

## Future Enhancements

1. PDF QR code generation (requires reportlab library)
2. Batch QR code download (multiple artifacts)
3. QR code customization (colors, logo embedding)
4. Media thumbnail generation
5. Video transcoding for different formats
6. GSI optimization for large-scale queries
