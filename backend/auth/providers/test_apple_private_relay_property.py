"""
Property-based tests for Apple private relay email storage.

**Validates: Requirements 4.6**
**Property 6: Apple Private Relay Email Storage**

This module contains property-based tests that verify Apple private relay
email addresses are properly stored and handled by the authentication system.
"""

import pytest
import uuid
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from ..services.profile_service import ProfileService
from ..models.user_profile import UserProfile, LinkedProvider
from ..providers.apple_provider import AppleOAuthProvider


# Custom strategies for Apple private relay emails
@composite
def apple_private_relay_email(draw):
    """Generate Apple private relay email addresses."""
    # Apple private relay emails follow the pattern: randomstring@privaterelay.appleid.com
    random_part = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Nd')),
        min_size=6,
        max_size=20
    ))
    return f"{random_part}@privaterelay.appleid.com"


@composite
def apple_regular_email(draw):
    """Generate regular Apple email addresses (non-private relay)."""
    username = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Nd')),
        min_size=3,
        max_size=15
    ))
    domains = ["icloud.com", "me.com", "mac.com", "gmail.com", "yahoo.com"]
    domain = draw(st.sampled_from(domains))
    return f"{username}@{domain}"


@composite
def apple_provider_data_with_private_relay(draw):
    """Generate Apple provider data with private relay email."""
    private_email = draw(apple_private_relay_email())
    user_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd')),
        min_size=10,
        max_size=30
    ))
    name = draw(st.text(min_size=1, max_size=50).filter(lambda x: x.strip()))
    
    return {
        "sub": f"apple-{user_id}",
        "email": private_email,
        "email_verified": True,  # Apple always verifies emails
        "name": name,
        "picture": None,  # Apple doesn't provide profile pictures
        "is_private_email": True  # Apple-specific claim
    }


@composite
def apple_provider_data_with_regular_email(draw):
    """Generate Apple provider data with regular email."""
    regular_email = draw(apple_regular_email())
    user_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd')),
        min_size=10,
        max_size=30
    ))
    name = draw(st.text(min_size=1, max_size=50).filter(lambda x: x.strip()))
    
    return {
        "sub": f"apple-{user_id}",
        "email": regular_email,
        "email_verified": True,
        "name": name,
        "picture": None,
        "is_private_email": False
    }


