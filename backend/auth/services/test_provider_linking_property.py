"""
Property-based tests for provider linking.

**Validates: Requirements 9.1, 9.2**
**Property 10: Provider Linking**

This module contains property-based tests that verify provider linking functionality
works correctly for any authenticated user and any social provider. The test validates
that for any authenticated user and any social provider not currently linked to their
profile, successfully authenticating with that provider should add it to the user's
linked providers list.
"""

import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .profile_service import ProfileService
from .provider_factory import get_supported_providers
from ..models.user_profile import UserProfile, LinkedProvider
from ..models.oauth_tokens import UserClaims
from ..utils.errors import AuthErrorCode


# Custom strategies for provider linking testing
@composite
def provider_name(draw):
    """Generate valid provider names."""
    return draw(st.sampled_from(get_supported_providers()))


@composite
def user_email_strategy(draw):
    """Generate valid email addresses."""
    return draw(st.emails())


@composite
def user_name_strategy(draw):
    """Generate valid user names with various formats."""
    # Generate realistic names with various cultural backgrounds and formats
    first_names = [
        "John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank",
        "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam", "Maya", "Noah",
        "Priya", "Raj", "Sita", "Arjun", "Lakshmi", "Krishna", "Radha", "Vishnu",
        "María", "José", "Ana", "Carlos", "Elena", "Miguel", "Sofia", "Diego",
        "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴"
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
        "Davis", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor",
        "Sharma", "Patel", "Singh", "Kumar", "Gupta", "Agarwal", "Jain",
        "González", "López", "Hernández", "Pérez", "Sánchez", "Ramírez",
        "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴"
    ]
    
    first = draw(st.sampled_from(first_names))
    last = draw(st.sampled_from(last_names))
    
    # Various name formats that social providers might return
    formats = [
        f"{first} {last}",
        f"{first}",  # Single name
        f"{first} {last} Jr.",
        f"Dr. {first} {last}",
        f"{first} {last}-Wilson",  # Hyphenated
        f"{first} de {last}",  # With preposition
        f"{first} {last} III",  # With suffix
        f"{last}, {first}",  # Last, First format
        f"{first} {last} MD",  # Professional suffix
        f"{first} van {last}",  # Dutch naming
        f"{first} O'{last}",  # Irish naming
        f"{first} Mc{last}",  # Scottish naming
    ]
    
    return draw(st.sampled_from(formats))


@composite
def profile_picture_url_strategy(draw):
    """Generate valid profile picture URLs from various social providers."""
    # Different providers use different URL patterns
    provider_patterns = [
        # Google
        f"https://lh3.googleusercontent.com/a/ACg8ocK{draw(st.text(alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', min_size=20, max_size=40))}=s96-c",
        # Facebook
        f"https://graph.facebook.com/{draw(st.integers(min_value=100000000000000, max_value=999999999999999))}/picture?type=large",
        # Instagram
        f"https://scontent-lax3-1.cdninstagram.com/v/t51.2885-19/{draw(st.integers(min_value=100000000, max_value=999999999))}_n.jpg",
        # Apple (generic avatar)
        f"https://appleid.cdn-apple.com/static/bin/cb7815887c42/dist/images/avatar_2x.png",
        # GitHub
        f"https://avatars.githubusercontent.com/u/{draw(st.integers(min_value=1, max_value=99999999))}?v=4",
        # Microsoft
        f"https://graph.microsoft.com/v1.0/me/photo/$value",
        # Twitter/X
        f"https://pbs.twimg.com/profile_images/{draw(st.integers(min_value=1000000000000000000, max_value=9999999999999999999))}/avatar_normal.jpg",
        # Generic CDN patterns
        f"https://cdn.example.com/avatars/{draw(st.uuids())}.jpg",
        f"https://images.example.com/profile/{draw(st.integers(min_value=1, max_value=999999))}.png",
        f"https://static.example.com/users/{draw(st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789', min_size=8, max_size=16))}.webp"
    ]
    
    return draw(st.sampled_from(provider_patterns))


