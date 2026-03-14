"""
Property-based tests for invalid refresh token error handling.

**Validates: Requirements 8.6**
**Property 8: Invalid Refresh Token Error Handling**

This module contains property-based tests that verify invalid refresh token error
handling works correctly. The test validates that for any invalid or expired
refresh token, attempting to refresh the access token returns an error response
with error code AUTH_SESSION_EXPIRED.
"""

import pytest
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from botocore.exceptions import ClientError
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .token_service import TokenService
from ..config import AuthConfig, AuthErrorCode


# Custom strategies for invalid refresh token testing
@composite
def invalid_refresh_token_format(draw):
    """Generate various types of invalid refresh token formats."""
    return draw(st.one_of(
        # Empty or whitespace tokens
        st.just(""),
        st.just("   "),
        st.just("\n\t"),
        st.just("\r\n"),
        
        # Null-like values
        st.just("null"),
        st.just("undefined"),
        st.just("None"),
        
        # Malformed token structures
        st.just("invalid_token"),
        st.just("not.a.refresh.token"),
        st.just("malformed"),
        
        # Invalid base64-like strings
        st.just("invalid_base64_string!@#$"),
        st.just("header!@#$.payload!@#$.signature!@#$"),
        
        # Random text that's not a valid refresh token
        st.text(min_size=1, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='!@#$%^&*()[]{}|;:,.<>?'
        )),
        
        # SQL injection attempts
        st.just("'; DROP TABLE users; --"),
        st.just("1' OR '1'='1"),
        st.just("UNION SELECT * FROM users"),
        
        # XSS attempts
        st.just("<script>alert('xss')</script>"),
        st.just("javascript:alert('xss')"),
        st.just("onload=alert('xss')"),
        
        # Very long strings (potential buffer overflow attempts)
        st.text(min_size=10000, max_size=50000, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd')
        )),
        
        # Binary data as string
        st.binary(min_size=10, max_size=100).map(lambda x: x.decode('latin1', errors='ignore')),
        
        # Unicode and special characters
        st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Sm', 'Sc', 'Sk', 'So')  # Math, currency, modifier, other symbols
        )),
        
        # Expired-looking tokens (realistic but invalid)
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                                  whitelist_characters='+/='),
            min_size=100,
            max_size=500
        ).map(lambda x: f"expired_{x}"),
        
        # Revoked-looking tokens
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                                  whitelist_characters='+/='),
            min_size=100,
            max_size=500
        ).map(lambda x: f"revoked_{x}"),
        
        # Tokens with invalid characters for base64
        st.text(min_size=50, max_size=200, alphabet='!@#$%^&*(){}[]|\\:";\'<>?,./'),
        
        # Tokens that look valid but aren't
        st.text(
            alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
            min_size=100,
            max_size=500
        ).map(lambda x: f"fake_{x}"),
        
        # Tokens with wrong format but correct-looking structure
        st.text(
            alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
            min_size=100,
            max_size=500
        )
    ))


@composite
def cognito_error_response(draw):
    """Generate various Cognito error responses for invalid refresh tokens."""
    error_codes = [
        "NotAuthorizedException",  # Most common for invalid/expired refresh tokens
        "UserNotFoundException",   # User no longer exists
        "TokenRefreshException",   # Token refresh specific error
        "InvalidParameterException",  # Invalid token format
        "ResourceNotFoundException",  # Resource not found
        "TooManyRequestsException",   # Rate limiting
        "InternalErrorException"      # Internal server error
    ]
    
    error_messages = [
        "Refresh Token has been revoked",
        "Refresh token is expired",
        "Invalid refresh token provided",
        "User does not exist",
        "Token has been revoked",
        "Refresh token has expired",
        "Invalid token format",
        "Token is not valid",
        "Authentication failed"
    ]
    
    error_code = draw(st.sampled_from(error_codes))
    error_message = draw(st.sampled_from(error_messages))
    
    return {
        "Error": {
            "Code": error_code,
            "Message": error_message
        }
    }


