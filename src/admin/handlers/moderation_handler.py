"""
Content Moderation Handler

Handles content moderation operations including reviewing, approving, rejecting,
and editing AI-generated content before publication to the mobile app.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
from decimal import Decimal
import uuid

# AWS clients
dynamodb = boto3.resource("dynamodb")
content_moderation_table = dynamodb.Table("SanaathanaAalayaCharithra-ContentModeration")
content_cache_table = dynamodb.Table("SanaathanaAalayaCharithra-ContentCache")
audit_log_table = dynamodb.Table("SanaathanaAalayaCharithra-AuditLog")

# Environment variables
CONTENT_MODERATION_TABLE = os.environ.get("CONTENT_MODERATION_TABLE", "SanaathanaAalayaCharithra-ContentModeration")
CONTENT_CACHE_TABLE = os.environ.get("CONTENT_CACHE_TABLE", "SanaathanaAalayaCharithra-ContentCache")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_moderation_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route content moderation requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID making the request
        
    Returns:
        Response data
    """
    # Extract contentId from path if present
    path_parts = path.split("/")
    content_id = None
    
    # Check for contentId in path (e.g., /admin/moderation/{contentId})
    if len(path_parts) > 3 and path_parts[3] not in ["pending", "stats"]:
        content_id = path_parts[3]
    
    # Moderation statistics endpoint
    if method == "GET" and "/stats" in path:
        return get_moderation_stats()
    
    # Pending content list endpoint
    if method == "GET" and "/pending" in path:
        return get_pending_content(query_params)
    
    # Content approval endpoint
    if method == "POST" and content_id and "/approve" in path:
        return approve_content(content_id, body, user_id)
    
    # Content rejection endpoint
    if method == "POST" and content_id and "/reject" in path:
        return reject_content(content_id, body, user_id)
    
    # Content edit and approve endpoint
    if method == "POST" and content_id and "/edit" in path:
        return edit_and_approve_content(content_id, body, user_id)
    
    # Get single content details
    if method == "GET" and content_id:
        return get_content_details(content_id)
    
    else:
        raise ValueError(f"Invalid moderation request: {method} {path}")


