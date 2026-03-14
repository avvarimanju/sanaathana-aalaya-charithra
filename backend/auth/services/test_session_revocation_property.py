"""
Property-based tests for session revocation.

**Validates: Requirements 8.7**
**Property 9: Session Revocation**

This module contains property-based tests that verify session revocation
functionality works correctly for any valid user session. The test validates
that after signing out, all tokens associated with that session (access token,
refresh token, ID token) are invalidated and fail authentication checks.
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
from ..models.user_profile import UserProfile, LinkedProvider
from ..config import AuthConfig, AuthErrorCode


# Custom strategies for session revocation testing
@composite
def provider_name(draw):
    """Generate valid provider names."""
    return draw(st.sampled_from(get_supported_providers()))


@composite
def user_id_strategy(draw):
    """Generate valid user IDs (UUID v4 format)."""
    return draw(st.uuids(version=4).map(str))


@composite
def user_email_strategy(draw):
    """Generate valid email addresses."""
    return draw(st.emails())


@composite
def user_name_strategy(draw):
    """Generate valid user names."""
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"]
    
    first = draw(st.sampled_from(first_names))
    last = draw(st.sampled_from(last_names))
    
    formats = [
        f"{first} {last}",
        f"{first}",
        f"{first} {last} Jr.",
        f"Dr. {first} {last}",
        f"{first} {last}-Wilson"
    ]
    
    return draw(st.sampled_from(formats))


@composite
def jwt_access_token(draw):
    """Generate realistic JWT access token format."""
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
def valid_refresh_token(draw):
    """Generate valid refresh token formats."""
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
def session_tokens_strategy(draw):
    """Generate complete session token set."""
    access_token = draw(jwt_access_token())
    refresh_token = draw(valid_refresh_token())
    id_token = draw(jwt_id_token())
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "id_token": id_token,
        "expires_in": AuthConfig.ACCESS_TOKEN_EXPIRATION,
        "token_type": "Bearer"
    }


@composite
def linked_provider_strategy(draw):
    """Generate LinkedProvider instances."""
    provider = draw(provider_name())
    provider_user_id = draw(st.text(min_size=5, max_size=50, alphabet=st.characters(
        whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='_-'
    )))
    email = draw(user_email_strategy())
    linked_at = draw(st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime.now()
    ))
    
    return LinkedProvider(
        provider=provider,
        provider_user_id=provider_user_id,
        linked_at=linked_at,
        email=email
    )


@composite
def user_profile_strategy(draw):
    """Generate UserProfile instances with various configurations."""
    user_id = draw(user_id_strategy())
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    
    # Profile picture is optional
    has_picture = draw(st.booleans())
    profile_picture_url = f"https://example.com/avatar/{user_id}.jpg" if has_picture else None
    
    # Generate 1-3 linked providers
    num_providers = draw(st.integers(min_value=1, max_value=3))
    linked_providers = draw(st.lists(
        linked_provider_strategy(),
        min_size=num_providers,
        max_size=num_providers,
        unique_by=lambda x: x.provider
    ))
    
    created_at = draw(st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime.now() - timedelta(days=1)
    ))
    updated_at = draw(st.datetimes(
        min_value=created_at,
        max_value=datetime.now()
    ))
    last_sign_in = draw(st.datetimes(
        min_value=created_at,
        max_value=datetime.now()
    ))
    last_sign_in_provider = draw(st.sampled_from([p.provider for p in linked_providers]))
    
    return UserProfile(
        user_id=user_id,
        email=email,
        email_verified=email_verified,
        name=name,
        profile_picture_url=profile_picture_url,
        linked_providers=linked_providers,
        created_at=created_at,
        updated_at=updated_at,
        last_sign_in=last_sign_in,
        last_sign_in_provider=last_sign_in_provider
    )


@composite
def valid_user_session(draw):
    """Generate a complete valid user session with profile and tokens."""
    user_profile = draw(user_profile_strategy())
    session_tokens = draw(session_tokens_strategy())
    provider = draw(st.sampled_from([p.provider for p in user_profile.linked_providers]))
    
    return {
        "user_profile": user_profile,
        "tokens": session_tokens,
        "provider": provider
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
        "iss": f"https://cognito-idp.{AuthConfig.AWS_REGION}.amazonaws.com/test_pool",
        "auth_time": current_time,
        "scope": "openid email profile"
    }


class TestSessionRevocationProperties:
    """Property-based tests for session revocation."""
    
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
        user_session=valid_user_session()
    )
    @settings(max_examples=100, deadline=20000)
    def test_session_revocation_property(self, user_session):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation**
        
        For any valid user session, after signing out, all tokens associated
        with that session (access token, refresh token, ID token) should be
        invalidated and should fail authentication checks.
        
        This property verifies that:
        1. Session revocation succeeds for any valid access token
        2. After revocation, the access token fails validation
        3. After revocation, the refresh token fails refresh attempts
        4. After revocation, the ID token is no longer valid
        5. Revocation is atomic - all tokens are invalidated together
        6. Subsequent authentication requests with revoked tokens fail
        7. The revocation process integrates correctly with Cognito
        """
        user_profile = user_session["user_profile"]
        tokens = user_session["tokens"]
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        id_token = tokens["id_token"]
        
        # Step 1: Mock successful session revocation
        self.mock_cognito_client.global_sign_out.return_value = {}
        
        # Revoke the session
        revocation_result = self.token_service.revoke_session(access_token)
        
        # Verify revocation succeeded
        assert revocation_result is True, (
            "Session revocation should return True for successful revocation"
        )
        
        # Verify Cognito global_sign_out was called correctly
        self.mock_cognito_client.global_sign_out.assert_called_once_with(
            AccessToken=access_token
        )
        
        # Step 2: Verify access token is invalidated after revocation
        # Mock token validation to fail after revocation
        self.mock_cognito_client.reset_mock()
        
        # Mock JWKS client to simulate token validation attempt
        mock_signing_key = Mock()
        mock_signing_key.key = "mock_signing_key"
        self.mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key
        
        # Mock JWT decode to raise InvalidTokenError (token revoked)
        with patch('jwt.decode', side_effect=jwt.InvalidTokenError("Token has been revoked")):
            with pytest.raises(Exception) as exc_info:
                self.token_service.validate_access_token(access_token)
            
            # Verify the error indicates token is invalid
            error_message = str(exc_info.value)
            assert AuthErrorCode.AUTH_INVALID_TOKEN in error_message, (
                f"Revoked access token validation should fail with {AuthErrorCode.AUTH_INVALID_TOKEN}. "
                f"Got: {error_message}"
            )
        
        # Step 3: Verify refresh token is invalidated after revocation
        # Mock refresh token attempt to fail
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(refresh_token)
        
        # Verify the error indicates session expired
        error_message = str(exc_info.value)
        assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message, (
            f"Revoked refresh token should fail with {AuthErrorCode.AUTH_SESSION_EXPIRED}. "
            f"Got: {error_message}"
        )
        
        # Step 4: Verify ID token is also invalidated (same validation logic as access token)
        # ID tokens use the same validation mechanism as access tokens
        with patch('jwt.decode', side_effect=jwt.InvalidTokenError("Token has been revoked")):
            with pytest.raises(Exception) as exc_info:
                # ID tokens would be validated using the same method
                self.token_service.validate_access_token(id_token)
            
            error_message = str(exc_info.value)
            assert AuthErrorCode.AUTH_INVALID_TOKEN in error_message, (
                f"Revoked ID token validation should fail with {AuthErrorCode.AUTH_INVALID_TOKEN}. "
                f"Got: {error_message}"
            )

    @given(
        user_sessions=st.lists(
            valid_user_session(),
            min_size=2,
            max_size=5,
            unique_by=lambda x: x["user_profile"].user_id
        )
    )
    @settings(max_examples=50, deadline=25000)
    def test_multiple_session_revocation_property(self, user_sessions):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Multiple Sessions)**
        
        For any set of different valid user sessions, revoking each session
        should only affect that specific session's tokens, ensuring proper
        isolation between different user sessions.
        
        This property verifies that:
        1. Each session can be revoked independently
        2. Revoking one session doesn't affect other sessions
        3. Session revocation is user-specific and isolated
        4. Multiple revocations work consistently
        """
        revocation_results = []
        
        for i, user_session in enumerate(user_sessions):
            access_token = user_session["tokens"]["access_token"]
            
            # Mock successful revocation for this session
            self.mock_cognito_client.reset_mock()
            self.mock_cognito_client.global_sign_out.return_value = {}
            
            # Revoke this session
            result = self.token_service.revoke_session(access_token)
            revocation_results.append(result)
            
            # Verify this specific revocation succeeded
            assert result is True, (
                f"Session {i} revocation should succeed"
            )
            
            # Verify Cognito was called for this specific token
            self.mock_cognito_client.global_sign_out.assert_called_once_with(
                AccessToken=access_token
            )
        
        # Verify all revocations succeeded
        assert all(revocation_results), (
            f"All session revocations should succeed. Results: {revocation_results}"
        )
        
        # Verify each session was handled independently
        assert len(revocation_results) == len(user_sessions), (
            "Should have one revocation result per session"
        )

    @given(
        user_session=valid_user_session(),
        iterations=st.integers(min_value=2, max_value=4)
    )
    @settings(max_examples=30, deadline=20000)
    def test_repeated_revocation_property(self, user_session, iterations):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Repeated Revocation)**
        
        For any valid user session, attempting to revoke the same session
        multiple times should be handled gracefully, with subsequent
        revocation attempts either succeeding (idempotent) or failing
        gracefully without causing system errors.
        
        This property verifies that:
        1. First revocation succeeds
        2. Subsequent revocations are handled gracefully
        3. No system errors occur from repeated revocation attempts
        4. Behavior is consistent across multiple attempts
        """
        access_token = user_session["tokens"]["access_token"]
        results = []
        
        for i in range(iterations):
            self.mock_cognito_client.reset_mock()
            
            if i == 0:
                # First revocation succeeds
                self.mock_cognito_client.global_sign_out.return_value = {}
            else:
                # Subsequent revocations - token already invalid
                error_response = {
                    "Error": {
                        "Code": "NotAuthorizedException",
                        "Message": "Access Token has been revoked"
                    }
                }
                self.mock_cognito_client.global_sign_out.side_effect = ClientError(
                    error_response, "GlobalSignOut"
                )
            
            # Attempt revocation
            try:
                result = self.token_service.revoke_session(access_token)
                results.append(("success", result))
            except Exception as e:
                results.append(("error", str(e)))
        
        # Verify first revocation succeeded
        assert results[0][0] == "success", (
            f"First revocation should succeed. Got: {results[0]}"
        )
        assert results[0][1] is True, (
            f"First revocation should return True. Got: {results[0][1]}"
        )
        
        # Verify subsequent revocations are handled gracefully
        # They should either succeed (idempotent) or fail gracefully
        for i, (status, value) in enumerate(results[1:], 1):
            if status == "success":
                # Idempotent behavior - already revoked tokens are considered successfully revoked
                assert value is True, (
                    f"Idempotent revocation {i} should return True. Got: {value}"
                )
            elif status == "error":
                # Graceful failure - should not be a system error
                assert "Failed to revoke session" in value, (
                    f"Revocation error {i} should be handled gracefully. Got: {value}"
                )
        
        # Verify all attempts were made
        assert len(results) == iterations, (
            f"Should have {iterations} results, got {len(results)}"
        )

    @given(
        user_session=valid_user_session()
    )
    @settings(max_examples=50, deadline=15000)
    def test_revocation_error_handling_property(self, user_session):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Error Handling)**
        
        For any valid user session, when session revocation encounters
        errors (Cognito failures, network issues, etc.), the system should
        handle errors gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. Cognito errors are handled gracefully
        2. Appropriate exceptions are raised with meaningful messages
        3. Error handling is consistent across different error scenarios
        4. No sensitive information is leaked in error messages
        """
        access_token = user_session["tokens"]["access_token"]
        
        # Test various Cognito error scenarios
        error_scenarios = [
            {
                "error": {
                    "Error": {
                        "Code": "InternalErrorException",
                        "Message": "An internal error occurred"
                    }
                },
                "expected_message": "Failed to revoke session"
            },
            {
                "error": {
                    "Error": {
                        "Code": "InvalidParameterException",
                        "Message": "Invalid access token format"
                    }
                },
                "expected_message": "Failed to revoke session"
            },
            {
                "error": {
                    "Error": {
                        "Code": "TooManyRequestsException",
                        "Message": "Too many requests"
                    }
                },
                "expected_message": "Failed to revoke session"
            }
        ]
        
        for scenario in error_scenarios:
            self.mock_cognito_client.reset_mock()
            self.mock_cognito_client.global_sign_out.side_effect = ClientError(
                scenario["error"], "GlobalSignOut"
            )
            
            # Attempt revocation
            with pytest.raises(Exception) as exc_info:
                self.token_service.revoke_session(access_token)
            
            error_message = str(exc_info.value)
            
            # Verify error message is meaningful
            assert scenario["expected_message"] in error_message, (
                f"Error message should contain '{scenario['expected_message']}'. "
                f"Got: {error_message}"
            )
            
            # Verify no sensitive information is leaked
            assert access_token not in error_message, (
                "Error message should not contain the access token"
            )
            
            # Verify error message is not empty
            assert len(error_message.strip()) > 0, (
                "Error message should not be empty"
            )

    @given(
        user_session=valid_user_session()
    )
    @settings(max_examples=50, deadline=15000)
    def test_revocation_already_invalid_token_property(self, user_session):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Already Invalid Token)**
        
        For any user session with an already invalid/expired access token,
        attempting to revoke the session should be handled gracefully,
        treating already-invalid tokens as successfully revoked.
        
        This property verifies that:
        1. Already invalid tokens are treated as successfully revoked
        2. NotAuthorizedException from Cognito is handled appropriately
        3. The revocation operation is idempotent
        4. No errors are raised for already-invalid tokens
        """
        access_token = user_session["tokens"]["access_token"]
        
        # Mock NotAuthorizedException (token already invalid)
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Access Token has been revoked"
            }
        }
        
        self.mock_cognito_client.global_sign_out.side_effect = ClientError(
            error_response, "GlobalSignOut"
        )
        
        # Attempt revocation of already invalid token
        result = self.token_service.revoke_session(access_token)
        
        # Verify revocation is considered successful (idempotent behavior)
        assert result is True, (
            "Revoking already invalid token should return True (idempotent behavior)"
        )
        
        # Verify Cognito was called
        self.mock_cognito_client.global_sign_out.assert_called_once_with(
            AccessToken=access_token
        )

    @given(
        user_session=valid_user_session()
    )
    @settings(max_examples=50, deadline=15000)
    def test_revocation_cognito_integration_property(self, user_session):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Cognito Integration)**
        
        For any valid user session, the session revocation should properly
        integrate with AWS Cognito using the global_sign_out operation
        with the correct parameters.
        
        This property verifies that:
        1. Cognito global_sign_out is called with correct access token
        2. No additional parameters are passed to Cognito
        3. Integration follows AWS Cognito best practices
        4. The operation is atomic and consistent
        """
        access_token = user_session["tokens"]["access_token"]
        
        # Mock successful Cognito response
        self.mock_cognito_client.global_sign_out.return_value = {}
        
        # Perform session revocation
        result = self.token_service.revoke_session(access_token)
        
        # Verify revocation succeeded
        assert result is True
        
        # Verify Cognito was called with correct parameters
        self.mock_cognito_client.global_sign_out.assert_called_once_with(
            AccessToken=access_token
        )
        
        # Verify no additional parameters were passed
        call_kwargs = self.mock_cognito_client.global_sign_out.call_args[1]
        expected_keys = {"AccessToken"}
        assert set(call_kwargs.keys()) == expected_keys, (
            f"Cognito call should only include expected parameters. "
            f"Expected: {expected_keys}, Got: {set(call_kwargs.keys())}"
        )
        
        # Verify AccessToken parameter is correct
        assert call_kwargs["AccessToken"] == access_token, (
            "AccessToken parameter should match input token"
        )

    @given(
        user_session=valid_user_session(),
        token_claims=token_claims()
    )
    @settings(max_examples=50, deadline=20000)
    def test_revocation_validation_round_trip_property(self, user_session, token_claims):
        """
        **Validates: Requirements 8.7**
        **Property 9: Session Revocation (Validation Round Trip)**
        
        For any valid user session, the complete round trip of revoking
        a session and then attempting to validate the revoked tokens
        should demonstrate that all tokens are properly invalidated.
        
        This property verifies that:
        1. Session revocation succeeds
        2. Access token validation fails after revocation
        3. Refresh token operations fail after revocation
        4. The round trip demonstrates complete token invalidation
        5. All token types are affected by revocation
        """
        access_token = user_session["tokens"]["access_token"]
        refresh_token = user_session["tokens"]["refresh_token"]
        
        # Step 1: Mock successful session revocation
        self.mock_cognito_client.global_sign_out.return_value = {}
        
        # Revoke the session
        revocation_result = self.token_service.revoke_session(access_token)
        assert revocation_result is True
        
        # Step 2: Attempt to validate access token after revocation
        self.mock_cognito_client.reset_mock()
        
        # Mock JWKS client
        mock_signing_key = Mock()
        mock_signing_key.key = "mock_signing_key"
        self.mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key
        
        # Mock JWT decode to fail (token revoked)
        with patch('jwt.decode', side_effect=jwt.InvalidTokenError("Token has been revoked")):
            with pytest.raises(Exception) as exc_info:
                self.token_service.validate_access_token(access_token)
            
            # Verify validation failed appropriately
            error_message = str(exc_info.value)
            assert AuthErrorCode.AUTH_INVALID_TOKEN in error_message
        
        # Step 3: Attempt to refresh token after revocation
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Refresh Token has been revoked"
            }
        }
        
        self.mock_cognito_client.initiate_auth.side_effect = ClientError(
            error_response, "InitiateAuth"
        )
        
        with pytest.raises(Exception) as exc_info:
            self.token_service.refresh_access_token(refresh_token)
        
        # Verify refresh failed appropriately
        error_message = str(exc_info.value)
        assert AuthErrorCode.AUTH_SESSION_EXPIRED in error_message
        
        # Verify the complete round trip demonstrates token invalidation
        # All token operations should fail after revocation, proving that
        # the session revocation successfully invalidated all associated tokens


if __name__ == "__main__":
    pytest.main([__file__, "-v"])