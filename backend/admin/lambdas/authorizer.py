"""
Custom Authorizer Lambda for Admin API

This Lambda function validates JWT tokens from AWS Cognito and checks
user permissions before allowing access to admin API endpoints.
"""

import json
import os
import sys
import time
from typing import Dict, Any, List
import jwt
from jwt import PyJWKClient
import boto3

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.rate_limiter import RateLimiter
from utils.session_manager import SessionManager

# Environment variables
USER_POOL_ID = os.environ.get("USER_POOL_ID")
ADMIN_USERS_TABLE = os.environ.get("ADMIN_USERS_TABLE")
RATE_LIMITS_TABLE = os.environ.get("RATE_LIMITS_TABLE")
ADMIN_SESSIONS_TABLE = os.environ.get("ADMIN_SESSIONS_TABLE")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# AWS clients
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
admin_users_table = dynamodb.Table(ADMIN_USERS_TABLE)

# Cognito JWKS URL
JWKS_URL = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"

# Initialize utilities
rate_limiter = RateLimiter(RATE_LIMITS_TABLE)
session_manager = SessionManager(ADMIN_SESSIONS_TABLE)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for custom authorizer
    
    Args:
        event: API Gateway authorizer event
        context: Lambda context
        
    Returns:
        IAM policy document
    """
    try:
        # Extract token from Authorization header
        token = event.get("authorizationToken", "").replace("Bearer ", "")
        
        if not token:
            raise Exception("Unauthorized: No token provided")
        
        # Verify JWT token
        decoded_token = verify_token(token)
        
        # Get user ID from token
        user_id = decoded_token.get("sub")
        token_jti = decoded_token.get("jti")
        
        if not user_id:
            raise Exception("Unauthorized: Invalid token")
        
        # Check rate limit
        if not rate_limiter.check_rate_limit(user_id):
            raise Exception("Unauthorized: Rate limit exceeded")
        
        # Get user from DynamoDB
        user = get_admin_user(user_id)
        
        if not user or user.get("status") != "ACTIVE":
            raise Exception("Unauthorized: User not active")
        
        # Validate session
        if token_jti:
            # Check if session exists, if not create it
            if not session_manager.validate_session(user_id, token_jti):
                # Create new session for first-time token
                try:
                    session_manager.create_session(user_id, token_jti)
                except Exception as e:
                    print(f"Warning: Could not create session: {str(e)}")
        
        # Generate IAM policy
        policy = generate_policy(
            user_id,
            "Allow",
            event["methodArn"],
            {
                "userId": user_id,
                "email": user.get("email"),
                "role": user.get("role"),
                "permissions": ",".join(user.get("permissions", [])),
            },
        )
        
        return policy
        
    except Exception as e:
        print(f"Authorization error: {str(e)}")
        # Return Deny policy
        return generate_policy("user", "Deny", event["methodArn"])


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token from Cognito
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        Exception: If token is invalid
    """
    try:
        # Get signing key from JWKS
        jwks_client = PyJWKClient(JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify token
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True},
        )
        
        return decoded
        
    except jwt.ExpiredSignatureError:
        raise Exception("Unauthorized: Token expired")
    except jwt.InvalidTokenError as e:
        raise Exception(f"Unauthorized: Invalid token - {str(e)}")


def get_admin_user(user_id: str) -> Dict[str, Any]:
    """
    Get admin user from DynamoDB
    
    Args:
        user_id: User ID (Cognito sub)
        
    Returns:
        User object or None
    """
    try:
        response = admin_users_table.get_item(Key={"userId": user_id})
        return response.get("Item")
    except Exception as e:
        print(f"Error getting user: {str(e)}")
        return None


def generate_policy(
    principal_id: str,
    effect: str,
    resource: str,
    context: Dict[str, str] = None,
) -> Dict[str, Any]:
    """
    Generate IAM policy document
    
    Args:
        principal_id: User identifier
        effect: Allow or Deny
        resource: API Gateway method ARN
        context: Additional context to pass to Lambda
        
    Returns:
        IAM policy document
    """
    policy = {
        "principalId": principal_id,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource,
                }
            ],
        },
    }
    
    if context:
        policy["context"] = context
    
    return policy
