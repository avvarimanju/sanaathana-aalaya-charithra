"""
Admin API Handler Lambda

This Lambda function handles all admin API requests.
It routes requests to appropriate handlers based on the HTTP method and path.
"""

import json
import os
import sys
from typing import Dict, Any
import boto3
from datetime import datetime

# Add config directory to path for global config import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from config.global_config import global_config

# Add handlers directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from handlers.temple_handler import handle_temple_request
from handlers.artifact_handler import handle_artifact_request
from handlers.content_job_handler import handle_content_job_request
from handlers.analytics_handler import handle_analytics_request
from handlers.user_handler import handle_user_request
from handlers.config_handler import handle_config_request
from handlers.moderation_handler import handle_moderation_request
from handlers.cost_handler import handle_cost_request
from handlers.payment_handler import handle_payment_request

# Environment variables
ADMIN_USERS_TABLE = os.environ.get("ADMIN_USERS_TABLE")
SYSTEM_CONFIG_TABLE = os.environ.get("SYSTEM_CONFIG_TABLE")
AUDIT_LOG_TABLE = os.environ.get("AUDIT_LOG_TABLE")
NOTIFICATIONS_TABLE = os.environ.get("NOTIFICATIONS_TABLE")
CONTENT_MODERATION_TABLE = os.environ.get("CONTENT_MODERATION_TABLE")
AWS_REGION = global_config.aws_region  # Now uses global config instead of hardcoded fallback

# AWS clients
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for admin API requests
    
    Args:
        event: API Gateway proxy event
        context: Lambda context
        
    Returns:
        API Gateway proxy response
    """
    try:
        # Extract request details
        http_method = event.get("httpMethod")
        path = event.get("path")
        body = json.loads(event.get("body", "{}")) if event.get("body") else {}
        query_params = event.get("queryStringParameters") or {}
        
        # Extract user context from authorizer
        request_context = event.get("requestContext", {})
        authorizer = request_context.get("authorizer", {})
        user_id = authorizer.get("userId")
        user_email = authorizer.get("email")
        user_role = authorizer.get("role")
        
        # Log request
        print(f"Request: {http_method} {path} by {user_email}")
        
        # Route request
        response_body = route_request(
            http_method,
            path,
            body,
            query_params,
            user_id,
            user_email,
            user_role,
        )
        
        # Log audit trail
        log_audit_trail(
            user_id,
            user_email,
            http_method,
            path,
            body,
            success=True,
        )
        
        # Return success response
        return create_response(200, response_body)
        
    except ValueError as e:
        # Validation error
        print(f"Validation error: {str(e)}")
        return create_response(400, {"error": "Validation Error", "message": str(e)})
        
    except PermissionError as e:
        # Permission error
        print(f"Permission error: {str(e)}")
        return create_response(403, {"error": "Forbidden", "message": str(e)})
        
    except Exception as e:
        # Internal error
        print(f"Internal error: {str(e)}")
        
        # Log failed audit trail
        try:
            log_audit_trail(
                user_id if 'user_id' in locals() else "unknown",
                user_email if 'user_email' in locals() else "unknown",
                http_method,
                path,
                body if 'body' in locals() else {},
                success=False,
                error_message=str(e),
            )
        except:
            pass
        
        return create_response(
            500,
            {
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "requestId": context.request_id,
            },
        )


def route_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
    user_email: str,
    user_role: str,
) -> Dict[str, Any]:
    """
    Route request to appropriate handler
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID
        user_email: User email
        user_role: User role
        
    Returns:
        Response body
    """
    # Health check endpoint
    if path == "/admin/health":
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "user": user_email,
        }
    
    # Temple management endpoints
    if path.startswith("/admin/temples"):
        return handle_temple_request(method, path, body, query_params, user_id)
    
    # Artifact management endpoints
    if path.startswith("/admin/artifacts"):
        return handle_artifact_request(method, path, body, query_params, user_id)
    
    # Content job monitoring endpoints
    if path.startswith("/admin/content-jobs"):
        return handle_content_job_request(method, path, body, query_params, user_id)
    
    # Analytics endpoints
    if path.startswith("/admin/analytics"):
        return handle_analytics_request(method, path, body, query_params, user_id)
    
    # User management endpoints
    if path.startswith("/admin/users"):
        return handle_user_request(method, path, body, query_params, user_id)
    
    # System configuration endpoints
    if path.startswith("/admin/config"):
        return handle_config_request(method, path, body, query_params, user_id)
    
    # Content moderation endpoints
    if path.startswith("/admin/moderation"):
        return handle_moderation_request(method, path, body, query_params, user_id)
    
    # Cost monitoring endpoints
    if path.startswith("/admin/costs"):
        return handle_cost_request(method, path, body, query_params, user_id)
    
    # Payment management endpoints
    if path.startswith("/admin/payments"):
        return handle_payment_request(method, path, body, query_params, user_id)
    
    # Default response for unimplemented endpoints
    return {
        "message": "Endpoint not yet implemented",
        "method": method,
        "path": path,
    }


def log_audit_trail(
    user_id: str,
    user_email: str,
    method: str,
    path: str,
    body: Dict[str, Any],
    success: bool,
    error_message: str = None,
) -> None:
    """
    Log action to audit trail
    
    Args:
        user_id: User ID
        user_email: User email
        method: HTTP method
        path: Request path
        body: Request body
        success: Whether action succeeded
        error_message: Error message if failed
    """
    try:
        audit_table = dynamodb.Table(AUDIT_LOG_TABLE)
        
        # Generate audit ID (ULID or UUID)
        import uuid
        audit_id = str(uuid.uuid4())
        
        timestamp = datetime.utcnow().isoformat()
        
        # Calculate TTL (365 days from now)
        import time
        ttl = int(time.time()) + (365 * 24 * 60 * 60)
        
        audit_entry = {
            "auditId": audit_id,
            "timestamp": timestamp,
            "userId": user_id,
            "userName": user_email,
            "action": f"{method} {path}",
            "resource": path.split("/")[2] if len(path.split("/")) > 2 else "unknown",
            "resourceId": body.get("id", "N/A"),
            "success": success,
            "ttl": ttl,
        }
        
        if error_message:
            audit_entry["errorMessage"] = error_message
        
        audit_table.put_item(Item=audit_entry)
        
    except Exception as e:
        print(f"Error logging audit trail: {str(e)}")


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create API Gateway response
    
    Args:
        status_code: HTTP status code
        body: Response body
        
    Returns:
        API Gateway response
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body),
    }
