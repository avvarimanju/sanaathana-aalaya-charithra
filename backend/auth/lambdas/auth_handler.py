"""
Authentication Handler Lambda

This Lambda function handles OAuth authentication flows for all social providers.
It provides endpoints for initiating OAuth flows and handling OAuth callbacks.

Endpoints:
- POST /auth/initiate/{provider} - Initiate OAuth flow
- POST /auth/callback/{provider} - Handle OAuth callback

Requirements: 1.1-7.6, 10.1, 10.2, 12.1, 13.4, 13.6
"""

import json
import logging
import traceback
from typing import Dict, Any, Optional

from ..services.oauth_service import OAuthService
from ..services.token_service import TokenService
from ..services.profile_service import ProfileService
from ..utils.rate_limiter import RateLimiter
from ..config import AuthConfig, AuthErrorCode

# Configure logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, AuthConfig.LOG_LEVEL))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for authentication endpoints.
    
    Routes requests to appropriate handler based on path and method.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        dict: API Gateway response
    """
    try:
        # Log request
        logger.info(f"Authentication request: {event.get('path')} {event.get('httpMethod')}")
        
        # Extract path and method
        path = event.get("path", "")
        method = event.get("httpMethod", "")
        path_parameters = event.get("pathParameters", {})
        
        # Route to appropriate handler
        if "/auth/initiate/" in path and method == "POST":
            return handle_initiate_auth(event, path_parameters)
        elif "/auth/callback/" in path and method == "POST":
            return handle_callback(event, path_parameters)
        else:
            return create_error_response(
                404,
                AuthErrorCode.AUTH_INTERNAL_ERROR,
                "Endpoint not found"
            )
            
    except Exception as e:
        logger.error(f"Unhandled error in auth handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Internal server error"
        )


def handle_initiate_auth(event: Dict[str, Any], path_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle POST /auth/initiate/{provider} endpoint.
    
    Initiates OAuth flow for the specified provider.
    
    Args:
        event: API Gateway event
        path_params: Path parameters containing provider
        
    Returns:
        dict: API Gateway response with authorization URL and state
        
    Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 10.6
    """
    try:
        # Extract provider from path
        provider = path_params.get("provider", "").lower()
        
        # Validate provider
        if not AuthConfig.is_valid_provider(provider):
            logger.warning(f"Invalid provider requested: {provider}")
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_PROVIDER,
                f"Provider '{provider}' is not supported"
            )
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        redirect_uri = body.get("redirect_uri", "")
        
        # Validate redirect URI
        if not redirect_uri:
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_REDIRECT_URI,
                "redirect_uri is required"
            )
        
        if not AuthConfig.is_redirect_uri_allowed(redirect_uri):
            logger.warning(f"Unauthorized redirect URI: {redirect_uri}")
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_REDIRECT_URI,
                "redirect_uri is not in the allowed list"
            )
        
        # Check rate limiting
        device_id = extract_device_id(event)
        rate_limiter = RateLimiter()
        
        if not rate_limiter.check_rate_limit(device_id):
            logger.warning(f"Rate limit exceeded for device: {device_id}")
            return create_error_response(
                429,
                AuthErrorCode.AUTH_RATE_LIMITED,
                "Too many authentication attempts. Please try again later.",
                {"retry_after": 900}  # 15 minutes
            )
        
        # Initiate OAuth flow
        oauth_service = OAuthService()
        result = oauth_service.initiate_auth(provider, redirect_uri)
        
        logger.info(f"OAuth flow initiated for provider: {provider}")
        
        return create_success_response(200, result)
        
    except ValueError as e:
        logger.error(f"Validation error in initiate_auth: {str(e)}")
        return create_error_response(
            400,
            AuthErrorCode.AUTH_PROVIDER_ERROR,
            str(e)
        )
    except Exception as e:
        logger.error(f"Error in initiate_auth: {str(e)}")
        logger.error(traceback.format_exc())
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to initiate authentication"
        )


