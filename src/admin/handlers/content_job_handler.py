"""
Content Job Monitoring Handler

Handles monitoring and management of content generation jobs.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
from decimal import Decimal
from collections import defaultdict

# AWS clients
dynamodb = boto3.resource("dynamodb")
lambda_client = boto3.client("lambda")
progress_table = dynamodb.Table("SanaathanaAalayaCharithra-PreGenerationProgress")
artifacts_table = dynamodb.Table("SanaathanaAalayaCharithra-Artifacts")
heritage_sites_table = dynamodb.Table("SanaathanaAalayaCharithra-HeritageSites")

# Environment variables
PRE_GENERATION_LAMBDA_NAME = os.environ.get("PRE_GENERATION_LAMBDA_NAME", "PreGenerationLambda")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_content_job_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route content job monitoring requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID
        
    Returns:
        Response data
    """
    # Extract jobId from path if present
    path_parts = path.split("/")
    job_id = None
    action = None
    
    # Parse path: /admin/content-jobs/{jobId}/{action}
    if len(path_parts) > 3 and path_parts[3] not in ["stats"]:
        job_id = path_parts[3]
        if len(path_parts) > 4:
            action = path_parts[4]
    
    # Job statistics
    if method == "GET" and "/stats" in path:
        return get_job_stats()
    
    # Job actions (retry, cancel)
    if method == "POST" and job_id and action == "retry":
        return retry_job(job_id, user_id)
    
    if method == "POST" and job_id and action == "cancel":
        return cancel_job(job_id, user_id)
    
    # Standard operations
    if method == "GET" and not job_id:
        # List jobs
        return list_jobs(query_params)
    
    elif method == "GET" and job_id:
        # Get single job with logs
        return get_job_details(job_id)
    
    else:
        raise ValueError(f"Invalid content job request: {method} {path}")


