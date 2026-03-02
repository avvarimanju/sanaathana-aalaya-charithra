"""
Provider Factory Module

This module provides a factory function to instantiate OAuth provider implementations
based on provider name. It loads OAuth credentials from AWS Secrets Manager and
creates the appropriate provider instance.

Requirements: 13.2
"""

import json
import boto3
from typing import Dict, Optional
from botocore.exceptions import ClientError

from ..providers.base_provider import BaseOAuthProvider
from ..providers.google_provider import GoogleOAuthProvider
from ..providers.facebook_provider import FacebookOAuthProvider
from ..providers.instagram_provider import InstagramOAuthProvider
from ..providers.apple_provider import AppleOAuthProvider
from ..providers.twitter_provider import TwitterOAuthProvider
from ..providers.github_provider import GitHubOAuthProvider
from ..providers.microsoft_provider import MicrosoftOAuthProvider


# Provider class mapping
PROVIDER_CLASSES = {
    "google": GoogleOAuthProvider,
    "facebook": FacebookOAuthProvider,
    "instagram": InstagramOAuthProvider,
    "apple": AppleOAuthProvider,
    "twitter": TwitterOAuthProvider,
    "github": GitHubOAuthProvider,
    "microsoft": MicrosoftOAuthProvider
}

# Credentials cache to avoid repeated Secrets Manager calls
_credentials_cache: Dict[str, Dict] = {}


def get_provider(provider_name: str, redirect_uri: str) -> BaseOAuthProvider:
    """
    Factory function to create OAuth provider instances.
    
    Loads OAuth credentials from AWS Secrets Manager and instantiates
    the appropriate provider class based on the provider name.
    
    Args:
        provider_name: Name of the social provider (google, facebook, etc.)
        redirect_uri: OAuth callback URL
        
    Returns:
        BaseOAuthProvider: Instantiated provider implementation
        
    Raises:
        ValueError: If provider name is not supported
        Exception: If credentials cannot be loaded from Secrets Manager
        
    Requirements: 13.2
    
    Example:
        >>> provider = get_provider("google", "https://app.example.com/callback")
        >>> auth_url = provider.get_authorization_url(state, redirect_uri)
    """
    # Validate provider name
    if provider_name not in PROVIDER_CLASSES:
        supported = ", ".join(PROVIDER_CLASSES.keys())
        raise ValueError(
            f"Unsupported provider: {provider_name}. "
            f"Supported providers: {supported}"
        )
    
    # Load credentials from Secrets Manager
    credentials = _load_credentials(provider_name)
    
    # Instantiate provider class
    provider_class = PROVIDER_CLASSES[provider_name]
    provider = provider_class(
        client_id=credentials["client_id"],
        client_secret=credentials["client_secret"],
        redirect_uri=redirect_uri
    )
    
    return provider


def _load_credentials(provider_name: str) -> Dict[str, str]:
    """
    Load OAuth credentials from AWS Secrets Manager with caching.
    
    Credentials are cached in memory to reduce Secrets Manager API calls.
    The cache is per Lambda execution environment.
    
    Args:
        provider_name: Name of the social provider
        
    Returns:
        Dict: OAuth credentials containing client_id and client_secret
        
    Raises:
        Exception: If credentials cannot be loaded
        
    Requirements: 13.2
    """
    # Check cache first
    if provider_name in _credentials_cache:
        return _credentials_cache[provider_name]
    
    # Load from Secrets Manager
    secret_name = f"social-auth/{provider_name}/credentials"
    
    try:
        # Create Secrets Manager client
        session = boto3.session.Session()
        client = session.client(service_name="secretsmanager")
        
        # Retrieve secret
        response = client.get_secret_value(SecretId=secret_name)
        
        # Parse secret value
        if "SecretString" in response:
            secret_data = json.loads(response["SecretString"])
        else:
            raise Exception(f"Secret {secret_name} is not a string secret")
        
        # Validate required fields
        if "client_id" not in secret_data or "client_secret" not in secret_data:
            raise Exception(
                f"Secret {secret_name} missing required fields: "
                "client_id and client_secret"
            )
        
        # Cache credentials
        credentials = {
            "client_id": secret_data["client_id"],
            "client_secret": secret_data["client_secret"]
        }
        _credentials_cache[provider_name] = credentials
        
        return credentials
        
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        
        if error_code == "ResourceNotFoundException":
            raise Exception(
                f"OAuth credentials not found for provider: {provider_name}. "
                f"Please create secret: {secret_name}"
            )
        elif error_code == "AccessDeniedException":
            raise Exception(
                f"Access denied to secret: {secret_name}. "
                "Check Lambda execution role permissions."
            )
        else:
            raise Exception(
                f"Failed to load credentials for {provider_name}: {str(e)}"
            )
    except json.JSONDecodeError as e:
        raise Exception(
            f"Invalid JSON in secret {secret_name}: {str(e)}"
        )
    except Exception as e:
        raise Exception(
            f"Unexpected error loading credentials for {provider_name}: {str(e)}"
        )


def clear_credentials_cache():
    """
    Clear the credentials cache.
    
    Useful for testing or forcing a refresh of credentials from Secrets Manager.
    """
    global _credentials_cache
    _credentials_cache = {}


def get_supported_providers() -> list:
    """
    Get list of supported provider names.
    
    Returns:
        list: List of supported provider names
    """
    return list(PROVIDER_CLASSES.keys())


def is_provider_supported(provider_name: str) -> bool:
    """
    Check if a provider is supported.
    
    Args:
        provider_name: Name of the provider to check
        
    Returns:
        bool: True if provider is supported, False otherwise
    """
    return provider_name in PROVIDER_CLASSES
