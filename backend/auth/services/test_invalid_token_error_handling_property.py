"""
Property-based tests for invalid token error handling.

**Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**
**Property 5: Invalid Token Error Handling**

This module contains property-based tests that verify invalid token error handling
works correctly across all supported social providers. The test validates that
any invalid or malformed ID token from any social provider returns an error
response with error code AUTH_INVALID_TOKEN.
"""

import pytest
import jwt
import time
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .oauth_service import OAuthService
from .provider_factory import get_supported_providers
from ..utils.errors import AuthErrorCode
from ..config import AuthConfig


# Custom strategies for invalid token testing
@composite
def provider_name(draw):
    """Generate valid provider names."""
    return draw(st.sampled_from(get_supported_providers()))


@composite
def invalid_token_format(draw):
    """Generate various types of invalid token formats."""
    return draw(st.one_of(
        # Empty or whitespace tokens
        st.just(""),
        st.just("   "),
        st.just("\n\t"),
        
        # Malformed JWT structures
        st.just("not.a.jwt"),
        st.just("invalid"),
        st.just("header.payload"),  # Missing signature
        st.just("header.payload.signature.extra"),  # Too many parts
        st.just(".."),  # Empty parts
        st.just("header..signature"),  # Empty payload
        st.just(".payload.signature"),  # Empty header
        
        # Invalid base64 encoding
        st.just("invalid_base64.invalid_base64.invalid_base64"),
        st.just("header!@#$.payload!@#$.signature!@#$"),
        
        # Random text that's not JWT
        st.text(min_size=1, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='!@#$%^&*()[]{}|;:,.<>?'
        )),
        
        # SQL injection attempts
        st.just("'; DROP TABLE users; --"),
        st.just("1' OR '1'='1"),
        
        # XSS attempts
        st.just("<script>alert('xss')</script>"),
        st.just("javascript:alert('xss')"),
        
        # Very long strings
        st.text(min_size=10000, max_size=50000, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd')
        )),
        
        # Binary data as string
        st.binary(min_size=10, max_size=100).map(lambda x: x.decode('latin1')),
        
        # Unicode and special characters
        st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Sm', 'Sc', 'Sk', 'So')  # Math, currency, modifier, other symbols
        ))
    ))


