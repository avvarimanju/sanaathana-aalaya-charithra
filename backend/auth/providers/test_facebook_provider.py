"""
Unit tests for FacebookOAuthProvider.

Tests Facebook-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 2.1, 2.2, 2.3
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .facebook_provider import FacebookOAuthProvider


class TestFacebookOAuthProvider:
    """Test suite for Facebook OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "123456789012345"
        self.client_secret = "test_facebook_app_secret"
        self.redirect_uri = "https://app.example.com/auth/facebook/callback"
        
        self.provider = FacebookOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Facebook provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "facebook"
        assert self.provider.scopes == ["email", "public_profile"]
    
    def test_facebook_endpoints(self):
        """Test Facebook OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://www.facebook.com/v18.0/dialog/oauth"
        assert self.provider.TOKEN_ENDPOINT == "https://graph.facebook.com/v18.0/oauth/access_token"
        assert self.provider.USERINFO_ENDPOINT == "https://graph.facebook.com/v18.0/me"
        assert self.provider.DEBUG_TOKEN_ENDPOINT == "https://graph.facebook.com/v18.0/debug_token"
    def test_get_authorization_url(self):
        """Test Facebook authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=email%2Cpublic_profile" in auth_url
        assert f"state={state}" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Facebook."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "EAABwzLixnjYBAtest_access_token",
            "token_type": "bearer",
            "expires_in": 5183944
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "EAABwzLixnjYBAtest_access_token"
        assert result["token_type"] == "bearer"
        assert result["expires_in"] == 5183944
        assert result["id_token"] is None  # Facebook doesn't provide ID tokens
        
        # Verify request was made correctly
        mock_post.assert_called_once_with(
            self.provider.TOKEN_ENDPOINT,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": redirect_uri
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
    @patch('requests.get')
    def test_validate_id_token_success(self, mock_get):
        """Test successful Facebook token validation using debug endpoint."""
        # Mock debug token response
        mock_debug_response = Mock()
        mock_debug_response.status_code = 200
        mock_debug_response.json.return_value = {
            "data": {
                "app_id": self.client_id,
                "is_valid": True,
                "user_id": "123456789"
            }
        }
        
        # Mock user info response
        mock_userinfo_response = Mock()
        mock_userinfo_response.status_code = 200
        mock_userinfo_response.json.return_value = {
            "id": "123456789",
            "name": "Test User",
            "email": "test@facebook.com",
            "picture": {
                "data": {
                    "url": "https://platform-lookaside.fbsbx.com/platform/profilepic/test.jpg"
                }
            }
        }
        
        mock_get.side_effect = [mock_debug_response, mock_userinfo_response]
        
        access_token = "EAABwzLixnjYBAtest_access_token"
        result = self.provider.validate_id_token(access_token)
        
        # Verify claims extraction
        assert result["sub"] == "123456789"
        assert result["email"] == "test@facebook.com"
        assert result["email_verified"] is True
        assert result["name"] == "Test User"
        assert result["picture"] == "https://platform-lookaside.fbsbx.com/platform/profilepic/test.jpg"
        
        # Verify debug token request
        debug_call = mock_get.call_args_list[0]
        assert debug_call[0][0] == self.provider.DEBUG_TOKEN_ENDPOINT
        assert debug_call[1]["params"]["input_token"] == access_token
        assert debug_call[1]["params"]["access_token"] == f"{self.client_id}|{self.client_secret}"
    
    @patch('requests.get')
    def test_validate_id_token_invalid_token(self, mock_get):
        """Test Facebook token validation with invalid token."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "is_valid": False,
                "error": {
                    "message": "Invalid OAuth access token."
                }
            }
        }
        mock_get.return_value = mock_response
        
        with pytest.raises(Exception, match="Invalid Facebook access token"):
            self.provider.validate_id_token("invalid_token")
    @patch('requests.get')
    def test_validate_id_token_wrong_app(self, mock_get):
        """Test Facebook token validation with token for wrong app."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "app_id": "different_app_id",
                "is_valid": True,
                "user_id": "123456789"
            }
        }
        mock_get.return_value = mock_response
        
        with pytest.raises(Exception, match="Token not issued for this app"):
            self.provider.validate_id_token("wrong_app_token")
    
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from Facebook."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "123456789",
            "name": "Test User",
            "email": "test@facebook.com",
            "picture": {
                "data": {
                    "url": "https://platform-lookaside.fbsbx.com/platform/profilepic/test.jpg"
                }
            }
        }
        mock_get.return_value = mock_response
        
        access_token = "EAABwzLixnjYBAtest_access_token"
        result = self.provider.get_user_info(access_token)
        
        # Verify response structure
        assert result["id"] == "123456789"
        assert result["name"] == "Test User"
        assert result["email"] == "test@facebook.com"
        assert result["picture"]["data"]["url"] == "https://platform-lookaside.fbsbx.com/platform/profilepic/test.jpg"
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            self.provider.USERINFO_ENDPOINT,
            params={
                "fields": "id,name,email,picture",
                "access_token": access_token
            },
            timeout=5
        )
    
    def test_get_jwks_uri(self):
        """Test JWKS URI retrieval (Facebook doesn't use JWKS)."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])