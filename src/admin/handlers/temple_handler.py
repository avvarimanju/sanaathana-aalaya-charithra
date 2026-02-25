"""
Temple Management Handler

Handles CRUD operations for temples (heritage sites).
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
import uuid
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource("dynamodb")
heritage_sites_table = dynamodb.Table("SanaathanaAalayaCharithra-HeritageSites")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_temple_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route temple management requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID
        
    Returns:
        Response data
    """
    # Extract siteId from path if present
    path_parts = path.split("/")
    site_id = path_parts[3] if len(path_parts) > 3 and path_parts[3] not in ["bulk-delete", "bulk-update"] else None
    
    # Bulk operations
    if method == "POST" and "/bulk-delete" in path:
        return handle_bulk_delete(body, user_id)
    
    if method == "POST" and "/bulk-update" in path:
        return handle_bulk_update(body, user_id)
    
    # Image upload
    if method == "POST" and site_id and "/images" in path:
        return handle_temple_image_upload(site_id, body, user_id)
    
    # Standard CRUD operations
    if method == "GET" and not site_id:
        # List temples
        return list_temples(query_params)
    
    elif method == "GET" and site_id:
        # Get single temple
        return get_temple(site_id)
    
    elif method == "POST":
        # Create temple
        return create_temple(body, user_id)
    
    elif method == "PUT" and site_id:
        # Update temple
        return update_temple(site_id, body, user_id)
    
    elif method == "DELETE" and site_id:
        # Delete temple (soft delete)
        return delete_temple(site_id, user_id)
    
    else:
        raise ValueError(f"Invalid temple request: {method} {path}")


