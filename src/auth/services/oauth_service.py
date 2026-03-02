"""
OAuth Service Module

This module orchestrates OAuth 2.0 authentication flows for all social providers.
It handles OAuth flow initiation, callback processing, token exchange, and token validation.

Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2
"""

import secrets
import time
from typing import Dict, Optional
import boto3
from botocore.exceptions import ClientError

from .provider_factory import get_provider
from ..providers.base_provider import BaseOAuthProvider


class OAuthService:
    """
    Orchestrates OAuth 2.0 authentication flows.
    
    This service manages the complete OAuth flow including:
    - Generating authorization URLs with CSRF protection
    - Handling OAuth callbacks and exchanging codes for tokens
    - Validating ID tokens from social providers
    - Managing OAuth state parameters in DynamoDB
    """
    
    def __init__(self, state_table_name: str = "OAuthStates"):
        """
        Initialize the OAuth service.
        
        Args:
            state_table_name: DynamoDB table name for storing OAuth state parameters
        """
        self.state_table_name = state_table_name
        self.dynamodb = boto3.resource("dynamodb")
        self.state_table = self.dynamodb.Table(state_table_name)
    
    def initiate_auth(self, provider: str, redirect_uri: str) -> Dict:
        """
        Initiates OAuth flow for specified provider.
        
        Generates a cryptographically secure state parameter for CSRF protection,
        stores it in DynamoDB with a short TTL, and returns the authorization URL
        where the user should be redirected.
        
        Args:
            provider: Social provider name (google, facebook, instagram, apple, 
                     twitter, github, microsoft)
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            dict: Authorization details containing:
                - authorization_url (str): URL to redirect user for authentication
                - state (str): CSRF protection token (store in session)
                
        Raises:
            ValueError: If provider is not supported
            Exception: If provider initialization fails
            
        Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
        
        Example:
            >>> oauth_service = OAuthService()
            >>> result = oauth_service.initiate_auth("google", "https://app.example.com/callback")
            >>> print(result["authorization_url"])
            https://accounts.google.com/o/oauth2/v2/auth?client_id=...
        """
        # Generate cryptographically secure state parameter (32 bytes = 43 chars base64)
        state = secrets.token_urlsafe(32)
        
        # Get provider instance
        provider_instance = get_provider(provider, redirect_uri)
        
        # Generate authorization URL
        authorization_url = provider_instance.get_authorization_url(state, redirect_uri)
        
        # Store state in DynamoDB with 10-minute TTL for CSRF validation
        self._store_state(state, provider, redirect_uri)
        
        return {
            "authorization_url": authorization_url,
            "state": state
        }
    
    def handle_callback(self, provider: str, code: str, state: str) -> Dict:
        """
        Handles OAuth callback and exchanges code for tokens.
        
        Validates the state parameter for CSRF protection, exchanges the authorization
        code for access and ID tokens, validates the ID token signature, and extracts
        user claims.
        
        Args:
            provider: Social provider name
            code: Authorization code from provider callback
            state: State parameter from callback (for CSRF validation)
            
        Returns:
            dict: Authentication result containing:
                - user_claims (dict): Validated user information from ID token
                    - sub (str): User ID from provider
                    - email (str): User email
                    - email_verified (bool): Email verification status
                    - name (str): User's full name
                    - picture (str): Profile picture URL
                - tokens (dict): OAuth tokens
                    - access_token (str): Access token for API calls
                    - id_token (str): JWT identity token
                    - refresh_token (str): Refresh token (if provided)
                    - expires_in (int): Token expiration in seconds
                - provider (str): Provider name
                
        Raises:
            ValueError: If state validation fails (CSRF attack)
            Exception: If token exchange or validation fails
            
        Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2
        
        Example:
            >>> oauth_service = OAuthService()
            >>> result = oauth_service.handle_callback("google", "auth_code_123", "state_abc")
            >>> print(result["user_claims"]["email"])
            user@example.com
        """
        # Validate state parameter for CSRF protection
        state_data = self._validate_and_retrieve_state(state)
        
        if state_data["provider"] != provider:
            raise ValueError(
                f"State provider mismatch: expected {state_data['provider']}, "
                f"got {provider}"
            )
        
        redirect_uri = state_data["redirect_uri"]
        
        # Get provider instance
        provider_instance = get_provider(provider, redirect_uri)
        
        # Exchange authorization code for tokens
        tokens = provider_instance.exchange_code_for_tokens(code, redirect_uri)
        
        # Validate ID token and extract user claims
        user_claims = provider_instance.validate_id_token(tokens["id_token"])
        
        # Add provider name to user claims
        user_claims["provider"] = provider
        
        # Clean up state from DynamoDB
        self._delete_state(state)
        
        return {
            "user_claims": user_claims,
            "tokens": tokens,
            "provider": provider
        }
    
    def validate_token(self, provider: str, id_token: str) -> Dict:
        """
        Validates identity token signature and extracts claims.
        
        This method can be used to validate ID tokens independently of the
        OAuth flow, useful for token refresh scenarios or when validating
        tokens from mobile SDKs.
        
        Args:
            provider: Social provider name
            id_token: JWT identity token to validate
            
        Returns:
            dict: Validated user claims containing:
                - sub (str): User ID from provider
                - email (str): User email
                - email_verified (bool): Email verification status
                - name (str): User's full name
                - picture (str): Profile picture URL
                - provider (str): Provider name
                
        Raises:
            ValueError: If provider is not supported
            Exception: If token validation fails
            
        Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2
        
        Example:
            >>> oauth_service = OAuthService()
            >>> claims = oauth_service.validate_token("google", "eyJhbGc...")
            >>> print(claims["email"])
            user@example.com
        """
        # Get provider instance (redirect_uri not needed for validation)
        provider_instance = get_provider(provider, "https://dummy.example.com")
        
        # Validate ID token
        user_claims = provider_instance.validate_id_token(id_token)
        
        # Add provider name
        user_claims["provider"] = provider
        
        return user_claims
    
    def _store_state(self, state: str, provider: str, redirect_uri: str) -> None:
        """
        Store OAuth state parameter in DynamoDB with TTL.
        
        The state is stored with a 10-minute TTL to prevent replay attacks
        and automatically clean up expired states.
        
        Args:
            state: CSRF protection token
            provider: Social provider name
            redirect_uri: OAuth callback URL
            
        Raises:
            Exception: If DynamoDB write fails
        """
        ttl = int(time.time()) + 600  # 10 minutes
        
        try:
            self.state_table.put_item(
                Item={
                    "state": state,
                    "provider": provider,
                    "redirect_uri": redirect_uri,
                    "created_at": int(time.time()),
                    "ttl": ttl
                }
            )
        except ClientError as e:
            raise Exception(f"Failed to store OAuth state: {str(e)}")
    
    def _validate_and_retrieve_state(self, state: str) -> Dict:
        """
        Validate and retrieve OAuth state from DynamoDB.
        
        Checks that the state exists and hasn't expired. This prevents
        CSRF attacks and replay attacks.
        
        Args:
            state: State parameter from OAuth callback
            
        Returns:
            dict: State data containing provider and redirect_uri
            
        Raises:
            ValueError: If state is invalid or expired
        """
        try:
            response = self.state_table.get_item(Key={"state": state})
            
            if "Item" not in response:
                raise ValueError(
                    "Invalid OAuth state parameter. Possible CSRF attack or expired state."
                )
            
            state_data = response["Item"]
            
            # Check if state has expired (additional check beyond DynamoDB TTL)
            current_time = int(time.time())
            if current_time > state_data["ttl"]:
                self._delete_state(state)
                raise ValueError("OAuth state has expired. Please restart authentication.")
            
            return {
                "provider": state_data["provider"],
                "redirect_uri": state_data["redirect_uri"]
            }
            
        except ClientError as e:
            raise Exception(f"Failed to validate OAuth state: {str(e)}")
    
    def _delete_state(self, state: str) -> None:
        """
        Delete OAuth state from DynamoDB after use.
        
        States are single-use to prevent replay attacks. This method
        removes the state after successful validation.
        
        Args:
            state: State parameter to delete
        """
        try:
            self.state_table.delete_item(Key={"state": state})
        except ClientError:
            # Ignore deletion errors - TTL will clean up eventually
            pass