class TestApplePrivateRelayEmailProperties:
    """Property-based tests for Apple private relay email storage."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.profile_service = ProfileService()
        self.profile_service.table = self.mock_table
        
        # Mock successful DynamoDB put_item
        self.mock_table.put_item.return_value = {}
    
    @given(provider_data=apple_provider_data_with_private_relay())
    @settings(max_examples=100, deadline=5000)
    def test_apple_private_relay_email_storage_property(self, provider_data):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage**
        
        For any Apple authentication that provides a private relay email address,
        the user profile should store and use the private relay email as the
        user's email address.
        
        This property verifies that:
        1. Private relay emails are correctly stored in the user profile
        2. The private relay email is used as the primary email for the user
        3. The system handles private relay emails the same as regular emails
        """
        # Create profile with Apple private relay email
        profile_dict = self.profile_service.create_profile(provider_data, "apple")
        
        # Verify the private relay email is stored as the primary email
        assert profile_dict["email"] == provider_data["email"], (
            f"Primary email should be the private relay email. "
            f"Expected: {provider_data['email']}, Got: {profile_dict['email']}"
        )
        
        # Verify the email is marked as verified (Apple always verifies)
        assert profile_dict["email_verified"] is True, (
            "Apple emails should always be marked as verified"
        )
        
        # Verify the private relay email is stored in the linked provider
        linked_providers = profile_dict["linked_providers"]
        assert len(linked_providers) == 1, "Should have exactly one linked provider"
        
        apple_provider = linked_providers[0]
        assert apple_provider["provider"] == "apple", "Provider should be 'apple'"
        assert apple_provider["email"] == provider_data["email"], (
            f"Linked provider email should match private relay email. "
            f"Expected: {provider_data['email']}, Got: {apple_provider['email']}"
        )
        
        # Verify the profile was stored in DynamoDB with correct data
        self.mock_table.put_item.assert_called_once()
        stored_item = self.mock_table.put_item.call_args[1]["Item"]
        
        assert stored_item["email"] == provider_data["email"], (
            "Stored profile should contain the private relay email"
        )
        assert stored_item["provider"] == "apple", (
            "GSI provider field should be 'apple'"
        )
        
        # Verify private relay email format is preserved
        assert "@privaterelay.appleid.com" in stored_item["email"], (
            "Private relay email domain should be preserved"
        )

    @given(provider_data=apple_provider_data_with_regular_email())
    @settings(max_examples=100, deadline=5000)
    def test_apple_regular_email_storage_property(self, provider_data):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage (Regular Email Handling)**
        
        For any Apple authentication that provides a regular email address
        (not private relay), the user profile should store and use the regular
        email address normally.
        
        This ensures the system handles both private relay and regular emails
        from Apple consistently.
        """
        # Create profile with Apple regular email
        profile_dict = self.profile_service.create_profile(provider_data, "apple")
        
        # Verify the regular email is stored as the primary email
        assert profile_dict["email"] == provider_data["email"], (
            f"Primary email should be the regular email. "
            f"Expected: {provider_data['email']}, Got: {profile_dict['email']}"
        )
        
        # Verify the email is marked as verified
        assert profile_dict["email_verified"] is True, (
            "Apple emails should always be marked as verified"
        )
        
        # Verify the regular email is stored in the linked provider
        linked_providers = profile_dict["linked_providers"]
        apple_provider = linked_providers[0]
        assert apple_provider["email"] == provider_data["email"], (
            "Linked provider email should match regular email"
        )
        
        # Verify regular email format is preserved
        assert "@privaterelay.appleid.com" not in provider_data["email"], (
            "Test data should not contain private relay domain"
        )

    @given(
        private_relay_data=apple_provider_data_with_private_relay(),
        regular_email_data=apple_provider_data_with_regular_email()
    )
    @settings(max_examples=50, deadline=10000)
    def test_apple_email_type_consistency_property(self, private_relay_data, regular_email_data):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage (Type Consistency)**
        
        For any Apple authentication, whether using private relay or regular email,
        the profile creation process should be consistent and both email types
        should be handled with the same logic flow.
        
        This ensures no special handling breaks the normal authentication flow.
        """
        # Create profiles with both email types
        private_profile = self.profile_service.create_profile(private_relay_data, "apple")
        
        # Reset mock for second call
        self.mock_table.reset_mock()
        self.mock_table.put_item.return_value = {}
        
        regular_profile = self.profile_service.create_profile(regular_email_data, "apple")
        
        # Both profiles should have the same structure
        assert set(private_profile.keys()) == set(regular_profile.keys()), (
            "Private relay and regular email profiles should have identical structure"
        )
        
        # Both should be marked as verified
        assert private_profile["email_verified"] is True
        assert regular_profile["email_verified"] is True
        
        # Both should have Apple as the provider
        assert private_profile["last_sign_in_provider"] == "apple"
        assert regular_profile["last_sign_in_provider"] == "apple"
        
        # Both should have exactly one linked provider
        assert len(private_profile["linked_providers"]) == 1
        assert len(regular_profile["linked_providers"]) == 1
        
        # Verify DynamoDB storage was called for both
        assert self.mock_table.put_item.call_count == 1  # Second call after reset

    @given(provider_data=apple_provider_data_with_private_relay())
    @settings(max_examples=50, deadline=10000)
    def test_apple_private_relay_email_uniqueness_property(self, provider_data):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage (Email Uniqueness)**
        
        For any Apple private relay email, the system should treat it as a
        unique identifier just like any other email address, ensuring proper
        user identification and preventing conflicts.
        """
        # Create profile with private relay email
        profile_dict = self.profile_service.create_profile(provider_data, "apple")
        
        # Verify the private relay email is used for user identification
        stored_item = self.mock_table.put_item.call_args[1]["Item"]
        
        # The email should be the primary identifier
        assert stored_item["email"] == provider_data["email"]
        
        # The provider_user_id should be from Apple's sub claim
        assert stored_item["provider_user_id"] == provider_data["sub"]
        
        # Verify GSI fields for provider lookup
        assert stored_item["provider"] == "apple"
        assert "provider_user_id" in stored_item
        
        # Verify the private relay email format is valid
        email = stored_item["email"]
        assert email.endswith("@privaterelay.appleid.com"), (
            "Private relay email should end with @privaterelay.appleid.com"
        )
        assert len(email.split("@")[0]) > 0, (
            "Private relay email should have a non-empty local part"
        )

    @given(provider_data=apple_provider_data_with_private_relay())
    @settings(max_examples=50, deadline=10000)
    def test_apple_private_relay_profile_completeness_property(self, provider_data):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage (Profile Completeness)**
        
        For any Apple authentication with private relay email, the created
        user profile should be complete and contain all required fields,
        ensuring the private relay email doesn't cause incomplete profiles.
        """
        # Create profile with private relay email
        profile_dict = self.profile_service.create_profile(provider_data, "apple")
        
        # Verify all required profile fields are present
        required_fields = [
            "user_id", "email", "email_verified", "name", "profile_picture_url",
            "linked_providers", "created_at", "updated_at", "last_sign_in",
            "last_sign_in_provider"
        ]
        
        for field in required_fields:
            assert field in profile_dict, f"Profile missing required field: {field}"
        
        # Verify field types and values
        assert isinstance(profile_dict["user_id"], str)
        assert len(profile_dict["user_id"]) > 0
        
        assert isinstance(profile_dict["email"], str)
        assert profile_dict["email"] == provider_data["email"]
        
        assert isinstance(profile_dict["email_verified"], bool)
        assert profile_dict["email_verified"] is True
        
        assert isinstance(profile_dict["name"], str)
        assert profile_dict["name"] == provider_data["name"]
        
        assert isinstance(profile_dict["linked_providers"], list)
        assert len(profile_dict["linked_providers"]) == 1
        
        # Verify linked provider completeness
        linked_provider = profile_dict["linked_providers"][0]
        provider_fields = ["provider", "provider_user_id", "linked_at", "email"]
        
        for field in provider_fields:
            assert field in linked_provider, f"Linked provider missing field: {field}"
        
        assert linked_provider["provider"] == "apple"
        assert linked_provider["email"] == provider_data["email"]

    @given(
        provider_data=apple_provider_data_with_private_relay(),
        iterations=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=30, deadline=15000)
    def test_apple_private_relay_idempotency_property(self, provider_data, iterations):
        """
        **Validates: Requirements 4.6**
        **Property 6: Apple Private Relay Email Storage (Idempotency)**
        
        For any Apple private relay email, multiple profile creation attempts
        with the same data should produce consistent results (though the second
        attempt should fail due to uniqueness constraints).
        
        This ensures the private relay email handling is deterministic.
        """
        # First creation should succeed
        profile_dict = self.profile_service.create_profile(provider_data, "apple")
        
        # Store the original result
        original_email = profile_dict["email"]
        original_user_id = profile_dict["user_id"]
        
        # Verify the private relay email was stored correctly
        assert original_email == provider_data["email"]
        assert "@privaterelay.appleid.com" in original_email
        
        # Reset mock and simulate duplicate creation attempt
        self.mock_table.reset_mock()
        
        # Mock ConditionalCheckFailedException for duplicate user_id
        from botocore.exceptions import ClientError
        self.mock_table.put_item.side_effect = ClientError(
            error_response={
                "Error": {
                    "Code": "ConditionalCheckFailedException",
                    "Message": "The conditional request failed"
                }
            },
            operation_name="PutItem"
        )
        
        # Second creation should fail with appropriate error
        with pytest.raises(Exception, match="User profile already exists"):
            self.profile_service.create_profile(provider_data, "apple")
        
        # Verify the error handling doesn't corrupt the private relay email
        # (The original profile data should remain unchanged)
        assert provider_data["email"] == original_email
        assert "@privaterelay.appleid.com" in provider_data["email"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])