def get_pending_content(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List pending content awaiting moderation
    
    Args:
        query_params: Query parameters (page, limit, siteId, artifactId, contentType, language)
        
    Returns:
        Paginated list of pending content
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    site_id_filter = query_params.get("siteId")
    artifact_id_filter = query_params.get("artifactId")
    content_type_filter = query_params.get("contentType")
    language_filter = query_params.get("language")
    
    # Query using StatusIndex GSI
    query_params_db = {
        "IndexName": "StatusIndex",
        "KeyConditionExpression": "#status = :status",
        "ExpressionAttributeNames": {"#status": "status"},
        "ExpressionAttributeValues": {":status": "PENDING"},
        "ScanIndexForward": False,  # Sort by generatedAt descending
    }
    
    response = content_moderation_table.query(**query_params_db)
    items = response.get("Items", [])
    
    # Apply additional filters (client-side)
    if site_id_filter:
        items = [item for item in items if item.get("siteId") == site_id_filter]
    
    if artifact_id_filter:
        items = [item for item in items if item.get("artifactId") == artifact_id_filter]
    
    if content_type_filter:
        items = [item for item in items if item.get("contentType") == content_type_filter]
    
    if language_filter:
        items = [
            item for item in items
            if any(lang.get("code") == language_filter for lang in item.get("languages", []))
        ]
    
    # Sort by quality score (highest first) and auto-approval eligibility
    items.sort(
        key=lambda x: (
            x.get("autoApprovalEligible", False),
            x.get("qualityScore", 0)
        ),
        reverse=True
    )
    
    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return {
        "content": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_content_details(content_id: str) -> Dict[str, Any]:
    """
    Get detailed content information for review
    
    Args:
        content_id: Content ID
        
    Returns:
        Content details with all languages
    """
    response = content_moderation_table.get_item(Key={"contentId": content_id})
    
    if "Item" not in response:
        raise ValueError(f"Content not found: {content_id}")
    
    content = response["Item"]
    
    return {
        "content": json.loads(json.dumps(content, cls=DecimalEncoder))
    }


def approve_content(content_id: str, body: Dict[str, Any], reviewer_id: str) -> Dict[str, Any]:
    """
    Approve content for publication to mobile app
    
    Args:
        content_id: Content ID
        body: Request body (optional feedback)
        reviewer_id: User performing the approval
        
    Returns:
        Success message with published content info
    """
    # Get content
    response = content_moderation_table.get_item(Key={"contentId": content_id})
    
    if "Item" not in response:
        raise ValueError(f"Content not found: {content_id}")
    
    content = response["Item"]
    
    # Check if already approved or rejected
    if content.get("status") != "PENDING":
        raise ValueError(f"Content is not pending review: {content.get('status')}")
    
    # Update content status
    timestamp = datetime.utcnow().isoformat()
    feedback = body.get("feedback", "")
    
    content_moderation_table.update_item(
        Key={"contentId": content_id},
        UpdateExpression="SET #status = :status, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt, feedback = :feedback",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "APPROVED",
            ":reviewedBy": reviewer_id,
            ":reviewedAt": timestamp,
            ":feedback": feedback,
        },
    )
    
    # Update language statuses
    for lang in content.get("languages", []):
        lang["status"] = "APPROVED"
    
    # Publish content to ContentCache table for mobile app
    published_content = publish_to_content_cache(content)
    
    # Log audit trail
    log_audit_entry(
        user_id=reviewer_id,
        action="APPROVE_CONTENT",
        resource="ContentModeration",
        resource_id=content_id,
        after={"status": "APPROVED", "feedback": feedback},
    )
    
    return {
        "success": True,
        "message": "Content approved and published successfully",
        "contentId": content_id,
        "publishedContent": json.loads(json.dumps(published_content, cls=DecimalEncoder))
    }


def reject_content(content_id: str, body: Dict[str, Any], reviewer_id: str) -> Dict[str, Any]:
    """
    Reject content with feedback for quality improvement
    
    Args:
        content_id: Content ID
        body: Request body (required feedback)
        reviewer_id: User performing the rejection
        
    Returns:
        Success message
    """
    # Validate required fields
    if "feedback" not in body or not body["feedback"]:
        raise ValueError("Feedback is required when rejecting content")
    
    # Get content
    response = content_moderation_table.get_item(Key={"contentId": content_id})
    
    if "Item" not in response:
        raise ValueError(f"Content not found: {content_id}")
    
    content = response["Item"]
    
    # Check if already approved or rejected
    if content.get("status") != "PENDING":
        raise ValueError(f"Content is not pending review: {content.get('status')}")
    
    # Update content status
    timestamp = datetime.utcnow().isoformat()
    feedback = body["feedback"]
    
    content_moderation_table.update_item(
        Key={"contentId": content_id},
        UpdateExpression="SET #status = :status, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt, feedback = :feedback",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "REJECTED",
            ":reviewedBy": reviewer_id,
            ":reviewedAt": timestamp,
            ":feedback": feedback,
        },
    )
    
    # Update language statuses
    for lang in content.get("languages", []):
        lang["status"] = "REJECTED"
    
    # Log audit trail
    log_audit_entry(
        user_id=reviewer_id,
        action="REJECT_CONTENT",
        resource="ContentModeration",
        resource_id=content_id,
        after={"status": "REJECTED", "feedback": feedback},
    )
    
    return {
        "success": True,
        "message": "Content rejected with feedback",
        "contentId": content_id,
        "feedback": feedback
    }


def edit_and_approve_content(content_id: str, body: Dict[str, Any], reviewer_id: str) -> Dict[str, Any]:
    """
    Edit content and approve for publication
    
    Args:
        content_id: Content ID
        body: Request body (editedContent: Dict[language, content], optional feedback)
        reviewer_id: User performing the edit and approval
        
    Returns:
        Success message with updated content
    """
    # Validate required fields
    if "editedContent" not in body:
        raise ValueError("editedContent is required")
    
    edited_content = body["editedContent"]
    
    if not isinstance(edited_content, dict):
        raise ValueError("editedContent must be a dictionary mapping language codes to content")
    
    # Get content
    response = content_moderation_table.get_item(Key={"contentId": content_id})
    
    if "Item" not in response:
        raise ValueError(f"Content not found: {content_id}")
    
    content = response["Item"]
    
    # Check if already approved or rejected
    if content.get("status") != "PENDING":
        raise ValueError(f"Content is not pending review: {content.get('status')}")
    
    # Update language content with edited versions
    languages = content.get("languages", [])
    for lang in languages:
        lang_code = lang.get("code")
        if lang_code in edited_content:
            lang["content"] = edited_content[lang_code]
            lang["edited"] = True
        lang["status"] = "APPROVED"
    
    # Update content status
    timestamp = datetime.utcnow().isoformat()
    feedback = body.get("feedback", "Content edited and approved")
    
    content_moderation_table.update_item(
        Key={"contentId": content_id},
        UpdateExpression="SET #status = :status, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt, feedback = :feedback, languages = :languages",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "APPROVED",
            ":reviewedBy": reviewer_id,
            ":reviewedAt": timestamp,
            ":feedback": feedback,
            ":languages": languages,
        },
    )
    
    # Update content object for publishing
    content["languages"] = languages
    content["status"] = "APPROVED"
    
    # Publish edited content to ContentCache table
    published_content = publish_to_content_cache(content)
    
    # Log audit trail
    log_audit_entry(
        user_id=reviewer_id,
        action="EDIT_AND_APPROVE_CONTENT",
        resource="ContentModeration",
        resource_id=content_id,
        after={"status": "APPROVED", "edited": True, "feedback": feedback},
    )
    
    return {
        "success": True,
        "message": "Content edited and approved successfully",
        "contentId": content_id,
        "updatedContent": json.loads(json.dumps(content, cls=DecimalEncoder)),
        "publishedContent": json.loads(json.dumps(published_content, cls=DecimalEncoder))
    }


