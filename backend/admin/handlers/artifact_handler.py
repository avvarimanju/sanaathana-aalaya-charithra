"""
Artifact Management Handler

Handles CRUD operations for artifacts including QR code generation.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
import uuid
from decimal import Decimal
import qrcode
from io import BytesIO
import base64

# AWS clients
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")
artifacts_table = dynamodb.Table("SanaathanaAalayaCharithra-Artifacts")
heritage_sites_table = dynamodb.Table("SanaathanaAalayaCharithra-HeritageSites")

# S3 bucket name
S3_BUCKET = os.environ.get("CONTENT_BUCKET", "sanaathana-aalaya-charithra-content")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_artifact_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route artifact management requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID
        
    Returns:
        Response data
    """
    # Extract artifactId from path if present
    path_parts = path.split("/")
    artifact_id = path_parts[3] if len(path_parts) > 3 and path_parts[3] not in ["bulk-delete"] else None
    
    # Bulk operations
    if method == "POST" and "/bulk-delete" in path:
        return handle_bulk_delete(body, user_id)
    
    # Media upload
    if method == "POST" and artifact_id and "/media" in path:
        return handle_artifact_media_upload(artifact_id, body, user_id)
    
    # QR code download
    if method == "GET" and artifact_id and "/qr-code" in path:
        return handle_qr_code_download(artifact_id, query_params)
    
    # Standard CRUD operations
    if method == "GET" and not artifact_id:
        # List artifacts
        return list_artifacts(query_params)
    
    elif method == "GET" and artifact_id:
        # Get single artifact
        return get_artifact(artifact_id)
    
    elif method == "POST":
        # Create artifact
        return create_artifact(body, user_id)
    
    elif method == "PUT" and artifact_id:
        # Update artifact
        return update_artifact(artifact_id, body, user_id)
    
    elif method == "DELETE" and artifact_id:
        # Delete artifact (soft delete)
        return delete_artifact(artifact_id, user_id)
    
    else:
        raise ValueError(f"Invalid artifact request: {method} {path}")


