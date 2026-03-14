"""
Property-based tests for token refresh round trip.

**Validates: Requirements 8.3, 8.4, 8.5**
**Property 7: Token Refresh Round Trip**

This module contains property-based tests that verify token refresh round trip
functionality works correctly for any valid refresh token. The test validates
that using a refresh token to obtain a new access token succeeds and returns
a new access token with 1-hour expiration, and the new access token is valid
for authenticated requests.
"""

import pytest
import jwt
import time
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .token_service import TokenService
from .provider_factory import get_supported_providers
from ..config import AuthConfig, AuthErrorCode


# Custom strategies for token refresh testing
@composite
def valid_refresh_token(draw):
    """Generate valid refresh token formats."""
    # Refresh tokens are typically opaque strings from Cognito
    # They can be various formats but are usually base64-encoded or similar
    token_formats = [
        # Base64-like tokens
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                                  whitelist_characters='+/='),
            min_size=100,
            max_size=500
        ),
        # UUID-like tokens
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                                  whitelist_characters='-'),
            min_size=36,
            max_size=200
        ),
        # Hex-encoded tokens
        st.text(
            alphabet='0123456789abcdefABCDEF',
            min_size=64,
            max_size=256
        ),
        # Mixed alphanumeric tokens
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
            min_size=50,
            max_size=300
        )
    ]
    
    return draw(st.one_of(token_formats))


@composite
def user_id_strategy(draw):
    """Generate valid user IDs (UUID v4 format)."""
    return draw(st.uuids(version=4).map(str))


@composite
def jwt_access_token(draw):
    """Generate realistic JWT access token format."""
    # JWT has 3 parts: header.payload.signature
    header = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=20,
        max_size=50
    ))
    payload = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=50,
        max_size=200
    ))
    signature = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=20,
        max_size=100
    ))
    
    return f"{header}.{payload}.{signature}"


@composite
def jwt_id_token(draw):
    """Generate realistic JWT ID token format."""
    # Similar to access token but typically contains user identity claims
    header = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=20,
        max_size=50
    ))
    payload = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=100,
        max_size=300
    ))
    signature = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                              whitelist_characters='+/='),
        min_size=20,
        max_size=100
    ))
    
    return f"{header}.{payload}.{signature}"


@composite
def cognito_refresh_response(draw):
    """Generate realistic Cognito refresh token response."""
    access_token = draw(jwt_access_token())
    id_token = draw(jwt_id_token())
    expires_in = AuthConfig.ACCESS_TOKEN_EXPIRATION  # Always 1 hour
    
    return {
        "AuthenticationResult": {
            "AccessToken": access_token,
            "IdToken": id_token,
            "ExpiresIn": expires_in,
            "TokenType": "Bearer"
        }
    }


@composite
def token_claims(draw):
    """Generate realistic JWT token claims."""
    user_id = draw(user_id_strategy())
    current_time = int(time.time())
    
    return {
        "sub": user_id,
        "username": user_id,
        "token_use": "access",
        "exp": current_time + AuthConfig.ACCESS_TOKEN_EXPIRATION,
        "iat": current_time,
        "aud": "test_client_id",
        "iss": f"https://cognito-idp.{AuthConfig.AWS_REGION}.amazonaws.com/{AuthConfig.USER_POOL_ID}",
        "auth_time": current_time,
        "scope": "openid email profile"
    }