def get_moderation_stats() -> Dict[str, Any]:
    """
    Get moderation statistics
    
    Returns:
        Statistics including pending, approved, rejected counts and auto-approval rate
    """
    # Scan table to get all content (in production, this should use aggregated metrics)
    response = content_moderation_table.scan()
    items = response.get("Items", [])
    
    # Calculate statistics
    pending_count = sum(1 for item in items if item.get("status") == "PENDING")
    approved_count = sum(1 for item in items if item.get("status") == "APPROVED")
    rejected_count = sum(1 for item in items if item.get("status") == "REJECTED")
    
    # Calculate auto-approval rate (content with quality score > 0.9)
    auto_approval_eligible = sum(1 for item in items if item.get("autoApprovalEligible", False))
    auto_approval_rate = (auto_approval_eligible / len(items) * 100) if items else 0
    
    return {
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "total": len(items),
        "autoApprovalRate": round(auto_approval_rate, 2)
    }


def publish_to_content_cache(content: Dict[str, Any]) -> Dict[str, Any]:
    """
    Publish approved content to ContentCache table for mobile app consumption
    
    Args:
        content: Content to publish
        
    Returns:
        Published content info
    """
    artifact_id = content.get("artifactId")
    content_type = content.get("contentType")
    languages = content.get("languages", [])
    
    published_items = []
    
    # Publish each language version to ContentCache
    for lang in languages:
        lang_code = lang.get("code")
        lang_content = lang.get("content")
        audio_url = lang.get("audioUrl")
        
        # Create cache key: artifactId#language#contentType
        cache_key = f"{artifact_id}#{lang_code}#{content_type}"
        
        # Calculate TTL (30 days from now)
        import time
        ttl = int(time.time()) + (30 * 24 * 60 * 60)
        
        # Create cache item
        cache_item = {
            "cacheKey": cache_key,
            "content": lang_content,
            "ttl": ttl,
            "createdAt": datetime.utcnow().isoformat(),
            "metadata": {
                "artifactId": artifact_id,
                "siteId": content.get("siteId"),
                "contentType": content_type,
                "language": lang_code,
                "qualityScore": content.get("qualityScore"),
                "reviewedBy": content.get("reviewedBy"),
                "reviewedAt": content.get("reviewedAt"),
            }
        }
        
        if audio_url:
            cache_item["s3Url"] = audio_url
        
        # Save to ContentCache table
        content_cache_table.put_item(Item=cache_item)
        
        published_items.append({
            "cacheKey": cache_key,
            "language": lang_code,
            "contentType": content_type
        })
    
    return {
        "artifactId": artifact_id,
        "contentType": content_type,
        "publishedItems": published_items,
        "publishedAt": datetime.utcnow().isoformat()
    }


def log_audit_entry(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str,
    before: Optional[Any] = None,
    after: Optional[Any] = None,
) -> None:
    """
    Log audit trail entry
    
    Args:
        user_id: User performing the action
        action: Action performed
        resource: Resource type
        resource_id: Resource ID
        before: Before value (for updates)
        after: After value (for updates)
    """
    try:
        # Generate audit ID
        audit_id = f"{int(datetime.utcnow().timestamp() * 1000)}-{user_id[:8]}"
        timestamp = datetime.utcnow().isoformat()
        
        # Create audit log entry
        audit_entry = {
            "auditId": audit_id,
            "timestamp": timestamp,
            "userId": user_id,
            "action": action,
            "resource": resource,
            "resourceId": resource_id,
            "success": True,
        }
        
        if before is not None:
            audit_entry["before"] = before
        
        if after is not None:
            audit_entry["after"] = after
        
        # Set TTL (365 days retention)
        import time
        ttl = int(time.time()) + (365 * 24 * 60 * 60)
        audit_entry["ttl"] = ttl
        
        # Save to audit log table
        audit_log_table.put_item(Item=audit_entry)
        
    except Exception as e:
        print(f"Error logging audit entry: {str(e)}")
        # Don't fail the operation if audit logging fails