def list_temples(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List temples with pagination, search, and filters
    
    Args:
        query_params: Query parameters (page, limit, search, state, status)
        
    Returns:
        Paginated list of temples
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    search = query_params.get("search", "").lower()
    state_filter = query_params.get("state")
    status_filter = query_params.get("status")
    
    # Scan table (TODO: optimize with GSI for large datasets)
    scan_params = {}
    
    # Add filter expressions
    filter_expressions = []
    expression_values = {}
    
    if state_filter:
        filter_expressions.append("stateLocation = :state")
        expression_values[":state"] = state_filter
    
    if status_filter:
        filter_expressions.append("#status = :status")
        expression_values[":status"] = status_filter
        scan_params["ExpressionAttributeNames"] = {"#status": "status"}
    
    # Exclude deleted temples
    filter_expressions.append("attribute_not_exists(deleted) OR deleted = :false")
    expression_values[":false"] = False
    
    if filter_expressions:
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
    
    response = heritage_sites_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Apply search filter (client-side for now)
    if search:
        items = [
            item for item in items
            if search in item.get("siteName", "").lower()
            or search in item.get("description", "").lower()
        ]
    
    # Sort by name
    items.sort(key=lambda x: x.get("siteName", ""))
    
    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return {
        "temples": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_temple(site_id: str) -> Dict[str, Any]:
    """
    Get single temple by ID
    
    Args:
        site_id: Temple site ID
        
    Returns:
        Temple data
    """
    response = heritage_sites_table.get_item(Key={"siteId": site_id})
    
    if "Item" not in response:
        raise ValueError(f"Temple not found: {site_id}")
    
    item = response["Item"]
    
    # Check if deleted
    if item.get("deleted", False):
        raise ValueError(f"Temple not found: {site_id}")
    
    return {"temple": json.loads(json.dumps(item, cls=DecimalEncoder))}


def create_temple(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Create new temple
    
    Args:
        body: Temple data
        user_id: User creating the temple
        
    Returns:
        Created temple data
    """
    # Validate required fields
    required_fields = ["siteName", "stateLocation", "description"]
    for field in required_fields:
        if not body.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Generate site ID
    site_id = str(uuid.uuid4())
    
    # Create temple item
    timestamp = datetime.utcnow().isoformat()
    temple = {
        "siteId": site_id,
        "siteName": body["siteName"],
        "stateLocation": body["stateLocation"],
        "description": body["description"],
        "latitude": body.get("latitude"),
        "longitude": body.get("longitude"),
        "images": body.get("images", []),
        "status": body.get("status", "ACTIVE"),
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "createdBy": user_id,
        "deleted": False,
    }
    
    # Add optional fields
    optional_fields = ["city", "district", "pincode", "website", "contactInfo"]
    for field in optional_fields:
        if field in body:
            temple[field] = body[field]
    
    # Save to DynamoDB
    heritage_sites_table.put_item(Item=temple)
    
    return {
        "temple": json.loads(json.dumps(temple, cls=DecimalEncoder)),
        "message": "Temple created successfully"
    }


def update_temple(site_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Update existing temple
    
    Args:
        site_id: Temple site ID
        body: Updated temple data
        user_id: User updating the temple
        
    Returns:
        Updated temple data
    """
    # Get existing temple
    response = heritage_sites_table.get_item(Key={"siteId": site_id})
    
    if "Item" not in response:
        raise ValueError(f"Temple not found: {site_id}")
    
    existing = response["Item"]
    
    # Check if deleted
    if existing.get("deleted", False):
        raise ValueError(f"Temple not found: {site_id}")
    
    # Build update expression
    update_expr = "SET updatedAt = :updatedAt, updatedBy = :updatedBy"
    expr_values = {
        ":updatedAt": datetime.utcnow().isoformat(),
        ":updatedBy": user_id,
    }
    
    # Update allowed fields
    updatable_fields = [
        "siteName", "stateLocation", "description", "latitude", "longitude",
        "images", "status", "city", "district", "pincode", "website", "contactInfo"
    ]
    
    for field in updatable_fields:
        if field in body:
            update_expr += f", {field} = :{field}"
            expr_values[f":{field}"] = body[field]
    
    # Update item
    heritage_sites_table.update_item(
        Key={"siteId": site_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
    )
    
    # Get updated item
    response = heritage_sites_table.get_item(Key={"siteId": site_id})
    updated = response["Item"]
    
    return {
        "temple": json.loads(json.dumps(updated, cls=DecimalEncoder)),
        "message": "Temple updated successfully"
    }


def delete_temple(site_id: str, user_id: str) -> Dict[str, Any]:
    """
    Delete temple (soft delete)
    
    Args:
        site_id: Temple site ID
        user_id: User deleting the temple
        
    Returns:
        Success message
    """
    # Get existing temple
    response = heritage_sites_table.get_item(Key={"siteId": site_id})
    
    if "Item" not in response:
        raise ValueError(f"Temple not found: {site_id}")
    
    existing = response["Item"]
    
    # Check if already deleted
    if existing.get("deleted", False):
        raise ValueError(f"Temple not found: {site_id}")
    
    # Soft delete
    heritage_sites_table.update_item(
        Key={"siteId": site_id},
        UpdateExpression="SET deleted = :true, deletedAt = :deletedAt, deletedBy = :deletedBy",
        ExpressionAttributeValues={
            ":true": True,
            ":deletedAt": datetime.utcnow().isoformat(),
            ":deletedBy": user_id,
        },
    )
    
    return {
        "message": "Temple deleted successfully",
        "siteId": site_id
    }



def handle_temple_image_upload(site_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle temple image upload
    
    Args:
        site_id: Temple site ID
        body: Upload data (base64 image or S3 key)
        user_id: User uploading the image
        
    Returns:
        S3 URL of uploaded image
    """
    import base64
    
    s3 = boto3.client("s3")
    bucket_name = "sanaathana-aalaya-charithra-content"
    
    # Validate temple exists
    response = heritage_sites_table.get_item(Key={"siteId": site_id})
    if "Item" not in response or response["Item"].get("deleted", False):
        raise ValueError(f"Temple not found: {site_id}")
    
    # Generate S3 key
    image_id = str(uuid.uuid4())
    file_extension = body.get("fileExtension", "jpg")
    s3_key = f"temples/{site_id}/{image_id}.{file_extension}"
    
    # Upload to S3
    if "base64Data" in body:
        # Decode base64 and upload
        image_data = base64.b64decode(body["base64Data"])
        
        # Validate file size (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            raise ValueError("Image size exceeds 10MB limit")
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=image_data,
            ContentType=f"image/{file_extension}",
        )
    else:
        raise ValueError("Missing base64Data in request body")
    
    # Generate S3 URL
    s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
    
    # Update temple images array
    temple = response["Item"]
    images = temple.get("images", [])
    images.append(s3_url)
    
    heritage_sites_table.update_item(
        Key={"siteId": site_id},
        UpdateExpression="SET images = :images, updatedAt = :updatedAt, updatedBy = :updatedBy",
        ExpressionAttributeValues={
            ":images": images,
            ":updatedAt": datetime.utcnow().isoformat(),
            ":updatedBy": user_id,
        },
    )
    
    return {
        "imageUrl": s3_url,
        "message": "Image uploaded successfully"
    }


def handle_bulk_delete(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle bulk delete of temples
    
    Args:
        body: Request body with siteIds array
        user_id: User performing bulk delete
        
    Returns:
        Bulk operation results
    """
    site_ids = body.get("siteIds", [])
    
    if not site_ids:
        raise ValueError("Missing siteIds in request body")
    
    if len(site_ids) > 100:
        raise ValueError("Cannot delete more than 100 temples at once")
    
    results = {
        "success": [],
        "failed": [],
        "total": len(site_ids),
    }
    
    for site_id in site_ids:
        try:
            delete_temple(site_id, user_id)
            results["success"].append(site_id)
        except Exception as e:
            results["failed"].append({
                "siteId": site_id,
                "error": str(e)
            })
    
    return {
        "results": results,
        "message": f"Bulk delete completed: {len(results['success'])} succeeded, {len(results['failed'])} failed"
    }


def handle_bulk_update(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Handle bulk update of temples
    
    Args:
        body: Request body with siteIds array and updates object
        user_id: User performing bulk update
        
    Returns:
        Bulk operation results
    """
    site_ids = body.get("siteIds", [])
    updates = body.get("updates", {})
    
    if not site_ids:
        raise ValueError("Missing siteIds in request body")
    
    if not updates:
        raise ValueError("Missing updates in request body")
    
    if len(site_ids) > 100:
        raise ValueError("Cannot update more than 100 temples at once")
    
    results = {
        "success": [],
        "failed": [],
        "total": len(site_ids),
    }
    
    for site_id in site_ids:
        try:
            update_temple(site_id, updates, user_id)
            results["success"].append(site_id)
        except Exception as e:
            results["failed"].append({
                "siteId": site_id,
                "error": str(e)
            })
    
    return {
        "results": results,
        "message": f"Bulk update completed: {len(results['success'])} succeeded, {len(results['failed'])} failed"
    }