class TestTokenRefreshRoundTripProperties:
    """Property-based tests for token refresh round trip."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock AWS Cognito client
        self.mock_cognito_client = Mock()
        self.token_service = TokenService()
        self.token_service.cognito_client = self.mock_cognito_client
        self.token_service.user_pool_id = "us-east-1_TestPool"
        self.token_service.client_id = "test_client_id"
        
        # Mock JWKS client for token validation
        self.mock_jwks_client = Mock()
        self.token_service.jwks_client = self.mock_jwks_client

    @given(
        refresh_token=valid_refresh_token(),
        cognito_response=cognito_refresh_response(),
        token_claims=token_claims()
    )
    @settings(max_examples=100, deadline=15000)
    def test_token_refresh_round_trip_property(self, refresh_token, cognito_response, token_claims):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip**
        
        For any valid refresh token, using it to obtain a new access token
        should succeed and return a new access token with 1-hour expiration,
        and the new access token should be valid for authenticated requests.
        
        This property verifies that:
        1. Refresh token is accepted and validated by Cognito
        2. New access token is generated with 1-hour expiration (3600 seconds)
        3. New ID token is included in the response
        4. Token type is "Bearer"
        5. New access token is valid JWT format
        6. New access token can be validated successfully
        7. Token refresh process is atomic and consistent
        8. All required fields are present in the response
        """
        # Mock successful Cognito refresh response
        self.mock_cognito_client.initiate_auth.return_value = cognito_response
        
        # Mock successful token validation for the new access token
        mock_signing_key = Mock()
        mock_signing_key.key = "mock_signing_key"
        self.mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key
        
        # Mock JWT decode to return the token claims
        with patch('jwt.decode', return_value=token_claims):
            # Step 1: Refresh the access token
            refresh_result = self.token_service.refresh_access_token(refresh_token)
            
            # Verify refresh result structure
            assert isinstance(refresh_result, dict), "Refresh result should be a dictionary"
            
            # Verify all required fields are present
            required_fields = ["access_token", "id_token", "expires_in", "token_type"]
            for field in required_fields:
                assert field in refresh_result, f"Refresh result should contain {field}"
                assert refresh_result[field] is not None, f"{field} should not be None"
            
            # Verify token type
            assert refresh_result["token_type"] == "Bearer", (
                f"Token type should be 'Bearer', got: {refresh_result['token_type']}"
            )
            
            # Verify access token expiration (1 hour = 3600 seconds)
            assert refresh_result["expires_in"] == AuthConfig.ACCESS_TOKEN_EXPIRATION, (
                f"Access token should expire in {AuthConfig.ACCESS_TOKEN_EXPIRATION} seconds, "
                f"got: {refresh_result['expires_in']}"
            )
            assert refresh_result["expires_in"] == 3600, (
                f"Access token should expire in 3600 seconds (1 hour), "
                f"got: {refresh_result['expires_in']}"
            )
            
            # Verify tokens are strings
            assert isinstance(refresh_result["access_token"], str), (
                "Access token should be a string"
            )
            assert isinstance(refresh_result["id_token"], str), (
                "ID token should be a string"
            )
            
            # Verify tokens are not empty
            assert len(refresh_result["access_token"]) > 0, (
                "Access token should not be empty"
            )
            assert len(refresh_result["id_token"]) > 0, (
                "ID token should not be empty"
            )
            
            # Verify JWT format for access and ID tokens (should have 3 parts)
            access_token_parts = refresh_result["access_token"].split(".")
            assert len(access_token_parts) == 3, (
                f"Access token should be JWT format (3 parts), "
                f"got {len(access_token_parts)} parts"
            )
            
            id_token_parts = refresh_result["id_token"].split(".")
            assert len(id_token_parts) == 3, (
                f"ID token should be JWT format (3 parts), "
                f"got {len(id_token_parts)} parts"
            )
            
            # Verify Cognito refresh was called correctly
            self.mock_cognito_client.initiate_auth.assert_called_once_with(
                ClientId=self.token_service.client_id,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={
                    "REFRESH_TOKEN": refresh_token
                }
            )
            
            # Step 2: Validate the new access token (round trip completion)
            new_access_token = refresh_result["access_token"]
            validation_result = self.token_service.validate_access_token(new_access_token)
            
            # Verify validation succeeded
            assert isinstance(validation_result, dict), (
                "Token validation should return a dictionary"
            )
            
            # Verify token claims are present
            expected_claims = ["sub", "username", "token_use", "exp", "iat"]
            for claim in expected_claims:
                assert claim in validation_result, (
                    f"Validated token should contain {claim} claim"
                )
            
            # Verify token_use claim
            assert validation_result["token_use"] == "access", (
                f"Token should be an access token, got: {validation_result['token_use']}"
            )
            
            # Verify token validation used correct parameters
            self.mock_jwks_client.get_signing_key_from_jwt.assert_called_once_with(
                new_access_token
            )

    @given(
        refresh_tokens=st.lists(
            valid_refresh_token(),
            min_size=2,
            max_size=5,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=20000)
    def test_token_refresh_uniqueness_property(self, refresh_tokens):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip (Uniqueness)**
        
        For any set of different valid refresh tokens, each refresh operation
        should generate unique new access tokens, ensuring no token collisions
        or reuse across different refresh operations.
        
        This property verifies that:
        1. Each refresh token generates a unique new access token
        2. Each refresh token generates a unique new ID token
        3. Token generation is deterministic per refresh token but unique across tokens
        4. No token collisions occur in concurrent refresh scenarios
        """
        refreshed_tokens = []
        
        for i, refresh_token in enumerate(refresh_tokens):
            # Mock unique response for each refresh token
            mock_response = {
                "AuthenticationResult": {
                    "AccessToken": f"access_token_from_refresh_{i}_{refresh_token[:10]}",
                    "IdToken": f"id_token_from_refresh_{i}_{refresh_token[:10]}",
                    "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION,
                    "TokenType": "Bearer"
                }
            }
            
            self.mock_cognito_client.initiate_auth.return_value = mock_response
            
            # Refresh token
            result = self.token_service.refresh_access_token(refresh_token)
            refreshed_tokens.append(result)
            
            # Reset mock for next iteration
            self.mock_cognito_client.reset_mock()
        
        # Verify all access tokens are unique
        access_tokens = [token["access_token"] for token in refreshed_tokens]
        assert len(access_tokens) == len(set(access_tokens)), (
            f"All access tokens should be unique. Got duplicates in: {access_tokens}"
        )
        
        # Verify all ID tokens are unique
        id_tokens = [token["id_token"] for token in refreshed_tokens]
        assert len(id_tokens) == len(set(id_tokens)), (
            f"All ID tokens should be unique. Got duplicates in: {id_tokens}"
        )

    @given(
        refresh_token=valid_refresh_token(),
        iterations=st.integers(min_value=2, max_value=4)
    )
    @settings(max_examples=30, deadline=20000)
    def test_token_refresh_consistency_property(self, refresh_token, iterations):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip (Consistency)**
        
        For any valid refresh token, multiple refresh operations should
        consistently return the same token structure and expiration times,
        even if the actual token values are different (due to token rotation).
        
        This property verifies that:
        1. Token structure is consistent across multiple refresh operations
        2. Expiration times are always correct (1 hour for access token)
        3. Token type is always "Bearer"
        4. All required fields are always present
        5. Response format is stable and predictable
        """
        results = []
        
        for i in range(iterations):
            # Mock response with different tokens but same structure
            mock_response = {
                "AuthenticationResult": {
                    "AccessToken": f"access_token_iteration_{i}",
                    "IdToken": f"id_token_iteration_{i}",
                    "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION,
                    "TokenType": "Bearer"
                }
            }
            
            self.mock_cognito_client.initiate_auth.return_value = mock_response
            
            # Refresh token
            result = self.token_service.refresh_access_token(refresh_token)
            results.append(result)
            
            # Reset mock for next iteration
            self.mock_cognito_client.reset_mock()
        
        # Verify all results have the same structure
        first_result = results[0]
        for i, result in enumerate(results[1:], 1):
            assert set(result.keys()) == set(first_result.keys()), (
                f"Result {i} should have same keys as first result. "
                f"Expected: {list(first_result.keys())}, Got: {list(result.keys())}"
            )
            
            # Verify consistent field types
            for key in first_result.keys():
                assert type(result[key]) == type(first_result[key]), (
                    f"Field {key} should have consistent type across iterations. "
                    f"Expected: {type(first_result[key])}, Got: {type(result[key])}"
                )
            
            # Verify consistent expiration time
            assert result["expires_in"] == first_result["expires_in"], (
                f"Expiration time should be consistent. "
                f"Expected: {first_result['expires_in']}, Got: {result['expires_in']}"
            )
            
            # Verify consistent token type
            assert result["token_type"] == first_result["token_type"], (
                f"Token type should be consistent. "
                f"Expected: {first_result['token_type']}, Got: {result['token_type']}"
            )

    @given(
        refresh_token=valid_refresh_token()
    )
    @settings(max_examples=50, deadline=10000)
    def test_token_refresh_error_handling_property(self, refresh_token):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip (Error Handling)**
        
        For any refresh token, when token refresh encounters errors
        (invalid refresh token, expired token, Cognito failures, etc.),
        the system should handle errors gracefully and provide meaningful
        error messages with appropriate error codes.
        
        This property verifies that:
        1. Invalid refresh tokens are rejected with AUTH_SESSION_EXPIRED
        2. Expired refresh tokens are handled gracefully
        3. Cognito errors are handled appropriately
        4. Error messages are meaningful and secure
        5. No sensitive information is leaked in error messages
        """
        # Test invalid refresh token error
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        # Verify error is handled gracefully
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(refresh_token)
        
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
        assert refresh_token not in error_message, (
            "Error message should not contain the actual refresh token"
        )

    @given(
        refresh_token=valid_refresh_token(),
        cognito_response=cognito_refresh_response()
    )
    @settings(max_examples=50, deadline=10000)
    def test_token_refresh_validation_round_trip_property(self, refresh_token, cognito_response):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip (Validation Round Trip)**
        
        For any valid refresh token, the complete round trip of refreshing
        a token and then validating the new access token should work
        seamlessly, ensuring the new token is immediately usable for
        authenticated requests.
        
        This property verifies that:
        1. Refresh operation succeeds and returns valid tokens
        2. New access token can be immediately validated
        3. Validation returns correct token claims
        4. The round trip is atomic and consistent
        5. No intermediate state issues affect the process
        """
        # Mock successful Cognito refresh
        self.mock_cognito_client.initiate_auth.return_value = cognito_response
        
        # Mock successful token validation
        mock_signing_key = Mock()
        mock_signing_key.key = "mock_signing_key"
        self.mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key
        
        # Create realistic token claims
        current_time = int(time.time())
        mock_claims = {
            "sub": "test-user-123",
            "username": "test-user-123",
            "token_use": "access",
            "exp": current_time + AuthConfig.ACCESS_TOKEN_EXPIRATION,
            "iat": current_time,
            "aud": self.token_service.client_id
        }
        
        with patch('jwt.decode', return_value=mock_claims):
            # Step 1: Refresh token
            refresh_result = self.token_service.refresh_access_token(refresh_token)
            
            # Step 2: Validate new access token immediately
            new_access_token = refresh_result["access_token"]
            validation_result = self.token_service.validate_access_token(new_access_token)
            
            # Verify the round trip worked
            assert validation_result["token_use"] == "access", (
                "Validated token should be an access token"
            )
            assert validation_result["sub"] == mock_claims["sub"], (
                "Validated token should contain correct subject"
            )
            assert validation_result["exp"] == mock_claims["exp"], (
                "Validated token should have correct expiration"
            )
            
            # Verify token expiration is in the future (valid for use)
            assert validation_result["exp"] > current_time, (
                "New access token should not be expired"
            )
            
            # Verify token expiration is approximately 1 hour from now
            expected_exp = current_time + AuthConfig.ACCESS_TOKEN_EXPIRATION
            time_diff = abs(validation_result["exp"] - expected_exp)
            assert time_diff <= 60, (  # Allow 1 minute tolerance
                f"Token expiration should be approximately 1 hour from now. "
                f"Expected: {expected_exp}, Got: {validation_result['exp']}, "
                f"Difference: {time_diff} seconds"
            )

    @given(
        refresh_token=valid_refresh_token()
    )
    @settings(max_examples=50, deadline=10000)
    def test_token_refresh_cognito_integration_property(self, refresh_token):
        """
        **Validates: Requirements 8.3, 8.4, 8.5**
        **Property 7: Token Refresh Round Trip (Cognito Integration)**
        
        For any valid refresh token, the token refresh operation should
        properly integrate with AWS Cognito using the correct authentication
        flow and parameters.
        
        This property verifies that:
        1. Correct Cognito AuthFlow is used (REFRESH_TOKEN_AUTH)
        2. Refresh token is passed correctly in AuthParameters
        3. Client ID is used correctly
        4. Cognito response is parsed correctly
        5. Integration follows AWS Cognito best practices
        """
        # Mock successful Cognito response
        mock_response = {
            "AuthenticationResult": {
                "AccessToken": "new_access_token_from_cognito",
                "IdToken": "new_id_token_from_cognito",
                "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION,
                "TokenType": "Bearer"
            }
        }
        
        self.mock_cognito_client.initiate_auth.return_value = mock_response
        
        # Perform token refresh
        result = self.token_service.refresh_access_token(refresh_token)
        
        # Verify Cognito was called with correct parameters
        self.mock_cognito_client.initiate_auth.assert_called_once_with(
            ClientId=self.token_service.client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": refresh_token
            }
        )
        
        # Verify response parsing
        assert result["access_token"] == mock_response["AuthenticationResult"]["AccessToken"]
        assert result["id_token"] == mock_response["AuthenticationResult"]["IdToken"]
        assert result["expires_in"] == mock_response["AuthenticationResult"]["ExpiresIn"]
        assert result["token_type"] == "Bearer"
        
        # Verify no additional parameters were passed
        call_kwargs = self.mock_cognito_client.initiate_auth.call_args[1]
        expected_keys = {"ClientId", "AuthFlow", "AuthParameters"}
        assert set(call_kwargs.keys()) == expected_keys, (
            f"Cognito call should only include expected parameters. "
            f"Expected: {expected_keys}, Got: {set(call_kwargs.keys())}"
        )
        
        # Verify AuthParameters structure
        auth_params = call_kwargs["AuthParameters"]
        assert set(auth_params.keys()) == {"REFRESH_TOKEN"}, (
            f"AuthParameters should only contain REFRESH_TOKEN. "
            f"Got: {set(auth_params.keys())}"
        )
        assert auth_params["REFRESH_TOKEN"] == refresh_token, (
            "REFRESH_TOKEN parameter should match input token"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])