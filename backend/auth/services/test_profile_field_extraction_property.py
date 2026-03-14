"""
Property-based tests for profile field extraction.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**
**Property 17: Profile Field Extraction**

This module contains property-based tests that verify profile field extraction
functionality works correctly for any social provider data. The test validates
that when a new user profile is created from social provider data, the profile
contains the user's name, email, and profile picture URL extracted from the
provider's user information.
"""

import pytest
import uuid
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite

from .profile_service import ProfileService
from .provider_factory import get_supported_providers
from ..models.user_profile import UserProfile, LinkedProvider
from ..models.oauth_tokens import UserClaims


# Custom strategies for profile field extraction testing
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
def provider_data_with_all_fields_strategy(draw):
    """Generate provider data with all required fields (name, email, picture)."""
    sub = draw(provider_user_id_strategy())
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    picture = draw(profile_picture_url_strategy())
    
    return {
        "sub": sub,
        "email": email,
        "email_verified": email_verified,
        "name": name,
        "picture": picture
    }


@composite
def provider_data_with_optional_picture_strategy(draw):
    """Generate provider data where picture might be None (some providers don't provide it)."""
    sub = draw(provider_user_id_strategy())
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    
    # Picture is optional - some providers don't provide it
    has_picture = draw(st.booleans())
    picture = draw(profile_picture_url_strategy()) if has_picture else None
    
    return {
        "sub": sub,
        "email": email,
        "email_verified": email_verified,
        "name": name,
        "picture": picture
    }


