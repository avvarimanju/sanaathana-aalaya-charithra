"""
Error Handling Utilities

This module provides comprehensive error handling utilities for the authentication service.
It includes standardized error response builders, error logging, and provider-specific error mapping.

Requirements: 10.1, 10.2, 12.6
"""

import logging
import traceback
from typing import Dict, Any, Optional
from enum import Enum

from ..config import AuthErrorCode

# Configure logging
logger = logging.getLogger()


class ErrorSeverity(Enum):
    """Error severity levels for logging and monitoring."""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# Error message templates
ERROR_MESSAGES = {
    AuthErrorCode.AUTH_INVALID_TOKEN: "The provided authentication token is invalid or malformed",
    AuthErrorCode.AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again",
    AuthErrorCode.AUTH_ACCOUNT_ALREADY_LINKED: "This social account is already linked to another user",
    AuthErrorCode.AUTH_CANNOT_UNLINK_LAST_PROVIDER: "Cannot unlink the last authentication provider. Link another provider first",
    AuthErrorCode.AUTH_RATE_LIMITED: "Too many authentication attempts. Please try again later",
    AuthErrorCode.AUTH_INVALID_REDIRECT_URI: "The redirect URI is not authorized",
    AuthErrorCode.AUTH_PROVIDER_ERROR: "An error occurred with the authentication provider",
    AuthErrorCode.AUTH_INVALID_STATE: "Invalid state parameter. Possible CSRF attack detected",
    AuthErrorCode.AUTH_USER_NOT_FOUND: "User profile not found",
    AuthErrorCode.AUTH_INTERNAL_ERROR: "An internal error occurred. Please try again",
    AuthErrorCode.AUTH_INVALID_PROVIDER: "The specified authentication provider is not supported",
    AuthErrorCode.AUTH_MISSING_EMAIL: "Email address is required but was not provided by the authentication provider",
}


# Provider-specific error mapping
PROVIDER_ERROR_MAPPING = {
    "google": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "unauthorized_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "access_denied": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "facebook": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "access_denied": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "instagram": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "access_denied": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "apple": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "unauthorized_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "twitter": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "access_denied": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "github": {
        "bad_verification_code": AuthErrorCode.AUTH_INVALID_TOKEN,
        "incorrect_client_credentials": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "access_denied": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
    "microsoft": {
        "invalid_grant": AuthErrorCode.AUTH_INVALID_TOKEN,
        "invalid_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
        "unauthorized_client": AuthErrorCode.AUTH_PROVIDER_ERROR,
    },
}


def create_error_response(
    status_code: int,
    error_code: str,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    log_traceback: bool = False
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        status_code: HTTP status code
        error_code: Application error code from AuthErrorCode
        message: Optional custom error message (uses default if not provided)
        details: Optional additional error details
        log_traceback: Whether to log the full traceback
        
    Returns:
        dict: API Gateway response with standardized error format
        
    Example:
        >>> create_error_response(
        ...     400,
        ...     AuthErrorCode.AUTH_INVALID_TOKEN,
        ...     "Token signature verification failed"
        ... )
        {
            "statusCode": 400,
            "headers": {...},
            "body": '{"error": {"code": "AUTH_INVALID_TOKEN", "message": "..."}}'
        }
    """
    # Use default message if not provided
    if message is None:
        message = ERROR_MESSAGES.get(error_code, "An error occurred")
    
    # Build error response body
    error_body = {
        "error": {
            "code": error_code,
            "message": message
        }
    }
    
    # Add details if provided
    if details:
        error_body["error"]["details"] = details
    
    # Log error with structured format
    log_error(error_code, message, status_code, details, log_traceback)
    
    # Return API Gateway response
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        },
        "body": str(error_body).replace("'", '"')
    }


def create_success_response(
    status_code: int,
    data: Dict[str, Any],
    message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        status_code: HTTP status code (typically 200 or 201)
        data: Response data
        message: Optional success message
        
    Returns:
        dict: API Gateway response with standardized success format
        
    Example:
        >>> create_success_response(200, {"user_id": "123", "email": "user@example.com"})
        {
            "statusCode": 200,
            "headers": {...},
            "body": '{"data": {"user_id": "123", "email": "user@example.com"}}'
        }
    """
    # Build response body
    response_body = {"data": data}
    
    # Add message if provided
    if message:
        response_body["message"] = message
    
    # Return API Gateway response
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        },
        "body": str(response_body).replace("'", '"')
    }


