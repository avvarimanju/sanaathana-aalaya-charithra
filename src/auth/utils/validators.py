"""
Token validation utilities for authentication service.

This module provides JWT signature validation using provider JWKS
and redirect URI whitelist validation.

**Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 10.6**
"""

import time
import requests
from typing import Dict, Optional, Any
from urllib.parse import urlparse
import jwt
from jwt import PyJWKClient
from jwt.exceptions import (
    InvalidTokenError,
    ExpiredSignatureError,
    InvalidSignatureError,
    InvalidAudienceError,
    InvalidIssuerError
)

from ..config import AuthConfig, ProviderConfig, AuthErrorCode


# Cache for JWKS clients to avoid repeated fetches
_jwks_clients: Dict[str, PyJWKClient] = {}


class TokenValidationError(Exception):
    """Raised when token validation fails."""
    
    def __init__(self, message: str, error_code: str = AuthErrorCode.AUTH_INVALID_TOKEN):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class RedirectURIValidationError(Exception):
    """Raised when redirect URI validation fails."""
    
    def __init__(self, message: str):
        self.message = message
        self.error_code = AuthErrorCode.AUTH_INVALID_REDIRECT_URI
        super().__init__(self.message)


def _get_jwks_client(provider: str) -> Optional[PyJWKClient]:
    """
    Get or create a JWKS client for a provider.
    
    Args:
        provider: Social provider name
        
    Returns:
        Optional[PyJWKClient]: JWKS client or None if provider doesn't use JWKS
    """
    # Check if provider uses JWKS
    jwks_uri = ProviderConfig.get_jwks_endpoint(provider)
    if not jwks_uri:
        return None
    
    # Return cached client if available
    if provider in _jwks_clients:
        return _jwks_clients[provider]
    
    # Create new JWKS client with caching
    client = PyJWKClient(
        jwks_uri,
        cache_keys=True,
        max_cached_keys=10
    )
    
    _jwks_clients[provider] = client
    return client


