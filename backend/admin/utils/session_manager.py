"""
Session Manager Utility

Manages admin user sessions with 8-hour timeout.
"""

import time
from typing import Dict, Any, Optional
import boto3
from datetime import datetime, timedelta

# AWS clients
dynamodb = boto3.resource("dynamodb")


class SessionManager:
    """Manages admin user sessions"""
    
    def __init__(self, table_name: str = "SanaathanaAalayaCharithra-AdminSessions"):
        self.table = dynamodb.Table(table_name)
        self.session_timeout_hours = 8
    
    def create_session(self, user_id: str, token_jti: str) -> str:
        """
        Create new session
        
        Args:
            user_id: User identifier
            token_jti: JWT token ID
            
        Returns:
            Session ID
        """
        try:
            current_time = int(time.time())
            expires_at = current_time + (self.session_timeout_hours * 3600)
            
            session_id = f"{user_id}:{token_jti}"
            
            self.table.put_item(
                Item={
                    "sessionId": session_id,
                    "userId": user_id,
                    "tokenJti": token_jti,
                    "createdAt": current_time,
                    "expiresAt": expires_at,
                    "lastActivity": current_time,
                    "ttl": expires_at + 3600,  # Auto-delete 1 hour after expiry
                }
            )
            
            return session_id
            
        except Exception as e:
            print(f"Error creating session: {str(e)}")
            raise
    
    def validate_session(self, user_id: str, token_jti: str) -> bool:
        """
        Validate session is active and not expired
        
        Args:
            user_id: User identifier
            token_jti: JWT token ID
            
        Returns:
            True if session is valid, False otherwise
        """
        try:
            session_id = f"{user_id}:{token_jti}"
            
            response = self.table.get_item(
                Key={"sessionId": session_id}
            )
            
            if "Item" not in response:
                return False
            
            session = response["Item"]
            current_time = int(time.time())
            
            # Check if session expired
            if session["expiresAt"] < current_time:
                return False
            
            # Update last activity
            self.table.update_item(
                Key={"sessionId": session_id},
                UpdateExpression="SET lastActivity = :activity",
                ExpressionAttributeValues={
                    ":activity": current_time,
                },
            )
            
            return True
            
        except Exception as e:
            print(f"Error validating session: {str(e)}")
            return False
    
    def terminate_session(self, user_id: str, token_jti: str) -> None:
        """
        Terminate session
        
        Args:
            user_id: User identifier
            token_jti: JWT token ID
        """
        try:
            session_id = f"{user_id}:{token_jti}"
            self.table.delete_item(Key={"sessionId": session_id})
        except Exception as e:
            print(f"Error terminating session: {str(e)}")
    
    def terminate_all_user_sessions(self, user_id: str) -> int:
        """
        Terminate all sessions for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of sessions terminated
        """
        try:
            # Query all sessions for user
            response = self.table.query(
                IndexName="UserIdIndex",
                KeyConditionExpression="userId = :uid",
                ExpressionAttributeValues={":uid": user_id},
            )
            
            sessions = response.get("Items", [])
            count = 0
            
            for session in sessions:
                self.table.delete_item(
                    Key={"sessionId": session["sessionId"]}
                )
                count += 1
            
            return count
            
        except Exception as e:
            print(f"Error terminating user sessions: {str(e)}")
            return 0