def log_error(
    error_code: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    log_traceback: bool = False
) -> None:
    """
    Log error with structured format for CloudWatch.
    
    Args:
        error_code: Application error code
        message: Error message
        status_code: HTTP status code
        details: Optional additional error details
        log_traceback: Whether to log the full traceback
    """
    # Determine severity based on status code
    if status_code >= 500:
        severity = ErrorSeverity.ERROR
    elif status_code >= 400:
        severity = ErrorSeverity.WARNING
    else:
        severity = ErrorSeverity.INFO
    
    # Build structured log entry
    log_entry = {
        "severity": severity.value,
        "error_code": error_code,
        "message": message,
        "status_code": status_code,
    }
    
    # Add details if provided
    if details:
        log_entry["details"] = details
    
    # Add traceback if requested
    if log_traceback:
        log_entry["traceback"] = traceback.format_exc()
    
    # Log based on severity
    if severity == ErrorSeverity.CRITICAL or severity == ErrorSeverity.ERROR:
        logger.error(log_entry)
    elif severity == ErrorSeverity.WARNING:
        logger.warning(log_entry)
    else:
        logger.info(log_entry)


def map_provider_error(provider: str, provider_error: str) -> str:
    """
    Map provider-specific error codes to standardized error codes.
    
    Args:
        provider: Social provider name
        provider_error: Error code from provider
        
    Returns:
        str: Standardized AuthErrorCode
        
    Example:
        >>> map_provider_error("google", "invalid_grant")
        'AUTH_INVALID_TOKEN'
    """
    provider_mapping = PROVIDER_ERROR_MAPPING.get(provider, {})
    return provider_mapping.get(provider_error, AuthErrorCode.AUTH_PROVIDER_ERROR)


def handle_exception(
    exception: Exception,
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Handle unexpected exceptions and return standardized error response.
    
    Args:
        exception: The exception that was raised
        context: Optional context about where the exception occurred
        
    Returns:
        dict: API Gateway error response
        
    Example:
        >>> try:
        ...     risky_operation()
        ... except Exception as e:
        ...     return handle_exception(e, "OAuth callback processing")
    """
    # Log the exception with full traceback
    error_message = f"Unexpected error: {str(exception)}"
    if context:
        error_message = f"{context}: {error_message}"
    
    logger.error(
        {
            "severity": ErrorSeverity.ERROR.value,
            "error_code": AuthErrorCode.AUTH_INTERNAL_ERROR,
            "message": error_message,
            "exception_type": type(exception).__name__,
            "traceback": traceback.format_exc(),
        }
    )
    
    # Return generic error response (don't expose internal details)
    return create_error_response(
        500,
        AuthErrorCode.AUTH_INTERNAL_ERROR,
        "An internal error occurred. Please try again later."
    )


def validate_required_fields(
    data: Dict[str, Any],
    required_fields: list,
    field_name: str = "request"
) -> Optional[Dict[str, Any]]:
    """
    Validate that required fields are present in data.
    
    Args:
        data: Data dictionary to validate
        required_fields: List of required field names
        field_name: Name of the data structure (for error messages)
        
    Returns:
        dict: Error response if validation fails, None if validation passes
        
    Example:
        >>> error = validate_required_fields(
        ...     {"code": "abc123"},
        ...     ["code", "state"],
        ...     "callback request"
        ... )
        >>> if error:
        ...     return error
    """
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    
    if missing_fields:
        return create_error_response(
            400,
            AuthErrorCode.AUTH_PROVIDER_ERROR,
            f"Missing required fields in {field_name}: {', '.join(missing_fields)}"
        )
    
    return None