def list_artifacts(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List artifacts with pagination, search, and filters
    
    Args:
        query_params: Query parameters (page, limit, search, siteId, status)
        
    Returns:
        Paginated list of artifacts
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    search = query_params.get("search", "").lower()
    site_id_filter = query_params.get("siteId")
    status_filter = query_params.get("status")
    sort_by = query_params.get("sortBy", "name")
    sort_order = query_params.get("sortOrder", "asc")
    
    # Scan table (TODO: optimize with GSI for large datasets)
    scan_params = {}
    
    # Add filter expressions
    filter_expressions = []
    expression_values = {}
    expression_names = {}
    
    if site_id_filter:
        filter_expressions.append("siteId = :siteId")
        expression_values[":siteId"] = site_id_filter
    
    if status_filter:
        filter_expressions.append("#status = :status")
        expression_values[":status"] = status_filter
        expression_names["#status"] = "status"
    
    # Exclude deleted artifacts
    filter_expressions.append("attribute_not_exists(deleted) OR deleted = :false")
    expression_values[":false"] = False
    
    if filter_expressions:
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
        if expression_names:
            scan_params["ExpressionAttributeNames"] = expression_names
    
    response = artifacts_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Apply search filter (client-side for now)
    if search:
        items = [
            item for item in items
            if search in item.get("artifactName", "").lower()
            or search in item.get("description", "").lower()
        ]
    
    # Sort
    reverse = sort_order == "desc"
    if sort_by == "name":
        items.sort(key=lambda x: x.get("artifactName", ""), reverse=reverse)
    elif sort_by == "createdAt":
        items.sort(key=lambda x: x.get("createdAt", ""), reverse=reverse)
    elif sort_by == "updatedAt":
        items.sort(key=lambda x: x.get("updatedAt", ""), reverse=reverse)
    
    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return {
        "artifacts": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_artifact(artifact_id: str) -> Dict[str, Any]:
    """
    Get single artifact by ID
    
    Args:
        artifact_id: Artifact ID
        
    Returns:
        Artifact data
    """
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    
    if "Item" not in response:
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    item = response["Item"]
    
    # Check if deleted
    if item.get("deleted", False):
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    return {"artifact": json.loads(json.dumps(item, cls=DecimalEncoder))}


def generate_qr_code(artifact_id: str) -> tuple[str, str]:
    """
    Generate QR code for artifact
    
    Args:
        artifact_id: Artifact ID
        
    Returns:
        Tuple of (qr_code_identifier, s3_url)
    """
    # Generate unique QR code identifier
    qr_code_id = f"QR-{artifact_id[:8]}-{uuid.uuid4().hex[:8].upper()}"
    
    # Create QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_code_id)
    qr.make(fit=True)
    
    # Generate PNG image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    # Upload to S3
    s3_key = f"artifacts/{artifact_id}/qr-codes/{qr_code_id}.png"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=buffer.getvalue(),
        ContentType="image/png",
    )
    
    # Generate S3 URL
    s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
    
    return qr_code_id, s3_url


def create_artifact(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Create new artifact with QR code generation
    
    Args:
        body: Artifact data
        user_id: User creating the artifact
        
    Returns:
        Created artifact data with QR code
    """
    # Validate required fields
    required_fields = ["artifactName", "siteId", "description"]
    for field in required_fields:
        if not body.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Validate temple exists
    site_id = body["siteId"]
    temple_response = heritage_sites_table.get_item(Key={"siteId": site_id})
    if "Item" not in temple_response or temple_response["Item"].get("deleted", False):
        raise ValueError(f"Temple not found: {site_id}")
    
    # Generate artifact ID
    artifact_id = str(uuid.uuid4())
    
    # Generate QR code
    qr_code_id, qr_code_url = generate_qr_code(artifact_id)
    
    # Create artifact item
    timestamp = datetime.utcnow().isoformat()
    artifact = {
        "artifactId": artifact_id,
        "siteId": site_id,
        "artifactName": body["artifactName"],
        "description": body["description"],
        "qrCode": qr_code_id,
        "qrCodeUrl": qr_code_url,
        "media": {
            "images": body.get("images", []),
            "videos": body.get("videos", []),
        },
        "content": {
            "hasTextContent": False,
            "hasAudioGuide": False,
            "hasQA": False,
            "hasInfographic": False,
            "languages": [],
        },
        "status": body.get("status", "ACTIVE"),
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "createdBy": user_id,
        "deleted": False,
    }
    
    # Add optional fields
    if "category" in body:
        artifact["category"] = body["category"]
    if "historicalPeriod" in body:
        artifact["historicalPeriod"] = body["historicalPeriod"]
    
    # Save to DynamoDB
    artifacts_table.put_item(Item=artifact)
    
    return {
        "artifact": json.loads(json.dumps(artifact, cls=DecimalEncoder)),
        "qrCodeUrl": qr_code_url,
        "message": "Artifact created successfully with QR code"
    }


def update_artifact(artifact_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Update existing artifact
    
    Args:
        artifact_id: Artifact ID
        body: Updated artifact data
        user_id: User updating the artifact
        
    Returns:
        Updated artifact data
    """
    # Get existing artifact
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    
    if "Item" not in response:
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    existing = response["Item"]
    
    # Check if deleted
    if existing.get("deleted", False):
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    # Build update expression
    update_expr = "SET updatedAt = :updatedAt, updatedBy = :updatedBy"
    expr_values = {
        ":updatedAt": datetime.utcnow().isoformat(),
        ":updatedBy": user_id,
    }
    expr_names = {}
    
    # Update allowed fields
    updatable_fields = [
        "artifactName", "description", "media", "content", "status",
        "category", "historicalPeriod"
    ]
    
    for field in updatable_fields:
        if field in body:
            # Handle reserved keywords
            if field == "status":
                update_expr += f", #status = :status"
                expr_names["#status"] = "status"
                expr_values[":status"] = body[field]
            else:
                update_expr += f", {field} = :{field}"
                expr_values[f":{field}"] = body[field]
    
    # Update item
    update_params = {
        "Key": {"artifactId": artifact_id},
        "UpdateExpression": update_expr,
        "ExpressionAttributeValues": expr_values,
    }
    if expr_names:
        update_params["ExpressionAttributeNames"] = expr_names
    
    artifacts_table.update_item(**update_params)
    
    # Invalidate content cache for this artifact
    invalidate_content_cache(artifact_id)
    
    # Get updated item
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    updated = response["Item"]
    
    return {
        "artifact": json.loads(json.dumps(updated, cls=DecimalEncoder)),
        "message": "Artifact updated successfully"
    }


def delete_artifact(artifact_id: str, user_id: str) -> Dict[str, Any]:
    """
    Delete artifact (soft delete)
    
    Args:
        artifact_id: Artifact ID
        user_id: User deleting the artifact
        
    Returns:
        Success message
    """
    # Get existing artifact
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    
    if "Item" not in response:
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    existing = response["Item"]
    
    # Check if already deleted
    if existing.get("deleted", False):
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    # Soft delete
    artifacts_table.update_item(
        Key={"artifactId": artifact_id},
        UpdateExpression="SET deleted = :true, deletedAt = :deletedAt, deletedBy = :deletedBy",
        ExpressionAttributeValues={
            ":true": True,
            ":deletedAt": datetime.utcnow().isoformat(),
            ":deletedBy": user_id,
        },
    )
    
    # Invalidate content cache
    invalidate_content_cache(artifact_id)
    
    return {
        "message": "Artifact deleted successfully",
        "artifactId": artifact_id
    }


def handle_artifact_media_upload(artifact_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle artifact media upload (images/videos)
    
    Args:
        artifact_id: Artifact ID
        body: Upload data (base64 media or S3 key)
        user_id: User uploading the media
        
    Returns:
        S3 URL of uploaded media
    """
    # Validate artifact exists
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    if "Item" not in response or response["Item"].get("deleted", False):
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    artifact = response["Item"]
    
    # Determine media type
    media_type = body.get("mediaType", "image")  # "image" or "video"
    file_extension = body.get("fileExtension", "jpg")
    
    # Generate S3 key
    media_id = str(uuid.uuid4())
    if media_type == "image":
        s3_key = f"artifacts/{artifact_id}/images/{media_id}.{file_extension}"
        content_type = f"image/{file_extension}"
        max_size = 10 * 1024 * 1024  # 10MB
    else:
        s3_key = f"artifacts/{artifact_id}/videos/{media_id}.{file_extension}"
        content_type = f"video/{file_extension}"
        max_size = 100 * 1024 * 1024  # 100MB
    
    # Upload to S3
    if "base64Data" in body:
        # Decode base64 and upload
        media_data = base64.b64decode(body["base64Data"])
        
        # Validate file size
        if len(media_data) > max_size:
            raise ValueError(f"Media size exceeds {max_size / (1024 * 1024)}MB limit")
        
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=media_data,
            ContentType=content_type,
        )
    else:
        raise ValueError("Missing base64Data in request body")
    
    # Generate S3 URL
    s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
    
    # Update artifact media array
    media = artifact.get("media", {"images": [], "videos": []})
    if media_type == "image":
        images = media.get("images", [])
        images.append(s3_url)
        media["images"] = images
    else:
        videos = media.get("videos", [])
        videos.append(s3_url)
        media["videos"] = videos
    
    artifacts_table.update_item(
        Key={"artifactId": artifact_id},
        UpdateExpression="SET media = :media, updatedAt = :updatedAt, updatedBy = :updatedBy",
        ExpressionAttributeValues={
            ":media": media,
            ":updatedAt": datetime.utcnow().isoformat(),
            ":updatedBy": user_id,
        },
    )
    
    return {
        "mediaUrl": s3_url,
        "mediaType": media_type,
        "message": f"{media_type.capitalize()} uploaded successfully"
    }


def handle_qr_code_download(artifact_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle QR code download in various formats
    
    Args:
        artifact_id: Artifact ID
        query_params: Query parameters (format, size)
        
    Returns:
        QR code data or download URL
    """
    # Get artifact
    response = artifacts_table.get_item(Key={"artifactId": artifact_id})
    if "Item" not in response or response["Item"].get("deleted", False):
        raise ValueError(f"Artifact not found: {artifact_id}")
    
    artifact = response["Item"]
    qr_code_id = artifact.get("qrCode")
    
    if not qr_code_id:
        raise ValueError(f"QR code not found for artifact: {artifact_id}")
    
    # Parse parameters
    format_type = query_params.get("format", "PNG").upper()
    size = int(query_params.get("size", "300"))
    
    # Generate QR code in requested format
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=size // 30,  # Adjust box size based on requested size
        border=4,
    )
    qr.add_data(qr_code_id)
    qr.make(fit=True)
    
    if format_type == "PNG":
        # Generate PNG
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Return base64 encoded image
        base64_data = base64.b64encode(buffer.getvalue()).decode()
        return {
            "format": "PNG",
            "base64Data": base64_data,
            "qrCode": qr_code_id,
        }
    
    elif format_type == "SVG":
        # Generate SVG
        import qrcode.image.svg
        factory = qrcode.image.svg.SvgPathImage
        img = qrcode.make(qr_code_id, image_factory=factory)
        buffer = BytesIO()
        img.save(buffer)
        buffer.seek(0)
        
        svg_data = buffer.getvalue().decode()
        return {
            "format": "SVG",
            "svgData": svg_data,
            "qrCode": qr_code_id,
        }
    
    elif format_type == "PDF":
        # For PDF, return the existing PNG URL
        # PDF generation would require additional libraries like reportlab
        return {
            "format": "PDF",
            "message": "PDF format not yet implemented. Use PNG or SVG.",
            "pngUrl": artifact.get("qrCodeUrl"),
            "qrCode": qr_code_id,
        }
    
    else:
        raise ValueError(f"Unsupported format: {format_type}")


def handle_bulk_delete(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle bulk delete of artifacts
    
    Args:
        body: Request body with artifactIds array
        user_id: User performing bulk delete
        
    Returns:
        Bulk operation results
    """
    artifact_ids = body.get("artifactIds", [])
    
    if not artifact_ids:
        raise ValueError("Missing artifactIds in request body")
    
    if len(artifact_ids) > 100:
        raise ValueError("Cannot delete more than 100 artifacts at once")
    
    results = {
        "success": [],
        "failed": [],
        "total": len(artifact_ids),
    }
    
    for artifact_id in artifact_ids:
        try:
            delete_artifact(artifact_id, user_id)
            results["success"].append(artifact_id)
        except Exception as e:
            results["failed"].append({
                "artifactId": artifact_id,
                "error": str(e)
            })
    
    return {
        "results": results,
        "message": f"Bulk delete completed: {len(results['success'])} succeeded, {len(results['failed'])} failed"
    }


def invalidate_content_cache(artifact_id: str) -> None:
    """
    Invalidate content cache for artifact
    
    Args:
        artifact_id: Artifact ID
    """
    try:
        # Get ContentCache table
        content_cache_table = dynamodb.Table("SanaathanaAalayaCharithra-ContentCache")
        
        # Query all cache entries for this artifact
        # Cache key format: artifactId#language#contentType
        response = content_cache_table.scan(
            FilterExpression="begins_with(cacheKey, :prefix)",
            ExpressionAttributeValues={":prefix": f"{artifact_id}#"}
        )
        
        # Delete cache entries
        for item in response.get("Items", []):
            content_cache_table.delete_item(Key={"cacheKey": item["cacheKey"]})
        
        print(f"Invalidated {len(response.get('Items', []))} cache entries for artifact {artifact_id}")
        
    except Exception as e:
        print(f"Error invalidating content cache: {str(e)}")
        # Don't fail the request if cache invalidation fails
