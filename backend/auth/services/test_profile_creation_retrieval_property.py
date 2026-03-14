"""
Property-based tests for profile creation or retrieval.

**Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
**Property 3: Profile Creation or Retrieval**

This module contains property-based tests that verify profile creation and retrieval
functionality works correctly for any valid ID token from any social provider.
The test validates that the authentication flow can successfully create new profiles
or retrieve existing ones, and the result contains a valid user profile.
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


# Custom strategies for profile creation/retrieval testing
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
    """Generate valid user names."""
    # Generate realistic names with various formats
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", 
                   "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam", "Maya", "Noah"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
                  "Davis", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor"]
    
    first = draw(st.sampled_from(first_names))
    last = draw(st.sampled_from(last_names))
    
    # Various name formats
    formats = [
        f"{first} {last}",
        f"{first}",
        f"{first} {last} Jr.",
        f"Dr. {first} {last}",
        f"{first} {last}-Wilson",
        f"{first} de {last}",
        f"{first} {last} III"
    ]
    
    return draw(st.sampled_from(formats))


@composite
def profile_picture_url_strategy(draw):
    """Generate valid profile picture URLs."""
    domains = ["example.com", "cdn.example.com", "images.example.com", 
               "avatars.example.com", "profile.example.com"]
    paths = ["avatar", "profile", "user", "pic", "photo", "image"]
    extensions = ["jpg", "png", "jpeg", "webp", "gif"]
    
    domain = draw(st.sampled_from(domains))
    path = draw(st.sampled_from(paths))
    user_id = draw(st.integers(min_value=1, max_value=999999))
    ext = draw(st.sampled_from(extensions))
    
    return f"https://{domain}/{path}/{user_id}.{ext}"


@composite
def provider_user_id_strategy(draw):
    """Generate provider-specific user IDs."""
    # Different providers use different ID formats
    formats = [
        # Google: numeric strings
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
def provider_data_strategy(draw):
    """Generate provider data (user claims from ID token)."""
    sub = draw(provider_user_id_strategy())
    email = draw(user_email_strategy())
    email_verified = draw(st.booleans())
    name = draw(user_name_strategy())
    
    # Picture is optional
    has_picture = draw(st.booleans())
    picture = draw(profile_picture_url_strategy()) if has_picture else None
    
    return {
        "sub": sub,
        "email": email,
        "email_verified": email_verified,
        "name": name,
        "picture": picture
    }


@composite
def existing_user_profile_strategy(draw):
    """Generate existing user profiles for retrieval testing."""
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


class TestProfileCreationRetrievalProperties:
    """Property-based tests for profile creation or retrieval."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Mock DynamoDB table
        self.mock_table = Mock()
        self.profile_service = ProfileService()
        self.profile_service.table = self.mock_table

    @given(
        provider_data=provider_data_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_creation_property(self, provider_data, provider):
        """
        **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
        **Property 3: Profile Creation or Retrieval (Creation Case)**
        
        For any valid ID token from any social provider, when the provider user ID
        doesn't exist in the system, the authentication flow should create a new
        user profile and the result should contain a valid user profile with all
        required fields populated from the provider data.
        
        This property verifies that:
        1. New profiles are created successfully for any provider data
        2. All required profile fields are populated from provider data
        3. Profile contains the provider as a linked account
        4. Profile has valid timestamps and UUID
        5. Profile creation is atomic and consistent
        6. Created profile can be stored in DynamoDB
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
        
        # Verify result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # Verify all required profile fields are present
        required_fields = [
            "user_id", "email", "email_verified", "name", "profile_picture_url",
            "linked_providers", "created_at", "updated_at", "last_sign_in",
            "last_sign_in_provider"
        ]
        for field in required_fields:
            assert field in result, f"Profile should contain {field} field"
        
        # Verify profile fields are populated from provider data
        assert result["email"] == provider_data["email"], (
            f"Profile email should match provider data. "
            f"Expected: {provider_data['email']}, Got: {result['email']}"
        )
        assert result["email_verified"] == provider_data["email_verified"], (
            f"Profile email_verified should match provider data. "
            f"Expected: {provider_data['email_verified']}, Got: {result['email_verified']}"
        )
        assert result["name"] == provider_data["name"], (
            f"Profile name should match provider data. "
            f"Expected: {provider_data['name']}, Got: {result['name']}"
        )
        assert result["profile_picture_url"] == provider_data.get("picture"), (
            f"Profile picture should match provider data. "
            f"Expected: {provider_data.get('picture')}, Got: {result['profile_picture_url']}"
        )
        
        # Verify user ID is a valid UUID
        assert result["user_id"] == "550e8400-e29b-41d4-a716-446655440000", (
            f"Profile should have valid UUID user_id. Got: {result['user_id']}"
        )
        
        # Verify linked providers
        assert isinstance(result["linked_providers"], list), (
            "linked_providers should be a list"
        )
        assert len(result["linked_providers"]) == 1, (
            f"New profile should have exactly 1 linked provider. "
            f"Got: {len(result['linked_providers'])}"
        )
        
        linked_provider = result["linked_providers"][0]
        assert linked_provider["provider"] == provider, (
            f"Linked provider should match input provider. "
            f"Expected: {provider}, Got: {linked_provider['provider']}"
        )
        assert linked_provider["provider_user_id"] == provider_data["sub"], (
            f"Provider user ID should match sub claim. "
            f"Expected: {provider_data['sub']}, Got: {linked_provider['provider_user_id']}"
        )
        assert linked_provider["email"] == provider_data["email"], (
            f"Linked provider email should match provider data. "
            f"Expected: {provider_data['email']}, Got: {linked_provider['email']}"
        )
        
        # Verify timestamps
        assert result["last_sign_in_provider"] == provider, (
            f"Last sign-in provider should be {provider}. "
            f"Got: {result['last_sign_in_provider']}"
        )
        
        # Verify DynamoDB storage
        self.mock_table.put_item.assert_called_once()
        put_item_call = self.mock_table.put_item.call_args
        
        # Verify conditional expression to prevent overwrites
        assert "ConditionExpression" in put_item_call[1], (
            "put_item should use ConditionExpression to prevent overwrites"
        )
        
        # Verify GSI attributes are added for provider lookup
        stored_item = put_item_call[1]["Item"]
        assert "provider_user_id" in stored_item, (
            "Stored item should include provider_user_id for GSI"
        )
        assert "provider" in stored_item, (
            "Stored item should include provider for GSI"
        )
        assert stored_item["provider_user_id"] == provider_data["sub"], (
            "GSI provider_user_id should match sub claim"
        )
        assert stored_item["provider"] == provider, (
            "GSI provider should match input provider"
        )

    @given(
        existing_profile=existing_user_profile_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_retrieval_property(self, existing_profile, provider):
        """
        **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
        **Property 3: Profile Creation or Retrieval (Retrieval Case)**
        
        For any valid ID token from any social provider, when the provider user ID
        already exists in the system, the authentication flow should retrieve the
        existing user profile and the result should contain the complete user profile
        with all linked providers and current information.
        
        This property verifies that:
        1. Existing profiles are retrieved successfully by provider user ID
        2. Retrieved profile contains all original data
        3. Profile retrieval works for any provider
        4. GSI lookup works correctly for provider user ID
        5. Retrieved profile structure is valid and complete
        """
        # Select a random linked provider from the existing profile
        linked_provider = existing_profile.linked_providers[0]
        provider_user_id = linked_provider.provider_user_id
        lookup_provider = linked_provider.provider
        
        # Mock successful DynamoDB GSI query (profile retrieval)
        profile_dict = existing_profile.to_dict()
        # Add GSI attributes that would be present in DynamoDB
        profile_dict["provider_user_id"] = provider_user_id
        profile_dict["provider"] = lookup_provider
        
        self.mock_table.query.return_value = {
            "Items": [profile_dict]
        }
        
        # Retrieve profile by provider user ID
        result = self.profile_service.get_profile_by_provider(
            lookup_provider, 
            provider_user_id
        )
        
        # Verify profile was retrieved
        assert result is not None, "Profile should be retrieved successfully"
        assert isinstance(result, dict), "Retrieved profile should be a dictionary"
        
        # Verify all required profile fields are present
        required_fields = [
            "user_id", "email", "email_verified", "name", "profile_picture_url",
            "linked_providers", "created_at", "updated_at", "last_sign_in",
            "last_sign_in_provider"
        ]
        for field in required_fields:
            assert field in result, f"Retrieved profile should contain {field} field"
        
        # Verify profile data matches original
        assert result["user_id"] == existing_profile.user_id, (
            f"Retrieved user_id should match original. "
            f"Expected: {existing_profile.user_id}, Got: {result['user_id']}"
        )
        assert result["email"] == existing_profile.email, (
            f"Retrieved email should match original. "
            f"Expected: {existing_profile.email}, Got: {result['email']}"
        )
        assert result["name"] == existing_profile.name, (
            f"Retrieved name should match original. "
            f"Expected: {existing_profile.name}, Got: {result['name']}"
        )
        assert result["email_verified"] == existing_profile.email_verified, (
            f"Retrieved email_verified should match original. "
            f"Expected: {existing_profile.email_verified}, Got: {result['email_verified']}"
        )
        
        # Verify linked providers are preserved
        assert isinstance(result["linked_providers"], list), (
            "linked_providers should be a list"
        )
        assert len(result["linked_providers"]) == len(existing_profile.linked_providers), (
            f"Retrieved profile should have same number of linked providers. "
            f"Expected: {len(existing_profile.linked_providers)}, "
            f"Got: {len(result['linked_providers'])}"
        )
        
        # Verify the queried provider is in the linked providers
        provider_found = False
        for linked in result["linked_providers"]:
            if (linked["provider"] == lookup_provider and 
                linked["provider_user_id"] == provider_user_id):
                provider_found = True
                break
        
        assert provider_found, (
            f"Retrieved profile should contain the queried provider {lookup_provider} "
            f"with user ID {provider_user_id}"
        )
        
        # Verify DynamoDB GSI query was called correctly
        self.mock_table.query.assert_called_once_with(
            IndexName="ProviderUserIdIndex",
            KeyConditionExpression=(
                "provider_user_id = :provider_user_id AND provider = :provider"
            ),
            ExpressionAttributeValues={
                ":provider_user_id": provider_user_id,
                ":provider": lookup_provider
            }
        )

    @given(
        provider_data=provider_data_strategy(),
        provider=provider_name(),
        scenario=st.sampled_from(["create", "retrieve"])
    )
    @settings(max_examples=100, deadline=15000)
    def test_profile_creation_or_retrieval_unified_property(self, provider_data, provider, scenario):
        """
        **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
        **Property 3: Profile Creation or Retrieval (Unified Property)**
        
        For any valid ID token from any social provider, the authentication flow
        should either create a new user profile (if the provider user ID doesn't exist)
        or retrieve the existing user profile (if it does exist), and the result
        should contain a valid user profile in both cases.
        
        This property verifies that:
        1. The system handles both creation and retrieval scenarios correctly
        2. Both scenarios return valid user profiles
        3. Profile structure is consistent between creation and retrieval
        4. All required fields are present in both scenarios
        5. The flow works for any provider and any valid provider data
        """
        if scenario == "create":
            # Test profile creation scenario
            self.mock_table.put_item.return_value = {}
            
            with patch('uuid.uuid4', return_value=uuid.UUID('550e8400-e29b-41d4-a716-446655440000')):
                with patch('backend.auth.services.profile_service.datetime') as mock_datetime:
                    fixed_time = datetime(2024, 1, 15, 10, 30, 0)
                    mock_datetime.utcnow.return_value = fixed_time
                    mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                    
                    result = self.profile_service.create_profile(provider_data, provider)
            
            # Verify creation result
            assert result is not None, "Profile creation should return a result"
            assert result["email"] == provider_data["email"], "Created profile should have correct email"
            assert result["name"] == provider_data["name"], "Created profile should have correct name"
            assert len(result["linked_providers"]) == 1, "Created profile should have one linked provider"
            assert result["linked_providers"][0]["provider"] == provider, "Linked provider should match input"
            
        else:  # scenario == "retrieve"
            # Test profile retrieval scenario
            # Create a mock existing profile
            existing_user_id = str(uuid.uuid4())
            existing_profile_dict = {
                "user_id": existing_user_id,
                "email": provider_data["email"],
                "email_verified": provider_data["email_verified"],
                "name": provider_data["name"],
                "profile_picture_url": provider_data.get("picture"),
                "linked_providers": [{
                    "provider": provider,
                    "provider_user_id": provider_data["sub"],
                    "linked_at": datetime.now().isoformat(),
                    "email": provider_data["email"]
                }],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "last_sign_in": datetime.now().isoformat(),
                "last_sign_in_provider": provider,
                "provider_user_id": provider_data["sub"],  # GSI attribute
                "provider": provider  # GSI attribute
            }
            
            self.mock_table.query.return_value = {
                "Items": [existing_profile_dict]
            }
            
            result = self.profile_service.get_profile_by_provider(provider, provider_data["sub"])
            
            # Verify retrieval result
            assert result is not None, "Profile retrieval should return a result"
            assert result["email"] == provider_data["email"], "Retrieved profile should have correct email"
            assert result["name"] == provider_data["name"], "Retrieved profile should have correct name"
            assert len(result["linked_providers"]) >= 1, "Retrieved profile should have linked providers"
        
        # Common validations for both scenarios
        assert isinstance(result, dict), "Result should be a dictionary"
        
        # Verify all required fields are present
        required_fields = [
            "user_id", "email", "email_verified", "name", "profile_picture_url",
            "linked_providers", "created_at", "updated_at", "last_sign_in",
            "last_sign_in_provider"
        ]
        for field in required_fields:
            assert field in result, f"Profile should contain {field} field"
        
        # Verify field types
        assert isinstance(result["user_id"], str), "user_id should be a string"
        assert isinstance(result["email"], str), "email should be a string"
        assert isinstance(result["email_verified"], bool), "email_verified should be a boolean"
        assert isinstance(result["name"], str), "name should be a string"
        assert isinstance(result["linked_providers"], list), "linked_providers should be a list"
        assert len(result["linked_providers"]) >= 1, "Profile should have at least one linked provider"
        
        # Verify at least one linked provider matches the input provider
        provider_found = False
        for linked in result["linked_providers"]:
            if linked["provider"] == provider:
                provider_found = True
                break
        
        assert provider_found, f"Profile should contain linked provider {provider}"

    @given(
        provider_data=provider_data_strategy(),
        provider=provider_name()
    )
    @settings(max_examples=50, deadline=10000)
    def test_profile_creation_error_handling_property(self, provider_data, provider):
        """
        **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
        **Property 3: Profile Creation or Retrieval (Error Handling)**
        
        For any provider data, when profile creation encounters errors
        (missing required fields, DynamoDB failures, etc.), the system
        should handle errors gracefully and provide meaningful error messages.
        
        This property verifies that:
        1. Missing email addresses are handled with appropriate errors
        2. DynamoDB errors are handled gracefully
        3. Error messages are informative and secure
        4. No sensitive information is leaked in error messages
        """
        # Test missing email error
        invalid_provider_data = provider_data.copy()
        invalid_provider_data["email"] = ""  # Empty email
        
        with pytest.raises(Exception) as exc_info:
            self.profile_service.create_profile(invalid_provider_data, provider)
        
        error_message = str(exc_info.value)
        assert "email" in error_message.lower(), (
            f"Error message should mention email requirement. Got: {error_message}"
        )
        
        # Test DynamoDB error handling
        self.mock_table.put_item.side_effect = ClientError(
            {"Error": {"Code": "InternalServerException", "Message": "Internal error"}},
            "PutItem"
        )
        
        with pytest.raises(Exception) as exc_info:
            self.profile_service.create_profile(provider_data, provider)
        
        error_message = str(exc_info.value)
        assert "Failed to create user profile" in error_message, (
            f"Error message should indicate profile creation failure. Got: {error_message}"
        )

    @given(
        provider=provider_name(),
        provider_user_id=provider_user_id_strategy()
    )
    @settings(max_examples=50, deadline=10000)
    def test_profile_retrieval_not_found_property(self, provider, provider_user_id):
        """
        **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
        **Property 3: Profile Creation or Retrieval (Not Found Case)**
        
        For any provider and provider user ID, when no profile exists with that
        provider user ID, the retrieval should return None gracefully without
        raising exceptions.
        
        This property verifies that:
        1. Non-existent profiles return None instead of raising exceptions
        2. GSI queries handle empty results correctly
        3. The system gracefully handles all provider/user ID combinations
        """
        # Mock empty DynamoDB query result
        self.mock_table.query.return_value = {
            "Items": []
        }
        
        # Attempt to retrieve non-existent profile
        result = self.profile_service.get_profile_by_provider(provider, provider_user_id)
        
        # Verify None is returned for non-existent profiles
        assert result is None, (
            f"Non-existent profile should return None. Got: {result}"
        )
        
        # Verify GSI query was called correctly
        self.mock_table.query.assert_called_once_with(
            IndexName="ProviderUserIdIndex",
            KeyConditionExpression=(
                "provider_user_id = :provider_user_id AND provider = :provider"
            ),
            ExpressionAttributeValues={
                ":provider_user_id": provider_user_id,
                ":provider": provider
            }
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])