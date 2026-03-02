"""
Profile Handler Lambda

This Lambda function handles user profile operations including account linking,
unlinking, and profile retrieval.

Endpoints:
- POST /profile/link/{provider} - Link additional social provider to profile
- DELETE /profile/unlink/{provider} - Unlink social provider from profile
- GET /profile/me - Get current user profile

Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 12.3
"""

import json
import logging
import traceback
from typing import Dict, Any, Optional

from ..services.profile_service import ProfileService
from ..services.token_service import TokenService
from ..services.oauth_service import OAuthService
from ..config import AuthConfig, AuthErrorCode

# Configure logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, AuthConfig.LOG_LEVEL))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for profile management endpoints.
    
    Routes requests to appropriate handler based on path and method.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        dict: API Gateway response
    """
    try:
        # Log request
        logger.info(f"Profile request: {event.get('path')} {event.get('httpMethod')}")
        
        # Extract path and method
        path = event.get("path", "")
        method = event.get("httpMethod", "")
        path_parameters = event.get("pathParameters", {})
        
        # Route to appropriate handler
        if "/profile/link/" in path and method == "POST":
            return handle_link_provider(event, path_parameters)
        elif "/profile/unlink/" in path and method == "DELETE":
            return handle_unlink_provider(event, path_parameters)
        elif "/profile/me" in path and method == "GET":
            return handle_get_profile(event)
        else:
            return create_error_response(
                404,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Endpoint not found"
            )
            
    except Exception as e:
        logger.error(f"Unhandled error in profile handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Internal server error"
        )


def handle_link_provider(event: Dict[str, Any], path_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle POST /profile/link/{provider} endpoint.
    
    Links an additional social provider to the authenticated user's profile.
    
    Args:
        event: API Gateway event
        path_params: Path parameters containing provider
        
    Returns:
        dict: API Gateway response with updated linked providers list
        
    Requirements: 9.1, 9.2, 9.3
    """
    try:
        # Extract and validate access token
        access_token = extract_access_token(event)
        
        if not access_token:
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Authorization header is required"
            )
        
        # Get user from token
        token_service = TokenService()
        
        try:
            user_info = token_service.get_user_from_token(access_token)
            user_id = user_info["user_id"]
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Invalid or expired access token"
            )
        
        # Extract provider from path
        provider = path_params.get("provider", "").lower()
        
        # Validate provider
        if not AuthConfig.is_valid_provider(provider):
            logger.warning(f"Invalid provider for linking: {provider}")
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_PROVIDER,
                f"Provider '{provider}' is not supported"
            )
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        code = body.get("code", "")
        state = body.get("state", "")
        
        # Validate required parameters
        if not code:
            return create_error_response(
                400,
                AuthErrorCode.AUTH_PROVIDER_ERROR,
                "Authorization code is required"
            )
        
        if not state:
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_STATE,
                "State parameter is required"
            )
        
        # Handle OAuth callback to get provider user info
        oauth_service = OAuthService()
        
        try:
            callback_result = oauth_service.handle_callback(provider, code, state)
        except ValueError as e:
            logger.error(f"State validation failed during linking: {str(e)}")
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_STATE,
                str(e)
            )
        except Exception as e:
            logger.error(f"OAuth callback failed during linking: {str(e)}")
            return create_error_response(
                500,
                AuthErrorCode.AUTH_PROVIDER_ERROR,
                f"Failed to authenticate with {provider}"
            )
        
        user_claims = callback_result["user_claims"]
        provider_user_id = user_claims.get("sub", "")
        provider_email = user_claims.get("email", "")
        
        # Link provider to user profile
        profile_service = ProfileService()
        
        try:
            success = profile_service.link_provider(
                user_id,
                provider,
                provider_user_id,
                provider_email
            )
        except Exception as e:
            error_message = str(e)
            
            # Check if account is already linked to different user
            if AuthErrorCode.AUTH_ACCOUNT_ALREADY_LINKED in error_message:
                logger.warning(f"Provider {provider} already linked to different user")
                return create_error_response(
                    409,
                    AuthErrorCode.AUTH_ACCOUNT_ALREADY_LINKED,
                    f"This {provider} account is already linked to another user"
                )
            
            # Other errors
            logger.error(f"Failed to link provider: {error_message}")
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to link provider"
            )
        
        # Get updated profile
        updated_profile = profile_service.get_profile(user_id)
        
        if not updated_profile:
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to retrieve updated profile"
            )
        
        # Build response
        linked_providers = [
            p["provider"] for p in updated_profile.get("linked_providers", [])
        ]
        
        response_data = {
            "success": success,
            "linked_providers": linked_providers
        }
        
        logger.info(f"Provider {provider} linked successfully for user {user_id}")
        
        return create_success_response(200, response_data)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_error_response(
            400,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Invalid request body"
        )
    except Exception as e:
        logger.error(f"Error in link provider handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to link provider"
        )


