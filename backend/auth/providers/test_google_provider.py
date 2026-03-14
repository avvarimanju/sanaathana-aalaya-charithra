"""
Unit tests for GoogleOAuthProvider.

Tests Google-specific OAuth endpoints, token validation, and user info extraction.
Requirements: 1.1, 1.2, 1.3
"""

import pytest
import jwt
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict
import requests

from .google_provider import GoogleOAuthProvider


class TestGoogleOAuthProvider:
    """Test suite for Google OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "test_google_client_id.apps.googleusercontent.com"
        self.client_secret = "test_google_client_secret"
        self.redirect_uri = "https://app.example.com/auth/google/callback"
        
        self.provider = GoogleOAuthProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri
        )
    
    def test_provider_initialization(self):
        """Test Google provider initialization."""
        assert self.provider.client_id == self.client_id
        assert self.provider.client_secret == self.client_secret
        assert self.provider.redirect_uri == self.redirect_uri
        assert self.provider.provider_name == "google"
        assert self.provider.scopes == ["openid", "email", "profile"]
    
    def test_google_endpoints(self):
        """Test Google OAuth endpoint URLs."""
        assert self.provider.AUTHORIZATION_ENDPOINT == "https://accounts.google.com/o/oauth2/v2/auth"
        assert self.provider.TOKEN_ENDPOINT == "https://oauth2.googleapis.com/token"
        assert self.provider.USERINFO_ENDPOINT == "https://www.googleapis.com/oauth2/v3/userinfo"
        assert self.provider.JWKS_URI == "https://www.googleapis.com/oauth2/v3/certs"
        assert self.provider.ISSUER == "https://accounts.google.com"
    
    def test_get_authorization_url(self):
        """Test Google authorization URL generation."""
        state = "test_state_12345"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Verify base URL
        assert auth_url.startswith(self.provider.AUTHORIZATION_ENDPOINT)
        
        # Verify required parameters
        assert f"client_id={self.client_id}" in auth_url
        assert f"redirect_uri={redirect_uri.replace('/', '%2F').replace(':', '%3A')}" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=openid+email+profile" in auth_url
        assert f"state={state}" in auth_url
        assert "access_type=offline" in auth_url
        assert "prompt=consent" in auth_url
    
    def test_get_authorization_url_with_special_characters(self):
        """Test authorization URL with special characters in parameters."""
        state = "state_with_special_chars!@#$%"
        redirect_uri = "https://app.example.com/callback?param=value&other=test"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Should properly encode special characters
        assert "state=state_with_special_chars%21%40%23%24%25" in auth_url
        assert "redirect_uri=https%3A//app.example.com/callback%3Fparam%3Dvalue%26other%3Dtest" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_success(self, mock_post):
        """Test successful token exchange with Google."""
        # Mock successful token response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "ya29.test_access_token",
            "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token",
            "refresh_token": "1//test_refresh_token",
            "expires_in": 3600,
            "token_type": "Bearer",
            "scope": "openid email profile"
        }
        mock_post.return_value = mock_response
        
        code = "test_authorization_code"
        redirect_uri = "https://app.example.com/callback"
        
        result = self.provider.exchange_code_for_tokens(code, redirect_uri)
        
        # Verify response structure
        assert result["access_token"] == "ya29.test_access_token"
        assert result["id_token"] == "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.test_id_token"
        assert result["refresh_token"] == "1//test_refresh_token"
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
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_error(self, mock_post):
        """Test token exchange error handling."""
        # Mock error response
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": "invalid_grant",
            "error_description": "Invalid authorization code"
        }
        mock_response.content = b'{"error": "invalid_grant"}'
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception, match="Token request failed: 400 - Invalid authorization code"):
            self.provider.exchange_code_for_tokens("invalid_code", self.redirect_uri)
    
    @patch('requests.get')
    def test_validate_id_token_success(self, mock_get):
        """Test successful Google ID token validation."""
        # Mock JWKS response
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [
                {
                    "kty": "RSA",
                    "kid": "test_key_id",
                    "use": "sig",
                    "alg": "RS256",
                    "n": "test_modulus",
                    "e": "AQAB"
                }
            ]
        }
        mock_get.return_value = mock_jwks_response
        
        # Create a mock ID token with proper structure
        test_claims = {
            "iss": "https://accounts.google.com",
            "aud": self.client_id,
            "sub": "123456789",
            "email": "test@gmail.com",
            "email_verified": True,
            "name": "Test User",
            "picture": "https://lh3.googleusercontent.com/test.jpg",
            "given_name": "Test",
            "family_name": "User",
            "exp": 9999999999,  # Far future
            "iat": 1000000000
        }
        
        # Mock JWT decoding
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "test_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.return_value = test_claims
            
            result = self.provider.validate_id_token("test_id_token")
            
            # Verify claims extraction
            assert result["sub"] == "123456789"
            assert result["email"] == "test@gmail.com"
            assert result["email_verified"] is True
            assert result["name"] == "Test User"
            assert result["picture"] == "https://lh3.googleusercontent.com/test.jpg"
            assert result["given_name"] == "Test"
            assert result["family_name"] == "User"
            
            # Verify JWT validation was called correctly
            mock_decode.assert_called_once_with(
                "test_id_token",
                "mock_public_key",
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=self.provider.ISSUER
            )
    
    @patch('requests.get')
    def test_validate_id_token_missing_kid(self, mock_get):
        """Test ID token validation with missing key ID."""
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {"keys": []}
        mock_get.return_value = mock_jwks_response
        
        with patch('jwt.get_unverified_header') as mock_header:
            mock_header.return_value = {}  # Missing kid
            
            with pytest.raises(Exception, match="ID token missing key ID \\(kid\\)"):
                self.provider.validate_id_token("test_id_token")
    
    @patch('requests.get')
    def test_validate_id_token_key_not_found(self, mock_get):
        """Test ID token validation with key not found."""
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [
                {"kid": "different_key_id", "kty": "RSA"}
            ]
        }
        mock_get.return_value = mock_jwks_response
        
        with patch('jwt.get_unverified_header') as mock_header:
            mock_header.return_value = {"kid": "test_key_id"}
            
            with pytest.raises(Exception, match="Public key not found for kid: test_key_id"):
                self.provider.validate_id_token("test_id_token")
    
    @patch('requests.get')
    def test_validate_id_token_expired(self, mock_get):
        """Test ID token validation with expired token."""
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [{"kid": "test_key_id", "kty": "RSA"}]
        }
        mock_get.return_value = mock_jwks_response
        
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "test_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.side_effect = jwt.ExpiredSignatureError("Token expired")
            
            with pytest.raises(Exception, match="ID token has expired"):
                self.provider.validate_id_token("expired_token")
    
    @patch('requests.get')
    def test_validate_id_token_invalid(self, mock_get):
        """Test ID token validation with invalid token."""
        mock_jwks_response = Mock()
        mock_jwks_response.json.return_value = {
            "keys": [{"kid": "test_key_id", "kty": "RSA"}]
        }
        mock_get.return_value = mock_jwks_response
        
        with patch('jwt.get_unverified_header') as mock_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:
            
            mock_header.return_value = {"kid": "test_key_id"}
            mock_from_jwk.return_value = "mock_public_key"
            mock_decode.side_effect = jwt.InvalidTokenError("Invalid token")
            
            with pytest.raises(Exception, match="Invalid ID token: Invalid token"):
                self.provider.validate_id_token("invalid_token")
    
    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval from Google."""
        # Mock user info response
        mock_response = Mock()
        mock_response.json.return_value = {
            "sub": "123456789",
            "email": "test@gmail.com",
            "email_verified": True,
            "name": "Test User",
            "picture": "https://lh3.googleusercontent.com/test.jpg",
            "given_name": "Test",
            "family_name": "User"
        }
        mock_get.return_value = mock_response
        
        access_token = "ya29.test_access_token"
        result = self.provider.get_user_info(access_token)
        
        # Verify response mapping
        assert result["id"] == "123456789"
        assert result["email"] == "test@gmail.com"
        assert result["email_verified"] is True
        assert result["name"] == "Test User"
        assert result["picture"] == "https://lh3.googleusercontent.com/test.jpg"
        assert result["given_name"] == "Test"
        assert result["family_name"] == "User"
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            self.provider.USERINFO_ENDPOINT,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            },
            timeout=5
        )
    
    @patch('requests.get')
    def test_get_user_info_error(self, mock_get):
        """Test user info retrieval error handling."""
        mock_get.side_effect = requests.exceptions.HTTPError("HTTP 401 Unauthorized")
        
        with pytest.raises(Exception, match="Failed to fetch user info: HTTP 401 Unauthorized"):
            self.provider.get_user_info("invalid_token")
    
    def test_get_jwks_uri(self):
        """Test JWKS URI retrieval."""
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == "https://www.googleapis.com/oauth2/v3/certs"
    
    @patch('requests.get')
    def test_fetch_jwks_integration(self, mock_get):
        """Test JWKS fetching integration."""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.json.return_value = {
            "keys": [
                {
                    "kty": "RSA",
                    "kid": "google_key_1",
                    "use": "sig",
                    "alg": "RS256",
                    "n": "google_modulus_1",
                    "e": "AQAB"
                },
                {
                    "kty": "RSA", 
                    "kid": "google_key_2",
                    "use": "sig",
                    "alg": "RS256",
                    "n": "google_modulus_2",
                    "e": "AQAB"
                }
            ]
        }
        mock_get.return_value = mock_response
        
        jwks = self.provider.fetch_jwks()
        
        assert "keys" in jwks
        assert len(jwks["keys"]) == 2
        assert jwks["keys"][0]["kid"] == "google_key_1"
        assert jwks["keys"][1]["kid"] == "google_key_2"
        
        mock_get.assert_called_once_with(self.provider.JWKS_URI, timeout=5)


