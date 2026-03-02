"""
Session token data models for authentication.

This module defines the data structures for session tokens returned to clients.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class SessionTokens:
    """Session token data model containing access, refresh, and ID tokens."""
    
    access_token: str  # JWT access token for API authentication
    refresh_token: str  # Long-lived token for obtaining new access tokens
    id_token: str  # JWT ID token containing user identity information
    expires_in: int  # Access token expiration time in seconds
    token_type: str = "Bearer"  # Token type for Authorization header
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "id_token": self.id_token,
            "expires_in": self.expires_in,
            "token_type": self.token_type
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "SessionTokens":
        """Create SessionTokens from dictionary."""
        return cls(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            id_token=data["id_token"],
            expires_in=data["expires_in"],
            token_type=data.get("token_type", "Bearer")
        )