def handle_unlink_provider(event: Dict[str, Any], path_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle DELETE /profile/unlink/{provider} endpoint.
    
    Unlinks a social provider from the authenticated user's profile.
    Prevents unlinking if it's the last remaining provider.
    
    Args:
        event: API Gateway event
        path_params: Path parameters containing provider
        
    Returns:
        dict: API Gateway response with updated linked providers list
        
    Requirements: 9.5, 9.6
    """
    try:
        # Extract and validate access token
        access_token = extract_access_token(event)
        
        if not access_token:
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Authorization header is required"
            )
        
        # Get user from token
        token_service = TokenService()
        
        try:
            user_info = token_service.get_user_from_token(access_token)
            user_id = user_info["user_id"]
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Invalid or expired access token"
            )
        
        # Extract provider from path
        provider = path_params.get("provider", "").lower()
        
        # Validate provider
        if not AuthConfig.is_valid_provider(provider):
            logger.warning(f"Invalid provider for unlinking: {provider}")
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_PROVIDER,
                f"Provider '{provider}' is not supported"
            )
        
        # Unlink provider from profile
        profile_service = ProfileService()
        
        try:
            success = profile_service.unlink_provider(user_id, provider)
        except Exception as e:
            error_message = str(e)
            
            # Check if trying to unlink last provider
            if AuthErrorCode.AUTH_CANNOT_UNLINK_LAST_PROVIDER in error_message:
                logger.warning(f"Attempt to unlink last provider for user {user_id}")
                return create_error_response(
                    400,
                    AuthErrorCode.AUTH_CANNOT_UNLINK_LAST_PROVIDER,
                    "Cannot unlink the last remaining provider. Users must have at least one linked provider."
                )
            
            # Other errors
            logger.error(f"Failed to unlink provider: {error_message}")
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to unlink provider"
            )
        
        # Get updated profile
        updated_profile = profile_service.get_profile(user_id)
        
        if not updated_profile:
            return create_error_response(
                500,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Failed to retrieve updated profile"
            )
        
        # Build response
        linked_providers = [
            p["provider"] for p in updated_profile.get("linked_providers", [])
        ]
        
        response_data = {
            "success": success,
            "linked_providers": linked_providers
        }
        
        logger.info(f"Provider {provider} unlinked successfully for user {user_id}")
        
        return create_success_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in unlink provider handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to unlink provider"
        )


def handle_get_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle GET /profile/me endpoint.
    
    Retrieves the authenticated user's profile information.
    
    Args:
        event: API Gateway event
        
    Returns:
        dict: API Gateway response with user profile
        
    Requirements: 9.4, 12.3
    """
    try:
        # Extract and validate access token
        access_token = extract_access_token(event)
        
        if not access_token:
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Authorization header is required"
            )
        
        # Get user from token
        token_service = TokenService()
        
        try:
            user_info = token_service.get_user_from_token(access_token)
            user_id = user_info["user_id"]
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return create_error_response(
                401,
                AuthErrorCode.AUTH_INVALID_TOKEN,
                "Invalid or expired access token"
            )
        
        # Get user profile
        profile_service = ProfileService()
        profile = profile_service.get_profile(user_id)
        
        if not profile:
            logger.error(f"Profile not found for user: {user_id}")
            return create_error_response(
                404,
                AuthErrorCode.AUTH_USER_NOT_FOUND,
                "User profile not found"
            )
        
        # Build response with sanitized profile data
        user_profile = {
            "user_id": profile["user_id"],
            "email": profile.get("email", ""),
            "email_verified": profile.get("email_verified", False),
            "name": profile.get("name", ""),
            "profile_picture_url": profile.get("profile_picture_url"),
            "linked_providers": [
                {
                    "provider": p["provider"],
                    "email": p.get("email", ""),
                    "linked_at": p.get("linked_at", "")
                }
                for p in profile.get("linked_providers", [])
            ],
            "created_at": profile.get("created_at", ""),
            "last_sign_in": profile.get("last_sign_in", ""),
            "last_sign_in_provider": profile.get("last_sign_in_provider", "")
        }
        
        response_data = {
            "user_profile": user_profile
        }
        
        logger.info(f"Profile retrieved for user: {user_id}")
        
        return create_success_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in get profile handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to retrieve profile"
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
