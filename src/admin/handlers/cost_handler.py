"""
Cost Monitoring Handler

Handles cost monitoring operations including AWS Cost Explorer integration,
cost alerts management, and resource usage metrics.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

# AWS clients
dynamodb = boto3.resource("dynamodb")
ce_client = boto3.client("ce")  # Cost Explorer
cloudwatch = boto3.client("cloudwatch")

# DynamoDB tables
system_config_table = dynamodb.Table("SanaathanaAalayaCharithra-SystemConfiguration")
audit_log_table = dynamodb.Table("SanaathanaAalayaCharithra-AuditLog")

# Environment variables
COST_CACHE_TABLE = os.environ.get("COST_CACHE_TABLE", "SanaathanaAalayaCharithra-CostCache")
COST_ALERTS_TABLE = os.environ.get("COST_ALERTS_TABLE", "SanaathanaAalayaCharithra-CostAlerts")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_cost_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route cost monitoring requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID making the request
        
    Returns:
        Response data
    """
    # Extract alertId from path if present
    path_parts = path.split("/")
    alert_id = None
    
    # Check for alertId in path (e.g., /admin/costs/alerts/{alertId})
    if len(path_parts) > 4 and path_parts[3] == "alerts":
        alert_id = path_parts[4] if len(path_parts) > 4 else None
    
    # Current month costs endpoint
    if method == "GET" and "/current" in path:
        return get_current_costs()
    
    # Cost trend endpoint
    elif method == "GET" and "/trend" in path:
        return get_cost_trend(query_params)
    
    # Resource usage endpoint
    elif method == "GET" and "/resources" in path:
        return get_resource_usage()
    
    # Cost alerts endpoints
    elif method == "GET" and "/alerts" in path and not alert_id:
        return get_cost_alerts()
    
    elif method == "POST" and "/alerts" in path:
        return create_cost_alert(body, user_id)
    
    elif method == "PUT" and alert_id:
        return update_cost_alert(alert_id, body, user_id)
    
    elif method == "DELETE" and alert_id:
        return delete_cost_alert(alert_id, user_id)
    
    else:
        raise ValueError(f"Invalid cost request: {method} {path}")


