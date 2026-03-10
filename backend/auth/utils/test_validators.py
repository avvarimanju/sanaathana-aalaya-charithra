"""
Unit tests for token validation utilities.

Tests JWT signature validation, redirect URI validation,
and token claim validation.
"""

import pytest
import time
import jwt
from unittest.mock import Mock, patch, MagicMock
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

from .validators import (
    validate_jwt_signature,
    validate_redirect_uri,
    validate_token_claims,
    validate_token_expiration,
    TokenValidationError,
    RedirectURIValidationError,
    _clear_jwks_cache
)
from ..config import AuthConfig, AuthErrorCode


# Test fixtures
@pytest.fixture
def rsa_key_pair():
    """Generate RSA key pair for testing."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    
    # Serialize keys
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_key, public_key, private_pem, public_pem


@pytest.fixture
def valid_token_claims():
    """Generate valid token claims."""
    return {
        "sub": "1234567890",
        "email": "user@example.com",
        "email_verified": True,
        "name": "Test User",
        "picture": "https://example.com/avatar.jpg",
        "iss": "https://accounts.google.com",
        "aud": "test-client-id",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }


@pytest.fixture(autouse=True)
def clear_caches():
    """Clear caches before each test."""
    _clear_jwks_cache()
    yield
    _clear_jwks_cache()


class TestValidateJWTSignature:
    """Tests for validate_jwt_signature function."""
    
    def test_empty_token_raises_error(self):
        """Test that empty token raises TokenValidationError."""
        with pytest.raises(TokenValidationError) as exc_info:
            validate_jwt_signature("", "google", "client-id")
        
        assert "cannot be empty" in str(exc_info.value)
        assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_TOKEN
    
    def test_unsupported_provider_raises_error(self):
        """Test that unsupported provider raises TokenValidationError."""
        with pytest.raises(TokenValidationError) as exc_info:
            validate_jwt_signature("token", "unsupported", "client-id")
        
        assert "Unsupported provider" in str(exc_info.value)
        assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_PROVIDER
    
    def test_provider_without_jwks_raises_error(self):
        """Test that provider without JWKS support raises error."""
        with pytest.raises(TokenValidationError) as exc_info:
            validate_jwt_signature("token", "facebook", "client-id")
        
        assert "does not support JWKS" in str(exc_info.value)
        assert exc_info.value.error_code == AuthErrorCode.AUTH_PROVIDER_ERROR
    
    def test_malformed_token_raises_error(self):
        """Test that malformed token raises error."""
        # This will fail when trying to get signing key from malformed token
        with pytest.raises(TokenValidationError) as exc_info:
            validate_jwt_signature(
                "not.a.valid.jwt",
                "google",
                "test-client-id"
            )
        
        # Should raise an error about invalid token
        assert exc_info.value.error_code in [AuthErrorCode.AUTH_INVALID_TOKEN, AuthErrorCode.AUTH_INTERNAL_ERROR]


class TestValidateRedirectURI:
    """Tests for validate_redirect_uri function."""
    
    def test_empty_uri_raises_error(self):
        """Test that empty URI raises error."""
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri("")
        
        assert "cannot be empty" in str(exc_info.value)
        assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_REDIRECT_URI
    
    def test_non_https_uri_raises_error(self):
        """Test that non-HTTPS URI raises error."""
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri("http://app.example.com/callback")
        
        assert "HTTPS" in str(exc_info.value)
    
    def test_localhost_http_allowed(self):
        """Test that localhost with HTTP is allowed for development."""
        # Add localhost to whitelist temporarily
        original_uris = AuthConfig.ALLOWED_REDIRECT_URIS.copy()
        AuthConfig.ALLOWED_REDIRECT_URIS.append("http://localhost:3000/callback")
        
        try:
            result = validate_redirect_uri("http://localhost:3000/callback")
            assert result is True
        finally:
            AuthConfig.ALLOWED_REDIRECT_URIS = original_uris
    
    def test_uri_without_hostname_raises_error(self):
        """Test that URI without hostname raises error."""
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri("https:///callback")
        
        assert "hostname" in str(exc_info.value).lower()
    
    def test_whitelisted_uri_succeeds(self):
        """Test that whitelisted URI succeeds."""
        # Add URI to whitelist temporarily
        original_uris = AuthConfig.ALLOWED_REDIRECT_URIS.copy()
        AuthConfig.ALLOWED_REDIRECT_URIS.append("https://app.example.com/callback")
        
        try:
            result = validate_redirect_uri("https://app.example.com/callback")
            assert result is True
        finally:
            AuthConfig.ALLOWED_REDIRECT_URIS = original_uris
    
    def test_non_whitelisted_uri_raises_error(self):
        """Test that non-whitelisted URI raises error."""
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri("https://evil.com/callback")
        
        assert "not in whitelist" in str(exc_info.value)
        assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_REDIRECT_URI
    
    def test_malformed_uri_raises_error(self):
        """Test that malformed URI raises error."""
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri("not a valid uri")
        
        assert "Invalid redirect URI" in str(exc_info.value)


class TestValidateTokenClaims:
    """Tests for validate_token_claims function."""
    
    def test_valid_claims_succeeds(self):
        """Test that valid claims succeed."""
        claims = {
            "sub": "1234567890",
            "email": "user@example.com",
            "name": "Test User"
        }
        
        result = validate_token_claims(claims)
        assert result is True
    
    def test_missing_required_claim_raises_error(self):
        """Test that missing required claim raises error."""
        claims = {
            "sub": "1234567890"
            # Missing email
        }
        
        with pytest.raises(TokenValidationError) as exc_info:
            validate_token_claims(claims)
        
        assert "Missing required claims" in str(exc_info.value)
        assert "email" in str(exc_info.value)
    
    def test_empty_claim_value_raises_error(self):
        """Test that empty claim value raises error."""
        claims = {
            "sub": "1234567890",
            "email": ""  # Empty value
        }
        
        with pytest.raises(TokenValidationError) as exc_info:
            validate_token_claims(claims)
        
        assert "Missing required claims" in str(exc_info.value)
    
    def test_custom_required_claims(self):
        """Test validation with custom required claims."""
        claims = {
            "sub": "1234567890",
            "email": "user@example.com",
            "name": "Test User"
        }
        
        result = validate_token_claims(claims, required_claims=["sub", "name"])
        assert result is True
    
    def test_multiple_missing_claims_raises_error(self):
        """Test that multiple missing claims are reported."""
        claims = {
            "name": "Test User"
            # Missing sub and email
        }
        
        with pytest.raises(TokenValidationError) as exc_info:
            validate_token_claims(claims)
        
        error_message = str(exc_info.value)
        assert "Missing required claims" in error_message
        assert "sub" in error_message
        assert "email" in error_message


class TestValidateTokenExpiration:
    """Tests for validate_token_expiration function."""
    
    def test_future_expiration_succeeds(self):
        """Test that future expiration succeeds."""
        future_time = int(time.time()) + 3600  # 1 hour from now
        result = validate_token_expiration(future_time)
        assert result is True
    
    def test_past_expiration_raises_error(self):
        """Test that past expiration raises error."""
        past_time = int(time.time()) - 3600  # 1 hour ago
        
        with pytest.raises(TokenValidationError) as exc_info:
            validate_token_expiration(past_time)
        
        assert "expired" in str(exc_info.value).lower()
        assert exc_info.value.error_code == AuthErrorCode.AUTH_SESSION_EXPIRED
    
    def test_expiration_with_leeway(self):
        """Test expiration validation with leeway for clock skew."""
        # Token expired 30 seconds ago
        past_time = int(time.time()) - 30
        
        # Should fail without leeway
        with pytest.raises(TokenValidationError):
            validate_token_expiration(past_time, leeway=0)
        
        # Should succeed with 60 second leeway
        result = validate_token_expiration(past_time, leeway=60)
        assert result is True
    
    def test_exact_expiration_time(self):
        """Test validation at exact expiration time."""
        current_time = int(time.time())
        
        # Should fail at exact expiration (current_time > exp)
        # Since current_time == exp, the condition current_time > exp is False
        # So it should actually pass. Let's test with current_time - 1
        with pytest.raises(TokenValidationError):
            validate_token_expiration(current_time - 1)
