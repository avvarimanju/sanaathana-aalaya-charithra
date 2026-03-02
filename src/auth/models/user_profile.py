"""
User profile data models for social media authentication.

This module defines the data structures for user profiles and linked social providers.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class LinkedProvider:
    """Represents a linked social media provider account."""
    
    provider: str  # Provider name (google, facebook, instagram, apple, twitter, github, microsoft)
    provider_user_id: str  # User ID from the social provider
    linked_at: datetime  # Timestamp when the provider was linked
    email: str  # Email address from this provider
    
    def to_dict(self) -> dict:
        """Convert to dictionary for DynamoDB storage."""
        return {
            "provider": self.provider,
            "provider_user_id": self.provider_user_id,
            "linked_at": self.linked_at.isoformat(),
            "email": self.email
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "LinkedProvider":
        """Create LinkedProvider from dictionary."""
        return cls(
            provider=data["provider"],
            provider_user_id=data["provider_user_id"],
            linked_at=datetime.fromisoformat(data["linked_at"]),
            email=data["email"]
        )


@dataclass
class UserProfile:
    """User profile data model for authenticated users."""
    
    user_id: str  # UUID v4 unique identifier
    email: str  # Primary email address
    email_verified: bool  # Email verification status
    name: str  # Full name
    profile_picture_url: Optional[str]  # Profile image URL
    linked_providers: List[LinkedProvider]  # List of linked social accounts
    created_at: datetime  # Profile creation timestamp
    updated_at: datetime  # Last update timestamp
    last_sign_in: datetime  # Last sign-in timestamp
    last_sign_in_provider: str  # Last used provider name
    
    def to_dict(self) -> dict:
        """Convert to dictionary for DynamoDB storage."""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "email_verified": self.email_verified,
            "name": self.name,
            "profile_picture_url": self.profile_picture_url,
            "linked_providers": [provider.to_dict() for provider in self.linked_providers],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_sign_in": self.last_sign_in.isoformat(),
            "last_sign_in_provider": self.last_sign_in_provider
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "UserProfile":
        """Create UserProfile from dictionary."""
        return cls(
            user_id=data["user_id"],
            email=data["email"],
            email_verified=data["email_verified"],
            name=data["name"],
            profile_picture_url=data.get("profile_picture_url"),
            linked_providers=[
                LinkedProvider.from_dict(provider) 
                for provider in data.get("linked_providers", [])
            ],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            last_sign_in=datetime.fromisoformat(data["last_sign_in"]),
            last_sign_in_provider=data["last_sign_in_provider"]
        )
    
    def get_provider(self, provider_name: str) -> Optional[LinkedProvider]:
        """Get a specific linked provider by name."""
        for provider in self.linked_providers:
            if provider.provider == provider_name:
                return provider
        return None
    
    def has_provider(self, provider_name: str) -> bool:
        """Check if a provider is linked to this profile."""
        return self.get_provider(provider_name) is not None
    
    def add_provider(self, provider: LinkedProvider) -> None:
        """Add a new linked provider to the profile."""
        if not self.has_provider(provider.provider):
            self.linked_providers.append(provider)
            self.updated_at = datetime.utcnow()
    
    def remove_provider(self, provider_name: str) -> bool:
        """Remove a linked provider from the profile. Returns True if removed."""
        for i, provider in enumerate(self.linked_providers):
            if provider.provider == provider_name:
                self.linked_providers.pop(i)
                self.updated_at = datetime.utcnow()
                return True
        return False