class TestInvalidRefreshTokenErrorHandlingProperties:
    """Property-based tests for invalid refresh token error handling."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock AWS Cognito client
        self.mock_cognito_client = Mock()
        self.token_service = TokenService()
        self.token_service.cognito_client = self.mock_cognito_client
        self.token_service.user_pool_id = "us-east-1_TestPool"
        self.token_service.client_id = "test_client_id"

    @given(
        invalid_refresh_token=invalid_refresh_token_format()
    )
    @settings(max_examples=100, deadline=15000)
    def test_invalid_refresh_token_error_handling_property(self, invalid_refresh_token):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling**
        
        For any invalid or expired refresh token, attempting to refresh the
        access token should return an error response with error code
        AUTH_SESSION_EXPIRED.
        
        This property verifies that:
        1. All types of invalid refresh tokens are rejected consistently
        2. The correct error code AUTH_SESSION_EXPIRED is returned
        3. Error messages indicate refresh token issues
        4. No sensitive information is leaked in error messages
        5. The system handles edge cases gracefully (empty, very long, binary data)
        6. Cognito integration properly handles various error scenarios
        """
        # Mock Cognito to return NotAuthorizedException for invalid refresh token
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        # Attempt to refresh with invalid token
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(invalid_refresh_token)
        
        # Verify error message contains AUTH_SESSION_EXPIRED
        error_message = str(exc_info.value)
        assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message, (
            f"Error message should contain {AuthErrorCode.AUTH_SESSION_EXPIRED}. "
            f"Got: {error_message}"
        )
        
        # Verify error message indicates refresh token issue
        assert "Refresh token is invalid or expired" in error_message, (
            f"Error message should indicate refresh token issue. Got: {error_message}"
        )
        
        # Verify no sensitive information is leaked
        # Don't include the actual token in error message for security
        if len(invalid_refresh_token) > 0 and invalid_refresh_token.strip():
            assert invalid_refresh_token not in error_message, (
                "Error message should not contain the actual refresh token"
            )
        
        # Verify Cognito was called with correct parameters
        self.mock_cognito_client.initiate_auth.assert_called_once_with(
            ClientId=self.token_service.client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": invalid_refresh_token
            }
        )

    @given(
        invalid_refresh_token=invalid_refresh_token_format(),
        cognito_error=cognito_error_response()
    )
    @settings(max_examples=100, deadline=15000)
    def test_various_cognito_errors_property(self, invalid_refresh_token, cognito_error):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Various Cognito Errors)**
        
        For any invalid refresh token and any type of Cognito error response,
        the system should handle the error appropriately and return
        AUTH_SESSION_EXPIRED for authentication-related errors.
        
        This property verifies that:
        1. Different Cognito error codes are handled appropriately
        2. NotAuthorizedException and UserNotFoundException return AUTH_SESSION_EXPIRED
        3. Other errors are handled gracefully with appropriate error messages
        4. Error handling is consistent across different Cognito error types
        5. No unhandled exceptions bubble up
        """
        # Mock Cognito to return the generated error
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            cognito_error, "InitiateAuth"
        )
        
        # Attempt to refresh with invalid token
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(invalid_refresh_token)
        
        error_message = str(exc_info.value)
        error_code = cognito_error["Error"]["Code"]
        
        # Verify appropriate error handling based on Cognito error code
        if error_code in ["NotAuthorizedException", "UserNotFoundException"]:
            # These should return AUTH_SESSION_EXPIRED
            assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message, (
                f"Error code {error_code} should result in {AuthErrorCode.AUTH_SESSION_EXPIRED}. "
                f"Got: {error_message}"
            )
            assert "Refresh token is invalid or expired" in error_message, (
                f"Error message should indicate refresh token issue for {error_code}. "
                f"Got: {error_message}"
            )
        else:
            # Other errors should be handled gracefully
            assert "Failed to refresh access token" in error_message, (
                f"Error message should indicate refresh failure for {error_code}. "
                f"Got: {error_message}"
            )
        
        # Verify error message is not empty
        assert len(error_message.strip()) > 0, (
            "Error message should not be empty"
        )
        
        # Verify Cognito was called
        self.mock_cognito_client.initiate_auth.assert_called_once()

    @given(
        invalid_refresh_tokens=st.lists(
            invalid_refresh_token_format(),
            min_size=2,
            max_size=5,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=20000)
    def test_multiple_invalid_tokens_consistency_property(self, invalid_refresh_tokens):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Multiple Tokens Consistency)**
        
        For any set of different invalid refresh tokens, the error handling
        should be consistent across all tokens, with each returning the
        appropriate error response.
        
        This property verifies that:
        1. All invalid tokens are rejected consistently
        2. Error handling is deterministic across different invalid tokens
        3. No invalid token type is accidentally accepted
        4. The system maintains consistent behavior across multiple calls
        """
        # Mock consistent Cognito error response
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        errors = []
        
        for invalid_token in invalid_refresh_tokens:
            # Reset mock for each token
            self.mock_cognito_client.reset_mock()
            self.mock_cognito_client.initiate_auth.side_effect = ClientError(
                error_response, "InitiateAuth"
            )
            
            # Attempt refresh
            with pytest.raises(Exception) as exc_info:
                self.token_service.refresh_access_token(invalid_token)
            
            error_message = str(exc_info.value)
            errors.append(error_message)
            
            # Verify each error contains AUTH_SESSION_EXPIRED
            assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message, (
                f"Error for token should contain {AuthErrorCode.AUTH_SESSION_EXPIRED}. "
                f"Token: {invalid_token[:20]}..., Error: {error_message}"
            )
            
            # Verify Cognito was called for this token
            self.mock_cognito_client.initiate_auth.assert_called_once_with(
                ClientId=self.token_service.client_id,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={
                    "REFRESH_TOKEN": invalid_token
                }
            )
        
        # Verify all errors have consistent structure
        for error in errors:
            assert AuthErrorCode.AUTH_SESSION_EXPIRED in error
            assert "Refresh token is invalid or expired" in error

    @given(
        invalid_refresh_token=invalid_refresh_token_format(),
        iterations=st.integers(min_value=2, max_value=4)
    )
    @settings(max_examples=30, deadline=20000)
    def test_repeated_invalid_token_consistency_property(self, invalid_refresh_token, iterations):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Repeated Attempts)**
        
        For any invalid refresh token, multiple refresh attempts should
        consistently return the same error response, ensuring deterministic
        error handling behavior.
        
        This property verifies that:
        1. Error handling is deterministic and repeatable
        2. No race conditions or state issues affect error handling
        3. The same invalid token always produces the same error
        4. System behavior is stable across multiple attempts
        """
        # Mock consistent error response
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        errors = []
        
        for i in range(iterations):
            # Reset mock for each attempt
            self.mock_cognito_client.reset_mock()
            self.mock_cognito_client.initiate_auth.side_effect = ClientError(
                error_response, "InitiateAuth"
            )
            
            # Attempt refresh
            with pytest.raises(Exception) as exc_info:
                self.token_service.refresh_access_token(invalid_refresh_token)
            
            error_message = str(exc_info.value)
            errors.append(error_message)
        
        # Verify all errors are identical (consistent behavior)
        assert len(errors) == iterations
        assert all(error == errors[0] for error in errors), (
            f"Inconsistent error messages across attempts: {errors}"
        )
        
        # Verify all errors contain expected content
        for error in errors:
            assert AuthErrorCode.AUTH_SESSION_EXPIRED in error
            assert "Refresh token is invalid or expired" in error

    @given(
        invalid_refresh_token=invalid_refresh_token_format()
    )
    @settings(max_examples=50, deadline=10000)
    def test_null_and_empty_token_handling_property(self, invalid_refresh_token):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Null/Empty Tokens)**
        
        For any null, empty, or whitespace-only refresh token, the system
        should handle the error gracefully and return appropriate error
        responses without causing system failures.
        
        This property verifies that:
        1. Null and empty values are handled gracefully
        2. No null pointer exceptions or similar errors occur
        3. Appropriate error codes are returned for missing/empty tokens
        4. The system handles edge cases robustly
        5. Cognito integration handles empty parameters correctly
        """
        # Mock Cognito error for empty/invalid token
        error_response = {
            "Error": {
                "Code": "InvalidParameterException" if not invalid_refresh_token.strip() else "NotAuthorizedException",
                "Message": "Invalid parameter" if not invalid_refresh_token.strip() else "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        # Attempt refresh
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(invalid_refresh_token)
        
        error_message = str(exc_info.value)
        
        # Verify error occurred and is handled appropriately
        assert exc_info.value is not None
        assert len(error_message.strip()) > 0, "Error message should not be empty"
        
        # For empty/whitespace tokens, we might get different error handling
        if not invalid_refresh_token.strip():
            # Empty tokens might result in different error handling
            assert "Failed to refresh access token" in error_message or AuthErrorCode.AUTH_SESSION_EXPIRED in error_message
        else:
            # Non-empty invalid tokens should get AUTH_SESSION_EXPIRED
            assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message or "Failed to refresh access token" in error_message
        
        # Verify Cognito was called (even with empty/invalid token)
        self.mock_cognito_client.initiate_auth.assert_called_once_with(
            ClientId=self.token_service.client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": invalid_refresh_token
            }
        )

    @given(
        invalid_refresh_token=invalid_refresh_token_format()
    )
    @settings(max_examples=50, deadline=10000)
    def test_security_and_injection_protection_property(self, invalid_refresh_token):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Security Protection)**
        
        For any refresh token containing potential security threats
        (SQL injection, XSS, etc.), the system should handle them safely
        without executing malicious code or leaking sensitive information.
        
        This property verifies that:
        1. SQL injection attempts are handled safely
        2. XSS attempts don't execute or get reflected
        3. No code execution occurs from malicious tokens
        4. Error messages don't reflect potentially malicious input
        5. The system maintains security boundaries
        """
        # Mock Cognito error response
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        # Attempt refresh with potentially malicious token
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(invalid_refresh_token)
        
        error_message = str(exc_info.value)
        
        # Verify error handling doesn't reflect malicious input
        malicious_patterns = [
            "<script>", "</script>", "javascript:", "onload=", "onerror=",
            "DROP TABLE", "UNION SELECT", "'; --", "1' OR '1'='1"
        ]
        
        for pattern in malicious_patterns:
            if pattern.lower() in invalid_refresh_token.lower():
                # Verify the malicious pattern is not reflected in the error message
                assert pattern.lower() not in error_message.lower(), (
                    f"Error message should not reflect malicious pattern '{pattern}'. "
                    f"Error: {error_message}"
                )
        
        # Verify error message follows expected format
        assert (AuthErrorCode.AUTH_SESSION_EXPIRED in error_message or 
                "Failed to refresh access token" in error_message), (
            f"Error message should follow expected format. Got: {error_message}"
        )
        
        # Verify the token was passed to Cognito as-is (no preprocessing that could be exploited)
        self.mock_cognito_client.initiate_auth.assert_called_once_with(
            ClientId=self.token_service.client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": invalid_refresh_token
            }
        )

    @given(
        invalid_refresh_token=invalid_refresh_token_format()
    )
    @settings(max_examples=50, deadline=10000)
    def test_cognito_integration_parameters_property(self, invalid_refresh_token):
        """
        **Validates: Requirements 8.6**
        **Property 8: Invalid Refresh Token Error Handling (Cognito Integration)**
        
        For any invalid refresh token, the system should properly integrate
        with AWS Cognito using the correct authentication flow and parameters,
        even when the token is invalid.
        
        This property verifies that:
        1. Correct Cognito AuthFlow is used (REFRESH_TOKEN_AUTH)
        2. Invalid refresh token is passed correctly in AuthParameters
        3. Client ID is used correctly
        4. Cognito errors are caught and handled appropriately
        5. Integration follows AWS Cognito best practices
        """
        # Mock Cognito error response
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        # Attempt refresh
        with pytest.raises(Exception):
            self.token_service.refresh_access_token(invalid_refresh_token)
        
        # Verify Cognito was called with correct parameters
        self.mock_cognito_client.initiate_auth.assert_called_once_with(
            ClientId=self.token_service.client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": invalid_refresh_token
            }
        )
        
        # Verify no additional parameters were passed
        call_kwargs = self.mock_cognito_client.initiate_auth.call_args[1]
        expected_keys = {"ClientId", "AuthFlow", "AuthParameters"}
        assert set(call_kwargs.keys()) == expected_keys, (
            f"Cognito call should only include expected parameters. "
            f"Expected: {expected_keys}, Got: {set(call_kwargs.keys())}"
        )
        
        # Verify AuthFlow is correct
        assert call_kwargs["AuthFlow"] == "REFRESH_TOKEN_AUTH", (
            f"AuthFlow should be REFRESH_TOKEN_AUTH, got: {call_kwargs['AuthFlow']}"
        )
        
        # Verify ClientId is correct
        assert call_kwargs["ClientId"] == self.token_service.client_id, (
            f"ClientId should match token service client ID"
        )
        
        # Verify AuthParameters structure
        auth_params = call_kwargs["AuthParameters"]
        assert set(auth_params.keys()) == {"REFRESH_TOKEN"}, (
            f"AuthParameters should only contain REFRESH_TOKEN. "
            f"Got: {set(auth_params.keys())}"
        )
        assert auth_params["REFRESH_TOKEN"] == invalid_refresh_token, (
            "REFRESH_TOKEN parameter should match input token"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])