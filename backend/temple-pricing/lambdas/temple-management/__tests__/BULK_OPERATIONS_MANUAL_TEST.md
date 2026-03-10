# Bulk Operations Manual Test Guide

This document provides manual testing instructions for the bulk operations functionality implemented in Task 2.9.

## Overview

Two bulk operations have been implemented:
1. **bulkUpdateTemples** - Update multiple temples with partial failure handling
2. **bulkDeleteTemples** - Delete multiple temples with referential integrity checks

## API Endpoints

### Bulk Update Temples
- **Endpoint**: `POST /api/admin/temples/bulk-update`
- **Request Body**:
```json
{
  "updates": [
    {
      "templeId": "temple-uuid-1",
      "updates": {
        "name": "Updated Temple Name",
        "description": "Updated description"
      }
    },
    {
      "templeId": "temple-uuid-2",
      "updates": {
        "accessMode": "OFFLINE_DOWNLOAD"
      }
    }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "entityId": "temple-uuid-1",
        "message": "Temple updated successfully"
      }
    ],
    "failed": [
      {
        "entityId": "temple-uuid-2",
        "error": "Temple not found",
        "details": "ValidationError"
      }
    ],
    "totalProcessed": 2,
    "successCount": 1,
    "failureCount": 1
  }
}
```

### Bulk Delete Temples
- **Endpoint**: `POST /api/admin/temples/bulk-delete`
- **Request Body**:
```json
{
  "templeIds": ["temple-uuid-1", "temple-uuid-2", "temple-uuid-3"]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "entityId": "temple-uuid-1",
        "message": "Temple deleted successfully"
      }
    ],
    "failed": [
      {
        "entityId": "temple-uuid-2",
        "error": "Cannot delete temple: it is part of 1 temple group(s): Karnataka Temples",
        "details": "ValidationError"
      }
    ],
    "totalProcessed": 3,
    "successCount": 2,
    "failureCount": 1
  }
}
```

## Test Scenarios

### Scenario 1: Bulk Update - All Succeed
1. Create 3 temples
2. Call bulk update with valid updates for all 3 temples
3. **Expected**: All 3 updates succeed, successCount = 3, failureCount = 0

### Scenario 2: Bulk Update - Partial Failure
1. Create 2 temples
2. Call bulk update with 3 temple IDs (1 non-existent)
3. **Expected**: 2 updates succeed, 1 fails with "Temple not found", successCount = 2, failureCount = 1

### Scenario 3: Bulk Update - All Fail
1. Call bulk update with 3 non-existent temple IDs
2. **Expected**: All 3 updates fail, successCount = 0, failureCount = 3

### Scenario 4: Bulk Delete - All Succeed
1. Create 3 temples (not in any groups)
2. Call bulk delete with all 3 temple IDs
3. **Expected**: All 3 deletions succeed, successCount = 3, failureCount = 0

### Scenario 5: Bulk Delete - Referential Integrity Check
1. Create 2 temples
2. Create a temple group containing temple 1
3. Call bulk delete with both temple IDs
4. **Expected**: Temple 2 deletes successfully, temple 1 fails with "Cannot delete temple: it is part of temple group(s)", successCount = 1, failureCount = 1

### Scenario 6: Bulk Delete - Partial Failure
1. Create 2 temples
2. Call bulk delete with 3 temple IDs (1 non-existent)
3. **Expected**: 2 deletions succeed, 1 fails with "Temple not found", successCount = 2, failureCount = 1

### Scenario 7: Empty Lists
1. Call bulk update with empty updates array
2. Call bulk delete with empty templeIds array
3. **Expected**: Both return totalProcessed = 0, successCount = 0, failureCount = 0

## Implementation Details

### Partial Failure Handling
- Each operation is processed independently
- If one operation fails, the remaining operations continue
- Detailed error information is returned for each failure
- Success and failure counts are tracked separately

### Referential Integrity
- Before deleting a temple, the system checks if it's part of any temple groups
- If a temple is in one or more groups, deletion fails with a descriptive error message
- The error message includes the names of all groups containing the temple

### Error Handling
- All errors are caught and logged
- Error messages and error types are included in the failure response
- The system continues processing even after encountering errors

## Requirements Validated

- **Requirement 8.1**: Admin Portal provides interface to select multiple entities for bulk updates
- **Requirement 8.2**: Pricing service applies configuration to all selected entities
- **Requirement 8.3**: When bulk update fails for any entity, service completes updates for successful entities and returns list of failures

## Notes

- Bulk operations use the existing single-entity functions (updateTemple, deleteTemple)
- This ensures consistency in validation and business logic
- Audit logging is handled by the underlying single-entity functions
- The implementation is minimal and focused on core functionality
