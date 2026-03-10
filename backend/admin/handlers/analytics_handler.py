"""
Analytics Handler

Handles analytics queries and data export for the admin application.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict
import csv
import io

# AWS clients
dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")

# DynamoDB tables
analytics_table = dynamodb.Table("SanaathanaAalayaCharithra-Analytics")
heritage_sites_table = dynamodb.Table("SanaathanaAalayaCharithra-HeritageSites")
artifacts_table = dynamodb.Table("SanaathanaAalayaCharithra-Artifacts")
content_cache_table = dynamodb.Table("SanaathanaAalayaCharithra-ContentCache")
progress_table = dynamodb.Table("SanaathanaAalayaCharithra-PreGenerationProgress")

# Environment variables
CONTENT_BUCKET = os.environ.get("CONTENT_BUCKET", "sanaathana-aalaya-charithra-content")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_analytics_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route analytics requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID
        
    Returns:
        Response data
    """
    # Parse path
    if method == "GET" and "/summary" in path:
        return get_analytics_summary()
    
    elif method == "GET" and "/qr-scans" in path:
        return get_qr_scan_analytics(query_params)
    
    elif method == "GET" and "/content-generation" in path:
        return get_content_generation_analytics(query_params)
    
    elif method == "GET" and "/language-usage" in path:
        return get_language_usage_analytics()
    
    elif method == "GET" and "/geographic" in path:
        return get_geographic_analytics()
    
    elif method == "GET" and "/audio-playback" in path:
        return get_audio_playback_analytics(query_params)
    
    elif method == "GET" and "/qa-interactions" in path:
        return get_qa_interaction_analytics(query_params)
    
    elif method == "POST" and "/export" in path:
        return export_analytics_data(body, user_id)
    
    else:
        raise ValueError(f"Invalid analytics request: {method} {path}")


def get_analytics_summary() -> Dict[str, Any]:
    """
    Get summary analytics with key metrics
    
    Returns:
        Summary analytics data
    """
    # Count temples
    temple_response = heritage_sites_table.scan(
        Select="COUNT",
        FilterExpression="attribute_exists(siteId)"
    )
    total_temples = temple_response.get("Count", 0)
    
    # Count artifacts
    artifact_response = artifacts_table.scan(
        Select="COUNT",
        FilterExpression="attribute_exists(artifactId)"
    )
    total_artifacts = artifact_response.get("Count", 0)
    
    # Count unique users from analytics events
    # Scan analytics table for unique userIds
    analytics_response = analytics_table.scan(
        ProjectionExpression="userId"
    )
    
    user_ids = set()
    for item in analytics_response.get("Items", []):
        user_id = item.get("userId")
        if user_id:
            user_ids.add(user_id)
    
    total_users = len(user_ids)
    
    # Calculate active users (daily, weekly, monthly)
    now = datetime.utcnow()
    daily_cutoff = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    weekly_cutoff = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    monthly_cutoff = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Scan analytics for active users
    active_users_response = analytics_table.scan(
        ProjectionExpression="userId, #date",
        ExpressionAttributeNames={"#date": "date"}
    )
    
    daily_users = set()
    weekly_users = set()
    monthly_users = set()
    
    for item in active_users_response.get("Items", []):
        user_id = item.get("userId")
        event_date = item.get("date")
        
        if user_id and event_date:
            if event_date >= daily_cutoff:
                daily_users.add(user_id)
            if event_date >= weekly_cutoff:
                weekly_users.add(user_id)
            if event_date >= monthly_cutoff:
                monthly_users.add(user_id)
    
    return {
        "summary": {
            "totalTemples": total_temples,
            "totalArtifacts": total_artifacts,
            "totalUsers": total_users,
            "activeUsers": {
                "daily": len(daily_users),
                "weekly": len(weekly_users),
                "monthly": len(monthly_users),
            }
        }
    }


