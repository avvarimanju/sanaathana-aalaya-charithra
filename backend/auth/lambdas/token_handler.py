"""
Token Handler Lambda

This Lambda function handles token refresh and sign-out operations.

Endpoints:
- POST /auth/refresh - Refresh access token using refresh token
- POST /auth/signout - Sign out user and revoke session

Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 12.2, 12.4
"""

import json
import logging
import traceback
from typing import Dict, Any, Optional

from ..services.token_service import TokenService
from ..config import AuthConfig, AuthErrorCode

# Configure logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, AuthConfig.LOG_LEVEL))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for token management endpoints.
    
    Routes requests to appropriate handler based on path and method.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        dict: API Gateway response
    """
    try:
        # Log request
        logger.info(f"Token request: {event.get('path')} {event.get('httpMethod')}")
        
        # Extract path and method
        path = event.get("path", "")
        method = event.get("httpMethod", "")
        
        # Route to appropriate handler
        if "/auth/refresh" in path and method == "POST":
            return handle_refresh_token(event)
        elif "/auth/signout" in path and method == "POST":
            return handle_signout(event)
        else:
            return create_error_response(
                404,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Endpoint not found"
            )
            
    except Exception as e:
        logger.error(f"Unhandled error in token handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Internal server error"
        )


def handle_refresh_token(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST /auth/refresh endpoint.
    
    Refreshes access token using a valid refresh token.
    
    Args:
        event: API Gateway event
        
    Returns:
        dict: API Gateway response with new access token
        
    Requirements: 8.3, 8.4, 8.5, 8.6
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        refresh_token = body.get("refresh_token", "")
        
        # Validate refresh token parameter
        if not refresh_token:
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "refresh_token is required"
            )
        
        # Refresh access token
        token_service = TokenService()
        
        try:
            new_tokens = token_service.refresh_access_token(refresh_token)
        except Exception as e:
            error_message = str(e)
            
            # Check if it's a session expired error
            if AuthErrorCode.AUTH_SESSION_EXPIRED in error_message:
                logger.warning(f"Refresh token expired or invalid")
                return create_error_response(
                    401,
                    AuthErrorCode.AUTH_SESSION_EXPIRED,
                    "Refresh token is invalid or expired. Please sign in again."
                )
            
            # Other token service errors
            logger.error(f"Token refresh failed: {error_message}")
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to refresh access token"
            )
        
        # Build response
        response_data = {
            "access_token": new_tokens["access_token"],
            "id_token": new_tokens["id_token"],
            "expires_in": new_tokens["expires_in"],
            "token_type": new_tokens["token_type"]
        }
        
        logger.info("Access token refreshed successfully")
        
        return create_success_response(200, response_data)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_error_response(
            400,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Invalid request body"
        )
    except Exception as e:
        logger.error(f"Error in refresh token handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to refresh access token"
        )


def handle_signout(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST /auth/signout endpoint.
    
    Signs out user and revokes all session tokens.
    
    Args:
        event: API Gateway event
        
    Returns:
        dict: API Gateway response confirming sign-out
        
    Requirements: 8.7, 12.4
    """
    try:
        # Extract access token from Authorization header
        access_token = extract_access_token(event)
        
        if not access_token:
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Authorization header is required"
            )
        
        # Revoke session
        token_service = TokenService()
        
        try:
            success = token_service.revoke_session(access_token)
        except Exception as e:
            error_message = str(e)
            
            # Check if token is already invalid
            if "NotAuthorizedException" in error_message or "invalid" in error_message.lower():
                # Token already invalid, consider sign-out successful
                logger.info("Sign-out requested with invalid token (already signed out)")
                return create_success_response(200, {"success": True})
            
            # Other errors
            logger.error(f"Sign-out failed: {error_message}")
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to sign out"
            )
        
        logger.info("User signed out successfully")
        
        return create_success_response(200, {"success": success})
        
    except Exception as e:
        logger.error(f"Error in signout handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to sign out"
        )


def extract_access_token(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract access token from Authorization header.
    
    Expects header format: "Bearer <token>"
    
    Args:
        event: API Gateway event
        
    Returns:
        Optional[str]: Access token or None if not found
    """
    headers = event.get("headers", {})
    
    # Try both lowercase and capitalized header names
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header:
        return None
    
    # Extract token from "Bearer <token>" format
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def create_success_response(status_code: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create successful API Gateway response.
    
    Args:
        status_code: HTTP status code
        data: Response data
        
    Returns:
        dict: API Gateway response
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(data)
    }


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create error API Gateway response.
    
    Args:
        status_code: HTTP status code
        error_code: Standardized error code
        message: Human-readable error message
        details: Optional additional error details
        
    Returns:
        dict: API Gateway response
    """
    error_body = {
        "error": {
            "code": error_code,
            "message": message
        }
    }
    
    if details:
        error_body["error"]["details"] = details
    
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(error_body)
    }
