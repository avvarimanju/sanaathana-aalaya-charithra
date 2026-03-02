"""
Cost Monitoring Lambda

This Lambda function is triggered daily by EventBridge to fetch and cache
AWS cost data from Cost Explorer API. This reduces API calls and costs.
"""

import json
import os
from typing import Dict, Any
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource("dynamodb")
ce_client = boto3.client("ce")  # Cost Explorer

# Environment variables
COST_CACHE_TABLE = os.environ.get("COST_CACHE_TABLE", "SanaathanaAalayaCharithra-CostCache")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for scheduled cost data refresh
    
    Args:
        event: EventBridge event
        context: Lambda context
        
    Returns:
        Response with refresh status
    """
    try:
        print("Starting cost data refresh...")
        
        # Refresh current month costs
        current_costs = refresh_current_costs()
        print(f"Refreshed current month costs: ${current_costs.get('total', 0)}")
        
        # Refresh 12-month cost trend
        trend_data = refresh_cost_trend(12)
        print(f"Refreshed 12-month cost trend: {len(trend_data)} months")
        
        # Refresh 6-month cost trend
        trend_data_6m = refresh_cost_trend(6)
        print(f"Refreshed 6-month cost trend: {len(trend_data_6m)} months")
        
        # Refresh 3-month cost trend
        trend_data_3m = refresh_cost_trend(3)
        print(f"Refreshed 3-month cost trend: {len(trend_data_3m)} months")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Cost data refresh completed successfully",
                "timestamp": datetime.utcnow().isoformat(),
                "currentMonthTotal": current_costs.get("total", 0),
                "trendMonths": len(trend_data)
            })
        }
        
    except Exception as e:
        print(f"Error refreshing cost data: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Cost data refresh failed",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })
        }


def refresh_current_costs() -> Dict[str, Any]:
    """
    Fetch and cache current month costs by service
    
    Returns:
        Current month cost data
    """
    cache_table = dynamodb.Table(COST_CACHE_TABLE)
    
    try:
        # Get current month date range
        now = datetime.utcnow()
        start_date = now.replace(day=1).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
        
        print(f"Fetching costs from {start_date} to {end_date}")
        
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
        cache_key = f"current_month_{now.strftime('%Y-%m')}"
        cache_table.put_item(
            Item={
                "cacheKey": cache_key,
                "data": json.loads(json.dumps(cost_data)),
                "timestamp": datetime.utcnow().isoformat(),
                "ttl": int((datetime.utcnow() + timedelta(days=7)).timestamp())
            }
        )
        
        print(f"Cached current month costs: {cache_key}")
        
        return cost_data
        
    except Exception as e:
        print(f"Error fetching current costs: {str(e)}")
        raise


def refresh_cost_trend(months: int) -> list:
    """
    Fetch and cache historical cost trends
    
    Args:
        months: Number of months to fetch
        
    Returns:
        Cost trend data
    """
    cache_table = dynamodb.Table(COST_CACHE_TABLE)
    
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=months * 30)
        
        print(f"Fetching {months}-month trend from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
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
        cache_key = f"cost_trend_{months}months"
        cache_table.put_item(
            Item={
                "cacheKey": cache_key,
                "data": json.loads(json.dumps(trend_data)),
                "timestamp": datetime.utcnow().isoformat(),
                "ttl": int((datetime.utcnow() + timedelta(days=7)).timestamp())
            }
        )
        
        print(f"Cached {months}-month trend: {cache_key}")
        
        return trend_data
        
    except Exception as e:
        print(f"Error fetching cost trend: {str(e)}")
        raise


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
        "AWS Cost Explorer": "costExplorer",
        "Amazon Cognito": "cognito",
        "Amazon EventBridge": "eventbridge",
        "AWS Secrets Manager": "secretsManager",
        "Amazon SES": "ses"
    }
    return service_map.get(service, service.lower().replace(" ", "_"))
