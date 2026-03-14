"""
Unit tests for GitHubOAuthProvider.

Tests GitHub-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 6.1, 6.2, 6.3
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .github_provider import GitHubOAuthProvider


class TestGitHubOAuthProvider:
    """Test suite for GitHub OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "Iv1.test_github_client_id"
        self.client_secret = "test_github_client_secret"
        self.redirect_uri = "https://app.example.com/auth/github/callback"
        
        self.provider = GitHubOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test GitHub provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "github"
        assert self.provider.scopes == ["user:email", "read:user"]
    
    def test_github_endpoints(self):
        """Test GitHub OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://github.com/login/oauth/authorize"
        assert self.provider.TOKEN_ENDPOINT == "https://github.com/login/oauth/access_token"
        assert self.provider.USERINFO_ENDPOINT == "https://api.github.com/user"
    def test_get_authorization_url(self):
        """Test GitHub authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=user%3Aemail+read%3Auser" in auth_url
        assert f"state={state}" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with GitHub."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "gho_test_access_token_16_chars",
            "token_type": "bearer",
            "scope": "user:email,read:user"
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "gho_test_access_token_16_chars"
        assert result["token_type"] == "bearer"
        assert result["expires_in"] == 28800  # 8 hours default
        assert result["id_token"] is None  # GitHub doesn't provide ID tokens
        
        # Verify request was made correctly
        mock_post.assert_called_once_with(
            self.provider.TOKEN_ENDPOINT,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": redirect_uri
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            timeout=5
        )
    @patch('requests.get')
    def test_validate_id_token_success(self, mock_get):
        """Test successful GitHub token validation via user info."""
        # Mock user info response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": 123456789,
            "login": "testuser",
            "name": "Test User",
            "email": "test@github.com",
            "avatar_url": "https://avatars.githubusercontent.com/u/123456789?v=4",
            "bio": "Test user bio",
            "company": "Test Company",
            "location": "Test Location"
        }
        mock_get.return_value = mock_response
        
        access_token = "gho_test_access_token_16_chars"
        result = self.provider.validate_id_token(access_token)
        
        # Verify claims extraction
        assert result["sub"] == "123456789"
        assert result["email"] == "test@github.com"
        assert result["email_verified"] is True  # GitHub verifies emails
        assert result["name"] == "Test User"
        assert result["picture"] == "https://avatars.githubusercontent.com/u/123456789?v=4"
    
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from GitHub."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": 123456789,
            "login": "testuser",
            "name": "Test User",
            "email": "test@github.com",
            "avatar_url": "https://avatars.githubusercontent.com/u/123456789?v=4",
            "bio": "Test user bio",
            "company": "Test Company",
            "location": "Test Location",
            "public_repos": 42,
            "followers": 100,
            "following": 50
        }
        mock_get.return_value = mock_response
        
        access_token = "gho_test_access_token_16_chars"
        result = self.provider.get_user_info(access_token)
        
        # Verify response structure
        assert result["id"] == 123456789
        assert result["login"] == "testuser"
        assert result["name"] == "Test User"
        assert result["email"] == "test@github.com"
        assert result["avatar_url"] == "https://avatars.githubusercontent.com/u/123456789?v=4"
        
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
        """Test JWKS URI retrieval (GitHub doesn't use JWKS)."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])