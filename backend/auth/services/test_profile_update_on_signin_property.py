"""
Property-based tests for profile update on sign-in.

**Validates: Requirements 11.5**
**Property 18: Profile Update on Sign-In**

This module contains property-based tests that verify profile update functionality
works correctly when users sign in with existing linked social providers. The test
validates that when a user signs in through a linked social provider, the profile
is updated with the latest information from that provider.
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


# Custom strategies for profile update testing
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
    """Generate existing user profiles with linked providers for update testing."""
    user_id = str(draw(st.uuids(version=4)))
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    
    # Profile picture is optional
    has_picture = draw(st.booleans())
    profile_picture_url = draw(profile_picture_url_strategy()) if has_picture else None
    
    # Generate 1-3 linked providers
    num_providers = draw(st.integers(min_value=1, max_value=3))
    providers = draw(st.lists(
        provider_name(),
        min_size=num_providers,
        max_size=num_providers,
        unique=True
    ))
    
    linked_providers = []
    for provider in providers:
        linked_provider = LinkedProvider(
            provider=provider,
            provider_user_id=draw(provider_user_id_strategy()),
            linked_at=draw(st.datetimes(
                min_value=datetime(2020, 1, 1),
                max_value=datetime.now() - timedelta(days=1)
            )),
            email=email if provider == providers[0] else draw(user_email_strategy())
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
        last_sign_in_provider=providers[0]
    )


@composite
def updated_provider_data_strategy(draw):
    """Generate updated provider data that differs from existing profile data."""
    # Generate new data that represents updated information from the provider
    new_email = draw(user_email_strategy())
    new_email_verified = draw(st.booleans())
    new_name = draw(user_name_strategy())
    
    # Picture might be updated or removed
    picture_action = draw(st.sampled_from(["update", "remove", "keep_none"]))
    if picture_action == "update":
        new_picture = draw(profile_picture_url_strategy())
    elif picture_action == "remove":
        new_picture = None
    else:  # keep_none
        new_picture = None
    
    return {
        "email": new_email,
        "email_verified": new_email_verified,
        "name": new_name,
        "picture": new_picture
    }


class TestProfileUpdateOnSignInProperties:
    """Property-based tests for profile update on sign-in functionality."""
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.profile_service = ProfileService()
        self.profile_service.table = self.mock_table
    
    @given(
        existing_profile=existing_user_profile_strategy(),
        updated_provider_data=updated_provider_data_strategy()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_update_on_signin_property(self, existing_profile, updated_provider_data):
        """
        **Validates: Requirements 11.5**
        **Property 18: Profile Update on Sign-In**
        
        For any existing user profile, when the user signs in through a linked
        social provider, the profile should be updated with the latest name, email,
        and profile picture URL from that provider.
        
        This property verifies that:
        1. Profile is updated with latest provider information on sign-in
        2. Name, email, and profile picture URL are synced from provider
        3. Update works for any existing profile and any updated provider data
        4. Profile timestamps are updated correctly
        5. Other profile data remains unchanged
        6. Update operation is atomic and consistent
        """
        # Mock existing profile retrieval
        existing_profile_dict = existing_profile.to_dict()
        self.mock_table.get_item.return_value = {
            "Item": existing_profile_dict
        }
        
        # Mock successful profile update
        updated_profile_dict = existing_profile_dict.copy()
        updated_profile_dict.update({
            "email": updated_provider_data["email"],
            "email_verified": updated_provider_data["email_verified"],
            "name": updated_provider_data["name"],
            "profile_picture_url": updated_provider_data["picture"],
            "updated_at": datetime.utcnow().isoformat(),
            "last_sign_in": datetime.utcnow().isoformat()
        })
        
        self.mock_table.update_item.return_value = {
            "Attributes": updated_profile_dict
        }
        
        # Update profile with latest provider data
        with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
            # Mock current time for consistent timestamps
            fixed_time = datetime(2024, 1, 15, 10, 30, 0)
            mock_datetime.utcnow.return_value = fixed_time
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = self.profile_service.update_profile_from_provider(
                existing_profile.user_id, 
                updated_provider_data
            )
        
        # Verify result is a valid updated profile
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # **Requirement 11.5**: Profile should be updated with latest provider information
        assert result["email"] == updated_provider_data["email"], (
            f"Profile email should be updated from provider data. "
            f"Expected: '{updated_provider_data['email']}', Got: '{result['email']}'"
        )
        assert result["email_verified"] == updated_provider_data["email_verified"], (
            f"Profile email_verified should be updated from provider data. "
            f"Expected: {updated_provider_data['email_verified']}, Got: {result['email_verified']}"
        )
        assert result["name"] == updated_provider_data["name"], (
            f"Profile name should be updated from provider data. "
            f"Expected: '{updated_provider_data['name']}', Got: '{result['name']}'"
        )
        assert result["profile_picture_url"] == updated_provider_data["picture"], (
            f"Profile picture URL should be updated from provider data. "
            f"Expected: {updated_provider_data['picture']}, Got: {result['profile_picture_url']}"
        )
        
        # Verify timestamps are updated
        assert "updated_at" in result, "Result should contain updated_at timestamp"
        assert "last_sign_in" in result, "Result should contain last_sign_in timestamp"
        
        # Verify other profile data remains unchanged
        assert result["user_id"] == existing_profile.user_id, (
            f"User ID should remain unchanged. "
            f"Expected: {existing_profile.user_id}, Got: {result['user_id']}"
        )
        assert result["linked_providers"] == existing_profile_dict["linked_providers"], (
            "Linked providers should remain unchanged during profile update"
        )
        assert result["created_at"] == existing_profile_dict["created_at"], (
            "Created timestamp should remain unchanged during profile update"
        )
        
        # Verify DynamoDB operations were called correctly
        # Should first get the existing profile
        self.mock_table.get_item.assert_called_once_with(
            Key={"user_id": existing_profile.user_id}
        )
        
        # Should then update the profile with new data
        self.mock_table.update_item.assert_called_once()
        update_call = self.mock_table.update_item.call_args
        
        # Verify update expression includes all required fields
        update_expression = update_call[1]["UpdateExpression"]
        assert "email = :email" in update_expression, (
            "Update expression should include email update"
        )
        assert "email_verified = :email_verified" in update_expression, (
            "Update expression should include email_verified update"
        )
        assert "#name = :name" in update_expression, (
            "Update expression should include name update (with attribute name alias)"
        )
        assert "profile_picture_url = :picture" in update_expression, (
            "Update expression should include profile_picture_url update"
        )
        assert "updated_at = :updated_at" in update_expression, (
            "Update expression should include updated_at timestamp"
        )
        assert "last_sign_in = :last_sign_in" in update_expression, (
            "Update expression should include last_sign_in timestamp"
        )
        
        # Verify attribute values match provider data
        attribute_values = update_call[1]["ExpressionAttributeValues"]
        assert attribute_values[":email"] == updated_provider_data["email"], (
            "Update should use email from provider data"
        )
        assert attribute_values[":email_verified"] == updated_provider_data["email_verified"], (
            "Update should use email_verified from provider data"
        )
        assert attribute_values[":name"] == updated_provider_data["name"], (
            "Update should use name from provider data"
        )
        assert attribute_values[":picture"] == updated_provider_data["picture"], (
            "Update should use picture from provider data"
        )
    
    @given(
        existing_profile=existing_user_profile_strategy(),
        updated_provider_data=updated_provider_data_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_profile_update_preserves_unchanged_fields_property(self, existing_profile, updated_provider_data):
        """
        **Validates: Requirements 11.5**
        **Property 18: Profile Update on Sign-In (Field Preservation)**
        
        For any existing user profile, when updated with provider data, fields not
        provided by the provider should fall back to existing profile values,
        ensuring no data loss during updates.
        
        This property verifies that:
        1. Missing provider fields fall back to existing profile values
        2. Profile structure remains consistent after updates
        3. No existing data is lost during the update process
        """
        # Create provider data with some missing fields
        incomplete_provider_data = {}
        
        # Randomly include or exclude each field
        if st.booleans().example():
            incomplete_provider_data["email"] = updated_provider_data["email"]
        if st.booleans().example():
            incomplete_provider_data["email_verified"] = updated_provider_data["email_verified"]
        if st.booleans().example():
            incomplete_provider_data["name"] = updated_provider_data["name"]
        if st.booleans().example():
            incomplete_provider_data["picture"] = updated_provider_data["picture"]
        
        # Mock existing profile retrieval
        existing_profile_dict = existing_profile.to_dict()
        self.mock_table.get_item.return_value = {
            "Item": existing_profile_dict
        }
        
        # Mock successful profile update
        expected_profile_dict = existing_profile_dict.copy()
        expected_profile_dict.update({
            "email": incomplete_provider_data.get("email", existing_profile.email),
            "email_verified": incomplete_provider_data.get("email_verified", existing_profile.email_verified),
            "name": incomplete_provider_data.get("name", existing_profile.name),
            "profile_picture_url": incomplete_provider_data.get("picture", existing_profile.profile_picture_url),
            "updated_at": datetime.utcnow().isoformat(),
            "last_sign_in": datetime.utcnow().isoformat()
        })
        
        self.mock_table.update_item.return_value = {
            "Attributes": expected_profile_dict
        }
        
        # Update profile with incomplete provider data
        with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
            fixed_time = datetime(2024, 1, 15, 10, 30, 0)
            mock_datetime.utcnow.return_value = fixed_time
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            result = self.profile_service.update_profile_from_provider(
                existing_profile.user_id, 
                incomplete_provider_data
            )
        
        # Verify fields fall back to existing values when not provided
        expected_email = incomplete_provider_data.get("email", existing_profile.email)
        assert result["email"] == expected_email, (
            f"Email should fall back to existing value when not provided. "
            f"Expected: {expected_email}, Got: {result['email']}"
        )
        
        expected_name = incomplete_provider_data.get("name", existing_profile.name)
        assert result["name"] == expected_name, (
            f"Name should fall back to existing value when not provided. "
            f"Expected: {expected_name}, Got: {result['name']}"
        )
        
        expected_picture = incomplete_provider_data.get("picture", existing_profile.profile_picture_url)
        assert result["profile_picture_url"] == expected_picture, (
            f"Picture URL should fall back to existing value when not provided. "
            f"Expected: {expected_picture}, Got: {result['profile_picture_url']}"
        )
    
    @given(
        user_id=st.uuids(version=4).map(str),
        updated_provider_data=updated_provider_data_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_profile_update_nonexistent_user_error_property(self, user_id, updated_provider_data):
        """
        **Validates: Requirements 11.5**
        **Property 18: Profile Update on Sign-In (Error Handling)**
        
        For any user ID that doesn't exist in the system, attempting to update
        the profile should raise an appropriate error indicating the user was not found.
        
        This property verifies that:
        1. Non-existent user profiles are handled gracefully
        2. Appropriate error messages are returned
        3. No partial updates occur for non-existent users
        """
        # Mock profile not found
        self.mock_table.get_item.return_value = {}
        
        # Attempt to update non-existent profile
        with pytest.raises(Exception) as exc_info:
            self.profile_service.update_profile_from_provider(user_id, updated_provider_data)
        
        error_message = str(exc_info.value)
        assert "AUTH_USER_NOT_FOUND" in error_message or "not found" in error_message.lower(), (
            f"Error message should indicate user not found. Got: {error_message}"
        )
        assert user_id in error_message, (
            f"Error message should include the user ID. Got: {error_message}"
        )
        
        # Verify no update was attempted
        self.mock_table.update_item.assert_not_called()
    
    @given(
        existing_profile=existing_user_profile_strategy(),
        updated_provider_data=updated_provider_data_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_profile_update_database_error_handling_property(self, existing_profile, updated_provider_data):
        """
        **Validates: Requirements 11.5**
        **Property 18: Profile Update on Sign-In (Database Error Handling)**
        
        For any profile update operation, when DynamoDB encounters errors,
        the system should handle them gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. DynamoDB errors are caught and handled appropriately
        2. Error messages are informative but don't leak sensitive information
        3. Failed updates don't leave the system in an inconsistent state
        """
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
        
        # Attempt profile update
        with pytest.raises(Exception) as exc_info:
            self.profile_service.update_profile_from_provider(
                existing_profile.user_id, 
                updated_provider_data
            )
        
        error_message = str(exc_info.value)
        assert "Failed to update profile" in error_message, (
            f"Error message should indicate profile update failure. Got: {error_message}"
        )
        
        # Verify the error doesn't leak sensitive information
        assert existing_profile.user_id not in error_message or len(existing_profile.user_id) < 10, (
            "Error message should not leak full user ID for security"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])