@composite
def provider_user_id_strategy(draw):
    """Generate provider-specific user IDs."""
    # Different providers use different ID formats
    formats = [
        # Google: numeric strings (21 digits max)
        draw(st.text(alphabet="0123456789", min_size=10, max_size=21)),
        # Facebook: numeric strings
        draw(st.text(alphabet="0123456789", min_size=8, max_size=20)),
        # GitHub: alphanumeric
        draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')), 
                    min_size=5, max_size=20)),
        # Apple: UUID-like
        str(draw(st.uuids())),
        # Twitter: alphanumeric with underscores
        draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), 
                                          whitelist_characters='_'), min_size=3, max_size=15)),
        # Microsoft: UUID-like
        str(draw(st.uuids())),
        # Instagram: numeric
        draw(st.text(alphabet="0123456789", min_size=8, max_size=15))
    ]
    
    return draw(st.sampled_from(formats))


@composite
def existing_user_profile_strategy(draw):
    """Generate existing user profiles with linked providers for linking testing."""
    user_id = str(draw(st.uuids(version=4)))
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    
    # Profile picture is optional
    has_picture = draw(st.booleans())
    profile_picture_url = draw(profile_picture_url_strategy()) if has_picture else None
    
    # Generate 1-2 existing linked providers (leaving room for more to be linked)
    num_providers = draw(st.integers(min_value=1, max_value=2))
    all_providers = get_supported_providers()
    existing_providers = draw(st.lists(
        st.sampled_from(all_providers),
        min_size=num_providers,
        max_size=num_providers,
        unique=True
    ))
    
    linked_providers = []
    for provider in existing_providers:
        linked_provider = LinkedProvider(
            provider=provider,
            provider_user_id=draw(provider_user_id_strategy()),
            linked_at=draw(st.datetimes(
                min_value=datetime(2020, 1, 1),
                max_value=datetime.now() - timedelta(days=1)
            )),
            email=email if provider == existing_providers[0] else draw(user_email_strategy())
        )
        linked_providers.append(linked_provider)
    
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
        last_sign_in_provider=existing_providers[0]
    )


@composite
def new_provider_to_link_strategy(draw, existing_profile):
    """Generate a new provider that is not currently linked to the profile."""
    all_providers = get_supported_providers()
    existing_provider_names = [lp.provider for lp in existing_profile.linked_providers]
    
    # Find providers not yet linked
    available_providers = [p for p in all_providers if p not in existing_provider_names]
    
    if not available_providers:
        # If all providers are linked, just pick a random one for testing
        # (this case will be handled differently in the test)
        return draw(st.sampled_from(all_providers))
    
    return draw(st.sampled_from(available_providers))