class TestProfileFieldExtractionProperties:
    """Property-based tests for profile field extraction functionality."""
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.profile_service = ProfileService()
        self.profile_service.table = self.mock_table
    
    @given(
        provider_data=provider_data_with_all_fields_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_field_extraction_with_all_fields_property(self, provider_data, provider):
        """
        **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
        **Property 17: Profile Field Extraction (All Fields Present)**
        
        For any new user profile created from social provider data that contains
        name, email, and profile picture URL, the profile should contain all three
        fields extracted from the provider's user information and stored correctly.
        
        This property verifies that:
        1. User's name is extracted from provider data (Requirement 11.1)
        2. User's email is extracted from provider data (Requirement 11.2)
        3. User's profile picture URL is extracted from provider data (Requirement 11.3)
        4. All extracted information is stored in the User_Profile (Requirement 11.4)
        5. Field extraction works for any provider and any valid data format
        """
        # Mock successful DynamoDB put_item (profile creation)
        self.mock_table.put_item.return_value = {}
        
        # Create profile from provider data
        with patch('uuid.uuid4', return_value=uuid.UUID('550e8400-e29b-41d4-a716-446655440000')):
            with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
                # Mock current time for consistent timestamps
                fixed_time = datetime(2024, 1, 15, 10, 30, 0)
                mock_datetime.utcnow.return_value = fixed_time
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                result = self.profile_service.create_profile(provider_data, provider)
        
        # Verify result is a valid profile dictionary
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # **Requirement 11.1**: User's name is extracted from provider data
        assert "name" in result, "Profile should contain name field"
        assert result["name"] == provider_data["name"], (
            f"Profile name should be extracted from provider data. "
            f"Expected: '{provider_data['name']}', Got: '{result['name']}'"
        )
        assert isinstance(result["name"], str), "Profile name should be a string"
        assert len(result["name"]) > 0, "Profile name should not be empty"
        
        # **Requirement 11.2**: User's email is extracted from provider data
        assert "email" in result, "Profile should contain email field"
        assert result["email"] == provider_data["email"], (
            f"Profile email should be extracted from provider data. "
            f"Expected: '{provider_data['email']}', Got: '{result['email']}'"
        )
        assert isinstance(result["email"], str), "Profile email should be a string"
        assert "@" in result["email"], "Profile email should be a valid email format"
        
        # **Requirement 11.3**: User's profile picture URL is extracted from provider data
        assert "profile_picture_url" in result, "Profile should contain profile_picture_url field"
        assert result["profile_picture_url"] == provider_data["picture"], (
            f"Profile picture URL should be extracted from provider data. "
            f"Expected: '{provider_data['picture']}', Got: '{result['profile_picture_url']}'"
        )
        assert isinstance(result["profile_picture_url"], str), "Profile picture URL should be a string"
        assert result["profile_picture_url"].startswith("https://"), (
            "Profile picture URL should be a valid HTTPS URL"
        )
        
        # **Requirement 11.4**: All extracted information is stored in the User_Profile
        # Verify email_verified is also extracted and stored
        assert "email_verified" in result, "Profile should contain email_verified field"
        assert result["email_verified"] == provider_data["email_verified"], (
            f"Profile email_verified should be extracted from provider data. "
            f"Expected: {provider_data['email_verified']}, Got: {result['email_verified']}"
        )
        assert isinstance(result["email_verified"], bool), "Profile email_verified should be a boolean"
        
        # Verify the profile was stored in DynamoDB with all extracted fields
        self.mock_table.put_item.assert_called_once()
        stored_item = self.mock_table.put_item.call_args[1]["Item"]
        
        # Verify all extracted fields are in the stored item
        assert stored_item["name"] == provider_data["name"], (
            "Stored profile should contain extracted name"
        )
        assert stored_item["email"] == provider_data["email"], (
            "Stored profile should contain extracted email"
        )
        assert stored_item["profile_picture_url"] == provider_data["picture"], (
            "Stored profile should contain extracted profile picture URL"
        )
        assert stored_item["email_verified"] == provider_data["email_verified"], (
            "Stored profile should contain extracted email verification status"
        )
        
        # Verify provider information is also stored correctly
        assert "linked_providers" in stored_item, "Stored profile should contain linked_providers"
        assert len(stored_item["linked_providers"]) == 1, (
            "New profile should have exactly one linked provider"
        )
        
        linked_provider = stored_item["linked_providers"][0]
        assert linked_provider["provider"] == provider, (
            f"Linked provider should match the provider used for creation. "
            f"Expected: {provider}, Got: {linked_provider['provider']}"
        )
        assert linked_provider["provider_user_id"] == provider_data["sub"], (
            f"Linked provider user ID should match provider data sub claim. "
            f"Expected: {provider_data['sub']}, Got: {linked_provider['provider_user_id']}"
        )
        assert linked_provider["email"] == provider_data["email"], (
            f"Linked provider email should match extracted email. "
            f"Expected: {provider_data['email']}, Got: {linked_provider['email']}"
        )
    
    @given(
        provider_data=provider_data_with_optional_picture_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_field_extraction_with_optional_picture_property(self, provider_data, provider):
        """
        **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
        **Property 17: Profile Field Extraction (Optional Picture)**
        
        For any new user profile created from social provider data where the
        profile picture URL might be None (some providers don't provide it),
        the profile should still contain the name and email extracted correctly,
        and handle the optional picture field appropriately.
        
        This property verifies that:
        1. User's name is always extracted when present (Requirement 11.1)
        2. User's email is always extracted when present (Requirement 11.2)
        3. Profile picture URL is extracted when provided, None when not (Requirement 11.3)
        4. All available information is stored in the User_Profile (Requirement 11.4)
        5. Field extraction handles missing optional fields gracefully
        """
        # Mock successful DynamoDB put_item (profile creation)
        self.mock_table.put_item.return_value = {}
        
        # Create profile from provider data
        with patch('uuid.uuid4', return_value=uuid.UUID('550e8400-e29b-41d4-a716-446655440000')):
            with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
                # Mock current time for consistent timestamps
                fixed_time = datetime(2024, 1, 15, 10, 30, 0)
                mock_datetime.utcnow.return_value = fixed_time
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                result = self.profile_service.create_profile(provider_data, provider)
        
        # Verify result is a valid profile dictionary
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # **Requirement 11.1**: User's name is extracted from provider data
        assert "name" in result, "Profile should contain name field"
        assert result["name"] == provider_data["name"], (
            f"Profile name should be extracted from provider data. "
            f"Expected: '{provider_data['name']}', Got: '{result['name']}'"
        )
        assert isinstance(result["name"], str), "Profile name should be a string"
        assert len(result["name"]) > 0, "Profile name should not be empty"
        
        # **Requirement 11.2**: User's email is extracted from provider data
        assert "email" in result, "Profile should contain email field"
        assert result["email"] == provider_data["email"], (
            f"Profile email should be extracted from provider data. "
            f"Expected: '{provider_data['email']}', Got: '{result['email']}'"
        )
        assert isinstance(result["email"], str), "Profile email should be a string"
        assert "@" in result["email"], "Profile email should be a valid email format"
        
        # **Requirement 11.3**: Profile picture URL is extracted when provided
        assert "profile_picture_url" in result, "Profile should contain profile_picture_url field"
        expected_picture = provider_data.get("picture")
        assert result["profile_picture_url"] == expected_picture, (
            f"Profile picture URL should match provider data (including None). "
            f"Expected: {expected_picture}, Got: {result['profile_picture_url']}"
        )
        
        # If picture is provided, it should be a valid HTTPS URL
        if expected_picture is not None:
            assert isinstance(result["profile_picture_url"], str), (
                "Profile picture URL should be a string when provided"
            )
            assert result["profile_picture_url"].startswith("https://"), (
                "Profile picture URL should be a valid HTTPS URL when provided"
            )
        else:
            # When no picture is provided, it should be None
            assert result["profile_picture_url"] is None, (
                "Profile picture URL should be None when not provided by provider"
            )
        
        # **Requirement 11.4**: All extracted information is stored in the User_Profile
        # Verify the profile was stored in DynamoDB with all extracted fields
        self.mock_table.put_item.assert_called_once()
        stored_item = self.mock_table.put_item.call_args[1]["Item"]
        
        # Verify all extracted fields are in the stored item
        assert stored_item["name"] == provider_data["name"], (
            "Stored profile should contain extracted name"
        )
        assert stored_item["email"] == provider_data["email"], (
            "Stored profile should contain extracted email"
        )
        assert stored_item["profile_picture_url"] == provider_data.get("picture"), (
            "Stored profile should contain extracted profile picture URL (or None)"
        )
        assert stored_item["email_verified"] == provider_data["email_verified"], (
            "Stored profile should contain extracted email verification status"
        )
        
        # Verify that the extraction and storage process is consistent
        # The stored data should exactly match what was extracted
        assert stored_item["name"] == result["name"], (
            "Stored name should match extracted name"
        )
        assert stored_item["email"] == result["email"], (
            "Stored email should match extracted email"
        )
        assert stored_item["profile_picture_url"] == result["profile_picture_url"], (
            "Stored profile picture URL should match extracted profile picture URL"
        )
    
    @given(
        provider_data=provider_data_with_all_fields_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_field_extraction_data_integrity_property(self, provider_data, provider):
        """
        **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
        **Property 17: Profile Field Extraction (Data Integrity)**
        
        For any new user profile created from social provider data, the extracted
        fields should maintain data integrity - no data corruption, no truncation,
        no encoding issues, and exact preservation of the original provider data.
        
        This property verifies that:
        1. Name extraction preserves all characters and formatting
        2. Email extraction preserves exact email format
        3. Picture URL extraction preserves complete URL
        4. No data is lost or corrupted during extraction and storage
        5. Unicode and special characters are handled correctly
        """
        # Mock successful DynamoDB put_item (profile creation)
        self.mock_table.put_item.return_value = {}
        
        # Create profile from provider data
        with patch('uuid.uuid4', return_value=uuid.UUID('550e8400-e29b-41d4-a716-446655440000')):
            with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
                # Mock current time for consistent timestamps
                fixed_time = datetime(2024, 1, 15, 10, 30, 0)
                mock_datetime.utcnow.return_value = fixed_time
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                result = self.profile_service.create_profile(provider_data, provider)
        
        # Verify exact data preservation for name field
        original_name = provider_data["name"]
        extracted_name = result["name"]
        assert extracted_name == original_name, (
            f"Name extraction should preserve exact data. "
            f"Original: '{original_name}' (len={len(original_name)}), "
            f"Extracted: '{extracted_name}' (len={len(extracted_name)})"
        )
        assert len(extracted_name) == len(original_name), (
            "Name extraction should preserve exact length"
        )
        
        # Verify exact data preservation for email field
        original_email = provider_data["email"]
        extracted_email = result["email"]
        assert extracted_email == original_email, (
            f"Email extraction should preserve exact data. "
            f"Original: '{original_email}', Extracted: '{extracted_email}'"
        )
        assert len(extracted_email) == len(original_email), (
            "Email extraction should preserve exact length"
        )
        
        # Verify exact data preservation for picture URL field
        original_picture = provider_data["picture"]
        extracted_picture = result["profile_picture_url"]
        assert extracted_picture == original_picture, (
            f"Picture URL extraction should preserve exact data. "
            f"Original: '{original_picture}', Extracted: '{extracted_picture}'"
        )
        if original_picture is not None:
            assert len(extracted_picture) == len(original_picture), (
                "Picture URL extraction should preserve exact length"
            )
        
        # Verify that no additional processing or normalization occurred
        # The extracted data should be byte-for-byte identical to the original
        assert type(extracted_name) == type(original_name), (
            "Name field type should be preserved"
        )
        assert type(extracted_email) == type(original_email), (
            "Email field type should be preserved"
        )
        assert type(extracted_picture) == type(original_picture), (
            "Picture URL field type should be preserved"
        )
        
        # Verify that the stored data maintains the same integrity
        stored_item = self.mock_table.put_item.call_args[1]["Item"]
        assert stored_item["name"] == original_name, (
            "Stored name should be identical to original provider data"
        )
        assert stored_item["email"] == original_email, (
            "Stored email should be identical to original provider data"
        )
        assert stored_item["profile_picture_url"] == original_picture, (
            "Stored picture URL should be identical to original provider data"
        )
        
        # Verify that the extraction process is deterministic
        # Running the same extraction twice should yield identical results
        with patch('uuid.uuid4', return_value=uuid.UUID('550e8400-e29b-41d4-a716-446655440000')):
            with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
                mock_datetime.utcnow.return_value = fixed_time
                mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                
                # Reset mock to avoid "already called" issues
                self.mock_table.reset_mock()
                self.mock_table.put_item.return_value = {}
                
                result2 = self.profile_service.create_profile(provider_data, provider)
        
        # Both extractions should yield identical results
        assert result2["name"] == result["name"], (
            "Field extraction should be deterministic for name"
        )
        assert result2["email"] == result["email"], (
            "Field extraction should be deterministic for email"
        )
        assert result2["profile_picture_url"] == result["profile_picture_url"], (
            "Field extraction should be deterministic for picture URL"
        )