def get_current_costs() -> Dict[str, Any]:
    """
    Get current month costs by service
    
    Returns:
        Current month cost data
    """
    # Try to get from cache first
    cache_table = dynamodb.Table(COST_CACHE_TABLE)
    cache_key = f"current_month_{datetime.utcnow().strftime('%Y-%m')}"
    
    try:
        response = cache_table.get_item(Key={"cacheKey": cache_key})
        if "Item" in response:
            cached_data = response["Item"]
            # Check if cache is still valid (less than 24 hours old)
            cache_time = datetime.fromisoformat(cached_data.get("timestamp", ""))
            if datetime.utcnow() - cache_time < timedelta(hours=24):
                return {
                    "currentMonth": json.loads(json.dumps(cached_data.get("data", {}), cls=DecimalEncoder)),
                    "cached": True,
                    "lastUpdated": cached_data.get("timestamp")
                }
    except Exception as e:
        print(f"Cache read error: {str(e)}")
    
    # Fetch from Cost Explorer if cache miss or expired
    try:
        # Get current month date range
        now = datetime.utcnow()
        start_date = now.replace(day=1).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
        
        # Query Cost Explorer
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                "Start": start_date,
                "End": end_date
            },
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[
                {
                    "Type": "DIMENSION",
                    "Key": "SERVICE"
                }
            ]
        )
        
        # Parse response
        by_service = {}
        total = 0.0
        
        if response.get("ResultsByTime"):
            for group in response["ResultsByTime"][0].get("Groups", []):
                service = group["Keys"][0]
                amount = float(group["Metrics"]["UnblendedCost"]["Amount"])
                
                # Map service names to friendly names
                service_name = map_service_name(service)
                by_service[service_name] = round(amount, 2)
                total += amount
        
        cost_data = {
            "total": round(total, 2),
            "byService": by_service
        }
        
        # Cache the result
        try:
            cache_table.put_item(
                Item={
                    "cacheKey": cache_key,
                    "data": json.loads(json.dumps(cost_data)),
                    "timestamp": datetime.utcnow().isoformat(),
                    "ttl": int((datetime.utcnow() + timedelta(days=7)).timestamp())
                }
            )
        except Exception as e:
            print(f"Cache write error: {str(e)}")
        
        return {
            "currentMonth": cost_data,
            "cached": False,
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Cost Explorer error: {str(e)}")
        # Return empty data on error
        return {
            "currentMonth": {
                "total": 0.0,
                "byService": {}
            },
            "error": str(e),
            "cached": False
        }


def get_cost_trend(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get historical cost trends
    
    Args:
        query_params: Query parameters (months)
        
    Returns:
        Cost trend data
    """
    months = int(query_params.get("months", "12"))
    
    # Try to get from cache first
    cache_table = dynamodb.Table(COST_CACHE_TABLE)
    cache_key = f"cost_trend_{months}months"
    
    try:
        response = cache_table.get_item(Key={"cacheKey": cache_key})
        if "Item" in response:
            cached_data = response["Item"]
            # Check if cache is still valid (less than 24 hours old)
            cache_time = datetime.fromisoformat(cached_data.get("timestamp", ""))
            if datetime.utcnow() - cache_time < timedelta(hours=24):
                return {
                    "trend": json.loads(json.dumps(cached_data.get("data", []), cls=DecimalEncoder)),
                    "cached": True,
                    "lastUpdated": cached_data.get("timestamp")
                }
    except Exception as e:
        print(f"Cache read error: {str(e)}")
    
    # Fetch from Cost Explorer
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=months * 30)
        
        # Query Cost Explorer
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                "Start": start_date.strftime("%Y-%m-%d"),
                "End": end_date.strftime("%Y-%m-%d")
            },
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[
                {
                    "Type": "DIMENSION",
                    "Key": "SERVICE"
                }
            ]
        )
        
        # Parse response
        trend_data = []
        
        for result in response.get("ResultsByTime", []):
            month = result["TimePeriod"]["Start"]
            by_service = {}
            total = 0.0
            
            for group in result.get("Groups", []):
                service = group["Keys"][0]
                amount = float(group["Metrics"]["UnblendedCost"]["Amount"])
                
                service_name = map_service_name(service)
                by_service[service_name] = round(amount, 2)
                total += amount
            
            trend_data.append({
                "month": month,
                "total": round(total, 2),
                "byService": by_service
            })
        
        # Cache the result
        try:
            cache_table.put_item(
                Item={
                    "cacheKey": cache_key,
                    "data": json.loads(json.dumps(trend_data)),
                    "timestamp": datetime.utcnow().isoformat(),
                    "ttl": int((datetime.utcnow() + timedelta(days=7)).timestamp())
                }
            )
        except Exception as e:
            print(f"Cache write error: {str(e)}")
        
        return {
            "trend": trend_data,
            "cached": False,
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Cost Explorer error: {str(e)}")
        return {
            "trend": [],
            "error": str(e),
            "cached": False
        }


def get_resource_usage() -> Dict[str, Any]:
    """
    Get resource usage metrics from CloudWatch
    
    Returns:
        Resource usage data
    """
    # Try to get from cache first
    cache_table = dynamodb.Table(COST_CACHE_TABLE)
    cache_key = f"resource_usage_{datetime.utcnow().strftime('%Y-%m-%d')}"
    
    try:
        response = cache_table.get_item(Key={"cacheKey": cache_key})
        if "Item" in response:
            cached_data = response["Item"]
            # Check if cache is still valid (less than 1 hour old)
            cache_time = datetime.fromisoformat(cached_data.get("timestamp", ""))
            if datetime.utcnow() - cache_time < timedelta(hours=1):
                return {
                    "usage": json.loads(json.dumps(cached_data.get("data", {}), cls=DecimalEncoder)),
                    "cached": True,
                    "lastUpdated": cached_data.get("timestamp")
                }
    except Exception as e:
        print(f"Cache read error: {str(e)}")
    
    # Fetch from CloudWatch
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)
        
        usage_data = {
            "lambda": get_lambda_metrics(start_time, end_time),
            "dynamodb": get_dynamodb_metrics(start_time, end_time),
            "s3": get_s3_metrics(start_time, end_time),
            "bedrock": get_bedrock_metrics(start_time, end_time),
            "polly": get_polly_metrics(start_time, end_time)
        }
        
        # Cache the result
        try:
            cache_table.put_item(
                Item={
                    "cacheKey": cache_key,
                    "data": json.loads(json.dumps(usage_data)),
                    "timestamp": datetime.utcnow().isoformat(),
                    "ttl": int((datetime.utcnow() + timedelta(days=2)).timestamp())
                }
            )
        except Exception as e:
            print(f"Cache write error: {str(e)}")
        
        return {
            "usage": usage_data,
            "cached": False,
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"CloudWatch error: {str(e)}")
        return {
            "usage": {},
            "error": str(e),
            "cached": False
        }


def get_cost_alerts() -> Dict[str, Any]:
    """
    Get all cost alerts
    
    Returns:
        List of cost alerts
    """
    alerts_table = dynamodb.Table(COST_ALERTS_TABLE)
    
    try:
        response = alerts_table.scan()
        alerts = response.get("Items", [])
        
        # Check which alerts are triggered
        current_costs = get_current_costs()
        by_service = current_costs.get("currentMonth", {}).get("byService", {})
        
        for alert in alerts:
            service = alert.get("service")
            threshold = float(alert.get("threshold", 0))
            current_value = by_service.get(service, 0)
            alert["currentValue"] = current_value
            alert["triggered"] = current_value > threshold
        
        return {
            "alerts": json.loads(json.dumps(alerts, cls=DecimalEncoder))
        }
        
    except Exception as e:
        print(f"Error fetching alerts: {str(e)}")
        return {
            "alerts": [],
            "error": str(e)
        }


def create_cost_alert(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Create a new cost alert
    
    Args:
        body: Alert data (service, threshold)
        user_id: User creating the alert
        
    Returns:
        Created alert
    """
    # Validate required fields
    if "service" not in body or "threshold" not in body:
        raise ValueError("Missing required fields: service, threshold")
    
    service = body["service"]
    threshold = float(body["threshold"])
    
    if threshold <= 0:
        raise ValueError("Threshold must be greater than 0")
    
    # Create alert
    alerts_table = dynamodb.Table(COST_ALERTS_TABLE)
    alert_id = str(uuid.uuid4())
    
    alert = {
        "alertId": alert_id,
        "service": service,
        "threshold": Decimal(str(threshold)),
        "createdAt": datetime.utcnow().isoformat(),
        "createdBy": user_id,
        "enabled": True
    }
    
    alerts_table.put_item(Item=alert)
    
    # Log audit entry
    log_audit_entry(
        user_id=user_id,
        action="CREATE_COST_ALERT",
        resource="cost_alert",
        resource_id=alert_id,
        after=alert
    )
    
    return {
        "alert": json.loads(json.dumps(alert, cls=DecimalEncoder))
    }


def update_cost_alert(alert_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Update a cost alert
    
    Args:
        alert_id: Alert ID
        body: Updated alert data (threshold)
        user_id: User updating the alert
        
    Returns:
        Updated alert
    """
    alerts_table = dynamodb.Table(COST_ALERTS_TABLE)
    
    # Get existing alert
    response = alerts_table.get_item(Key={"alertId": alert_id})
    if "Item" not in response:
        raise ValueError(f"Alert not found: {alert_id}")
    
    old_alert = response["Item"]
    
    # Validate threshold
    if "threshold" not in body:
        raise ValueError("Missing required field: threshold")
    
    threshold = float(body["threshold"])
    if threshold <= 0:
        raise ValueError("Threshold must be greater than 0")
    
    # Update alert
    alerts_table.update_item(
        Key={"alertId": alert_id},
        UpdateExpression="SET threshold = :threshold, updatedAt = :updatedAt, updatedBy = :updatedBy",
        ExpressionAttributeValues={
            ":threshold": Decimal(str(threshold)),
            ":updatedAt": datetime.utcnow().isoformat(),
            ":updatedBy": user_id
        }
    )
    
    # Get updated alert
    response = alerts_table.get_item(Key={"alertId": alert_id})
    updated_alert = response["Item"]
    
    # Log audit entry
    log_audit_entry(
        user_id=user_id,
        action="UPDATE_COST_ALERT",
        resource="cost_alert",
        resource_id=alert_id,
        before=old_alert,
        after=updated_alert
    )
    
    return {
        "alert": json.loads(json.dumps(updated_alert, cls=DecimalEncoder))
    }


def delete_cost_alert(alert_id: str, user_id: str) -> Dict[str, Any]:
    """
    Delete a cost alert
    
    Args:
        alert_id: Alert ID
        user_id: User deleting the alert
        
    Returns:
        Success response
    """
    alerts_table = dynamodb.Table(COST_ALERTS_TABLE)
    
    # Get existing alert for audit log
    response = alerts_table.get_item(Key={"alertId": alert_id})
    if "Item" not in response:
        raise ValueError(f"Alert not found: {alert_id}")
    
    old_alert = response["Item"]
    
    # Delete alert
    alerts_table.delete_item(Key={"alertId": alert_id})
    
    # Log audit entry
    log_audit_entry(
        user_id=user_id,
        action="DELETE_COST_ALERT",
        resource="cost_alert",
        resource_id=alert_id,
        before=old_alert
    )
    
    return {
        "success": True,
        "message": f"Alert {alert_id} deleted successfully"
    }


# Helper functions for CloudWatch metrics

def get_lambda_metrics(start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """Get Lambda metrics from CloudWatch"""
    try:
        # Get invocations
        invocations_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/Lambda",
            MetricName="Invocations",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,  # 1 day
            Statistics=["Sum"]
        )
        
        # Get duration
        duration_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/Lambda",
            MetricName="Duration",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=["Sum"]
        )
        
        # Get errors
        errors_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/Lambda",
            MetricName="Errors",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=["Sum"]
        )
        
        # Get throttles
        throttles_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/Lambda",
            MetricName="Throttles",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=["Sum"]
        )
        
        invocations = sum(dp["Sum"] for dp in invocations_response.get("Datapoints", []))
        duration = sum(dp["Sum"] for dp in duration_response.get("Datapoints", []))
        errors = sum(dp["Sum"] for dp in errors_response.get("Datapoints", []))
        throttles = sum(dp["Sum"] for dp in throttles_response.get("Datapoints", []))
        
        return {
            "invocations": int(invocations),
            "duration": int(duration),
            "errors": int(errors),
            "throttles": int(throttles)
        }
    except Exception as e:
        print(f"Error fetching Lambda metrics: {str(e)}")
        return {
            "invocations": 0,
            "duration": 0,
            "errors": 0,
            "throttles": 0
        }


def get_dynamodb_metrics(start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """Get DynamoDB metrics from CloudWatch"""
    try:
        # Get consumed read capacity
        read_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/DynamoDB",
            MetricName="ConsumedReadCapacityUnits",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=["Sum"]
        )
        
        # Get consumed write capacity
        write_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/DynamoDB",
            MetricName="ConsumedWriteCapacityUnits",
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=["Sum"]
        )
        
        read_capacity = sum(dp["Sum"] for dp in read_response.get("Datapoints", []))
        write_capacity = sum(dp["Sum"] for dp in write_response.get("Datapoints", []))
        
        return {
            "readCapacityUnits": int(read_capacity),
            "writeCapacityUnits": int(write_capacity),
            "storageGB": 0  # Would need to query table sizes separately
        }
    except Exception as e:
        print(f"Error fetching DynamoDB metrics: {str(e)}")
        return {
            "readCapacityUnits": 0,
            "writeCapacityUnits": 0,
            "storageGB": 0
        }


def get_s3_metrics(start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """Get S3 metrics from CloudWatch"""
    try:
        # S3 metrics are more complex and require bucket-specific queries
        # For now, return placeholder values
        return {
            "storageGB": 0,
            "requests": 0,
            "dataTransferGB": 0
        }
    except Exception as e:
        print(f"Error fetching S3 metrics: {str(e)}")
        return {
            "storageGB": 0,
            "requests": 0,
            "dataTransferGB": 0
        }


def get_bedrock_metrics(start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """Get Bedrock metrics from CloudWatch"""
    try:
        # Bedrock metrics would need to be tracked via custom metrics
        # For now, return placeholder values
        return {
            "apiCalls": 0,
            "tokensProcessed": 0
        }
    except Exception as e:
        print(f"Error fetching Bedrock metrics: {str(e)}")
        return {
            "apiCalls": 0,
            "tokensProcessed": 0
        }


def get_polly_metrics(start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """Get Polly metrics from CloudWatch"""
    try:
        # Polly metrics would need to be tracked via custom metrics
        # For now, return placeholder values
        return {
            "charactersConverted": 0
        }
    except Exception as e:
        print(f"Error fetching Polly metrics: {str(e)}")
        return {
            "charactersConverted": 0
        }


def map_service_name(service: str) -> str:
    """Map AWS service names to friendly names"""
    service_map = {
        "AWS Lambda": "lambda",
        "Amazon DynamoDB": "dynamodb",
        "Amazon Simple Storage Service": "s3",
        "Amazon Bedrock": "bedrock",
        "Amazon Polly": "polly",
        "Amazon API Gateway": "apiGateway",
        "Amazon CloudFront": "cloudfront",
        "Amazon CloudWatch": "cloudwatch",
        "AWS Cost Explorer": "costExplorer"
    }
    return service_map.get(service, service.lower().replace(" ", "_"))


def log_audit_entry(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log action to audit trail
    
    Args:
        user_id: User ID
        action: Action performed
        resource: Resource type
        resource_id: Resource ID
        before: State before action
        after: State after action
    """
    try:
        audit_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Calculate TTL (365 days from now)
        import time
        ttl = int(time.time()) + (365 * 24 * 60 * 60)
        
        audit_entry = {
            "auditId": audit_id,
            "timestamp": timestamp,
            "userId": user_id,
            "userName": user_id,  # Would need to fetch from user table
            "action": action,
            "resource": resource,
            "resourceId": resource_id,
            "success": True,
            "ttl": ttl,
        }
        
        if before:
            audit_entry["before"] = json.loads(json.dumps(before, cls=DecimalEncoder))
        if after:
            audit_entry["after"] = json.loads(json.dumps(after, cls=DecimalEncoder))
        
        audit_log_table.put_item(Item=audit_entry)
        
    except Exception as e:
        print(f"Error logging audit trail: {str(e)}")
