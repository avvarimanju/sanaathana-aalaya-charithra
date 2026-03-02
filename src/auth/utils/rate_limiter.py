"""
Rate limiting logic for authentication attempts.

This module implements sliding window rate limiting to prevent brute force
attacks and abuse of the authentication system. It tracks authentication
attempts per device using DynamoDB.
"""

import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError

from auth.config import AuthConfig, AuthErrorCode


class RateLimiter:
    """
    Implements sliding window rate limiting for authentication attempts.
    
    Tracks authentication attempts per device ID in DynamoDB and enforces
    a limit of 5 attempts per 15-minute window.
    """
    
    def __init__(self, dynamodb_client=None):
        """
        Initialize the rate limiter.
        
        Args:
            dynamodb_client: Optional boto3 DynamoDB client for testing
        """
        self.dynamodb = dynamodb_client or boto3.client(
            'dynamodb',
            region_name=AuthConfig.AWS_REGION
        )
        self.table_name = AuthConfig.RATE_LIMITS_TABLE
        self.max_attempts = AuthConfig.RATE_LIMIT_MAX_ATTEMPTS
        self.window_seconds = AuthConfig.RATE_LIMIT_WINDOW_SECONDS
    
    def check_rate_limit(self, device_id: str) -> Dict[str, Any]:
        """
        Check if a device has exceeded the rate limit.
        
        Implements sliding window rate limiting by checking the number of
        attempts within the configured time window.
        
        Args:
            device_id: Unique device identifier
            
        Returns:
            dict: {
                "allowed": bool,  # Whether the attempt is allowed
                "remaining": int,  # Remaining attempts in window
                "reset_at": str,  # ISO 8601 timestamp when limit resets
                "error_code": str  # Error code if rate limited (optional)
            }
        """
        try:
            # Get current rate limit record
            response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={'device_id': {'S': device_id}}
            )
            
            current_time = datetime.utcnow()
            
            # No existing record - allow the attempt
            if 'Item' not in response:
                return {
                    "allowed": True,
                    "remaining": self.max_attempts - 1,
                    "reset_at": (current_time + timedelta(seconds=self.window_seconds)).isoformat()
                }
            
            item = response['Item']
            
            # Check if blocked
            if 'blocked_until' in item:
                blocked_until = datetime.fromisoformat(item['blocked_until']['S'])
                if current_time < blocked_until:
                    return {
                        "allowed": False,
                        "remaining": 0,
                        "reset_at": blocked_until.isoformat(),
                        "error_code": AuthErrorCode.AUTH_RATE_LIMITED
                    }
            
            # Parse window start time
            window_start = datetime.fromisoformat(item['window_start']['S'])
            attempt_count = int(item['attempt_count']['N'])
            
            # Check if we're still in the same window
            window_age = (current_time - window_start).total_seconds()
            
            if window_age > self.window_seconds:
                # Window has expired - start a new window
                return {
                    "allowed": True,
                    "remaining": self.max_attempts - 1,
                    "reset_at": (current_time + timedelta(seconds=self.window_seconds)).isoformat()
                }
            
            # Within the window - check attempt count
            if attempt_count >= self.max_attempts:
                # Rate limit exceeded
                reset_at = window_start + timedelta(seconds=self.window_seconds)
                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": reset_at.isoformat(),
                    "error_code": AuthErrorCode.AUTH_RATE_LIMITED
                }
            
            # Still have attempts remaining
            remaining = self.max_attempts - attempt_count
            reset_at = window_start + timedelta(seconds=self.window_seconds)
            
            return {
                "allowed": True,
                "remaining": remaining - 1,  # Account for current attempt
                "reset_at": reset_at.isoformat()
            }
            
        except ClientError as e:
            # Log error but allow the attempt (fail open for availability)
            print(f"Error checking rate limit: {e}")
            return {
                "allowed": True,
                "remaining": self.max_attempts - 1,
                "reset_at": (datetime.utcnow() + timedelta(seconds=self.window_seconds)).isoformat()
            }
    
    def record_attempt(self, device_id: str, success: bool = False) -> None:
        """
        Record an authentication attempt for a device.
        
        Updates the attempt count in DynamoDB. If the attempt is successful,
        clears the rate limit record. If unsuccessful, increments the counter
        and may block the device if the limit is exceeded.
        
        Args:
            device_id: Unique device identifier
            success: Whether the authentication attempt was successful
        """
        try:
            current_time = datetime.utcnow()
            
            # If successful, clear the rate limit record
            if success:
                self.dynamodb.delete_item(
                    TableName=self.table_name,
                    Key={'device_id': {'S': device_id}}
                )
                return
            
            # Get existing record
            response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={'device_id': {'S': device_id}}
            )
            
            if 'Item' not in response:
                # Create new record for first failed attempt
                ttl = int((current_time + timedelta(seconds=self.window_seconds)).timestamp())
                self.dynamodb.put_item(
                    TableName=self.table_name,
                    Item={
                        'device_id': {'S': device_id},
                        'attempt_count': {'N': '1'},
                        'window_start': {'S': current_time.isoformat()},
                        'ttl': {'N': str(ttl)}
                    }
                )
                return
            
            item = response['Item']
            window_start = datetime.fromisoformat(item['window_start']['S'])
            attempt_count = int(item['attempt_count']['N'])
            
            # Check if window has expired
            window_age = (current_time - window_start).total_seconds()
            
            if window_age > self.window_seconds:
                # Start new window
                ttl = int((current_time + timedelta(seconds=self.window_seconds)).timestamp())
                self.dynamodb.put_item(
                    TableName=self.table_name,
                    Item={
                        'device_id': {'S': device_id},
                        'attempt_count': {'N': '1'},
                        'window_start': {'S': current_time.isoformat()},
                        'ttl': {'N': str(ttl)}
                    }
                )
                return
            
            # Increment attempt count
            new_count = attempt_count + 1
            ttl = int((window_start + timedelta(seconds=self.window_seconds)).timestamp())
            
            update_item = {
                'device_id': {'S': device_id},
                'attempt_count': {'N': str(new_count)},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(ttl)}
            }
            
            # If limit exceeded, add blocked_until timestamp
            if new_count >= self.max_attempts:
                blocked_until = window_start + timedelta(seconds=self.window_seconds)
                update_item['blocked_until'] = {'S': blocked_until.isoformat()}
            
            self.dynamodb.put_item(
                TableName=self.table_name,
                Item=update_item
            )
            
        except ClientError as e:
            # Log error but don't raise (fail open for availability)
            print(f"Error recording attempt: {e}")
    
    def clear_rate_limit(self, device_id: str) -> None:
        """
        Clear the rate limit record for a device.
        
        This can be used for administrative purposes or after successful
        authentication to reset the counter.
        
        Args:
            device_id: Unique device identifier
        """
        try:
            self.dynamodb.delete_item(
                TableName=self.table_name,
                Key={'device_id': {'S': device_id}}
            )
        except ClientError as e:
            print(f"Error clearing rate limit: {e}")
    
    def get_rate_limit_info(self, device_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current rate limit information for a device.
        
        Useful for debugging and monitoring purposes.
        
        Args:
            device_id: Unique device identifier
            
        Returns:
            Optional[dict]: Rate limit info or None if no record exists
        """
        try:
            response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={'device_id': {'S': device_id}}
            )
            
            if 'Item' not in response:
                return None
            
            item = response['Item']
            
            info = {
                "device_id": device_id,
                "attempt_count": int(item['attempt_count']['N']),
                "window_start": item['window_start']['S'],
                "ttl": int(item['ttl']['N'])
            }
            
            if 'blocked_until' in item:
                info['blocked_until'] = item['blocked_until']['S']
            
            return info
            
        except ClientError as e:
            print(f"Error getting rate limit info: {e}")
            return None
