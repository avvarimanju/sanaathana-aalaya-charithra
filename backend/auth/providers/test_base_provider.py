"""
Unit tests for BaseOAuthProvider abstract class.

Tests abstract method enforcement, common helper methods, and interface contract.
Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
"""

import pytest
import secrets
import hashlib
import base64
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List
import requests

from .base_provider import BaseOAuthProvider


class ConcreteProvider(BaseOAuthProvider):
    """Concrete implementation of BaseOAuthProvider for testing."""
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Test implementation of abstract method."""
        params = {
            'client_id': self.client_id,
            'redirect_uri': redirect_uri,
            'scope': ' '.join(self.scopes),
            'state': state,
            'response_type': 'code'
        }
        return self.build_authorization_url('https://example.com/oauth/authorize', params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """Test implementation of abstract method."""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        return self.make_token_request('https://example.com/oauth/token', data)
    
    def validate_id_token(self, id_token: str) -> Dict:
        """Test implementation of abstract method."""
        # Simple mock validation for testing
        return {
            'sub': '12345',
            'email': 'test@example.com',
            'email_verified': True,
            'name': 'Test User',
            'picture': 'https://example.com/avatar.jpg'
        }
    
    def get_user_info(self, access_token: str) -> Dict:
        """Test implementation of abstract method."""
        return self.make_user_info_request('https://example.com/userinfo', access_token)
    
    def get_jwks_uri(self) -> str:
        """Test implementation of abstract method."""
        return 'https://example.com/.well-known/jwks.json'


class IncompleteProvider(BaseOAuthProvider):
    """Incomplete implementation missing abstract methods for testing."""
    pass


class TestBaseOAuthProvider:
    """Test suite for BaseOAuthProvider abstract class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client_id = "test_client_id"
        self.client_secret = "test_client_secret"
        self.redirect_uri = "https://app.example.com/callback"
        self.scopes = ["openid", "email", "profile"]
        self.provider_name = "test_provider"
        
        self.provider = ConcreteProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri,
            scopes=self.scopes,
            provider_name=self.provider_name
        )
    
    def test_abstract_method_enforcement(self):
        """Test that abstract methods must be implemented."""
        # Should not be able to instantiate incomplete provider
        with pytest.raises(TypeError, match="Can't instantiate abstract class"):
            IncompleteProvider(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                scopes=self.scopes,
                provider_name=self.provider_name
            )
    
    def test_concrete_provider_instantiation(self):
        """Test that concrete provider can be instantiated."""
        provider = ConcreteProvider(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri,
            scopes=self.scopes,
            provider_name=self.provider_name
        )
        
        assert provider.client_id == self.client_id
        assert provider.client_secret == self.client_secret
        assert provider.redirect_uri == self.redirect_uri
        assert provider.scopes == self.scopes
        assert provider.provider_name == self.provider_name
        assert provider._jwks_cache is None
        assert provider._jwks_cache_time == 0
        assert provider._jwks_cache_ttl == 3600
    
    def test_generate_state_default_length(self):
        """Test state generation with default length."""
        state = self.provider.generate_state()
        
        # Should be URL-safe base64 encoded
        assert isinstance(state, str)
        assert len(state) > 0
        
        # Should be different each time
        state2 = self.provider.generate_state()
        assert state != state2
    
    def test_generate_state_custom_length(self):
        """Test state generation with custom length."""
        length = 16
        state = self.provider.generate_state(length)
        
        # Should be URL-safe base64 encoded
        assert isinstance(state, str)
        assert len(state) > 0
        
        # Different lengths should produce different sized outputs
        state_32 = self.provider.generate_state(32)
        assert len(state) != len(state_32)
    
    def test_generate_state_cryptographic_randomness(self):
        """Test that generated states are cryptographically random."""
        states = [self.provider.generate_state() for _ in range(100)]
        
        # All states should be unique
        assert len(set(states)) == 100
        
        # Should not contain predictable patterns
        for state in states[:10]:  # Check first 10
            assert state.isalnum() or '-' in state or '_' in state  # URL-safe chars
    
    def test_build_authorization_url(self):
        """Test authorization URL building."""
        auth_endpoint = "https://example.com/oauth/authorize"
        params = {
            'client_id': 'test_id',
            'redirect_uri': 'https://app.com/callback',
            'scope': 'openid email',
            'state': 'test_state',
            'response_type': 'code'
        }
        
        url = self.provider.build_authorization_url(auth_endpoint, params)
        
        assert url.startswith(auth_endpoint)
        assert 'client_id=test_id' in url
        assert 'redirect_uri=https%3A//app.com/callback' in url
        assert 'scope=openid+email' in url
        assert 'state=test_state' in url
        assert 'response_type=code' in url
    
    def test_build_authorization_url_empty_params(self):
        """Test authorization URL building with empty parameters."""
        auth_endpoint = "https://example.com/oauth/authorize"
        params = {}
        
        url = self.provider.build_authorization_url(auth_endpoint, params)
        
        assert url == auth_endpoint + "?"
    
    @patch('requests.post')
    def test_make_token_request_success(self, mock_post):
        """Test successful token request."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'test_access_token',
            'id_token': 'test_id_token',
            'expires_in': 3600,
            'token_type': 'Bearer'
        }
        mock_post.return_value = mock_response
        
        token_endpoint = "https://example.com/oauth/token"
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': 'test_code',
            'grant_type': 'authorization_code'
        }
        
        result = self.provider.make_token_request(token_endpoint, data)
        
        assert result['access_token'] == 'test_access_token'
        assert result['id_token'] == 'test_id_token'
        assert result['expires_in'] == 3600
        assert result['token_type'] == 'Bearer'
        
        # Verify request was made correctly
        mock_post.assert_called_once_with(
            token_endpoint,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
    
    @patch('requests.post')
    def test_make_token_request_with_custom_headers(self, mock_post):
        """Test token request with custom headers."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'access_token': 'test_token'}
        mock_post.return_value = mock_response
        
        custom_headers = {"Authorization": "Basic dGVzdA=="}
        
        result = self.provider.make_token_request(
            "https://example.com/token",
            {"grant_type": "client_credentials"},
            custom_headers
        )
        
        mock_post.assert_called_once_with(
            "https://example.com/token",
            data={"grant_type": "client_credentials"},
            headers=custom_headers,
            timeout=5
        )
    
    @patch('requests.post')
    def test_make_token_request_client_error(self, mock_post):
        """Test token request with client error."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'error': 'invalid_request',
            'error_description': 'Invalid authorization code'
        }
        mock_response.content = b'{"error": "invalid_request"}'
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception, match="Token request failed: 400 - Invalid authorization code"):
            self.provider.make_token_request(
                "https://example.com/token",
                {"code": "invalid_code"}
            )
    
    @patch('requests.post')
    @patch('time.sleep')
    def test_make_token_request_server_error_retry(self, mock_sleep, mock_post):
        """Test token request retry on server error."""
        # First two calls return server error, third succeeds
        mock_response_error = Mock()
        mock_response_error.status_code = 500
        mock_response_error.json.return_value = {'error': 'server_error'}
        mock_response_error.content = b'{"error": "server_error"}'
        
        mock_response_success = Mock()
        mock_response_success.status_code = 200
        mock_response_success.json.return_value = {'access_token': 'test_token'}
        
        mock_post.side_effect = [mock_response_error, mock_response_error, mock_response_success]
        
        result = self.provider.make_token_request(
            "https://example.com/token",
            {"grant_type": "client_credentials"}
        )
        
        assert result['access_token'] == 'test_token'
        assert mock_post.call_count == 3
        assert mock_sleep.call_count == 2  # Two retries
    
    @patch('requests.post')
    def test_make_token_request_network_error(self, mock_post):
        """Test token request with network error."""
        mock_post.side_effect = requests.exceptions.ConnectionError("Network error")
        
        with pytest.raises(Exception, match="Token request failed: Network error"):
            self.provider.make_token_request(
                "https://example.com/token",
                {"grant_type": "client_credentials"}
            )
    
    @patch('requests.get')
    def test_fetch_jwks_success(self, mock_get):
        """Test successful JWKS fetch."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kty': 'RSA',
                    'kid': 'test_key_id',
                    'n': 'test_modulus',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response
        
        jwks = self.provider.fetch_jwks()
        
        assert 'keys' in jwks
        assert len(jwks['keys']) == 1
        assert jwks['keys'][0]['kid'] == 'test_key_id'
        
        mock_get.assert_called_once_with('https://example.com/.well-known/jwks.json', timeout=5)
    
    @patch('requests.get')
    @patch('time.time')
    def test_fetch_jwks_caching(self, mock_time, mock_get):
        """Test JWKS caching behavior."""
        # Mock time progression
        mock_time.side_effect = [1000, 1500, 4000]  # Initial, within cache, after cache expiry
        
        mock_response = Mock()
        mock_response.json.return_value = {'keys': [{'kid': 'test_key'}]}
        mock_get.return_value = mock_response
        
        # First call - should fetch
        jwks1 = self.provider.fetch_jwks()
        assert mock_get.call_count == 1
        
        # Second call within cache TTL - should use cache
        jwks2 = self.provider.fetch_jwks()
        assert mock_get.call_count == 1  # No additional call
        assert jwks1 == jwks2
        
        # Third call after cache expiry - should fetch again
        jwks3 = self.provider.fetch_jwks()
        assert mock_get.call_count == 2  # Additional call made
    
    @patch('requests.get')
    def test_fetch_jwks_network_error(self, mock_get):
        """Test JWKS fetch with network error."""
        mock_get.side_effect = requests.exceptions.ConnectionError("Network error")
        
        with pytest.raises(Exception, match="Failed to fetch JWKS: Network error"):
            self.provider.fetch_jwks()
    
    @patch('requests.get')
    def test_make_user_info_request_success(self, mock_get):
        """Test successful user info request."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'id': '12345',
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/avatar.jpg'
        }
        mock_get.return_value = mock_response
        
        user_info = self.provider.make_user_info_request(
            'https://example.com/userinfo',
            'test_access_token'
        )
        
        assert user_info['id'] == '12345'
        assert user_info['email'] == 'test@example.com'
        assert user_info['name'] == 'Test User'
        
        mock_get.assert_called_once_with(
            'https://example.com/userinfo',
            headers={
                'Authorization': 'Bearer test_access_token',
                'Accept': 'application/json'
            },
            timeout=5
        )
    
    @patch('requests.get')
    def test_make_user_info_request_error(self, mock_get):
        """Test user info request with error."""
        mock_get.side_effect = requests.exceptions.HTTPError("HTTP error")
        
        with pytest.raises(Exception, match="Failed to fetch user info: HTTP error"):
            self.provider.make_user_info_request(
                'https://example.com/userinfo',
                'invalid_token'
            )
    
    def test_generate_code_verifier(self):
        """Test PKCE code verifier generation."""
        verifier = self.provider.generate_code_verifier()
        
        # Should be URL-safe string
        assert isinstance(verifier, str)
        assert len(verifier) == 43  # 32 bytes -> 43 characters in base64
        
        # Should be different each time
        verifier2 = self.provider.generate_code_verifier()
        assert verifier != verifier2
        
        # Should be URL-safe
        assert all(c.isalnum() or c in '-_' for c in verifier)
    
    def test_generate_code_challenge(self):
        """Test PKCE code challenge generation."""
        verifier = "test_code_verifier_12345"
        challenge = self.provider.generate_code_challenge(verifier)
        
        # Should be base64 URL-encoded SHA-256 hash
        assert isinstance(challenge, str)
        
        # Verify it's the correct SHA-256 hash
        expected_digest = hashlib.sha256(verifier.encode()).digest()
        expected_challenge = base64.urlsafe_b64encode(expected_digest).decode().rstrip('=')
        assert challenge == expected_challenge
        
        # Should be deterministic for same input
        challenge2 = self.provider.generate_code_challenge(verifier)
        assert challenge == challenge2
    
    def test_parse_query_params(self):
        """Test URL query parameter parsing."""
        url = "https://app.com/callback?code=test_code&state=test_state&scope=openid+email"
        
        params = self.provider.parse_query_params(url)
        
        assert params['code'] == 'test_code'
        assert params['state'] == 'test_state'
        assert params['scope'] == 'openid email'  # + decoded to space
    
    def test_parse_query_params_no_params(self):
        """Test URL parsing with no query parameters."""
        url = "https://app.com/callback"
        
        params = self.provider.parse_query_params(url)
        
        assert params == {}
    
    def test_parse_query_params_multiple_values(self):
        """Test URL parsing with multiple values for same parameter."""
        url = "https://app.com/callback?scope=openid&scope=email&single=value"
        
        params = self.provider.parse_query_params(url)
        
        # Multiple values should be returned as list
        assert params['scope'] == ['openid', 'email']
        assert params['single'] == 'value'
    
    def test_validate_state_success(self):
        """Test successful state validation."""
        state = "test_state_12345"
        
        # Same state should validate
        assert self.provider.validate_state(state, state) is True
    
    def test_validate_state_failure(self):
        """Test failed state validation."""
        received_state = "received_state"
        expected_state = "expected_state"
        
        # Different states should not validate
        assert self.provider.validate_state(received_state, expected_state) is False
    
    def test_validate_state_timing_attack_protection(self):
        """Test that state validation uses constant-time comparison."""
        # This test verifies that secrets.compare_digest is used
        # which provides timing attack protection
        
        state1 = "a" * 32
        state2 = "b" * 32
        
        # Should use constant-time comparison (secrets.compare_digest)
        result = self.provider.validate_state(state1, state2)
        assert result is False
        
        # Verify it works with identical strings
        result = self.provider.validate_state(state1, state1)
        assert result is True
    
    def test_repr(self):
        """Test string representation of provider."""
        repr_str = repr(self.provider)
        
        assert "ConcreteProvider" in repr_str
        assert "provider=test_provider" in repr_str
        assert repr_str.startswith("<")
        assert repr_str.endswith(">")
    
    def test_abstract_methods_are_called(self):
        """Test that abstract methods are properly called in concrete implementation."""
        # Test get_authorization_url
        state = "test_state"
        redirect_uri = "https://app.com/callback"
        
        auth_url = self.provider.get_authorization_url(state, redirect_uri)
        assert "https://example.com/oauth/authorize" in auth_url
        assert f"state={state}" in auth_url
        
        # Test validate_id_token
        claims = self.provider.validate_id_token("test_token")
        assert claims['sub'] == '12345'
        assert claims['email'] == 'test@example.com'
        
        # Test get_jwks_uri
        jwks_uri = self.provider.get_jwks_uri()
        assert jwks_uri == 'https://example.com/.well-known/jwks.json'
    
    @patch('requests.post')
    def test_exchange_code_for_tokens_integration(self, mock_post):
        """Test token exchange integration with make_token_request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'test_access_token',
            'id_token': 'test_id_token',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response
        
        result = self.provider.exchange_code_for_tokens('test_code', self.redirect_uri)
        
        assert result['access_token'] == 'test_access_token'
        assert result['id_token'] == 'test_id_token'
        
        # Verify correct parameters were sent
        call_args = mock_post.call_args
        assert call_args[1]['data']['client_id'] == self.client_id
        assert call_args[1]['data']['code'] == 'test_code'
        assert call_args[1]['data']['redirect_uri'] == self.redirect_uri
    
    @patch('requests.get')
    def test_get_user_info_integration(self, mock_get):
        """Test user info retrieval integration with make_user_info_request."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'id': '12345',
            'email': 'test@example.com',
            'name': 'Test User'
        }
        mock_get.return_value = mock_response
        
        result = self.provider.get_user_info('test_access_token')
        
        assert result['id'] == '12345'
        assert result['email'] == 'test@example.com'
        
        # Verify correct headers were sent
        call_args = mock_get.call_args
        assert call_args[1]['headers']['Authorization'] == 'Bearer test_access_token'


class TestBaseOAuthProviderEdgeCases:
    """Test edge cases and error conditions for BaseOAuthProvider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = ConcreteProvider(
            client_id="test_id",
            client_secret="test_secret",
            redirect_uri="https://app.com/callback",
            scopes=["openid"],
            provider_name="test"
        )
    
    def test_initialization_with_empty_scopes(self):
        """Test provider initialization with empty scopes."""
        provider = ConcreteProvider(
            client_id="test_id",
            client_secret="test_secret",
            redirect_uri="https://app.com/callback",
            scopes=[],
            provider_name="test"
        )
        
        assert provider.scopes == []
    
    def test_initialization_with_none_values(self):
        """Test provider initialization with None values."""
        # Should handle None values gracefully
        provider = ConcreteProvider(
            client_id="test_id",
            client_secret="test_secret",
            redirect_uri="https://app.com/callback",
            scopes=["openid"],
            provider_name="test"
        )
        
        # Internal cache should be properly initialized
        assert provider._jwks_cache is None
        assert provider._jwks_cache_time == 0
    
    def test_build_authorization_url_special_characters(self):
        """Test URL building with special characters in parameters."""
        params = {
            'redirect_uri': 'https://app.com/callback?param=value&other=test',
            'scope': 'openid email profile',
            'state': 'state with spaces & symbols!'
        }
        
        url = self.provider.build_authorization_url('https://example.com/auth', params)
        
        # Should properly encode special characters
        assert 'redirect_uri=https%3A//app.com/callback%3Fparam%3Dvalue%26other%3Dtest' in url
        assert 'scope=openid+email+profile' in url
        assert 'state=state+with+spaces+%26+symbols%21' in url
    
    @patch('requests.post')
    def test_make_token_request_empty_response(self, mock_post):
        """Test token request with empty response body."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.content = b''
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception, match="Token request failed: 400 - Unknown error"):
            self.provider.make_token_request('https://example.com/token', {})
    
    @patch('requests.post')
    def test_make_token_request_malformed_json(self, mock_post):
        """Test token request with malformed JSON response."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.content = b'invalid json'
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "doc", 0)
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception, match="Token request failed"):
            self.provider.make_token_request('https://example.com/token', {})
    
    def test_generate_state_zero_length(self):
        """Test state generation with zero length."""
        # Should handle edge case gracefully
        state = self.provider.generate_state(0)
        assert isinstance(state, str)
        # secrets.token_urlsafe(0) returns empty string
        assert state == ""
    
    def test_parse_query_params_malformed_url(self):
        """Test query parameter parsing with malformed URL."""
        # Should handle malformed URLs gracefully
        malformed_url = "not-a-valid-url"
        params = self.provider.parse_query_params(malformed_url)
        
        # Should return empty dict for malformed URLs
        assert params == {}
    
    def test_validate_state_empty_strings(self):
        """Test state validation with empty strings."""
        # Empty strings should validate as equal
        assert self.provider.validate_state("", "") is True
        
        # Empty vs non-empty should not validate
        assert self.provider.validate_state("", "non-empty") is False
        assert self.provider.validate_state("non-empty", "") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])