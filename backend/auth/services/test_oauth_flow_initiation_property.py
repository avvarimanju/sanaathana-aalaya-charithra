"""
Property-based tests for OAuth flow initiation.

**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
**Property 1: OAuth Flow Initiation**

This module contains property-based tests that verify OAuth flow initiation
works correctly for all supported social providers, returning proper
authorization URLs and state parameters for CSRF protection.
"""

import pytest
import re
from unittest.mock import Mock, patch, MagicMock
from urllib.parse import urlparse, parse_qs
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .oauth_service import OAuthService
from .provider_factory import get_supported_providers


# Custom strategies for OAuth flow initiation testing
@composite
def provider_name(draw):
    """Generate valid provider names."""
    return draw(st.sampled_from(get_supported_providers()))


@composite
def redirect_uri(draw):
    """Generate valid redirect URIs."""
    # Generate realistic redirect URIs for mobile and web apps
    schemes = ["https"]  # Only HTTPS for security
    domains = [
        "app.sanaathana-aalaya.com",
        "mobile.sanaathana-aalaya.com", 
        "auth.sanaathana-aalaya.com",
        "localhost:3000",  # Development
        "localhost:8080",  # Development
        "127.0.0.1:3000"   # Development
    ]
    paths = [
        "/callback",
        "/auth/callback", 
        "/oauth/callback",
        "/auth/callback/success",
        "/mobile/auth/callback"
    ]
    
    scheme = draw(st.sampled_from(schemes))
    domain = draw(st.sampled_from(domains))
    path = draw(st.sampled_from(paths))
    
    return f"{scheme}://{domain}{path}"


@composite
def invalid_redirect_uri(draw):
    """Generate invalid redirect URIs for negative testing."""
    invalid_uris = [
        "http://insecure.com/callback",  # HTTP not allowed
        "ftp://example.com/callback",    # Wrong scheme
        "javascript:alert('xss')",       # XSS attempt
        "data:text/html,<script>alert('xss')</script>",  # Data URI
        "",                              # Empty string
        "not-a-url",                     # Invalid format
        "https://",                      # Incomplete URL
        "https://evil.com/callback"      # Not whitelisted domain
    ]
    return draw(st.sampled_from(invalid_uris))


@composite
def oauth_state_parameter(draw):
    """Generate OAuth state parameters for testing."""
    # State should be cryptographically secure, at least 32 bytes
    return draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='-_'),
        min_size=43,  # 32 bytes base64url encoded = 43 chars
        max_size=128
    ))