def get_qr_scan_analytics(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get QR scan analytics with trends
    
    Args:
        query_params: Query parameters (dateRange, siteId, artifactId)
        
    Returns:
        QR scan analytics
    """
    # Parse query parameters
    date_range_str = query_params.get("dateRange")
    site_id_filter = query_params.get("siteId")
    artifact_id_filter = query_params.get("artifactId")
    
    # Parse date range
    date_start = None
    date_end = None
    if date_range_str:
        parts = date_range_str.split(",")
        if len(parts) == 2:
            date_start = parts[0]
            date_end = parts[1]
    
    # Build scan parameters
    scan_params = {
        "FilterExpression": "eventType = :eventType",
        "ExpressionAttributeValues": {":eventType": "QR_SCAN"}
    }
    
    # Add filters
    filter_expressions = ["eventType = :eventType"]
    expression_values = {":eventType": "QR_SCAN"}
    
    if site_id_filter:
        filter_expressions.append("siteId = :siteId")
        expression_values[":siteId"] = site_id_filter
    
    if artifact_id_filter:
        filter_expressions.append("artifactId = :artifactId")
        expression_values[":artifactId"] = artifact_id_filter
    
    if date_start:
        filter_expressions.append("#date >= :dateStart")
        expression_values[":dateStart"] = date_start
        scan_params["ExpressionAttributeNames"] = {"#date": "date"}
    
    if date_end:
        filter_expressions.append("#date <= :dateEnd")
        expression_values[":dateEnd"] = date_end
        if "ExpressionAttributeNames" not in scan_params:
            scan_params["ExpressionAttributeNames"] = {"#date": "date"}
    
    scan_params["FilterExpression"] = " AND ".join(filter_expressions)
    scan_params["ExpressionAttributeValues"] = expression_values
    
    # Scan analytics table
    response = analytics_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Calculate statistics
    total_scans = len(items)
    by_temple = defaultdict(int)
    by_artifact = defaultdict(int)
    by_date = defaultdict(int)
    
    for item in items:
        site_id = item.get("siteId")
        artifact_id = item.get("artifactId")
        event_date = item.get("date")
        
        if site_id:
            by_temple[site_id] += 1
        if artifact_id:
            by_artifact[artifact_id] += 1
        if event_date:
            by_date[event_date] += 1
    
    # Build trend data
    trend = [
        {"timestamp": date, "value": count}
        for date, count in sorted(by_date.items())
    ]
    
    return {
        "qrScans": {
            "total": total_scans,
            "byTemple": dict(by_temple),
            "byArtifact": dict(by_artifact),
            "trend": trend,
        }
    }


def get_content_generation_analytics(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get content generation analytics
    
    Args:
        query_params: Query parameters (dateRange)
        
    Returns:
        Content generation analytics
    """
    # Parse date range
    date_range_str = query_params.get("dateRange")
    date_start = None
    date_end = None
    if date_range_str:
        parts = date_range_str.split(",")
        if len(parts) == 2:
            date_start = parts[0]
            date_end = parts[1]
    
    # Scan progress table
    scan_params = {}
    
    if date_start or date_end:
        filter_expressions = []
        expression_values = {}
        
        if date_start:
            filter_expressions.append("startTime >= :dateStart")
            expression_values[":dateStart"] = date_start
        
        if date_end:
            filter_expressions.append("startTime <= :dateEnd")
            expression_values[":dateEnd"] = date_end
        
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
    
    response = progress_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Calculate statistics
    total_jobs = len(items)
    completed = sum(1 for item in items if item.get("status") == "COMPLETED")
    failed = sum(1 for item in items if item.get("status") == "FAILED")
    
    success_rate = (completed / (completed + failed) * 100) if (completed + failed) > 0 else 0
    
    # Calculate average duration
    durations = []
    for item in items:
        if item.get("startTime") and item.get("completionTime"):
            try:
                start = datetime.fromisoformat(item["startTime"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(item["completionTime"].replace("Z", "+00:00"))
                duration = (end - start).total_seconds() * 1000  # milliseconds
                durations.append(duration)
            except:
                pass
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Count by type
    by_type = defaultdict(int)
    for item in items:
        item_key = item.get("itemKey", "")
        parts = item_key.split("#")
        if len(parts) >= 3:
            content_type = parts[2]
            by_type[content_type] += 1
    
    return {
        "contentGeneration": {
            "totalJobs": total_jobs,
            "successRate": round(success_rate, 2),
            "averageDuration": round(avg_duration, 2),
            "byType": dict(by_type),
        }
    }


def get_language_usage_analytics() -> Dict[str, Any]:
    """
    Get language usage distribution
    
    Returns:
        Language usage analytics
    """
    # Scan analytics table for language field
    response = analytics_table.scan(
        ProjectionExpression="language"
    )
    
    language_counts = defaultdict(int)
    
    for item in response.get("Items", []):
        language = item.get("language")
        if language:
            language_counts[language] += 1
    
    return {
        "languageUsage": dict(language_counts)
    }


def get_geographic_analytics() -> Dict[str, Any]:
    """
    Get geographic distribution of temple visits
    
    Returns:
        Geographic analytics
    """
    # Get all temples with their locations
    temple_response = heritage_sites_table.scan()
    temples = temple_response.get("Items", [])
    
    # Get QR scan events
    analytics_response = analytics_table.scan(
        FilterExpression="eventType = :eventType",
        ExpressionAttributeValues={":eventType": "QR_SCAN"}
    )
    
    # Count visits by temple
    visits_by_temple = defaultdict(int)
    for item in analytics_response.get("Items", []):
        site_id = item.get("siteId")
        if site_id:
            visits_by_temple[site_id] += 1
    
    # Aggregate by state
    visits_by_state = defaultdict(int)
    for temple in temples:
        site_id = temple.get("siteId")
        location = temple.get("location", {})
        state = location.get("state", "Unknown")
        
        visits = visits_by_temple.get(site_id, 0)
        visits_by_state[state] += visits
    
    # Build result
    geographic_distribution = [
        {"state": state, "visits": visits}
        for state, visits in visits_by_state.items()
    ]
    
    return {
        "geographicDistribution": geographic_distribution
    }


def get_audio_playback_analytics(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get audio playback statistics
    
    Args:
        query_params: Query parameters (dateRange)
        
    Returns:
        Audio playback analytics
    """
    # Parse date range
    date_range_str = query_params.get("dateRange")
    date_start = None
    date_end = None
    if date_range_str:
        parts = date_range_str.split(",")
        if len(parts) == 2:
            date_start = parts[0]
            date_end = parts[1]
    
    # Build scan parameters
    scan_params = {
        "FilterExpression": "eventType = :eventType",
        "ExpressionAttributeValues": {":eventType": "AUDIO_PLAY"}
    }
    
    if date_start or date_end:
        filter_expressions = ["eventType = :eventType"]
        expression_values = {":eventType": "AUDIO_PLAY"}
        
        if date_start:
            filter_expressions.append("#date >= :dateStart")
            expression_values[":dateStart"] = date_start
            scan_params["ExpressionAttributeNames"] = {"#date": "date"}
        
        if date_end:
            filter_expressions.append("#date <= :dateEnd")
            expression_values[":dateEnd"] = date_end
            if "ExpressionAttributeNames" not in scan_params:
                scan_params["ExpressionAttributeNames"] = {"#date": "date"}
        
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
    
    # Scan analytics table
    response = analytics_table.scan(**scan_params)
    items = response.get("Items", [])
    
    total_plays = len(items)
    
    # Calculate average duration and completion rate from metadata
    durations = []
    completed_plays = 0
    
    for item in items:
        metadata = item.get("metadata", {})
        duration = metadata.get("duration")
        completed = metadata.get("completed", False)
        
        if duration:
            durations.append(float(duration))
        if completed:
            completed_plays += 1
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    completion_rate = (completed_plays / total_plays * 100) if total_plays > 0 else 0
    
    return {
        "audioPlayback": {
            "totalPlays": total_plays,
            "averageDuration": round(avg_duration, 2),
            "completionRate": round(completion_rate, 2),
        }
    }


def get_qa_interaction_analytics(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get Q&A interaction statistics
    
    Args:
        query_params: Query parameters (dateRange)
        
    Returns:
        Q&A interaction analytics
    """
    # Parse date range
    date_range_str = query_params.get("dateRange")
    date_start = None
    date_end = None
    if date_range_str:
        parts = date_range_str.split(",")
        if len(parts) == 2:
            date_start = parts[0]
            date_end = parts[1]
    
    # Build scan parameters
    scan_params = {
        "FilterExpression": "eventType = :eventType",
        "ExpressionAttributeValues": {":eventType": "QA_INTERACTION"}
    }
    
    if date_start or date_end:
        filter_expressions = ["eventType = :eventType"]
        expression_values = {":eventType": "QA_INTERACTION"}
        
        if date_start:
            filter_expressions.append("#date >= :dateStart")
            expression_values[":dateStart"] = date_start
            scan_params["ExpressionAttributeNames"] = {"#date": "date"}
        
        if date_end:
            filter_expressions.append("#date <= :dateEnd")
            expression_values[":dateEnd"] = date_end
            if "ExpressionAttributeNames" not in scan_params:
                scan_params["ExpressionAttributeNames"] = {"#date": "date"}
        
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
    
    # Scan analytics table
    response = analytics_table.scan(**scan_params)
    items = response.get("Items", [])
    
    total_questions = len(items)
    
    # Calculate average response time and satisfaction from metadata
    response_times = []
    satisfaction_scores = []
    
    for item in items:
        metadata = item.get("metadata", {})
        response_time = metadata.get("responseTime")
        satisfaction = metadata.get("satisfactionScore")
        
        if response_time:
            response_times.append(float(response_time))
        if satisfaction:
            satisfaction_scores.append(float(satisfaction))
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    avg_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0
    
    return {
        "qaInteractions": {
            "totalQuestions": total_questions,
            "averageResponseTime": round(avg_response_time, 2),
            "satisfactionScore": round(avg_satisfaction, 2),
        }
    }


def export_analytics_data(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Export analytics data to CSV or JSON format
    
    Args:
        body: Request body with format, dataType, and filters
        user_id: User requesting export
        
    Returns:
        Pre-signed S3 URL for download
    """
    export_format = body.get("format", "CSV")
    data_type = body.get("dataType", "summary")
    filters = body.get("filters", {})
    
    # Validate format
    if export_format not in ["CSV", "JSON"]:
        raise ValueError(f"Invalid export format: {export_format}")
    
    # Get data based on type
    if data_type == "summary":
        data = get_analytics_summary()
    elif data_type == "qr-scans":
        data = get_qr_scan_analytics(filters)
    elif data_type == "content-generation":
        data = get_content_generation_analytics(filters)
    elif data_type == "language-usage":
        data = get_language_usage_analytics()
    elif data_type == "geographic":
        data = get_geographic_analytics()
    elif data_type == "audio-playback":
        data = get_audio_playback_analytics(filters)
    elif data_type == "qa-interactions":
        data = get_qa_interaction_analytics(filters)
    else:
        raise ValueError(f"Invalid data type: {data_type}")
    
    # Generate export file
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    export_id = f"{data_type}-{timestamp}"
    
    if export_format == "CSV":
        file_content = convert_to_csv(data, data_type)
        file_name = f"{export_id}.csv"
        content_type = "text/csv"
    else:  # JSON
        file_content = json.dumps(data, cls=DecimalEncoder, indent=2)
        file_name = f"{export_id}.json"
        content_type = "application/json"
    
    # Upload to S3
    s3_key = f"exports/{export_id}/{file_name}"
    
    s3_client.put_object(
        Bucket=CONTENT_BUCKET,
        Key=s3_key,
        Body=file_content.encode("utf-8") if isinstance(file_content, str) else file_content,
        ContentType=content_type,
    )
    
    # Generate pre-signed URL (valid for 1 hour)
    presigned_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": CONTENT_BUCKET, "Key": s3_key},
        ExpiresIn=3600,
    )
    
    # Calculate expiration time
    expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    
    return {
        "exportUrl": presigned_url,
        "expiresAt": expires_at,
        "fileName": file_name,
        "format": export_format,
    }


def convert_to_csv(data: Dict[str, Any], data_type: str) -> str:
    """
    Convert analytics data to CSV format
    
    Args:
        data: Analytics data
        data_type: Type of data
        
    Returns:
        CSV string
    """
    output = io.StringIO()
    
    if data_type == "summary":
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        
        summary = data.get("summary", {})
        writer.writerow(["Total Temples", summary.get("totalTemples", 0)])
        writer.writerow(["Total Artifacts", summary.get("totalArtifacts", 0)])
        writer.writerow(["Total Users", summary.get("totalUsers", 0)])
        
        active_users = summary.get("activeUsers", {})
        writer.writerow(["Daily Active Users", active_users.get("daily", 0)])
        writer.writerow(["Weekly Active Users", active_users.get("weekly", 0)])
        writer.writerow(["Monthly Active Users", active_users.get("monthly", 0)])
    
    elif data_type == "qr-scans":
        writer = csv.writer(output)
        qr_scans = data.get("qrScans", {})
        
        # Write summary
        writer.writerow(["Total QR Scans", qr_scans.get("total", 0)])
        writer.writerow([])
        
        # Write by temple
        writer.writerow(["Temple ID", "Scans"])
        for temple_id, count in qr_scans.get("byTemple", {}).items():
            writer.writerow([temple_id, count])
        
        writer.writerow([])
        
        # Write by artifact
        writer.writerow(["Artifact ID", "Scans"])
        for artifact_id, count in qr_scans.get("byArtifact", {}).items():
            writer.writerow([artifact_id, count])
    
    elif data_type == "content-generation":
        writer = csv.writer(output)
        content_gen = data.get("contentGeneration", {})
        
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Jobs", content_gen.get("totalJobs", 0)])
        writer.writerow(["Success Rate (%)", content_gen.get("successRate", 0)])
        writer.writerow(["Average Duration (ms)", content_gen.get("averageDuration", 0)])
        writer.writerow([])
        
        writer.writerow(["Content Type", "Count"])
        for content_type, count in content_gen.get("byType", {}).items():
            writer.writerow([content_type, count])
    
    elif data_type == "language-usage":
        writer = csv.writer(output)
        writer.writerow(["Language", "Usage Count"])
        
        for language, count in data.get("languageUsage", {}).items():
            writer.writerow([language, count])
    
    elif data_type == "geographic":
        writer = csv.writer(output)
        writer.writerow(["State", "Visits"])
        
        for item in data.get("geographicDistribution", []):
            writer.writerow([item.get("state"), item.get("visits")])
    
    elif data_type == "audio-playback":
        writer = csv.writer(output)
        audio = data.get("audioPlayback", {})
        
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Plays", audio.get("totalPlays", 0)])
        writer.writerow(["Average Duration (s)", audio.get("averageDuration", 0)])
        writer.writerow(["Completion Rate (%)", audio.get("completionRate", 0)])
    
    elif data_type == "qa-interactions":
        writer = csv.writer(output)
        qa = data.get("qaInteractions", {})
        
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Questions", qa.get("totalQuestions", 0)])
        writer.writerow(["Average Response Time (ms)", qa.get("averageResponseTime", 0)])
        writer.writerow(["Satisfaction Score", qa.get("satisfactionScore", 0)])
    
    return output.getvalue()
