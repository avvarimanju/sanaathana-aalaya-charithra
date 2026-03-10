"""
Data models for authentication service.

This module contains dataclass models for:
- User profiles and linked providers
- Session tokens
- OAuth tokens and user claims
"""

from .user_profile import UserProfile, LinkedProvider
from .session import SessionTokens
from .oauth_tokens import OAuthTokens, UserClaims

__all__ = [
    "UserProfile",
    "LinkedProvider",
    "SessionTokens",
    "OAuthTokens",
    "UserClaims"
]
