#!/usr/bin/env python3
"""
Setup OAuth Credentials in AWS Secrets Manager

This script helps configure OAuth credentials for all social providers
in AWS Secrets Manager. It can be run interactively or with a JSON config file.

Requirements: 13.2

Usage:
    # Interactive mode
    python scripts/setup-oauth-secrets.py

    # From config file
    python scripts/setup-oauth-secrets.py --config oauth-credentials.json

    # Update specific provider
    python scripts/setup-oauth-secrets.py --provider google
"""

import argparse
import json
import sys
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError


# Provider configuration templates
PROVIDER_TEMPLATES = {
    "google": {
        "client_id": "",
        "client_secret": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["openid", "email", "profile"]
    },
    "facebook": {
        "client_id": "",
        "client_secret": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["email", "public_profile"]
    },
    "instagram": {
        "client_id": "",
        "client_secret": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["user_profile", "user_media"]
    },
    "apple": {
        "client_id": "",
        "client_secret": "",
        "team_id": "",
        "key_id": "",
        "private_key": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["email", "name"]
    },
    "twitter": {
        "client_id": "",
        "client_secret": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["users.read", "tweet.read"]
    },
    "github": {
        "client_id": "",
        "client_secret": "",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["user:email", "read:user"]
    },
    "microsoft": {
        "client_id": "",
        "client_secret": "",
        "tenant_id": "common",
        "redirect_uris": ["https://app.example.com/callback"],
        "scopes": ["openid", "email", "profile"]
    }
}


# Provider setup instructions
PROVIDER_INSTRUCTIONS = {
    "google": """
Google OAuth Setup:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URIs
4. Copy the Client ID and Client Secret
""",
    "facebook": """
Facebook OAuth Setup:
1. Go to https://developers.facebook.com/apps
2. Create a new app or select existing app
3. Add Facebook Login product
4. Configure OAuth redirect URIs in Settings > Basic
5. Copy the App ID (client_id) and App Secret (client_secret)
""",
    "instagram": """
Instagram OAuth Setup:
1. Go to https://developers.facebook.com/apps
2. Create a new app or select existing app
3. Add Instagram Basic Display product
4. Create an Instagram App ID
5. Configure OAuth redirect URIs
6. Copy the Instagram App ID and App Secret
""",
    "apple": """
Apple Sign In Setup:
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Create a new Services ID
3. Enable Sign In with Apple
4. Configure return URLs
5. Create a private key for Sign In with Apple
6. Copy the Services ID, Team ID, Key ID, and private key
""",
    "twitter": """
Twitter/X OAuth Setup:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or select existing app
3. Enable OAuth 2.0
4. Add callback URLs
5. Copy the Client ID and Client Secret
""",
    "github": """
GitHub OAuth Setup:
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Add authorization callback URL
4. Copy the Client ID and Client Secret
""",
    "microsoft": """
Microsoft OAuth Setup:
1. Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Register a new application
3. Add redirect URIs in Authentication
4. Create a client secret in Certificates & secrets
5. Copy the Application (client) ID and client secret value
"""
}


def get_secret_name(provider: str) -> str:
    """Get the Secrets Manager secret name for a provider."""
    return f"social-auth/{provider}/credentials"


def create_or_update_secret(
    secrets_client: Any,
    secret_name: str,
    secret_value: Dict[str, Any]
) -> None:
    """
    Create or update a secret in Secrets Manager.
    
    Args:
        secrets_client: Boto3 Secrets Manager client
        secret_name: Name of the secret
        secret_value: Secret value as dictionary
    """
    secret_string = json.dumps(secret_value, indent=2)
    
    try:
        # Try to update existing secret
        secrets_client.update_secret(
            SecretId=secret_name,
            SecretString=secret_string
        )
        print(f"✓ Updated secret: {secret_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            # Create new secret
            secrets_client.create_secret(
                Name=secret_name,
                SecretString=secret_string,
                Description=f"OAuth credentials for {secret_name.split('/')[1]} authentication"
            )
            print(f"✓ Created secret: {secret_name}")
        else:
            raise


def get_provider_credentials_interactive(provider: str) -> Dict[str, Any]:
    """
    Get provider credentials interactively from user input.
    
    Args:
        provider: Provider name
        
    Returns:
        dict: Provider credentials
    """
    print(f"\n{'='*60}")
    print(f"Configuring {provider.upper()} OAuth Credentials")
    print(f"{'='*60}")
    print(PROVIDER_INSTRUCTIONS[provider])
    
    template = PROVIDER_TEMPLATES[provider].copy()
    credentials = {}
    
    for key, default_value in template.items():
        if isinstance(default_value, list):
            # Handle list values (redirect_uris, scopes)
            value = input(f"{key} (comma-separated) [{','.join(default_value)}]: ").strip()
            credentials[key] = value.split(',') if value else default_value
        else:
            # Handle string values
            value = input(f"{key} [{default_value}]: ").strip()
            credentials[key] = value if value else default_value
    
    return credentials


def setup_provider(
    secrets_client: Any,
    provider: str,
    credentials: Dict[str, Any] = None
) -> None:
    """
    Setup OAuth credentials for a provider.
    
    Args:
        secrets_client: Boto3 Secrets Manager client
        provider: Provider name
        credentials: Optional credentials dict (if None, prompts interactively)
    """
    if credentials is None:
        credentials = get_provider_credentials_interactive(provider)
    
    secret_name = get_secret_name(provider)
    create_or_update_secret(secrets_client, secret_name, credentials)


def load_config_file(config_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Load OAuth credentials from JSON config file.
    
    Args:
        config_path: Path to JSON config file
        
    Returns:
        dict: Provider credentials by provider name
    """
    with open(config_path, 'r') as f:
        return json.load(f)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Setup OAuth credentials in AWS Secrets Manager"
    )
    parser.add_argument(
        "--config",
        help="Path to JSON config file with OAuth credentials"
    )
    parser.add_argument(
        "--provider",
        choices=list(PROVIDER_TEMPLATES.keys()),
        help="Setup specific provider only"
    )
    parser.add_argument(
        "--region",
        default="us-east-1",
        help="AWS region (default: us-east-1)"
    )
    
    args = parser.parse_args()
    
    # Initialize Secrets Manager client
    secrets_client = boto3.client('secretsmanager', region_name=args.region)
    
    print(f"\nSetting up OAuth credentials in AWS Secrets Manager")
    print(f"Region: {args.region}\n")
    
    try:
        if args.config:
            # Load from config file
            print(f"Loading credentials from: {args.config}")
            config = load_config_file(args.config)
            
            providers = [args.provider] if args.provider else config.keys()
            
            for provider in providers:
                if provider not in config:
                    print(f"⚠ Provider '{provider}' not found in config file")
                    continue
                
                setup_provider(secrets_client, provider, config[provider])
        
        else:
            # Interactive mode
            providers = [args.provider] if args.provider else PROVIDER_TEMPLATES.keys()
            
            for provider in providers:
                setup_provider(secrets_client, provider)
        
        print(f"\n{'='*60}")
        print("✓ OAuth credentials setup complete!")
        print(f"{'='*60}\n")
        
        print("Next steps:")
        print("1. Verify credentials in AWS Secrets Manager console")
        print("2. Update redirect URIs to match your application domain")
        print("3. Deploy the authentication stack with CDK")
        print("4. Test authentication flows for each provider\n")
    
    except Exception as e:
        print(f"\n✗ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
