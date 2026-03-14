"""
Configuration management for authentication service.

This module manages environment variables, constants, and configuration
for the social media authentication system.
"""

import os
import sys
from typing import List

# Add config directory to path for global config import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from config.global_config import global_config


class AuthConfig:
    """Authentication service configuration."""
    
    # AWS Configuration - use global config
    AWS_REGION = global_config.aws_region  # Now uses global config instead of hardcoded fallback
    USER_POOL_ID = os.environ.get("USER_POOL_ID", "")
    USER_POOL_CLIENT_ID = os.environ.get("USER_POOL_CLIENT_ID", "")
    
    # DynamoDB Tables
    USER_PROFILES_TABLE = os.environ.get("USER_PROFILES_TABLE", "UserProfiles")
    RATE_LIMITS_TABLE = os.environ.get("RATE_LIMITS_TABLE", "AuthRateLimits")
    
    # Token Configuration
    ACCESS_TOKEN_EXPIRATION = 3600  # 1 hour in seconds
    REFRESH_TOKEN_EXPIRATION = 2592000  # 30 days in seconds
    ID_TOKEN_EXPIRATION = 3600  # 1 hour in seconds
    
    # Rate Limiting Configuration
    RATE_LIMIT_MAX_ATTEMPTS = 5  # Maximum authentication attempts
    RATE_LIMIT_WINDOW_SECONDS = 900  # 15 minutes in seconds
    
    # OAuth Configuration
    OAUTH_STATE_LENGTH = 32  # Length of CSRF state parameter in bytes
    OAUTH_STATE_TTL = 600  # State parameter TTL in seconds (10 minutes)
    
    # Security Configuration
    ENCRYPTION_ALGORITHM = "AES-256"
    JWT_ALGORITHM = "RS256"
    
    # Supported Social Providers
    SUPPORTED_PROVIDERS = [
        "google",
        "facebook",
        "instagram",
        "apple",
        "twitter",
        "github",
        "microsoft"
    ]
    
    # Secrets Manager Configuration
    SECRETS_PREFIX = "social-auth"
    
    # API Configuration
    API_TIMEOUT_SECONDS = 30
    PROVIDER_API_TIMEOUT_SECONDS = 5
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")
    
    # Redirect URI Whitelist - use global config for domain
    ALLOWED_REDIRECT_URIS = os.environ.get(
        "ALLOWED_REDIRECT_URIS",
        f"https://app.{global_config.domain_root}/callback"
    ).split(",")
    
    # CORS Configuration - use global config for domain
    CORS_ALLOWED_ORIGINS = os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        f"https://app.{global_config.domain_root}"
    ).split(",")
    
    @classmethod
    def is_valid_provider(cls, provider: str) -> bool:
        """Check if a provider name is supported."""
        return provider.lower() in cls.SUPPORTED_PROVIDERS
    
    @classmethod
    def get_secret_name(cls, provider: str) -> str:
        """Get the Secrets Manager secret name for a provider."""
        return f"{cls.SECRETS_PREFIX}/{provider}/credentials"
    
    @classmethod
    def is_redirect_uri_allowed(cls, redirect_uri: str) -> bool:
        """Check if a redirect URI is in the whitelist."""
        return redirect_uri in cls.ALLOWED_REDIRECT_URIS
    
    @classmethod
    def validate_config(cls) -> List[str]:
        """
        Validate required configuration is present.
        Returns list of missing configuration items.
        """
        missing = []
        
        if not cls.USER_POOL_ID:
            missing.append("USER_POOL_ID")
        
        if not cls.USER_POOL_CLIENT_ID:
            missing.append("USER_POOL_CLIENT_ID")
        
        return missing