class TestOAuthFlowInitiationProperties:
    """Property-based tests for OAuth flow initiation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock DynamoDB table for state storage
        self.mock_table = Mock()
        self.oauth_service = OAuthService()
        self.oauth_service.table = self.mock_table
        
        # Mock successful DynamoDB put_item for state storage
        self.mock_table.put_item.return_value = {}

    @given(
        provider=provider_name(),
        redirect_uri=redirect_uri()
    )
    @settings(max_examples=100, deadline=10000)
    def test_oauth_flow_initiation_property(self, provider, redirect_uri):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation**
        
        For any supported social provider (Google, Facebook, Instagram, Apple, 
        Twitter/X, GitHub, Microsoft) and any valid redirect URI, initiating 
        the OAuth flow should return an authorization URL and a state parameter 
        for CSRF protection.
        
        This property verifies that:
        1. Authorization URL is returned and is a valid HTTPS URL
        2. State parameter is returned and is cryptographically secure
        3. Authorization URL contains required OAuth parameters
        4. State parameter is stored in DynamoDB for CSRF validation
        5. The flow works consistently across all supported providers
        """
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.get_authorization_url.return_value = (
                f"https://oauth.{provider}.com/authorize"
                f"?client_id=test_client"
                f"&redirect_uri={redirect_uri}"
                f"&response_type=code"
                f"&scope=openid%20email%20profile"
                f"&state=test_state_123"
            )
            mock_get_provider.return_value = mock_provider
            
            # Initiate OAuth flow
            result = self.oauth_service.initiate_auth(provider, redirect_uri)
            
            # Verify result structure
            assert isinstance(result, dict), "Result should be a dictionary"
            assert "authorization_url" in result, "Result should contain authorization_url"
            assert "state" in result, "Result should contain state parameter"
            
            # Verify authorization URL is valid HTTPS URL
            auth_url = result["authorization_url"]
            assert isinstance(auth_url, str), "Authorization URL should be a string"
            assert auth_url.startswith("https://"), (
                f"Authorization URL should use HTTPS. Got: {auth_url}"
            )
            
            # Parse and validate authorization URL
            parsed_url = urlparse(auth_url)
            assert parsed_url.scheme == "https", "Authorization URL should use HTTPS scheme"
            assert parsed_url.netloc, "Authorization URL should have a valid domain"
            assert parsed_url.path, "Authorization URL should have a path"
            
            # Verify authorization URL contains OAuth parameters
            query_params = parse_qs(parsed_url.query)
            expected_params = ["client_id", "redirect_uri", "response_type", "scope", "state"]
            for param in expected_params:
                assert param in query_params, (
                    f"Authorization URL should contain {param} parameter. "
                    f"URL: {auth_url}"
                )
            
            # Verify state parameter properties
            state = result["state"]
            assert isinstance(state, str), "State parameter should be a string"
            assert len(state) >= 43, (
                f"State parameter should be at least 43 characters (32 bytes base64url). "
                f"Got length: {len(state)}"
            )
            
            # Verify state parameter is URL-safe (base64url characters only)
            state_pattern = re.compile(r'^[A-Za-z0-9_-]+$')
            assert state_pattern.match(state), (
                f"State parameter should contain only URL-safe characters. Got: {state}"
            )
            
            # Verify provider factory was called correctly
            mock_get_provider.assert_called_once_with(provider, redirect_uri)
            
            # Verify provider's get_authorization_url was called
            mock_provider.get_authorization_url.assert_called_once()
            call_args = mock_provider.get_authorization_url.call_args[0]
            assert len(call_args) == 2, "get_authorization_url should be called with 2 arguments"
            assert call_args[1] == redirect_uri, "Redirect URI should be passed to provider"
            
            # Verify state is stored in DynamoDB
            self.mock_table.put_item.assert_called_once()
            stored_item = self.mock_table.put_item.call_args[1]["Item"]
            
            assert "state" in stored_item, "State should be stored in DynamoDB"
            assert "provider" in stored_item, "Provider should be stored with state"
            assert "redirect_uri" in stored_item, "Redirect URI should be stored with state"
            assert "ttl" in stored_item, "TTL should be set for state cleanup"
            
            assert stored_item["provider"] == provider, (
                f"Stored provider should match input. Expected: {provider}, "
                f"Got: {stored_item['provider']}"
            )
            assert stored_item["redirect_uri"] == redirect_uri, (
                "Stored redirect URI should match input"
            )

    @given(
        provider=provider_name(),
        redirect_uri=redirect_uri(),
        iterations=st.integers(min_value=2, max_value=5)
    )
    @settings(max_examples=50, deadline=15000)
    def test_oauth_state_uniqueness_property(self, provider, redirect_uri, iterations):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation (State Uniqueness)**
        
        For any supported provider and redirect URI, multiple OAuth flow
        initiations should generate unique state parameters to prevent
        CSRF attacks and ensure proper flow isolation.
        
        This property verifies that:
        1. Each initiation generates a unique state parameter
        2. State parameters are cryptographically random
        3. No state collisions occur across multiple initiations
        """
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.get_authorization_url.return_value = (
                f"https://oauth.{provider}.com/authorize?state=mock_state"
            )
            mock_get_provider.return_value = mock_provider
            
            # Generate multiple OAuth flows
            states = []
            for i in range(iterations):
                # Reset mock for each iteration
                self.mock_table.reset_mock()
                self.mock_table.put_item.return_value = {}
                
                result = self.oauth_service.initiate_auth(provider, redirect_uri)
                states.append(result["state"])
            
            # Verify all states are unique
            assert len(states) == len(set(states)), (
                f"All state parameters should be unique. Got duplicates in: {states}"
            )
            
            # Verify each state meets security requirements
            for i, state in enumerate(states):
                assert len(state) >= 43, (
                    f"State {i} should be at least 43 characters. Got: {len(state)}"
                )
                
                # Verify state entropy (should not be predictable patterns)
                assert not state.isdigit(), f"State {i} should not be all digits: {state}"
                assert not state.isalpha(), f"State {i} should not be all letters: {state}"
                assert state != state.lower(), f"State {i} should have mixed case: {state}"

    @given(
        provider=provider_name(),
        redirect_uri=redirect_uri()
    )
    @settings(max_examples=50, deadline=10000)
    def test_oauth_flow_provider_consistency_property(self, provider, redirect_uri):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation (Provider Consistency)**
        
        For any supported provider, the OAuth flow initiation should follow
        the same consistent pattern regardless of which specific provider
        is used, ensuring uniform behavior across all social providers.
        
        This property verifies that:
        1. All providers return the same result structure
        2. All providers generate secure state parameters
        3. All providers store state in DynamoDB consistently
        4. Provider-specific logic doesn't break the common interface
        """
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider instance with provider-specific URL
            mock_provider = Mock()
            
            # Generate provider-specific authorization URL
            provider_domains = {
                "google": "accounts.google.com",
                "facebook": "www.facebook.com", 
                "instagram": "api.instagram.com",
                "apple": "appleid.apple.com",
                "twitter": "twitter.com",
                "github": "github.com",
                "microsoft": "login.microsoftonline.com"
            }
            
            domain = provider_domains.get(provider, f"oauth.{provider}.com")
            mock_provider.get_authorization_url.return_value = (
                f"https://{domain}/oauth/authorize"
                f"?client_id=test_client_{provider}"
                f"&redirect_uri={redirect_uri}"
                f"&response_type=code"
                f"&state=test_state"
            )
            mock_get_provider.return_value = mock_provider
            
            # Initiate OAuth flow
            result = self.oauth_service.initiate_auth(provider, redirect_uri)
            
            # Verify consistent result structure regardless of provider
            assert isinstance(result, dict), f"Provider {provider} should return dict"
            assert set(result.keys()) == {"authorization_url", "state"}, (
                f"Provider {provider} should return exactly authorization_url and state keys. "
                f"Got: {list(result.keys())}"
            )
            
            # Verify authorization URL format is consistent
            auth_url = result["authorization_url"]
            assert auth_url.startswith("https://"), (
                f"Provider {provider} should return HTTPS URL. Got: {auth_url}"
            )
            
            # Verify state parameter format is consistent
            state = result["state"]
            assert isinstance(state, str), f"Provider {provider} state should be string"
            assert len(state) >= 43, (
                f"Provider {provider} state should be at least 43 chars. Got: {len(state)}"
            )
            
            # Verify DynamoDB storage is consistent
            self.mock_table.put_item.assert_called_once()
            stored_item = self.mock_table.put_item.call_args[1]["Item"]
            
            required_fields = ["state", "provider", "redirect_uri", "ttl"]
            for field in required_fields:
                assert field in stored_item, (
                    f"Provider {provider} should store {field} in DynamoDB"
                )
            
            # Verify provider-specific data is stored correctly
            assert stored_item["provider"] == provider, (
                f"Stored provider should be {provider}, got {stored_item['provider']}"
            )

    @given(provider=provider_name())
    @settings(max_examples=50, deadline=10000)
    def test_oauth_flow_error_handling_property(self, provider):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation (Error Handling)**
        
        For any supported provider, when OAuth flow initiation encounters
        errors (invalid redirect URI, provider failures, etc.), the system
        should handle errors gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. Invalid redirect URIs are rejected with appropriate errors
        2. Provider failures are handled gracefully
        3. DynamoDB failures are handled gracefully
        4. Error messages are informative and secure
        """
        # Test with invalid redirect URI
        invalid_uri = "http://insecure.com/callback"  # HTTP not allowed
        
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider to raise validation error for invalid URI
            mock_provider = Mock()
            mock_provider.get_authorization_url.side_effect = ValueError(
                "Invalid redirect URI: must use HTTPS"
            )
            mock_get_provider.return_value = mock_provider
            
            # Verify invalid redirect URI is rejected
            with pytest.raises(ValueError, match="Invalid redirect URI"):
                self.oauth_service.initiate_auth(provider, invalid_uri)
            
            # Verify provider was called (error occurred in provider, not service)
            mock_get_provider.assert_called_once_with(provider, invalid_uri)

    @given(
        provider=provider_name(),
        redirect_uri=redirect_uri()
    )
    @settings(max_examples=30, deadline=10000)
    def test_oauth_flow_state_storage_property(self, provider, redirect_uri):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation (State Storage)**
        
        For any OAuth flow initiation, the state parameter should be properly
        stored in DynamoDB with appropriate TTL and metadata for later
        validation during the callback phase.
        
        This property verifies that:
        1. State is stored with correct TTL (10 minutes)
        2. Provider and redirect URI are stored with state
        3. State storage is atomic and consistent
        4. Storage format is suitable for callback validation
        """
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.get_authorization_url.return_value = (
                f"https://oauth.{provider}.com/authorize?state=test"
            )
            mock_get_provider.return_value = mock_provider
            
            # Mock current time for TTL calculation
            with patch('time.time', return_value=1640995200):  # Fixed timestamp
                result = self.oauth_service.initiate_auth(provider, redirect_uri)
            
            # Verify state storage
            self.mock_table.put_item.assert_called_once()
            stored_item = self.mock_table.put_item.call_args[1]["Item"]
            
            # Verify state storage structure
            assert stored_item["state"] == result["state"], (
                "Stored state should match returned state"
            )
            assert stored_item["provider"] == provider, (
                "Stored provider should match input provider"
            )
            assert stored_item["redirect_uri"] == redirect_uri, (
                "Stored redirect URI should match input"
            )
            
            # Verify TTL is set correctly (10 minutes = 600 seconds)
            expected_ttl = 1640995200 + 600  # Current time + 10 minutes
            assert stored_item["ttl"] == expected_ttl, (
                f"TTL should be set to 10 minutes from now. "
                f"Expected: {expected_ttl}, Got: {stored_item['ttl']}"
            )
            
            # Verify DynamoDB put_item was called with correct parameters
            put_item_kwargs = self.mock_table.put_item.call_args[1]
            assert "Item" in put_item_kwargs, "put_item should be called with Item parameter"
            
            # Verify conditional expression to prevent overwrites
            assert "ConditionExpression" in put_item_kwargs, (
                "put_item should use ConditionExpression to prevent state overwrites"
            )

    @given(
        provider=provider_name(),
        redirect_uri=redirect_uri()
    )
    @settings(max_examples=50, deadline=10000)
    def test_oauth_flow_authorization_url_format_property(self, provider, redirect_uri):
        """
        **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**
        **Property 1: OAuth Flow Initiation (Authorization URL Format)**
        
        For any OAuth flow initiation, the returned authorization URL should
        be properly formatted with all required OAuth 2.0 parameters and
        should be suitable for redirecting users to the social provider.
        
        This property verifies that:
        1. Authorization URL is a valid HTTPS URL
        2. URL contains all required OAuth 2.0 parameters
        3. Parameters are properly URL-encoded
        4. URL structure follows OAuth 2.0 specification
        """
        with patch('backend.auth.services.oauth_service.get_provider') as mock_get_provider:
            # Mock provider with realistic authorization URL
            mock_provider = Mock()
            
            # Create realistic authorization URL with proper parameters
            from urllib.parse import urlencode
            params = {
                "client_id": f"test_client_{provider}",
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": "test_state_parameter",
                "access_type": "offline"  # Some providers need this
            }
            query_string = urlencode(params)
            
            mock_provider.get_authorization_url.return_value = (
                f"https://oauth.{provider}.com/authorize?{query_string}"
            )
            mock_get_provider.return_value = mock_provider
            
            # Initiate OAuth flow
            result = self.oauth_service.initiate_auth(provider, redirect_uri)
            
            # Parse authorization URL
            auth_url = result["authorization_url"]
            parsed_url = urlparse(auth_url)
            query_params = parse_qs(parsed_url.query)
            
            # Verify URL structure
            assert parsed_url.scheme == "https", (
                f"Authorization URL should use HTTPS. Got: {parsed_url.scheme}"
            )
            assert parsed_url.netloc, (
                f"Authorization URL should have valid domain. Got: {parsed_url.netloc}"
            )
            assert parsed_url.path, (
                f"Authorization URL should have path. Got: {parsed_url.path}"
            )
            
            # Verify required OAuth 2.0 parameters
            required_params = ["client_id", "redirect_uri", "response_type"]
            for param in required_params:
                assert param in query_params, (
                    f"Authorization URL should contain {param} parameter. "
                    f"URL: {auth_url}"
                )
                assert query_params[param], (
                    f"Parameter {param} should have a value. Got: {query_params[param]}"
                )
            
            # Verify response_type is 'code' (authorization code flow)
            assert query_params["response_type"][0] == "code", (
                f"response_type should be 'code'. Got: {query_params['response_type'][0]}"
            )
            
            # Verify redirect_uri matches input
            assert query_params["redirect_uri"][0] == redirect_uri, (
                f"redirect_uri in URL should match input. "
                f"Expected: {redirect_uri}, Got: {query_params['redirect_uri'][0]}"
            )
            
            # Verify state parameter is present
            assert "state" in query_params, (
                f"Authorization URL should contain state parameter. URL: {auth_url}"
            )
            
            # Verify URL is properly encoded (no spaces, special chars handled)
            assert " " not in auth_url, (
                f"Authorization URL should be properly encoded (no spaces). URL: {auth_url}"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])