def validate_jwt_signature(
    id_token: str,
    provider: str,
    client_id: str,
    issuer: Optional[str] = None,
    audience: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate JWT signature using provider's JWKS and verify claims.
    
    This function validates:
    1. Token signature using provider's public keys (JWKS)
    2. Token expiration (exp claim)
    3. Token issuer (iss claim) if provided
    4. Token audience (aud claim) if provided
    5. Token not before (nbf claim) if present
    
    Args:
        id_token: JWT identity token from social provider
        provider: Social provider name (google, apple, microsoft, etc.)
        client_id: OAuth client ID for audience validation
        issuer: Expected token issuer (optional, provider-specific)
        audience: Expected token audience (optional, defaults to client_id)
        
    Returns:
        Dict[str, Any]: Validated token claims/payload
        
    Raises:
        TokenValidationError: If token validation fails
        
    Example:
        >>> claims = validate_jwt_signature(
        ...     id_token="eyJhbGc...",
        ...     provider="google",
        ...     client_id="my-client-id.apps.googleusercontent.com"
        ... )
        >>> print(claims["email"])
    """
    if not id_token:
        raise TokenValidationError("ID token cannot be empty")
    
    if not AuthConfig.is_valid_provider(provider):
        raise TokenValidationError(
            f"Unsupported provider: {provider}",
            AuthErrorCode.AUTH_INVALID_PROVIDER
        )
    
    # Get JWKS client for providers that use JWKS
    jwks_client = _get_jwks_client(provider)
    
    if not jwks_client:
        raise TokenValidationError(
            f"Provider {provider} does not support JWKS validation. "
            f"Use provider-specific validation method.",
            AuthErrorCode.AUTH_PROVIDER_ERROR
        )
    
    try:
        # Get signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)
        
        # Set audience to client_id if not provided
        if audience is None:
            audience = client_id
        
        # Decode and validate token
        # This validates:
        # - Signature using the public key
        # - Expiration (exp claim)
        # - Not before (nbf claim) if present
        # - Audience (aud claim) if provided
        # - Issuer (iss claim) if provided
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256", "ES256"],  # Support RSA and ECDSA
            audience=audience,
            issuer=issuer,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": True if audience else False,
                "verify_iss": True if issuer else False,
                "require_exp": True,
                "require_iat": True
            }
        )
        
        return claims
        
    except ExpiredSignatureError:
        raise TokenValidationError(
            "ID token has expired",
            AuthErrorCode.AUTH_SESSION_EXPIRED
        )
    except InvalidSignatureError:
        raise TokenValidationError(
            "ID token signature verification failed"
        )
    except InvalidAudienceError:
        raise TokenValidationError(
            f"ID token audience mismatch. Expected: {audience}"
        )
    except InvalidIssuerError:
        raise TokenValidationError(
            f"ID token issuer mismatch. Expected: {issuer}"
        )
    except InvalidTokenError as e:
        raise TokenValidationError(
            f"Invalid ID token: {str(e)}"
        )
    except Exception as e:
        raise TokenValidationError(
            f"Failed to validate ID token: {str(e)}",
            AuthErrorCode.AUTH_INTERNAL_ERROR
        )


def validate_redirect_uri(redirect_uri: str) -> bool:
    """
    Validate redirect URI against whitelist.
    
    This function performs exact match validation against the configured
    whitelist of allowed redirect URIs. No wildcards or pattern matching
    is supported for security reasons.
    
    Args:
        redirect_uri: The redirect URI to validate
        
    Returns:
        bool: True if redirect URI is valid
        
    Raises:
        RedirectURIValidationError: If redirect URI is not in whitelist
        
    Example:
        >>> validate_redirect_uri("https://app.example.com/callback")
        True
        >>> validate_redirect_uri("https://evil.com/callback")
        RedirectURIValidationError: Redirect URI not in whitelist
    """
    if not redirect_uri:
        raise RedirectURIValidationError("Redirect URI cannot be empty")
    
    # Validate URI format
    try:
        parsed = urlparse(redirect_uri)
        
        # Must be HTTPS (except localhost for development)
        if parsed.scheme != "https":
            if parsed.hostname not in ["localhost", "127.0.0.1"]:
                raise RedirectURIValidationError(
                    "Redirect URI must use HTTPS protocol"
                )
        
        # Must have a hostname
        if not parsed.hostname:
            raise RedirectURIValidationError(
                "Redirect URI must have a valid hostname"
            )
            
    except Exception as e:
        raise RedirectURIValidationError(
            f"Invalid redirect URI format: {str(e)}"
        )
    
    # Check against whitelist (exact match)
    if not AuthConfig.is_redirect_uri_allowed(redirect_uri):
        raise RedirectURIValidationError(
            f"Redirect URI not in whitelist: {redirect_uri}"
        )
    
    return True


def validate_token_claims(
    claims: Dict[str, Any],
    required_claims: Optional[list] = None
) -> bool:
    """
    Validate that required claims are present in token.
    
    Args:
        claims: Token claims dictionary
        required_claims: List of required claim names (default: ["sub", "email"])
        
    Returns:
        bool: True if all required claims are present
        
    Raises:
        TokenValidationError: If required claims are missing
        
    Example:
        >>> claims = {"sub": "12345", "email": "user@example.com"}
        >>> validate_token_claims(claims)
        True
    """
    if required_claims is None:
        required_claims = ["sub", "email"]
    
    missing_claims = []
    for claim in required_claims:
        if claim not in claims or not claims[claim]:
            missing_claims.append(claim)
    
    if missing_claims:
        raise TokenValidationError(
            f"Missing required claims: {', '.join(missing_claims)}"
        )
    
    return True


def validate_token_expiration(exp: int, leeway: int = 0) -> bool:
    """
    Validate token expiration timestamp.
    
    Args:
        exp: Expiration timestamp (Unix epoch seconds)
        leeway: Leeway in seconds for clock skew (default: 0)
        
    Returns:
        bool: True if token is not expired
        
    Raises:
        TokenValidationError: If token is expired
        
    Example:
        >>> import time
        >>> future_time = int(time.time()) + 3600
        >>> validate_token_expiration(future_time)
        True
    """
    current_time = int(time.time())
    
    if current_time > (exp + leeway):
        raise TokenValidationError(
            "Token has expired",
            AuthErrorCode.AUTH_SESSION_EXPIRED
        )
    
    return True


def _clear_jwks_cache():
    """
    Clear the JWKS client cache.
    
    This is a utility function for testing purposes only.
    It allows tests to reset the JWKS cache between test cases.
    """
    global _jwks_clients
    _jwks_clients = {}
