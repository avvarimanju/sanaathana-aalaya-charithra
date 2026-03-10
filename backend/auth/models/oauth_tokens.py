"""
OAuth token data models for social provider authentication.

This module defines the data structures for OAuth tokens and user claims
received from social media providers.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class OAuthTokens:
    """OAuth tokens received from social provider."""
    
    access_token: str  # Access token from social provider
    id_token: str  # ID token (JWT) from social provider
    refresh_token: Optional[str]  # Optional refresh token from provider
    expires_in: int  # Token expiration time in seconds
    scope: str  # OAuth scopes granted
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "access_token": self.access_token,
            "id_token": self.id_token,
            "refresh_token": self.refresh_token,
            "expires_in": self.expires_in,
            "scope": self.scope
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "OAuthTokens":
        """Create OAuthTokens from dictionary."""
        return cls(
            access_token=data["access_token"],
            id_token=data["id_token"],
            refresh_token=data.get("refresh_token"),
            expires_in=data["expires_in"],
            scope=data.get("scope", "")
        )


@dataclass
class UserClaims:
    """Validated user claims extracted from ID token."""
    
    sub: str  # Subject - user ID from social provider
    email: str  # User's email address
    email_verified: bool  # Email verification status from provider
    name: str  # User's full name
    picture: Optional[str]  # Profile picture URL
    provider: str  # Social provider name (google, facebook, etc.)
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "sub": self.sub,
            "email": self.email,
            "email_verified": self.email_verified,
            "name": self.name,
            "picture": self.picture,
            "provider": self.provider
        }
    
    @classmethod
    def from_dict(cls, data: dict, provider: str) -> "UserClaims":
        """Create UserClaims from dictionary with provider name."""
        return cls(
            sub=data["sub"],
            email=data.get("email", ""),
            email_verified=data.get("email_verified", False),
            name=data.get("name", ""),
            picture=data.get("picture"),
            provider=provider
        )
