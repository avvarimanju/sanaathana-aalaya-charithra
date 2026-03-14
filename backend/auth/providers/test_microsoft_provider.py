"""
Unit tests for MicrosoftOAuthProvider.

Tests Microsoft-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 7.1, 7.2, 7.3
"""

import pytest
import jwt
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .microsoft_provider import MicrosoftOAuthProvider


class TestMicrosoftOAuthProvider:
    """Test suite for Microsoft OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "12345678-1234-1234-1234-123456789012"
        self.client_secret = "test_microsoft_client_secret"
        self.redirect_uri = "https://app.example.com/auth/microsoft/callback"
        
        self.provider = MicrosoftOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Microsoft provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "microsoft"
        assert self.provider.scopes == ["openid", "profile", "email", "User.Read"]
    
    def test_microsoft_endpoints(self):
        """Test Microsoft OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        assert self.provider.TOKEN_ENDPOINT == "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        assert self.provider.USERINFO_ENDPOINT == "https://graph.microsoft.com/v1.0/me"
        assert self.provider.JWKS_URI == "https://login.microsoftonline.com/common/discovery/v2.0/keys"
        assert self.provider.ISSUER == "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0"
    def test_get_authorization_url(self):
        """Test Microsoft authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=openid+profile+email+User.Read" in auth_url
        assert f"state={state}" in auth_url
        assert "response_mode=query" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Microsoft."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "EwAoA8l6BAAU_test_access_token",
            "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token",
            "refresh_token": "M.R3_BAY.-test_refresh_token",
            "expires_in": 3600,
            "token_type": "Bearer",
            "scope": "openid profile email User.Read"
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "EwAoA8l6BAAU_test_access_token"
        assert result["id_token"] == "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token"
        assert result["refresh_token"] == "M.R3_BAY.-test_refresh_token"
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
        """Test successful Microsoft ID token validation."""
        # Mock JWKS response
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [
                {
                    "kty": "RSA",
                    "kid": "microsoft_key_id",
                    "use": "sig",
                    "alg": "RS256",
                    "n": "microsoft_modulus",
                    "e": "AQAB"
                }
            ]
        }
        mock_get.return_value = mock_jwks_response
        
        # Create test claims
        test_claims = {
            "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            "aud": self.client_id,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "email": "test@outlook.com",
            "email_verified": True,
            "name": "Test User",
            "picture": "https://graph.microsoft.com/v1.0/me/photo/$value",
            "given_name": "Test",
            "family_name": "User",
            "exp": 9999999999,
            "iat": 1000000000
        }
        
        # Mock JWT decoding
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "microsoft_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.return_value = test_claims
            
            result = self.provider.validate_id_token("test_id_token")
            
            # Verify claims extraction
            assert result["sub"] == "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ"
            assert result["email"] == "test@outlook.com"
            assert result["email_verified"] is True
            assert result["name"] == "Test User"
            assert result["picture"] == "https://graph.microsoft.com/v1.0/me/photo/$value"
            assert result["given_name"] == "Test"
            assert result["family_name"] == "User"
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from Microsoft Graph."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "displayName": "Test User",
            "mail": "test@outlook.com",
            "userPrincipalName": "test@outlook.com",
            "givenName": "Test",
            "surname": "User",
            "jobTitle": "Software Engineer",
            "officeLocation": "Seattle"
        }
        mock_get.return_value = mock_response
        
        access_token = "EwAoA8l6BAAU_test_access_token"
        result = self.provider.get_user_info(access_token)
        
        # Verify response structure
        assert result["id"] == "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ"
        assert result["displayName"] == "Test User"
        assert result["mail"] == "test@outlook.com"
        assert result["userPrincipalName"] == "test@outlook.com"
        assert result["givenName"] == "Test"
        assert result["surname"] == "User"
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            self.provider.USERINFO_ENDPOINT,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            },
            timeout=5
        )
    
    def test_get_jwks_uri(self):
        """Test Microsoft JWKS URI retrieval."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == "https://login.microsoftonline.com/common/discovery/v2.0/keys"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])