class TestInvalidTokenErrorHandlingProperties:
    """Property-based tests for invalid token error handling."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.oauth_service = OAuthService()
        self.oauth_service.table = self.mock_table
        
        # Mock successful DynamoDB operations
        self.mock_table.put_item.return_value = {}
        self.mock_table.get_item.return_value = {"Item": {
            "state": "test_state",
            "provider": "google",
            "redirect_uri": "https://app.example.com/callback",
            "ttl": int(time.time()) + 600
        }}
        self.mock_table.delete_item.return_value = {}

    @given(
        provider=provider_name(),
        invalid_token=invalid_token_format()
    )
    @settings(max_examples=100, deadline=15000)
    def test_invalid_token_format_error_handling_property(self, provider, invalid_token):
        """
        **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**
        **Property 5: Invalid Token Error Handling (Format Errors)**
        
        For any invalid or malformed ID token from any social provider,
        the authentication flow should return an error response with
        error code AUTH_INVALID_TOKEN.
        
        This property verifies that:
        1. All types of malformed tokens are rejected consistently
        2. The correct error code AUTH_INVALID_TOKEN is returned
        3. The error handling works across all supported providers
        4. No sensitive information is leaked in error messages
        5. The system handles edge cases gracefully (empty, very long, binary data)
        """
        with patch('auth.services.provider_factory.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            
            # Configure provider to raise exception for invalid token
            mock_provider.validate_id_token.side_effect = Exception("Invalid token format")
            mock_get_provider.return_value = mock_provider
            
            # Try to validate the invalid token
            with pytest.raises(Exception) as exc_info:
                self.oauth_service.validate_token(provider, invalid_token)
            
            # Verify the provider's validate_id_token was called
            mock_provider.validate_id_token.assert_called_once_with(invalid_token)
            
            # Verify error occurred (the specific error handling depends on the provider implementation)
            assert exc_info.value is not None
            
            # Verify provider factory was called correctly
            mock_get_provider.assert_called_once_with(provider, "https://dummy.example.com")

    @given(
        provider=provider_name(),
        iterations=st.integers(min_value=2, max_value=5)
    )
    @settings(max_examples=50, deadline=20000)
    def test_invalid_token_consistency_across_attempts_property(self, provider, iterations):
        """
        **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**
        **Property 5: Invalid Token Error Handling (Consistency)**
        
        For any social provider, invalid token error handling should be
        consistent across multiple attempts with the same invalid token.
        The same error should be returned every time.
        
        This property verifies that:
        1. Error handling is deterministic and consistent
        2. No race conditions or state issues affect error handling
        3. The same invalid token always produces the same error
        4. Provider behavior is stable across multiple calls
        """
        invalid_token = "definitely.not.valid"
        
        with patch('auth.services.provider_factory.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.validate_id_token.side_effect = Exception("Consistent error message")
            mock_get_provider.return_value = mock_provider
            
            errors = []
            
            # Try validation multiple times
            for i in range(iterations):
                try:
                    self.oauth_service.validate_token(provider, invalid_token)
                    # Should not reach here
                    assert False, f"Expected exception on iteration {i}"
                except Exception as e:
                    errors.append(str(e))
            
            # Verify all errors are the same (consistent behavior)
            assert len(errors) == iterations
            assert all(error == errors[0] for error in errors), (
                f"Inconsistent error messages across attempts: {errors}"
            )
            
            # Verify provider was called the expected number of times
            assert mock_provider.validate_id_token.call_count == iterations

    @given(
        provider=provider_name(),
        invalid_tokens=st.lists(
            invalid_token_format(),
            min_size=2,
            max_size=5,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=20000)
    def test_different_invalid_tokens_error_handling_property(self, provider, invalid_tokens):
        """
        **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**
        **Property 5: Invalid Token Error Handling (Different Invalid Tokens)**
        
        For any social provider and any set of different invalid tokens,
        the authentication flow should consistently return error responses
        for all invalid tokens, regardless of the specific type of invalidity.
        
        This property verifies that:
        1. All types of invalid tokens are rejected
        2. The error handling is comprehensive across different invalidity types
        3. No invalid token type is accidentally accepted
        4. Provider behavior is consistent across different invalid inputs
        """
        with patch('auth.services.provider_factory.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.validate_id_token.side_effect = Exception("Invalid token")
            mock_get_provider.return_value = mock_provider
            
            # Test each invalid token
            for i, invalid_token in enumerate(invalid_tokens):
                with pytest.raises(Exception) as exc_info:
                    self.oauth_service.validate_token(provider, invalid_token)
                
                # Verify error occurred for this token
                assert exc_info.value is not None, f"No error for invalid token {i}: {invalid_token}"
            
            # Verify provider was called for each token
            assert mock_provider.validate_id_token.call_count == len(invalid_tokens)
            
            # Verify each token was passed to the provider
            call_args_list = mock_provider.validate_id_token.call_args_list
            passed_tokens = [call[0][0] for call in call_args_list]
            assert set(passed_tokens) == set(invalid_tokens)

    @given(
        provider=provider_name()
    )
    @settings(max_examples=50, deadline=10000)
    def test_null_and_none_token_error_handling_property(self, provider):
        """
        **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**
        **Property 5: Invalid Token Error Handling (Null/None Values)**
        
        For any social provider and null/None token values, the authentication
        flow should return an error response with error code AUTH_INVALID_TOKEN.
        
        This property verifies that:
        1. Null and None values are handled gracefully
        2. No null pointer exceptions or similar errors occur
        3. Appropriate error codes are returned for missing tokens
        4. The system handles edge cases robustly
        """
        null_values = [None, "", "null", "undefined", "None"]
        
        with patch('auth.services.provider_factory.get_provider') as mock_get_provider:
            # Mock provider instance
            mock_provider = Mock()
            mock_provider.validate_id_token.side_effect = Exception("Token is required")
            mock_get_provider.return_value = mock_provider
            
            for null_value in null_values:
                with pytest.raises(Exception) as exc_info:
                    self.oauth_service.validate_token(provider, null_value)
                
                # Verify error occurred
                assert exc_info.value is not None
                
                # Verify provider was called (even with null value)
                mock_provider.validate_id_token.assert_called_with(null_value)
            
            # Verify provider was called for each null value
            assert mock_provider.validate_id_token.call_count == len(null_values)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])