"""
Unit tests for AppleOAuthProvider.

Tests Apple-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 4.1, 4.2, 4.3, 4.6
"""

import pytest
import jwt
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .apple_provider import AppleOAuthProvider


class TestAppleOAuthProvider:
    """Test suite for Apple OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "com.example.app.signin"
        self.client_secret = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.test_client_secret"
        self.redirect_uri = "https://app.example.com/auth/apple/callback"
        
        self.provider = AppleOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Apple provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "apple"
        assert self.provider.scopes == ["name", "email"]
    
    def test_apple_endpoints(self):
        """Test Apple OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://appleid.apple.com/auth/authorize"
        assert self.provider.TOKEN_ENDPOINT == "https://appleid.apple.com/auth/token"
        assert self.provider.JWKS_URI == "https://appleid.apple.com/auth/keys"
        assert self.provider.ISSUER == "https://appleid.apple.com"
    def test_get_authorization_url(self):
        """Test Apple authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "response_mode=form_post" in auth_url
        assert "scope=name+email" in auth_url
        assert f"state={state}" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Apple."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "a1b2c3d4e5f6test_access_token",
            "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token",
            "refresh_token": "r1e2f3r4e5s6h_token",
            "expires_in": 3600,
            "token_type": "Bearer"
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "a1b2c3d4e5f6test_access_token"
        assert result["id_token"] == "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token"
        assert result["refresh_token"] == "r1e2f3r4e5s6h_token"
        assert result["expires_in"] == 3600
        assert result["token_type"] == "Bearer"
        
        # Verify request was made correctly
        mock_post.assert_called_once_with(
            self.provider.TOKEN_ENDPOINT,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
    @patch('requests.get')
    def test_validate_id_token_success(self, mock_get):
        """Test successful Apple ID token validation."""
        # Mock JWKS response
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [
                {
                    "kty": "RSA",
                    "kid": "apple_key_id",
                    "use": "sig",
                    "alg": "RS256",
                    "n": "apple_modulus",
                    "e": "AQAB"
                }
            ]
        }
        mock_get.return_value = mock_jwks_response
        
        # Create test claims
        test_claims = {
            "iss": "https://appleid.apple.com",
            "aud": self.client_id,
            "sub": "001234.abcdef1234567890.1234",
            "email": "test@privaterelay.appleid.com",
            "email_verified": True,
            "is_private_email": True,
            "exp": 9999999999,
            "iat": 1000000000
        }
        
        # Mock JWT decoding
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "apple_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.return_value = test_claims
            
            result = self.provider.validate_id_token("test_id_token")
            
            # Verify claims extraction including private relay email
            assert result["sub"] == "001234.abcdef1234567890.1234"
            assert result["email"] == "test@privaterelay.appleid.com"
            assert result["email_verified"] is True
            assert result["name"] is None  # Apple only provides name on first sign-in
            assert result["picture"] is None  # Apple doesn't provide profile pictures
            assert result["is_private_email"] is True  # Apple-specific claim
    
    @patch('requests.get')
    def test_validate_id_token_regular_email(self, mock_get):
        """Test Apple ID token validation with regular email."""
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [{"kid": "apple_key_id", "kty": "RSA"}]
        }
        mock_get.return_value = mock_jwks_response
        
        test_claims = {
            "iss": "https://appleid.apple.com",
            "aud": self.client_id,
            "sub": "001234.abcdef1234567890.1234",
            "email": "user@icloud.com",
            "email_verified": True,
            "is_private_email": False,
            "exp": 9999999999,
            "iat": 1000000000
        }
        
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "apple_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.return_value = test_claims
            
            result = self.provider.validate_id_token("test_id_token")
            
            assert result["email"] == "user@icloud.com"
            assert result["is_private_email"] is False
    def test_get_user_info(self):
        """Test Apple user info retrieval (Apple doesn't provide user info endpoint)."""
        access_token = "a1b2c3d4e5f6test_access_token"
        result = self.provider.get_user_info(access_token)
        
        # Apple doesn't have a user info endpoint, so should return empty data
        assert result["id"] is None
        assert result["email"] is None
        assert result["name"] is None
        assert result["picture"] is None
    
    def test_get_jwks_uri(self):
        """Test Apple JWKS URI retrieval."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == "https://appleid.apple.com/auth/keys"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])