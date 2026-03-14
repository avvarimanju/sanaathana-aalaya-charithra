"""
Unit tests for InstagramOAuthProvider.

Tests Instagram-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 3.1, 3.2, 3.3
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .instagram_provider import InstagramOAuthProvider


class TestInstagramOAuthProvider:
    """Test suite for Instagram OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "123456789012345"
        self.client_secret = "test_instagram_app_secret"
        self.redirect_uri = "https://app.example.com/auth/instagram/callback"
        
        self.provider = InstagramOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Instagram provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "instagram"
        assert self.provider.scopes == ["user_profile", "user_media"]
    
    def test_instagram_endpoints(self):
        """Test Instagram OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://api.instagram.com/oauth/authorize"
        assert self.provider.TOKEN_ENDPOINT == "https://api.instagram.com/oauth/access_token"
        assert self.provider.USERINFO_ENDPOINT == "https://graph.instagram.com/me"
    def test_get_authorization_url(self):
        """Test Instagram authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=user_profile%2Cuser_media" in auth_url
        assert f"state={state}" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Instagram."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "IGQVJtest_access_token",
            "user_id": 123456789
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "IGQVJtest_access_token"
        assert result["token_type"] == "bearer"
        assert result["expires_in"] == 3600
        assert result["id_token"] is None  # Instagram doesn't provide ID tokens
        
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
        """Test successful Instagram token validation."""
        # Mock user info response (Instagram uses access token validation via user info)
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "123456789",
            "username": "testuser",
            "account_type": "PERSONAL",
            "media_count": 42
        }
        mock_get.return_value = mock_response
        
        access_token = "IGQVJtest_access_token"
        result = self.provider.validate_id_token(access_token)
        
        # Verify claims extraction
        assert result["sub"] == "123456789"
        assert result["email"] is None  # Instagram doesn't provide email
        assert result["email_verified"] is False
        assert result["name"] == "testuser"
        assert result["picture"] is None
    
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from Instagram."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "123456789",
            "username": "testuser",
            "account_type": "PERSONAL",
            "media_count": 42
        }
        mock_get.return_value = mock_response
        
        access_token = "IGQVJtest_access_token"
        result = self.provider.get_user_info(access_token)
        
        # Verify response structure
        assert result["id"] == "123456789"
        assert result["username"] == "testuser"
        assert result["account_type"] == "PERSONAL"
        assert result["media_count"] == 42
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            self.provider.USERINFO_ENDPOINT,
            params={
                "fields": "id,username,account_type,media_count",
                "access_token": access_token
            },
            timeout=5
        )
    
    def test_get_jwks_uri(self):
        """Test JWKS URI retrieval (Instagram doesn't use JWKS)."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])