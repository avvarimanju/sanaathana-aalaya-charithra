"""
Twitter/X OAuth Provider Implementation

This module implements Twitter/X OAuth 2.0 authentication.
Twitter uses OAuth 2.0 with PKCE for enhanced security.

Requirements: 5.1, 5.2, 5.3
"""

from typing import Dict
import requests
from .base_provider import BaseOAuthProvider


class TwitterOAuthProvider(BaseOAuthProvider):
    """
    Twitter/X OAuth 2.0 provider implementation.
    
    Implements Twitter authentication using OAuth 2.0 with PKCE.
    """
    
    # Twitter OAuth endpoints
    AUTHORIZATION_ENDPOINT = "https://twitter.com/i/oauth2/authorize"
    TOKEN_ENDPOINT = "https://api.twitter.com/2/oauth2/token"
    USERINFO_ENDPOINT = "https://api.twitter.com/2/users/me"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Twitter OAuth provider.
        
        Args:
            client_id: Twitter OAuth 2.0 Client ID
            client_secret: Twitter OAuth 2.0 Client Secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "tweet.read",
            "users.read",
            "offline.access"  # For refresh tokens
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "twitter")
        self._code_verifier = None
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Twitter authorization URL with PKCE.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Twitter authorization URL
        """
        # Generate PKCE parameters
        self._code_verifier = self.generate_code_verifier()
        code_challenge = self.generate_code_challenge(self._code_verifier)
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens using PKCE.
        
        Args:
            code: Authorization code from Twitter
            redirect_uri: Callback URL (must match authorization request)
            
        Returns:
            Dict: Token response with access_token, refresh_token
        """
        data = {
            "client_id": self.client_id,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": self._code_verifier
        }
        
        # Twitter requires Basic Auth for token endpoint
        import base64
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {auth_b64}"
        }
        
        token_response = self.make_token_request(self.TOKEN_ENDPOINT, data, headers)
        
        # Twitter doesn't provide ID tokens
        return {
            "access_token": token_response.get("access_token"),
            "token_type": token_response.get("token_type", "bearer"),
            "expires_in": token_response.get("expires_in", 7200),
            "refresh_token": token_response.get("refresh_token"),
            "scope": token_response.get("scope"),
            "id_token": None  # Twitter doesn't use ID tokens
        }
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate Twitter access token.
        
        Note: Twitter doesn't use ID tokens. This method validates the access token
        by fetching user info.
        
        Args:
            id_token: Access token (Twitter doesn't have separate ID tokens)
            
        Returns:
            Dict: User claims from user info
        """
        # Fetch user info to validate token and get profile
        user_info = self.get_user_info(id_token)
        
        return {
            "sub": user_info.get("id"),
            "email": None,  # Twitter API v2 doesn't provide email by default
            "email_verified": False,
            "name": user_info.get("name"),
            "picture": user_info.get("profile_image_url"),
            "username": user_info.get("username")
        }
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Twitter.
        
        Args:
            access_token: Valid Twitter access token
            
        Returns:
            Dict: User profile information
        """
        try:
            response = requests.get(
                self.USERINFO_ENDPOINT,
                params={
                    "user.fields": "id,name,username,profile_image_url"
                },
                headers={
                    "Authorization": f"Bearer {access_token}"
                },
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get("data", {})
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch Twitter user info: {str(e)}")
    
    def get_jwks_uri(self) -> str:
        """
        Get JWKS URI (not used by Twitter).
        
        Twitter doesn't use JWKS for token validation.
        Returns empty string as placeholder.
        
        Returns:
            str: Empty string
        """
        return ""