def list_jobs(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List content generation jobs with pagination and filters
    
    Args:
        query_params: Query parameters (page, limit, status, dateRange, siteId, artifactId, contentType)
        
    Returns:
        Paginated list of jobs
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    status_filter = query_params.get("status")  # Can be comma-separated
    site_id_filter = query_params.get("siteId")
    artifact_id_filter = query_params.get("artifactId")
    content_type_filter = query_params.get("contentType")  # Can be comma-separated
    
    # Parse date range (format: start,end)
    date_range_str = query_params.get("dateRange")
    date_start = None
    date_end = None
    if date_range_str:
        parts = date_range_str.split(",")
        if len(parts) == 2:
            date_start = parts[0]
            date_end = parts[1]
    
    # Scan table (TODO: optimize with GSI for large datasets)
    scan_params = {}
    
    # Add filter expressions
    filter_expressions = []
    expression_values = {}
    expression_names = {}
    
    if status_filter:
        # Support multiple statuses
        statuses = [s.strip() for s in status_filter.split(",")]
        if len(statuses) == 1:
            filter_expressions.append("#status = :status")
            expression_values[":status"] = statuses[0]
        else:
            status_conditions = []
            for i, status in enumerate(statuses):
                status_conditions.append(f"#status = :status{i}")
                expression_values[f":status{i}"] = status
            filter_expressions.append(f"({' OR '.join(status_conditions)})")
        expression_names["#status"] = "status"
    
    if artifact_id_filter:
        filter_expressions.append("contains(itemKey, :artifactId)")
        expression_values[":artifactId"] = artifact_id_filter
    
    if content_type_filter:
        # Support multiple content types
        content_types = [ct.strip() for ct in content_type_filter.split(",")]
        if len(content_types) == 1:
            filter_expressions.append("contains(itemKey, :contentType)")
            expression_values[":contentType"] = content_types[0]
        else:
            ct_conditions = []
            for i, ct in enumerate(content_types):
                ct_conditions.append(f"contains(itemKey, :contentType{i})")
                expression_values[f":contentType{i}"] = ct
            filter_expressions.append(f"({' OR '.join(ct_conditions)})")
    
    if date_start:
        filter_expressions.append("startTime >= :dateStart")
        expression_values[":dateStart"] = date_start
    
    if date_end:
        filter_expressions.append("startTime <= :dateEnd")
        expression_values[":dateEnd"] = date_end
    
    if filter_expressions:
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
        if expression_names:
            scan_params["ExpressionAttributeNames"] = expression_names
    
    response = progress_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Enrich items with artifact and temple names
    enriched_items = []
    for item in items:
        enriched_item = enrich_job_item(item)
        
        # Apply siteId filter (after enrichment)
        if site_id_filter and enriched_item.get("siteId") != site_id_filter:
            continue
        
        enriched_items.append(enriched_item)
    
    # Sort by startTime (most recent first)
    enriched_items.sort(key=lambda x: x.get("startTime", ""), reverse=True)
    
    # Paginate
    total = len(enriched_items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = enriched_items[start:end]
    
    return {
        "jobs": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_job_details(job_id: str) -> Dict[str, Any]:
    """
    Get detailed job information with logs
    
    Args:
        job_id: Job ID
        
    Returns:
        Job details with logs
    """
    # Query all items for this job
    response = progress_table.query(
        KeyConditionExpression="jobId = :jobId",
        ExpressionAttributeValues={":jobId": job_id}
    )
    
    items = response.get("Items", [])
    
    if not items:
        raise ValueError(f"Job not found: {job_id}")
    
    # Enrich items
    enriched_items = [enrich_job_item(item) for item in items]
    
    # Calculate job summary
    total_items = len(enriched_items)
    completed = sum(1 for item in enriched_items if item.get("status") == "COMPLETED")
    failed = sum(1 for item in enriched_items if item.get("status") == "FAILED")
    in_progress = sum(1 for item in enriched_items if item.get("status") == "IN_PROGRESS")
    pending = sum(1 for item in enriched_items if item.get("status") == "PENDING")
    
    # Calculate duration for completed items
    durations = []
    for item in enriched_items:
        if item.get("startTime") and item.get("completionTime"):
            try:
                start = datetime.fromisoformat(item["startTime"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(item["completionTime"].replace("Z", "+00:00"))
                duration = (end - start).total_seconds() * 1000  # milliseconds
                durations.append(duration)
            except:
                pass
    
    avg_duration = sum(durations) / len(durations) if durations else None
    
    # Get logs (error messages from failed items)
    logs = []
    for item in enriched_items:
        if item.get("error"):
            logs.append({
                "timestamp": item.get("completionTime") or item.get("startTime"),
                "level": "ERROR",
                "message": item["error"].get("message", "Unknown error"),
                "itemKey": item.get("itemKey"),
                "artifactId": item.get("artifactId"),
                "language": item.get("language"),
                "contentType": item.get("contentType"),
            })
    
    return {
        "job": {
            "jobId": job_id,
            "summary": {
                "total": total_items,
                "completed": completed,
                "failed": failed,
                "inProgress": in_progress,
                "pending": pending,
                "successRate": (completed / total_items * 100) if total_items > 0 else 0,
                "averageDuration": avg_duration,
            },
            "items": json.loads(json.dumps(enriched_items, cls=DecimalEncoder)),
        },
        "logs": logs,
    }


def retry_job(job_id: str, user_id: str) -> Dict[str, Any]:
    """
    Retry a failed job by invoking PreGenerationLambda
    
    Args:
        job_id: Job ID to retry
        user_id: User requesting retry
        
    Returns:
        New job information
    """
    # Query all failed items for this job
    response = progress_table.query(
        KeyConditionExpression="jobId = :jobId",
        FilterExpression="#status = :failed",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":jobId": job_id,
            ":failed": "FAILED"
        }
    )
    
    failed_items = response.get("Items", [])
    
    if not failed_items:
        raise ValueError(f"No failed items found for job: {job_id}")
    
    # Generate new job ID
    new_job_id = f"retry-{job_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Extract artifact IDs and languages from failed items
    artifacts_to_retry = []
    for item in failed_items:
        # Parse itemKey: artifactId#language#contentType
        parts = item.get("itemKey", "").split("#")
        if len(parts) >= 2:
            artifact_id = parts[0]
            language = parts[1]
            
            # Check if already in list
            existing = next((a for a in artifacts_to_retry if a["artifactId"] == artifact_id), None)
            if existing:
                if language not in existing["languages"]:
                    existing["languages"].append(language)
            else:
                artifacts_to_retry.append({
                    "artifactId": artifact_id,
                    "languages": [language]
                })
    
    # Invoke PreGenerationLambda with retry payload
    payload = {
        "jobId": new_job_id,
        "artifacts": artifacts_to_retry,
        "retryOf": job_id,
        "requestedBy": user_id,
    }
    
    try:
        lambda_client.invoke(
            FunctionName=PRE_GENERATION_LAMBDA_NAME,
            InvocationType="Event",  # Async invocation
            Payload=json.dumps(payload)
        )
    except Exception as e:
        raise ValueError(f"Failed to invoke PreGenerationLambda: {str(e)}")
    
    return {
        "newJobId": new_job_id,
        "originalJobId": job_id,
        "itemsToRetry": len(failed_items),
        "message": f"Retry job initiated with {len(failed_items)} items"
    }


def cancel_job(job_id: str, user_id: str) -> Dict[str, Any]:
    """
    Cancel an in-progress job by updating status
    
    Args:
        job_id: Job ID to cancel
        user_id: User requesting cancellation
        
    Returns:
        Cancellation result
    """
    # Query all in-progress items for this job
    response = progress_table.query(
        KeyConditionExpression="jobId = :jobId",
        FilterExpression="#status = :inProgress",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":jobId": job_id,
            ":inProgress": "IN_PROGRESS"
        }
    )
    
    in_progress_items = response.get("Items", [])
    
    if not in_progress_items:
        raise ValueError(f"No in-progress items found for job: {job_id}")
    
    # Update status to FAILED with cancellation message
    cancelled_count = 0
    for item in in_progress_items:
        try:
            progress_table.update_item(
                Key={
                    "jobId": job_id,
                    "itemKey": item["itemKey"]
                },
                UpdateExpression="SET #status = :cancelled, completionTime = :now, #error = :error",
                ExpressionAttributeNames={
                    "#status": "status",
                    "#error": "error"
                },
                ExpressionAttributeValues={
                    ":cancelled": "FAILED",
                    ":now": datetime.utcnow().isoformat(),
                    ":error": {
                        "message": f"Job cancelled by user {user_id}",
                        "stackTrace": ""
                    }
                }
            )
            cancelled_count += 1
        except Exception as e:
            print(f"Error cancelling item {item['itemKey']}: {str(e)}")
    
    return {
        "jobId": job_id,
        "cancelledItems": cancelled_count,
        "message": f"Cancelled {cancelled_count} in-progress items"
    }


def get_job_stats() -> Dict[str, Any]:
    """
    Get job statistics (total, by status, success rate, average duration)
    
    Returns:
        Job statistics
    """
    # Scan all jobs (TODO: optimize with aggregation or caching)
    response = progress_table.scan()
    items = response.get("Items", [])
    
    # Calculate statistics
    total = len(items)
    by_status = defaultdict(int)
    durations = []
    
    for item in items:
        status = item.get("status", "UNKNOWN")
        by_status[status] += 1
        
        # Calculate duration for completed items
        if item.get("startTime") and item.get("completionTime"):
            try:
                start = datetime.fromisoformat(item["startTime"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(item["completionTime"].replace("Z", "+00:00"))
                duration = (end - start).total_seconds() * 1000  # milliseconds
                durations.append(duration)
            except:
                pass
    
    completed = by_status.get("COMPLETED", 0)
    failed = by_status.get("FAILED", 0)
    success_rate = (completed / (completed + failed) * 100) if (completed + failed) > 0 else 0
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    return {
        "total": total,
        "byStatus": dict(by_status),
        "successRate": round(success_rate, 2),
        "averageDuration": round(avg_duration, 2),
    }


def enrich_job_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enrich job item with artifact and temple names
    
    Args:
        item: Job item from DynamoDB
        
    Returns:
        Enriched job item
    """
    enriched = dict(item)
    
    # Parse itemKey: artifactId#language#contentType
    item_key = item.get("itemKey", "")
    parts = item_key.split("#")
    
    if len(parts) >= 3:
        artifact_id = parts[0]
        language = parts[1]
        content_type = parts[2]
        
        enriched["artifactId"] = artifact_id
        enriched["language"] = language
        enriched["contentType"] = content_type
        
        # Get artifact name and siteId
        try:
            artifact_response = artifacts_table.get_item(Key={"artifactId": artifact_id})
            if "Item" in artifact_response:
                artifact = artifact_response["Item"]
                enriched["artifactName"] = artifact.get("artifactName", "Unknown")
                enriched["siteId"] = artifact.get("siteId", "")
                
                # Get temple name
                site_id = artifact.get("siteId")
                if site_id:
                    try:
                        temple_response = heritage_sites_table.get_item(Key={"siteId": site_id})
                        if "Item" in temple_response:
                            temple = temple_response["Item"]
                            enriched["templeName"] = temple.get("siteName", "Unknown")
                        else:
                            enriched["templeName"] = "Unknown"
                    except:
                        enriched["templeName"] = "Unknown"
            else:
                enriched["artifactName"] = "Unknown"
                enriched["templeName"] = "Unknown"
        except:
            enriched["artifactName"] = "Unknown"
            enriched["templeName"] = "Unknown"
    
    # Calculate duration if both times are present
    if item.get("startTime") and item.get("completionTime"):
        try:
            start = datetime.fromisoformat(item["startTime"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(item["completionTime"].replace("Z", "+00:00"))
            duration = (end - start).total_seconds() * 1000  # milliseconds
            enriched["duration"] = duration
        except:
            pass
    
    return enriched