# Error Codes
class AuthErrorCode:
    """Standardized authentication error codes."""
    
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN"
    AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED"
    AUTH_ACCOUNT_ALREADY_LINKED = "AUTH_ACCOUNT_ALREADY_LINKED"
    AUTH_CANNOT_UNLINK_LAST_PROVIDER = "AUTH_CANNOT_UNLINK_LAST_PROVIDER"
    AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED"
    AUTH_INVALID_REDIRECT_URI = "AUTH_INVALID_REDIRECT_URI"
    AUTH_PROVIDER_ERROR = "AUTH_PROVIDER_ERROR"
    AUTH_INVALID_STATE = "AUTH_INVALID_STATE"
    AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND"
    AUTH_INTERNAL_ERROR = "AUTH_INTERNAL_ERROR"
    AUTH_INVALID_PROVIDER = "AUTH_INVALID_PROVIDER"
    AUTH_MISSING_EMAIL = "AUTH_MISSING_EMAIL"


# Provider-Specific Configuration
class ProviderConfig:
    """Provider-specific OAuth configuration."""
    
    # OAuth Scopes by Provider
    SCOPES = {
        "google": ["openid", "email", "profile"],
        "facebook": ["email", "public_profile"],
        "instagram": ["user_profile", "user_media"],
        "apple": ["email", "name"],
        "twitter": ["users.read", "tweet.read"],
        "github": ["user:email", "read:user"],
        "microsoft": ["openid", "email", "profile"]
    }
    
    # OAuth Endpoints by Provider
    AUTHORIZATION_ENDPOINTS = {
        "google": "https://accounts.google.com/o/oauth2/v2/auth",
        "facebook": "https://www.facebook.com/v18.0/dialog/oauth",
        "instagram": "https://api.instagram.com/oauth/authorize",
        "apple": "https://appleid.apple.com/auth/authorize",
        "twitter": "https://twitter.com/i/oauth2/authorize",
        "github": "https://github.com/login/oauth/authorize",
        "microsoft": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    }
    
    TOKEN_ENDPOINTS = {
        "google": "https://oauth2.googleapis.com/token",
        "facebook": "https://graph.facebook.com/v18.0/oauth/access_token",
        "instagram": "https://api.instagram.com/oauth/access_token",
        "apple": "https://appleid.apple.com/auth/token",
        "twitter": "https://api.twitter.com/2/oauth2/token",
        "github": "https://github.com/login/oauth/access_token",
        "microsoft": "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    }
    
    USERINFO_ENDPOINTS = {
        "google": "https://www.googleapis.com/oauth2/v2/userinfo",
        "facebook": "https://graph.facebook.com/me?fields=id,name,email,picture",
        "instagram": "https://graph.instagram.com/me?fields=id,username",
        "apple": None,  # Apple provides user info in ID token
        "twitter": "https://api.twitter.com/2/users/me",
        "github": "https://api.github.com/user",
        "microsoft": "https://graph.microsoft.com/v1.0/me"
    }
    
    JWKS_ENDPOINTS = {
        "google": "https://www.googleapis.com/oauth2/v3/certs",
        "facebook": None,  # Facebook uses different validation
        "instagram": None,  # Instagram uses different validation
        "apple": "https://appleid.apple.com/auth/keys",
        "twitter": None,  # Twitter uses different validation
        "github": None,  # GitHub uses different validation
        "microsoft": "https://login.microsoftonline.com/common/discovery/v2.0/keys"
    }
    
    @classmethod
    def get_scopes(cls, provider: str) -> List[str]:
        """Get OAuth scopes for a provider."""
        return cls.SCOPES.get(provider, [])
    
    @classmethod
    def get_authorization_endpoint(cls, provider: str) -> str:
        """Get authorization endpoint for a provider."""
        return cls.AUTHORIZATION_ENDPOINTS.get(provider, "")
    
    @classmethod
    def get_token_endpoint(cls, provider: str) -> str:
        """Get token endpoint for a provider."""
        return cls.TOKEN_ENDPOINTS.get(provider, "")
    
    @classmethod
    def get_userinfo_endpoint(cls, provider: str) -> str:
        """Get user info endpoint for a provider."""
        return cls.USERINFO_ENDPOINTS.get(provider, "")
    
    @classmethod
    def get_jwks_endpoint(cls, provider: str) -> str:
        """Get JWKS endpoint for a provider."""
        return cls.JWKS_ENDPOINTS.get(provider, "")
