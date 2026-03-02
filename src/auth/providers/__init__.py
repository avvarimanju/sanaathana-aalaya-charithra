"""
Social provider OAuth implementations.

This module contains OAuth provider implementations for:
- Google
- Facebook
- Instagram
- Apple
- Twitter/X
- GitHub
- Microsoft

All providers extend the BaseOAuthProvider abstract class.
"""

from .base_provider import BaseOAuthProvider
from .google_provider import GoogleOAuthProvider
from .facebook_provider import FacebookOAuthProvider
from .instagram_provider import InstagramOAuthProvider
from .apple_provider import AppleOAuthProvider
from .twitter_provider import TwitterOAuthProvider
from .github_provider import GitHubOAuthProvider
from .microsoft_provider import MicrosoftOAuthProvider

__all__ = [
    'BaseOAuthProvider',
    'GoogleOAuthProvider',
    'FacebookOAuthProvider',
    'InstagramOAuthProvider',
    'AppleOAuthProvider',
    'TwitterOAuthProvider',
    'GitHubOAuthProvider',
    'MicrosoftOAuthProvider',
]
