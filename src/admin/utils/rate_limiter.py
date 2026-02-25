"""
Rate Limiter Utility

Implements rate limiting for admin API requests using DynamoDB.
Limits: 100 requests per minute per user.
"""

import time
from typing import Dict, Any
import boto3
from datetime import datetime, timedelta

# AWS clients
dynamodb = boto3.resource("dynamodb")


class RateLimiter:
    """Rate limiter using DynamoDB for distributed rate limiting"""
    
    def __init__(self, table_name: str = "SanaathanaAalayaCharithra-RateLimits"):
        self.table = dynamodb.Table(table_name)
        self.max_requests = 100  # requests per minute
        self.window_seconds = 60
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user has exceeded rate limit
        
        Args:
            user_id: User identifier
            
        Returns:
            True if within limit, False if exceeded
        """
        try:
            current_time = int(time.time())
            window_start = current_time - self.window_seconds
            
            # Get current request count
            response = self.table.get_item(
                Key={"userId": user_id}
            )
            
            if "Item" not in response:
                # First request, create entry
                self._create_entry(user_id, current_time)
                return True
            
            item = response["Item"]
            requests = item.get("requests", [])
            
            # Filter requests within current window
            recent_requests = [
                req for req in requests 
                if req >= window_start
            ]
            
            # Check if limit exceeded
            if len(recent_requests) >= self.max_requests:
                return False
            
            # Add current request
            recent_requests.append(current_time)
            
            # Update DynamoDB
            self.table.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET requests = :requests, lastRequest = :last",
                ExpressionAttributeValues={
                    ":requests": recent_requests,
                    ":last": current_time,
                },
            )
            
            return True
            
        except Exception as e:
            print(f"Rate limit check error: {str(e)}")
            # On error, allow request (fail open)
            return True
    
    def _create_entry(self, user_id: str, timestamp: int) -> None:
        """Create new rate limit entry"""
        self.table.put_item(
            Item={
                "userId": user_id,
                "requests": [timestamp],
                "lastRequest": timestamp,
                "ttl": timestamp + (2 * self.window_seconds),  # Auto-delete after 2 minutes
            }
        )
