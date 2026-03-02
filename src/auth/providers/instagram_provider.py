"""
Instagram OAuth Provider Implementation

This module implements Instagram OAuth 2.0 authentication.
Instagram uses the Facebook Graph API for authentication.

Requirements: 3.1, 3.2, 3.3
"""

from typing import Dict
import requests
from .base_provider import BaseOAuthProvider


class InstagramOAuthProvider(BaseOAuthProvider):
    """
    Instagram OAuth 2.0 provider implementation.
    
    Implements Instagram authentication using Facebook's Graph API.
    Instagram is owned by Meta and uses their OAuth infrastructure.
    """
    
    # Instagram OAuth endpoints (via Facebook Graph API)
    AUTHORIZATION_ENDPOINT = "https://api.instagram.com/oauth/authorize"
    TOKEN_ENDPOINT = "https://api.instagram.com/oauth/access_token"
    USERINFO_ENDPOINT = "https://graph.instagram.com/me"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Instagram OAuth provider.
        
        Args:
            client_id: Instagram App ID
            client_secret: Instagram App Secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "user_profile",
            "user_media"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "instagram")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Instagram authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Instagram authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": ",".join(self.scopes),
            "state": state
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from Instagram
            redirect_uri: Callback URL (must match authorization request)
            
        Returns:
            Dict: Token response with access_token
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        token_response = self.make_token_request(self.TOKEN_ENDPOINT, data)
        
        # Instagram returns short-lived tokens
        return {
            "access_token": token_response.get("access_token"),
            "token_type": token_response.get("token_type", "bearer"),
            "expires_in": token_response.get("expires_in", 3600),
            "user_id": token_response.get("user_id"),
            "id_token": None  # Instagram doesn't use ID tokens
        }
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate Instagram access token.
        
        Note: Instagram doesn't use ID tokens. This method validates the access token
        by fetching user info.
        
        Args:
            id_token: Access token (Instagram doesn't have separate ID tokens)
            
        Returns:
            Dict: User claims from user info
        """
        # Fetch user info to validate token and get profile
        user_info = self.get_user_info(id_token)
        
        return {
            "sub": user_info.get("id"),
            "email": None,  # Instagram Basic Display API doesn't provide email
            "email_verified": False,
            "name": user_info.get("username"),
            "picture": None  # Not available in Basic Display API
        }
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Instagram.
        
        Args:
            access_token: Valid Instagram access token
            
        Returns:
            Dict: User profile information
        """
        try:
            response = requests.get(
                self.USERINFO_ENDPOINT,
                params={
                    "fields": "id,username,account_type",
                    "access_token": access_token
                },
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch Instagram user info: {str(e)}")
    
    def get_jwks_uri(self) -> str:
        """
        Get JWKS URI (not used by Instagram).
        
        Instagram doesn't use JWKS for token validation.
        Returns empty string as placeholder.
        
        Returns:
            str: Empty string
        """
        return ""
