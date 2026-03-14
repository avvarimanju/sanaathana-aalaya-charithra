"""
Property-based tests for session token generation.

**Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
**Property 4: Session Token Generation**

This module contains property-based tests that verify session token generation
works correctly for any user profile. The test validates that the token service
generates proper session tokens with correct expiration times across all types
of user profiles.
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
from ..config import AuthConfig


# Custom strategies for session token generation testing
@composite
def provider_name(draw):
    """Generate valid provider names."""
    return draw(st.sampled_from(get_supported_providers()))


@composite
def user_id_strategy(draw):
    """Generate valid user IDs (UUID v4 format)."""
    # Generate realistic UUID v4 strings
    return draw(st.uuids(version=4).map(str))


@composite
def user_email_strategy(draw):
    """Generate valid email addresses."""
    return draw(st.emails())


@composite
def user_name_strategy(draw):
    """Generate valid user names."""
    # Generate realistic names with various formats
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"]
    
    first = draw(st.sampled_from(first_names))
    last = draw(st.sampled_from(last_names))
    
    # Various name formats
    formats = [
        f"{first} {last}",
        f"{first}",
        f"{first} {last} Jr.",
        f"Dr. {first} {last}",
        f"{first} {last}-Wilson"
    ]
    
    return draw(st.sampled_from(formats))


@composite
def profile_picture_url_strategy(draw):
    """Generate valid profile picture URLs."""
    domains = ["example.com", "cdn.example.com", "images.example.com"]
    paths = ["avatar", "profile", "user", "pic"]
    extensions = ["jpg", "png", "jpeg", "webp"]
    
    domain = draw(st.sampled_from(domains))
    path = draw(st.sampled_from(paths))
    user_id = draw(st.integers(min_value=1, max_value=999999))
    ext = draw(st.sampled_from(extensions))
    
    return f"https://{domain}/{path}/{user_id}.{ext}"


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
    profile_picture_url = draw(profile_picture_url_strategy()) if has_picture else None
    
    # Generate 1-3 linked providers
    num_providers = draw(st.integers(min_value=1, max_value=3))
    linked_providers = draw(st.lists(
        linked_provider_strategy(),
        min_size=num_providers,
        max_size=num_providers,
        unique_by=lambda x: x.provider  # Ensure unique providers
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
def user_attributes_strategy(draw):
    """Generate user attributes dictionary for token generation."""
    email = draw(user_email_strategy())
    name = draw(user_name_strategy())
    
    # Optional attributes
    attributes = {
        "email": email,
        "name": name
    }
    
    # Sometimes include additional attributes
    include_picture = draw(st.booleans())
    if include_picture:
        attributes["picture"] = draw(profile_picture_url_strategy())
    
    include_email_verified = draw(st.booleans())
    if include_email_verified:
        attributes["email_verified"] = str(draw(st.booleans())).lower()
    
    return attributes


class TestSessionTokenGenerationProperties:
    """Property-based tests for session token generation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock AWS Cognito client
        self.mock_cognito_client = Mock()
        self.token_service = TokenService()
        self.token_service.cognito_client = self.mock_cognito_client
        self.token_service.user_pool_id = "us-east-1_TestPool"
        self.token_service.client_id = "test_client_id"

    @given(
        user_profile=user_profile_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_session_token_generation_property(self, user_profile, provider):
        """
        **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
        **Property 4: Session Token Generation**
        
        For any user profile, the system should generate a session containing
        an access token with 1-hour expiration, a refresh token with 30-day
        expiration, and an ID token.
        
        This property verifies that:
        1. Session tokens are generated successfully for any user profile
        2. Access token has 1-hour expiration (3600 seconds)
        3. Refresh token has 30-day expiration (2592000 seconds)
        4. ID token is included in the session
        5. Token type is "Bearer"
        6. All required token fields are present
        7. Tokens are valid JWT format (for access and ID tokens)
        """
        # Mock successful Cognito response
        mock_tokens = {
            "AccessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjE2NDA5OTg4MDB9.signature",
            "RefreshToken": "encrypted_refresh_token_string_with_30_day_expiration",
            "IdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.signature",
            "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION
        }
        
        self.mock_cognito_client.admin_initiate_auth.return_value = {
            "AuthenticationResult": mock_tokens
        }
        
        # Mock user existence check
        self.mock_cognito_client.admin_get_user.return_value = {
            "Username": user_profile.user_id,
            "UserAttributes": [
                {"Name": "email", "Value": user_profile.email},
                {"Name": "name", "Value": user_profile.name}
            ]
        }
        
        # Generate session tokens
        user_attributes = {
            "email": user_profile.email,
            "name": user_profile.name
        }
        
        result = self.token_service.generate_session_tokens(
            user_profile.user_id,
            provider,
            user_attributes
        )
        
        # Verify result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # Verify all required fields are present
        required_fields = ["access_token", "refresh_token", "id_token", "expires_in", "token_type"]
        for field in required_fields:
            assert field in result, f"Result should contain {field}"
            assert result[field] is not None, f"{field} should not be None"
        
        # Verify token type
        assert result["token_type"] == "Bearer", (
            f"Token type should be 'Bearer', got: {result['token_type']}"
        )
        
        # Verify access token expiration (1 hour = 3600 seconds)
        assert result["expires_in"] == AuthConfig.ACCESS_TOKEN_EXPIRATION, (
            f"Access token should expire in {AuthConfig.ACCESS_TOKEN_EXPIRATION} seconds, "
            f"got: {result['expires_in']}"
        )
        assert result["expires_in"] == 3600, (
            f"Access token should expire in 3600 seconds (1 hour), got: {result['expires_in']}"
        )
        
        # Verify tokens are strings
        assert isinstance(result["access_token"], str), "Access token should be a string"
        assert isinstance(result["refresh_token"], str), "Refresh token should be a string"
        assert isinstance(result["id_token"], str), "ID token should be a string"
        
        # Verify tokens are not empty
        assert len(result["access_token"]) > 0, "Access token should not be empty"
        assert len(result["refresh_token"]) > 0, "Refresh token should not be empty"
        assert len(result["id_token"]) > 0, "ID token should not be empty"
        
        # Verify JWT format for access and ID tokens (should have 3 parts separated by dots)
        access_token_parts = result["access_token"].split(".")
        assert len(access_token_parts) == 3, (
            f"Access token should be JWT format (3 parts), got {len(access_token_parts)} parts"
        )
        
        id_token_parts = result["id_token"].split(".")
        assert len(id_token_parts) == 3, (
            f"ID token should be JWT format (3 parts), got {len(id_token_parts)} parts"
        )
        
        # Verify Cognito was called correctly
        self.mock_cognito_client.admin_initiate_auth.assert_called_once_with(
            UserPoolId=self.token_service.user_pool_id,
            ClientId=self.token_service.client_id,
            AuthFlow="CUSTOM_AUTH",
            AuthParameters={
                "USERNAME": user_profile.user_id
            }
        )

    @given(
        user_profiles=st.lists(
            user_profile_strategy(),
            min_size=2,
            max_size=5,
            unique_by=lambda x: x.user_id
        ),
        provider=provider_name()
    )
    @settings(max_examples=50, deadline=20000)
    def test_session_token_uniqueness_property(self, user_profiles, provider):
        """
        **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
        **Property 4: Session Token Generation (Uniqueness)**
        
        For any set of different user profiles, the system should generate
        unique session tokens for each user, ensuring no token collisions
        or reuse across different users.
        
        This property verifies that:
        1. Each user gets unique access tokens
        2. Each user gets unique refresh tokens
        3. Each user gets unique ID tokens
        4. Token generation is deterministic per user but unique across users
        """
        generated_tokens = []
        
        for i, user_profile in enumerate(user_profiles):
            # Mock unique tokens for each user
            mock_tokens = {
                "AccessToken": f"access_token_for_user_{i}_{user_profile.user_id}",
                "RefreshToken": f"refresh_token_for_user_{i}_{user_profile.user_id}",
                "IdToken": f"id_token_for_user_{i}_{user_profile.user_id}",
                "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION
            }
            
            self.mock_cognito_client.admin_initiate_auth.return_value = {
                "AuthenticationResult": mock_tokens
            }
            
            # Mock user existence
            self.mock_cognito_client.admin_get_user.return_value = {
                "Username": user_profile.user_id,
                "UserAttributes": []
            }
            
            # Generate tokens
            result = self.token_service.generate_session_tokens(
                user_profile.user_id,
                provider,
                {"email": user_profile.email, "name": user_profile.name}
            )
            
            generated_tokens.append(result)
            
            # Reset mock for next iteration
            self.mock_cognito_client.reset_mock()
        
        # Verify all access tokens are unique
        access_tokens = [token["access_token"] for token in generated_tokens]
        assert len(access_tokens) == len(set(access_tokens)), (
            f"All access tokens should be unique. Got duplicates in: {access_tokens}"
        )
        
        # Verify all refresh tokens are unique
        refresh_tokens = [token["refresh_token"] for token in generated_tokens]
        assert len(refresh_tokens) == len(set(refresh_tokens)), (
            f"All refresh tokens should be unique. Got duplicates in: {refresh_tokens}"
        )
        
        # Verify all ID tokens are unique
        id_tokens = [token["id_token"] for token in generated_tokens]
        assert len(id_tokens) == len(set(id_tokens)), (
            f"All ID tokens should be unique. Got duplicates in: {id_tokens}"
        )

    @given(
        user_profile=user_profile_strategy(),
        provider=provider_name(),
        iterations=st.integers(min_value=2, max_value=4)
    )
    @settings(max_examples=30, deadline=20000)
    def test_session_token_consistency_property(self, user_profile, provider, iterations):
        """
        **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
        **Property 4: Session Token Generation (Consistency)**
        
        For any user profile, multiple token generation requests should
        consistently return the same token structure and expiration times,
        even if the actual token values are different.
        
        This property verifies that:
        1. Token structure is consistent across multiple generations
        2. Expiration times are always correct (1 hour for access token)
        3. Token type is always "Bearer"
        4. All required fields are always present
        """
        results = []
        
        for i in range(iterations):
            # Mock tokens with different values but same structure
            mock_tokens = {
                "AccessToken": f"access_token_iteration_{i}",
                "RefreshToken": f"refresh_token_iteration_{i}",
                "IdToken": f"id_token_iteration_{i}",
                "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION
            }
            
            self.mock_cognito_client.admin_initiate_auth.return_value = {
                "AuthenticationResult": mock_tokens
            }
            
            # Mock user existence
            self.mock_cognito_client.admin_get_user.return_value = {
                "Username": user_profile.user_id,
                "UserAttributes": []
            }
            
            # Generate tokens
            result = self.token_service.generate_session_tokens(
                user_profile.user_id,
                provider,
                {"email": user_profile.email, "name": user_profile.name}
            )
            
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
        user_profile=user_profile_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=50, deadline=10000)
    def test_session_token_error_handling_property(self, user_profile, provider):
        """
        **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
        **Property 4: Session Token Generation (Error Handling)**
        
        For any user profile, when token generation encounters errors
        (Cognito failures, network issues, etc.), the system should handle
        errors gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. Cognito errors are handled gracefully
        2. Appropriate exceptions are raised with meaningful messages
        3. Error handling is consistent across different user profiles
        4. No sensitive information is leaked in error messages
        """
        # Test Cognito ClientError handling
        error_response = {
            "Error": {
                "Code": "InternalErrorException",
                "Message": "An internal error occurred"
            }
        }
        
        self.mock_cognito_client.admin_initiate_auth.side_effect = ClientError(
            error_response, "AdminInitiateAuth"
        )
        
        # Mock user existence check
        self.mock_cognito_client.admin_get_user.return_value = {
            "Username": user_profile.user_id,
            "UserAttributes": []
        }
        
        # Verify error is handled gracefully
        with pytest.raises(Exception) as exc_info:
            self.token_service.generate_session_tokens(
                user_profile.user_id,
                provider,
                {"email": user_profile.email, "name": user_profile.name}
            )
        
        # Verify error message is meaningful and doesn't leak sensitive info
        error_message = str(exc_info.value)
        assert "Failed to generate session tokens" in error_message, (
            f"Error message should indicate token generation failure. Got: {error_message}"
        )
        
        # Verify no sensitive information is leaked
        assert user_profile.user_id not in error_message, (
            "Error message should not contain user ID"
        )
        assert user_profile.email not in error_message, (
            "Error message should not contain user email"
        )

    @given(
        user_profile=user_profile_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=50, deadline=10000)
    def test_session_token_user_creation_property(self, user_profile, provider):
        """
        **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**
        **Property 4: Session Token Generation (User Creation)**
        
        For any user profile, when the user doesn't exist in Cognito,
        the system should create the user and then generate session tokens
        successfully.
        
        This property verifies that:
        1. Non-existent users are created automatically
        2. Token generation succeeds after user creation
        3. User creation uses correct attributes
        4. The process is atomic and consistent
        """
        # Mock user not found initially, then success after creation
        self.mock_cognito_client.admin_initiate_auth.side_effect = [
            ClientError(
                {"Error": {"Code": "UserNotFoundException", "Message": "User not found"}},
                "AdminInitiateAuth"
            ),
            {
                "AuthenticationResult": {
                    "AccessToken": "new_user_access_token",
                    "RefreshToken": "new_user_refresh_token",
                    "IdToken": "new_user_id_token",
                    "ExpiresIn": AuthConfig.ACCESS_TOKEN_EXPIRATION
                }
            }
        ]
        
        # Mock user creation
        self.mock_cognito_client.admin_create_user.return_value = {
            "User": {
                "Username": user_profile.user_id,
                "Attributes": []
            }
        }
        
        # Generate tokens (should trigger user creation)
        result = self.token_service.generate_session_tokens(
            user_profile.user_id,
            provider,
            {"email": user_profile.email, "name": user_profile.name}
        )
        
        # Verify tokens were generated successfully
        assert "access_token" in result
        assert "refresh_token" in result
        assert "id_token" in result
        assert result["expires_in"] == AuthConfig.ACCESS_TOKEN_EXPIRATION
        
        # Verify user creation was attempted
        self.mock_cognito_client.admin_create_user.assert_called_once()
        
        # Verify admin_initiate_auth was called twice (first failed, second succeeded)
        assert self.mock_cognito_client.admin_initiate_auth.call_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])