class TestGoogleOAuthProviderEdgeCases:
    """Test edge cases and error conditions for Google OAuth provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = GoogleOAuthProvider(
            client_id="test_client_id",
            client_secret="test_client_secret",
            redirect_uri="https://app.com/callback"
        )
    
    def test_get_authorization_url_empty_state(self):
        """Test authorization URL generation with empty state."""
        auth_url = self.provider.get_authorization_url("", self.provider.redirect_uri)
        
        assert "state=" in auth_url
        assert self.provider.AUTHORIZATION_ENDPOINT in auth_url
    
    def test_get_authorization_url_unicode_characters(self):
        """Test authorization URL with unicode characters."""
        state = "state_with_unicode_测试"
        redirect_uri = "https://app.example.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        
        # Should handle unicode characters properly
        assert "state=state_with_unicode_%E6%B5%8B%E8%AF%95" in auth_url
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_network_timeout(self, mock_post):
        """Test token exchange with network timeout."""
        mock_post.side_effect = requests.exceptions.Timeout("Request timeout")
        
        with pytest.raises(Exception, match="Token request failed: Request timeout"):
            self.provider.exchange_code_for_tokens("test_code", self.provider.redirect_uri)
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_connection_error(self, mock_post):
        """Test token exchange with connection error."""
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection failed")
        
        with pytest.raises(Exception, match="Token request failed: Connection failed"):
            self.provider.exchange_code_for_tokens("test_code", self.provider.redirect_uri)
    
    @patch('requests.get')
    def test_validate_id_token_jwks_fetch_error(self, mock_get):
        """Test ID token validation when JWKS fetch fails."""
        mock_get.side_effect = requests.exceptions.ConnectionError("JWKS fetch failed")
        
        with pytest.raises(Exception, match="Failed to fetch JWKS: JWKS fetch failed"):
            self.provider.validate_id_token("test_token")
    
    @patch('requests.get')
    def test_get_user_info_partial_response(self, mock_get):
        """Test user info retrieval with partial response."""
        # Mock response with missing optional fields
        mock_response = Mock()
        mock_response.json.return_value = {
            "sub": "123456789",
            "email": "test@gmail.com"
            # Missing: email_verified, name, picture, given_name, family_name
        }
        mock_get.return_value = mock_response
        
        result = self.provider.get_user_info("test_token")
        
        # Should handle missing fields gracefully
        assert result["id"] == "123456789"
        assert result["email"] == "test@gmail.com"
        assert result["email_verified"] is False  # Default value
        assert result["name"] is None
        assert result["picture"] is None
        assert result["given_name"] is None
        assert result["family_name"] is None
    
    @patch('requests.get')
    def test_get_user_info_empty_response(self, mock_get):
        """Test user info retrieval with empty response."""
        mock_response = Mock()
        mock_response.json.return_value = {}
        mock_get.return_value = mock_response
        
        result = self.provider.get_user_info("test_token")
        
        # Should handle empty response gracefully
        assert result["id"] is None
        assert result["email"] is None
        assert result["email_verified"] is False
        assert result["name"] is None
        assert result["picture"] is None
        assert result["given_name"] is None
        assert result["family_name"] is None
    
    def test_provider_string_representation(self):
        """Test string representation of Google provider."""
        repr_str = repr(self.provider)
        
        assert "GoogleOAuthProvider" in repr_str
        assert "provider=google" in repr_str


if __name__ == "__main__":
    pytest.main([__file__, "-v"])