def handle_callback(event: Dict[str, Any], path_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle POST /auth/callback/{provider} endpoint.
    
    Handles OAuth callback, exchanges code for tokens, creates/retrieves user profile,
    and generates session tokens.
    
    Args:
        event: API Gateway event
        path_params: Path parameters containing provider
        
    Returns:
        dict: API Gateway response with session tokens and user profile
        
    Requirements: 1.1-7.6, 10.1, 10.2
    """
    try:
        # Extract provider from path
        provider = path_params.get("provider", "").lower()
        
        # Validate provider
        if not AuthConfig.is_valid_provider(provider):
            logger.warning(f"Invalid provider in callback: {provider}")
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
        
        # Check rate limiting
        device_id = extract_device_id(event)
        rate_limiter = RateLimiter()
        
        if not rate_limiter.check_rate_limit(device_id):
            logger.warning(f"Rate limit exceeded for device: {device_id}")
            return create_error_response(
                429,
                AuthErrorCode.AUTH_RATE_LIMITED,
                "Too many authentication attempts. Please try again later.",
                {"retry_after": 900}
            )
        
        # Handle OAuth callback
        oauth_service = OAuthService()
        
        try:
            callback_result = oauth_service.handle_callback(provider, code, state)
        except ValueError as e:
            # State validation failed - possible CSRF attack
            logger.error(f"State validation failed: {str(e)}")
            rate_limiter.record_attempt(device_id, success=False)
            
            return create_error_response(
                400,
                AuthErrorCode.AUTH_INVALID_STATE,
                str(e)
            )
        except Exception as e:
            # OAuth provider error
            logger.error(f"OAuth callback failed: {str(e)}")
            rate_limiter.record_attempt(device_id, success=False)
            
            # Check if it's an invalid token error
            if "invalid" in str(e).lower() or "token" in str(e).lower():
                return create_error_response(
                    401,
                    AuthErrorCode.AUTH_INVALID_TOKEN,
                    "Invalid or expired authorization code"
                )
            
            return create_error_response(
                500,
                AuthErrorCode.AUTH_PROVIDER_ERROR,
                f"Authentication with {provider} failed"
            )
        
        user_claims = callback_result["user_claims"]
        provider_user_id = user_claims.get("sub", "")
        
        # Create or retrieve user profile
        profile_service = ProfileService()
        
        # Check if user already exists
        existing_profile = profile_service.get_profile_by_provider(
            provider,
            provider_user_id
        )
        
        if existing_profile:
            # Update existing profile with latest provider data
            user_profile = profile_service.update_profile_from_provider(
                existing_profile["user_id"],
                user_claims
            )
            profile_service.update_last_sign_in(existing_profile["user_id"], provider)
            
            logger.info(f"User signed in: {existing_profile['user_id']}")
        else:
            # Create new profile
            user_profile = profile_service.create_profile(user_claims, provider)
            
            logger.info(f"New user created: {user_profile['user_id']}")
        
        # Generate session tokens
        token_service = TokenService()
        
        user_attributes = {
            "email": user_profile.get("email", ""),
            "name": user_profile.get("name", ""),
            "picture": user_profile.get("profile_picture_url", "")
        }
        
        session_tokens = token_service.generate_session_tokens(
            user_profile["user_id"],
            provider,
            user_attributes
        )
        
        # Record successful authentication
        rate_limiter.record_attempt(device_id, success=True)
        
        # Build response
        response_data = {
            "access_token": session_tokens["access_token"],
            "refresh_token": session_tokens["refresh_token"],
            "id_token": session_tokens["id_token"],
            "expires_in": session_tokens["expires_in"],
            "token_type": session_tokens["token_type"],
            "user_profile": {
                "user_id": user_profile["user_id"],
                "email": user_profile.get("email", ""),
                "name": user_profile.get("name", ""),
                "profile_picture_url": user_profile.get("profile_picture_url"),
                "email_verified": user_profile.get("email_verified", False),
                "linked_providers": [
                    p["provider"] for p in user_profile.get("linked_providers", [])
                ]
            }
        }
        
        logger.info(f"Authentication successful for user: {user_profile['user_id']}")
        
        return create_success_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error in callback handler: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Record failed attempt
        try:
            device_id = extract_device_id(event)
            rate_limiter = RateLimiter()
            rate_limiter.record_attempt(device_id, success=False)
        except Exception:
            pass
        
        return create_error_response(
            500,
            AuthErrorCode.AUTH_INTERNAL_ERROR,
            "Failed to complete authentication"
        )


def extract_device_id(event: Dict[str, Any]) -> str:
    """
    Extract device ID from request for rate limiting.
    
    Uses X-Device-ID header if available, otherwise falls back to source IP.
    
    Args:
        event: API Gateway event
        
    Returns:
        str: Device identifier
    """
    headers = event.get("headers", {})
    
    # Try X-Device-ID header first
    device_id = headers.get("X-Device-ID") or headers.get("x-device-id")
    
    if device_id:
        return device_id
    
    # Fall back to source IP
    request_context = event.get("requestContext", {})
    identity = request_context.get("identity", {})
    source_ip = identity.get("sourceIp", "unknown")
    
    return f"ip-{source_ip}"


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
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Device-ID",
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
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Device-ID",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        "body": json.dumps(error_body)
    }
