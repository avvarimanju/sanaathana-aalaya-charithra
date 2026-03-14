"""
Unit tests for TwitterOAuthProvider.

Tests Twitter/X-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 5.1, 5.2, 5.3
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .twitter_provider import TwitterOAuthProvider


class TestTwitterOAuthProvider:
    """Test suite for Twitter OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "test_twitter_client_id"
        self.client_secret = "test_twitter_client_secret"
        self.redirect_uri = "https://app.example.com/auth/twitter/callback"
        
        self.provider = TwitterOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Twitter provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "twitter"
        assert self.provider.scopes == ["tweet.read", "users.read"]
    
    def test_twitter_endpoints(self):
        """Test Twitter OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://twitter.com/i/oauth2/authorize"
        assert self.provider.TOKEN_ENDPOINT == "https://api.twitter.com/2/oauth2/token"
        assert self.provider.USERINFO_ENDPOINT == "https://api.twitter.com/2/users/me"
    def test_get_authorization_url(self):
        """Test Twitter authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=tweet.read+users.read" in auth_url
        assert f"state={state}" in auth_url
        assert "code_challenge_method=S256" in auth_url
        assert "code_challenge=" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Twitter."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "VGhpcyBpcyBhbiB0ZXN0X2FjY2Vzc190b2tlbg",
            "token_type": "bearer",
            "expires_in": 7200,
            "refresh_token": "bWlLdmtqcDFsUzVVbk1xTG1CWmVuVXVjaw",
            "scope": "tweet.read users.read"
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "VGhpcyBpcyBhbiB0ZXN0X2FjY2Vzc190b2tlbg"
        assert result["token_type"] == "bearer"
        assert result["expires_in"] == 7200
        assert result["refresh_token"] == "bWlLdmtqcDFsUzVVbk1xTG1CWmVuVXVjaw"
        assert result["id_token"] is None  # Twitter doesn't provide ID tokens
    
    @patch('requests.get')
    def test_validate_id_token_success(self, mock_get):
        """Test successful Twitter token validation via user info."""
        # Mock user info response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "id": "123456789",
                "username": "testuser",
                "name": "Test User",
                "profile_image_url": "https://pbs.twimg.com/profile_images/test.jpg"
            }
        }
        mock_get.return_value = mock_response
        
        access_token = "VGhpcyBpcyBhbiB0ZXN0X2FjY2Vzc190b2tlbg"
        result = self.provider.validate_id_token(access_token)
        
        # Verify claims extraction
        assert result["sub"] == "123456789"
        assert result["email"] is None  # Twitter doesn't provide email by default
        assert result["email_verified"] is False
        assert result["name"] == "Test User"
        assert result["picture"] == "https://pbs.twimg.com/profile_images/test.jpg"
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from Twitter."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "id": "123456789",
                "username": "testuser",
                "name": "Test User",
                "profile_image_url": "https://pbs.twimg.com/profile_images/test.jpg",
                "verified": False,
                "public_metrics": {
                    "followers_count": 100,
                    "following_count": 50,
                    "tweet_count": 200
                }
            }
        }
        mock_get.return_value = mock_response
        
        access_token = "VGhpcyBpcyBhbiB0ZXN0X2FjY2Vzc190b2tlbg"
        result = self.provider.get_user_info(access_token)
        
        # Verify response structure
        assert result["data"]["id"] == "123456789"
        assert result["data"]["username"] == "testuser"
        assert result["data"]["name"] == "Test User"
        assert result["data"]["profile_image_url"] == "https://pbs.twimg.com/profile_images/test.jpg"
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            self.provider.USERINFO_ENDPOINT,
            params={
                "user.fields": "id,username,name,profile_image_url,verified,public_metrics"
            },
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            },
            timeout=5
        )
    
    def test_get_jwks_uri(self):
        """Test JWKS URI retrieval (Twitter doesn't use JWKS)."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])