class TestProviderLinkingProperties:
    """Property-based tests for provider linking functionality."""
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.profile_service = ProfileService()
        self.profile_service.table = self.mock_table
    
    @given(
        existing_profile=existing_user_profile_strategy()
    )
    @settings(max_examples=100, deadline=15000)
    def test_provider_linking_property(self, existing_profile):
        """
        **Validates: Requirements 9.1, 9.2**
        **Property 10: Provider Linking**
        
        For any authenticated user and any social provider not currently linked to
        their profile, successfully authenticating with that provider should add it
        to the user's linked providers list.
        
        This property verifies that:
        1. Authentication service verifies the new social provider identity (Requirement 9.1)
        2. When provider identity is verified, it's linked to existing user profile (Requirement 9.2)
        3. Linking works for any authenticated user and any unlinked provider
        4. Linked provider is added to the user's linked providers list
        5. Profile is updated with correct timestamps
        6. Linking operation is atomic and consistent
        """
        # Generate a new provider to link that's not currently linked
        all_providers = get_supported_providers()
        existing_provider_names = [lp.provider for lp in existing_profile.linked_providers]
        available_providers = [p for p in all_providers if p not in existing_provider_names]
        
        # Skip if all providers are already linked (edge case)
        if not available_providers:
            pytest.skip("All providers already linked to this profile")
        
        # Select a random available provider to link
        new_provider = st.sampled_from(available_providers).example()
        new_provider_user_id = provider_user_id_strategy().example()
        new_provider_email = user_email_strategy().example()
        
        # Mock that the new provider is not linked to any other user
        # (Requirement 9.1: Authentication service verifies new provider identity)
        self.mock_table.query.return_value = {
            "Items": []  # No existing profile with this provider user ID
        }
        
        # Mock existing profile retrieval
        existing_profile_dict = existing_profile.to_dict()
        self.mock_table.get_item.return_value = {
            "Item": existing_profile_dict
        }
        
        # Mock successful profile update with new linked provider
        updated_linked_providers = existing_profile_dict["linked_providers"].copy()
        new_linked_provider = {
            "provider": new_provider,
            "provider_user_id": new_provider_user_id,
            "linked_at": datetime.utcnow().isoformat(),
            "email": new_provider_email
        }
        updated_linked_providers.append(new_linked_provider)
        
        self.mock_table.update_item.return_value = {}
        
        # **Requirement 9.1**: Authentication service verifies new provider identity
        # **Requirement 9.2**: When verified, provider is linked to existing user profile
        with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
            # Mock current time for consistent timestamps
            fixed_time = datetime(2024, 1, 15, 10, 30, 0)
            mock_datetime.utcnow.return_value = fixed_time
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = self.profile_service.link_provider(
                existing_profile.user_id,
                new_provider,
                new_provider_user_id,
                new_provider_email
            )
        
        # Verify linking was successful
        assert result is True, (
            f"Provider linking should succeed for unlinked provider {new_provider}"
        )
        
        # **Requirement 9.1**: Verify that the service checked for existing provider links
        # Should query GSI to check if provider is already linked to another user
        self.mock_table.query.assert_called_once_with(
            IndexName="ProviderUserIdIndex",
            KeyConditionExpression=(
                "provider_user_id = :provider_user_id AND provider = :provider"
            ),
            ExpressionAttributeValues={
                ":provider_user_id": new_provider_user_id,
                ":provider": new_provider
            }
        )
        
        # Verify existing profile was retrieved
        self.mock_table.get_item.assert_called_once_with(
            Key={"user_id": existing_profile.user_id}
        )
        
        # **Requirement 9.2**: Verify that the provider was linked to the existing user profile
        # Should update profile with new linked provider
        self.mock_table.update_item.assert_called_once()
        update_call = self.mock_table.update_item.call_args
        
        # Verify update expression adds new provider to linked_providers list
        update_expression = update_call[1]["UpdateExpression"]
        assert "linked_providers = list_append(linked_providers, :new_provider)" in update_expression, (
            "Update expression should append new provider to linked_providers list"
        )
        assert "updated_at = :updated_at" in update_expression, (
            "Update expression should update the updated_at timestamp"
        )
        
        # Verify the new provider data is correct
        attribute_values = update_call[1]["ExpressionAttributeValues"]
        new_provider_data = attribute_values[":new_provider"][0]
        
        assert new_provider_data["provider"] == new_provider, (
            f"New linked provider should have correct provider name. "
            f"Expected: {new_provider}, Got: {new_provider_data['provider']}"
        )
        assert new_provider_data["provider_user_id"] == new_provider_user_id, (
            f"New linked provider should have correct provider user ID. "
            f"Expected: {new_provider_user_id}, Got: {new_provider_data['provider_user_id']}"
        )
        assert new_provider_data["email"] == new_provider_email, (
            f"New linked provider should have correct email. "
            f"Expected: {new_provider_email}, Got: {new_provider_data['email']}"
        )
        assert "linked_at" in new_provider_data, (
            "New linked provider should have linked_at timestamp"
        )
        
        # Verify timestamp format
        linked_at = new_provider_data["linked_at"]
        assert isinstance(linked_at, str), "linked_at should be a string (ISO format)"
        # Should be able to parse as ISO datetime
        datetime.fromisoformat(linked_at.replace('Z', '+00:00'))
        
        # Verify updated_at timestamp
        updated_at = attribute_values[":updated_at"]
        assert isinstance(updated_at, str), "updated_at should be a string (ISO format)"
        datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
    
    @given(
        existing_profile=existing_user_profile_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_provider_linking_already_linked_to_same_user_property(self, existing_profile):
        """
        **Validates: Requirements 9.1, 9.2**
        **Property 10: Provider Linking (Already Linked to Same User)**
        
        For any authenticated user and any social provider that is already linked to
        their profile, attempting to link it again should succeed without duplicating
        the provider in the linked providers list.
        
        This property verifies that:
        1. Linking an already-linked provider is idempotent
        2. No duplicate providers are created in the linked providers list
        3. The operation succeeds gracefully
        """
        # Select an existing linked provider from the profile
        existing_linked_provider = existing_profile.linked_providers[0]
        provider_to_relink = existing_linked_provider.provider
        provider_user_id = existing_linked_provider.provider_user_id
        provider_email = existing_linked_provider.email
        
        # Mock that the provider is already linked to this user
        existing_profile_dict = existing_profile.to_dict()
        self.mock_table.query.return_value = {
            "Items": [existing_profile_dict]  # Found existing profile with this provider
        }
        
        # Mock existing profile retrieval
        self.mock_table.get_item.return_value = {
            "Item": existing_profile_dict
        }
        
        # Attempt to link the already-linked provider
        result = self.profile_service.link_provider(
            existing_profile.user_id,
            provider_to_relink,
            provider_user_id,
            provider_email
        )
        
        # Verify linking succeeds (idempotent operation)
        assert result is True, (
            f"Linking already-linked provider {provider_to_relink} should succeed"
        )
        
        # Verify that no update was performed (since provider is already linked)
        self.mock_table.update_item.assert_not_called()
        
        # Verify that the service checked for existing links
        self.mock_table.query.assert_called_once()
        self.mock_table.get_item.assert_called_once()
    
    @given(
        user_profile1=existing_user_profile_strategy(),
        user_profile2=existing_user_profile_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_provider_linking_already_linked_to_different_user_property(self, user_profile1, user_profile2):
        """
        **Validates: Requirements 9.1, 9.2**
        **Property 10: Provider Linking (Already Linked to Different User)**
        
        For any authenticated user and any social provider that is already linked to
        a different user's profile, attempting to link it should fail with an
        appropriate error indicating the account is already linked.
        
        This property verifies that:
        1. Authentication service detects when provider is linked to different user
        2. Appropriate error is raised (AUTH_ACCOUNT_ALREADY_LINKED)
        3. No linking occurs when provider belongs to different user
        4. Error message is informative and secure
        """
        # Ensure the two profiles have different user IDs
        if user_profile1.user_id == user_profile2.user_id:
            user_profile2.user_id = str(uuid.uuid4())
        
        # Select a provider from user_profile1 to attempt linking to user_profile2
        provider_from_user1 = user_profile1.linked_providers[0]
        provider_name = provider_from_user1.provider
        provider_user_id = provider_from_user1.provider_user_id
        provider_email = provider_from_user1.email
        
        # Mock that the provider is already linked to user_profile1
        user1_profile_dict = user_profile1.to_dict()
        self.mock_table.query.return_value = {
            "Items": [user1_profile_dict]  # Found existing profile with this provider
        }
        
        # Attempt to link the provider to user_profile2 (should fail)
        with pytest.raises(Exception) as exc_info:
            self.profile_service.link_provider(
                user_profile2.user_id,  # Different user
                provider_name,
                provider_user_id,
                provider_email
            )
        
        # Verify appropriate error is raised
        error_message = str(exc_info.value)
        assert AuthErrorCode.AUTH_ACCOUNT_ALREADY_LINKED in error_message, (
            f"Error should contain AUTH_ACCOUNT_ALREADY_LINKED code. Got: {error_message}"
        )
        assert provider_name in error_message, (
            f"Error message should mention the provider name. Got: {error_message}"
        )
        assert "already linked to another user" in error_message, (
            f"Error message should explain the conflict. Got: {error_message}"
        )
        
        # Verify that the service checked for existing provider links
        self.mock_table.query.assert_called_once_with(
            IndexName="ProviderUserIdIndex",
            KeyConditionExpression=(
                "provider_user_id = :provider_user_id AND provider = :provider"
            ),
            ExpressionAttributeValues={
                ":provider_user_id": provider_user_id,
                ":provider": provider_name
            }
        )
        
        # Verify no profile update was attempted
        self.mock_table.update_item.assert_not_called()
        self.mock_table.get_item.assert_not_called()
    
    @given(
        provider=provider_name(),
        provider_user_id=provider_user_id_strategy(),
        provider_email=user_email_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_provider_linking_nonexistent_user_property(self, provider, provider_user_id, provider_email):
        """
        **Validates: Requirements 9.1, 9.2**
        **Property 10: Provider Linking (Nonexistent User)**
        
        For any provider linking attempt with a user ID that doesn't exist in the
        system, the operation should fail with an appropriate error indicating
        the user was not found.
        
        This property verifies that:
        1. Service validates user existence before linking providers
        2. Appropriate error is raised for nonexistent users
        3. No partial operations occur for invalid users
        """
        nonexistent_user_id = str(uuid.uuid4())
        
        # Mock that the provider is not linked to any other user
        self.mock_table.query.return_value = {
            "Items": []  # No existing profile with this provider
        }
        
        # Mock that the user profile doesn't exist
        self.mock_table.get_item.return_value = {}
        
        # Attempt to link provider to nonexistent user
        with pytest.raises(Exception) as exc_info:
            self.profile_service.link_provider(
                nonexistent_user_id,
                provider,
                provider_user_id,
                provider_email
            )
        
        # Verify appropriate error is raised
        error_message = str(exc_info.value)
        assert (AuthErrorCode.AUTH_USER_NOT_FOUND in error_message or 
                "not found" in error_message.lower()), (
            f"Error should indicate user not found. Got: {error_message}"
        )
        
        # Verify that the service checked for existing provider links first
        self.mock_table.query.assert_called_once()
        
        # Verify that the service attempted to get the user profile
        self.mock_table.get_item.assert_called_once_with(
            Key={"user_id": nonexistent_user_id}
        )
        
        # Verify no update was attempted
        self.mock_table.update_item.assert_not_called()
    
    @given(
        existing_profile=existing_user_profile_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_provider_linking_database_error_handling_property(self, existing_profile):
        """
        **Validates: Requirements 9.1, 9.2**
        **Property 10: Provider Linking (Database Error Handling)**
        
        For any provider linking operation, when DynamoDB encounters errors,
        the system should handle them gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. DynamoDB errors are caught and handled appropriately
        2. Error messages are informative but don't leak sensitive information
        3. Failed linking operations don't leave the system in an inconsistent state
        """
        # Generate a new provider to link
        all_providers = get_supported_providers()
        existing_provider_names = [lp.provider for lp in existing_profile.linked_providers]
        available_providers = [p for p in all_providers if p not in existing_provider_names]
        
        if not available_providers:
            pytest.skip("All providers already linked to this profile")
        
        new_provider = st.sampled_from(available_providers).example()
        new_provider_user_id = provider_user_id_strategy().example()
        new_provider_email = user_email_strategy().example()
        
        # Mock that the provider is not linked to any other user
        self.mock_table.query.return_value = {
            "Items": []
        }
        
        # Mock existing profile retrieval
        existing_profile_dict = existing_profile.to_dict()
        self.mock_table.get_item.return_value = {
            "Item": existing_profile_dict
        }
        
        # Mock DynamoDB update error
        self.mock_table.update_item.side_effect = ClientError(
            {"Error": {"Code": "InternalServerException", "Message": "Internal error"}},
            "UpdateItem"
        )
        
        # Attempt provider linking
        with pytest.raises(Exception) as exc_info:
            self.profile_service.link_provider(
                existing_profile.user_id,
                new_provider,
                new_provider_user_id,
                new_provider_email
            )
        
        error_message = str(exc_info.value)
        assert "Failed to link provider" in error_message, (
            f"Error message should indicate linking failure. Got: {error_message}"
        )
        
        # Verify the error doesn't leak sensitive information
        assert existing_profile.user_id not in error_message or len(existing_profile.user_id) < 10, (
            "Error message should not leak full user ID for security"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])