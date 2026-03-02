"""
Profile Service Module

This module manages user profile operations including creation, retrieval,
provider linking/unlinking, and profile updates from social providers.

Requirements: 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6,
             11.1, 11.2, 11.3, 11.4, 11.5
"""

import boto3
from typing import Dict, Optional, List
from botocore.exceptions import ClientError
from datetime import datetime
import uuid

from ..models.user_profile import UserProfile, LinkedProvider
from ..config import AuthConfig, AuthErrorCode


class ProfileService:
    """
    Manages user profile operations.
    
    This service handles:
    - Creating new user profiles from social provider data
    - Retrieving profiles by user_id or provider user ID
    - Linking additional social providers to existing profiles
    - Unlinking social providers with last provider protection
    - Updating profiles with latest data from social providers
    """
    
    def __init__(self, table_name: Optional[str] = None):
        """
        Initialize the profile service.
        
        Args:
            table_name: DynamoDB table name for user profiles (defaults to config)
        """
        self.table_name = table_name or AuthConfig.USER_PROFILES_TABLE
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(self.table_name)
    
    def create_profile(self, provider_data: Dict, provider: str) -> Dict:
        """
        Creates new user profile from provider data.
        
        Extracts user information from the social provider's data and creates
        a new user profile in DynamoDB. The profile includes the provider as
        the first linked account.
        
        Args:
            provider_data: User information from social provider containing:
                - sub (str): User ID from provider
                - email (str): User email
                - email_verified (bool): Email verification status
                - name (str): User's full name
                - picture (str): Profile picture URL (optional)
            provider: Social provider name (google, facebook, etc.)
            
        Returns:
            dict: Created user profile as dictionary
            
        Raises:
            Exception: If profile creation fails
            
        Requirements: 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3, 11.1, 11.2, 11.3, 11.4
        
        Example:
            >>> profile_service = ProfileService()
            >>> provider_data = {
            ...     "sub": "google-123",
            ...     "email": "user@example.com",
            ...     "email_verified": True,
            ...     "name": "John Doe",
            ...     "picture": "https://example.com/photo.jpg"
            ... }
            >>> profile = profile_service.create_profile(provider_data, "google")
            >>> print(profile["user_id"])
            550e8400-e29b-41d4-a716-446655440000
        """
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Extract user information from provider data
        email = provider_data.get("email", "")
        email_verified = provider_data.get("email_verified", False)
        name = provider_data.get("name", "")
        picture = provider_data.get("picture")
        provider_user_id = provider_data.get("sub", "")
        
        # Validate required fields
        if not email:
            raise Exception(
                f"{AuthErrorCode.AUTH_MISSING_EMAIL}: "
                "Provider did not provide email address"
            )
        
        if not provider_user_id:
            raise Exception("Provider did not provide user ID (sub claim)")
        
        # Create linked provider entry
        now = datetime.utcnow()
        linked_provider = LinkedProvider(
            provider=provider,
            provider_user_id=provider_user_id,
            linked_at=now,
            email=email
        )
        
        # Create user profile
        profile = UserProfile(
            user_id=user_id,
            email=email,
            email_verified=email_verified,
            name=name,
            profile_picture_url=picture,
            linked_providers=[linked_provider],
            created_at=now,
            updated_at=now,
            last_sign_in=now,
            last_sign_in_provider=provider
        )
        
        # Store in DynamoDB
        try:
            profile_dict = profile.to_dict()
            
            # Add GSI attributes for provider lookup
            profile_dict["provider_user_id"] = provider_user_id
            profile_dict["provider"] = provider
            
            self.table.put_item(
                Item=profile_dict,
                ConditionExpression="attribute_not_exists(user_id)"
            )
            
            return profile_dict
            
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise Exception("User profile already exists")
            else:
                raise Exception(
                    f"Failed to create user profile: {e.response['Error']['Message']}"
                )
        except Exception as e:
            raise Exception(f"Failed to create user profile: {str(e)}")
    
    def get_profile(self, user_id: str) -> Optional[Dict]:
        """
        Retrieves user profile by user_id.
        
        Args:
            user_id: Unique user identifier (UUID)
            
        Returns:
            Optional[dict]: User profile dictionary or None if not found
            
        Raises:
            Exception: If DynamoDB query fails
            
        Requirements: 9.4
        
        Example:
            >>> profile_service = ProfileService()
            >>> profile = profile_service.get_profile("user-123")
            >>> print(profile["email"])
            user@example.com
        """
        try:
            response = self.table.get_item(Key={"user_id": user_id})
            
            if "Item" in response:
                return response["Item"]
            else:
                return None
                
        except ClientError as e:
            raise Exception(
                f"Failed to retrieve user profile: {e.response['Error']['Message']}"
            )
        except Exception as e:
            raise Exception(f"Failed to retrieve user profile: {str(e)}")
    
    def get_profile_by_provider(
        self,
        provider: str,
        provider_user_id: str
    ) -> Optional[Dict]:
        """
        Retrieves user profile by provider user ID using GSI.
        
        Uses the ProviderUserIdIndex GSI to look up profiles by their
        social provider user ID.
        
        Args:
            provider: Social provider name
            provider_user_id: User ID from social provider
            
        Returns:
            Optional[dict]: User profile dictionary or None if not found
            
        Raises:
            Exception: If DynamoDB query fails
            
        Requirements: 9.4
        
        Example:
            >>> profile_service = ProfileService()
            >>> profile = profile_service.get_profile_by_provider("google", "google-123")
            >>> print(profile["user_id"])
            user-456
        """
        try:
            response = self.table.query(
                IndexName="ProviderUserIdIndex",
                KeyConditionExpression=(
                    "provider_user_id = :provider_user_id AND provider = :provider"
                ),
                ExpressionAttributeValues={
                    ":provider_user_id": provider_user_id,
                    ":provider": provider
                }
            )
            
            items = response.get("Items", [])
            
            if items:
                return items[0]  # Return first match
            else:
                return None
                
        except ClientError as e:
            raise Exception(
                f"Failed to query user profile by provider: {e.response['Error']['Message']}"
            )
        except Exception as e:
            raise Exception(f"Failed to query user profile by provider: {str(e)}")
    
    def link_provider(
        self,
        user_id: str,
        provider: str,
        provider_user_id: str,
        email: str
    ) -> bool:
        """
        Links additional social provider to existing profile.
        
        Adds a new social provider to the user's linked providers list.
        Prevents linking if the provider user ID is already linked to
        a different user profile.
        
        Args:
            user_id: User identifier
            provider: Social provider name to link
            provider_user_id: User ID from social provider
            email: Email from social provider
            
        Returns:
            bool: True if provider was successfully linked
            
        Raises:
            Exception: If provider is already linked to different user
                      (AUTH_ACCOUNT_ALREADY_LINKED)
            
        Requirements: 9.1, 9.2, 9.3
        
        Example:
            >>> profile_service = ProfileService()
            >>> success = profile_service.link_provider(
            ...     "user-123",
            ...     "facebook",
            ...     "fb-456",
            ...     "user@example.com"
            ... )
            >>> print(success)
            True
        """
        # Check if provider is already linked to a different user
        existing_profile = self.get_profile_by_provider(provider, provider_user_id)
        
        if existing_profile and existing_profile["user_id"] != user_id:
            raise Exception(
                f"{AuthErrorCode.AUTH_ACCOUNT_ALREADY_LINKED}: "
                f"This {provider} account is already linked to another user"
            )
        
        # Get current profile
        profile = self.get_profile(user_id)
        
        if not profile:
            raise Exception(
                f"{AuthErrorCode.AUTH_USER_NOT_FOUND}: "
                f"User profile not found: {user_id}"
            )
        
        # Check if provider is already linked to this user
        linked_providers = profile.get("linked_providers", [])
        for linked in linked_providers:
            if linked["provider"] == provider:
                # Already linked, nothing to do
                return True
        
        # Create new linked provider entry
        now = datetime.utcnow()
        new_provider = {
            "provider": provider,
            "provider_user_id": provider_user_id,
            "linked_at": now.isoformat(),
            "email": email
        }
        
        # Update profile with new linked provider
        try:
            self.table.update_item(
                Key={"user_id": user_id},
                UpdateExpression=(
                    "SET linked_providers = list_append(linked_providers, :new_provider), "
                    "updated_at = :updated_at"
                ),
                ExpressionAttributeValues={
                    ":new_provider": [new_provider],
                    ":updated_at": now.isoformat()
                }
            )
            
            return True
            
        except ClientError as e:
            raise Exception(
                f"Failed to link provider: {e.response['Error']['Message']}"
            )
        except Exception as e:
            raise Exception(f"Failed to link provider: {str(e)}")
    
    def unlink_provider(self, user_id: str, provider: str) -> bool:
        """
        Unlinks social provider from profile with last provider protection.
        
        Removes a social provider from the user's linked providers list.
        Prevents unlinking if it's the last remaining provider (users must
        have at least one linked provider).
        
        Args:
            user_id: User identifier
            provider: Social provider name to unlink
            
        Returns:
            bool: True if provider was successfully unlinked
            
        Raises:
            Exception: If attempting to unlink last provider
                      (AUTH_CANNOT_UNLINK_LAST_PROVIDER)
            
        Requirements: 9.5, 9.6
        
        Example:
            >>> profile_service = ProfileService()
            >>> success = profile_service.unlink_provider("user-123", "facebook")
            >>> print(success)
            True
        """
        # Get current profile
        profile = self.get_profile(user_id)
        
        if not profile:
            raise Exception(
                f"{AuthErrorCode.AUTH_USER_NOT_FOUND}: "
                f"User profile not found: {user_id}"
            )
        
        # Check number of linked providers
        linked_providers = profile.get("linked_providers", [])
        
        if len(linked_providers) <= 1:
            raise Exception(
                f"{AuthErrorCode.AUTH_CANNOT_UNLINK_LAST_PROVIDER}: "
                "Cannot unlink the last remaining provider. "
                "Users must have at least one linked provider."
            )
        
        # Find provider to unlink
        provider_index = None
        for i, linked in enumerate(linked_providers):
            if linked["provider"] == provider:
                provider_index = i
                break
        
        if provider_index is None:
            # Provider not linked, nothing to do
            return True
        
        # Remove provider from list
        updated_providers = [
            p for p in linked_providers if p["provider"] != provider
        ]
        
        # Update profile
        try:
            now = datetime.utcnow()
            
            self.table.update_item(
                Key={"user_id": user_id},
                UpdateExpression=(
                    "SET linked_providers = :updated_providers, "
                    "updated_at = :updated_at"
                ),
                ExpressionAttributeValues={
                    ":updated_providers": updated_providers,
                    ":updated_at": now.isoformat()
                }
            )
            
            return True
            
        except ClientError as e:
            raise Exception(
                f"Failed to unlink provider: {e.response['Error']['Message']}"
            )
        except Exception as e:
            raise Exception(f"Failed to unlink provider: {str(e)}")
    
    def update_profile_from_provider(
        self,
        user_id: str,
        provider_data: Dict
    ) -> Dict:
        """
        Updates profile with latest data from social provider.
        
        Syncs the user's profile information (name, email, picture) with
        the latest data from the social provider. This is called on each
        sign-in to keep profile data up-to-date.
        
        Args:
            user_id: User identifier
            provider_data: Latest user information from provider containing:
                - email (str): User email
                - email_verified (bool): Email verification status
                - name (str): User's full name
                - picture (str): Profile picture URL (optional)
            
        Returns:
            dict: Updated user profile
            
        Raises:
            Exception: If profile update fails
            
        Requirements: 11.5
        
        Example:
            >>> profile_service = ProfileService()
            >>> provider_data = {
            ...     "email": "newemail@example.com",
            ...     "email_verified": True,
            ...     "name": "John Smith",
            ...     "picture": "https://example.com/newphoto.jpg"
            ... }
            >>> profile = profile_service.update_profile_from_provider("user-123", provider_data)
            >>> print(profile["name"])
            John Smith
        """
        # Get current profile
        profile = self.get_profile(user_id)
        
        if not profile:
            raise Exception(
                f"{AuthErrorCode.AUTH_USER_NOT_FOUND}: "
                f"User profile not found: {user_id}"
            )
        
        # Extract updated fields
        email = provider_data.get("email", profile.get("email"))
        email_verified = provider_data.get("email_verified", profile.get("email_verified"))
        name = provider_data.get("name", profile.get("name"))
        picture = provider_data.get("picture", profile.get("profile_picture_url"))
        
        # Update profile
        try:
            now = datetime.utcnow()
            
            response = self.table.update_item(
                Key={"user_id": user_id},
                UpdateExpression=(
                    "SET email = :email, "
                    "email_verified = :email_verified, "
                    "#name = :name, "
                    "profile_picture_url = :picture, "
                    "updated_at = :updated_at, "
                    "last_sign_in = :last_sign_in"
                ),
                ExpressionAttributeNames={
                    "#name": "name"  # 'name' is a reserved word in DynamoDB
                },
                ExpressionAttributeValues={
                    ":email": email,
                    ":email_verified": email_verified,
                    ":name": name,
                    ":picture": picture,
                    ":updated_at": now.isoformat(),
                    ":last_sign_in": now.isoformat()
                },
                ReturnValues="ALL_NEW"
            )
            
            return response.get("Attributes", {})
            
        except ClientError as e:
            raise Exception(
                f"Failed to update profile: {e.response['Error']['Message']}"
            )
        except Exception as e:
            raise Exception(f"Failed to update profile: {str(e)}")
    
    def update_last_sign_in(self, user_id: str, provider: str) -> None:
        """
        Updates last sign-in timestamp and provider.
        
        Called on each successful authentication to track user activity.
        
        Args:
            user_id: User identifier
            provider: Provider used for sign-in
        """
        try:
            now = datetime.utcnow()
            
            self.table.update_item(
                Key={"user_id": user_id},
                UpdateExpression=(
                    "SET last_sign_in = :last_sign_in, "
                    "last_sign_in_provider = :provider"
                ),
                ExpressionAttributeValues={
                    ":last_sign_in": now.isoformat(),
                    ":provider": provider
                }
            )
            
        except Exception:
            # Don't fail authentication if last sign-in update fails
            pass
