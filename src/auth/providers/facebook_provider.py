"""
Facebook OAuth Provider Implementation

This module implements Facebook OAuth 2.0 authentication.
Facebook uses access token validation via their debug endpoint instead of JWKS.

Requirements: 2.1, 2.2, 2.3
"""

from typing import Dict
import requests
from .base_provider import BaseOAuthProvider


class FacebookOAuthProvider(BaseOAuthProvider):
    """
    Facebook OAuth 2.0 provider implementation.
    
    Implements Facebook Login using OAuth 2.0.
    Uses Facebook's token debug endpoint for validation.
    """
    
    # Facebook OAuth endpoints
    AUTHORIZATION_ENDPOINT = "https://www.facebook.com/v18.0/dialog/oauth"
    TOKEN_ENDPOINT = "https://graph.facebook.com/v18.0/oauth/access_token"
    USERINFO_ENDPOINT = "https://graph.facebook.com/v18.0/me"
    DEBUG_TOKEN_ENDPOINT = "https://graph.facebook.com/v18.0/debug_token"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Facebook OAuth provider.
        
        Args:
            client_id: Facebook App ID
            client_secret: Facebook App Secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "email",
            "public_profile"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "facebook")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Facebook authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Facebook authorization URL
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
            code: Authorization code from Facebook
            redirect_uri: Callback URL (must match authorization request)
            
        Returns:
            Dict: Token response with access_token
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri
        }
        
        token_response = self.make_token_request(self.TOKEN_ENDPOINT, data)
        
        # Facebook doesn't provide ID tokens, so we create a synthetic response
        return {
            "access_token": token_response.get("access_token"),
            "token_type": token_response.get("token_type", "bearer"),
            "expires_in": token_response.get("expires_in", 3600),
            "id_token": None  # Facebook doesn't use ID tokens
        }
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate Facebook access token using debug endpoint.
        
        Note: Facebook doesn't use ID tokens. This method validates the access token
        and fetches user info to return claims in a standard format.
        
        Args:
            id_token: Access token (Facebook doesn't have separate ID tokens)
            
        Returns:
            Dict: User claims from token validation and user info
        """
        # Validate token using Facebook's debug endpoint
        app_access_token = f"{self.client_id}|{self.client_secret}"
        
        try:
            response = requests.get(
                self.DEBUG_TOKEN_ENDPOINT,
                params={
                    "input_token": id_token,
                    "access_token": app_access_token
                },
                timeout=5
            )
            response.raise_for_status()
            
            debug_data = response.json().get("data", {})
            
            if not debug_data.get("is_valid"):
                raise Exception("Invalid Facebook access token")
            
            if debug_data.get("app_id") != self.client_id:
                raise Exception("Token not issued for this app")
            
            # Fetch user info to get complete profile
            user_info = self.get_user_info(id_token)
            
            return {
                "sub": user_info.get("id"),
                "email": user_info.get("email"),
                "email_verified": True,  # Facebook verifies emails
                "name": user_info.get("name"),
                "picture": user_info.get("picture", {}).get("data", {}).get("url")
            }
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to validate Facebook token: {str(e)}")
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Facebook.
        
        Args:
            access_token: Valid Facebook access token
            
        Returns:
            Dict: User profile information
        """
        try:
            response = requests.get(
                self.USERINFO_ENDPOINT,
                params={
                    "fields": "id,name,email,picture",
                    "access_token": access_token
                },
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch Facebook user info: {str(e)}")
    
    def get_jwks_uri(self) -> str:
        """
        Get JWKS URI (not used by Facebook).
        
        Facebook doesn't use JWKS for token validation.
        Returns empty string as placeholder.
        
        Returns:
            str: Empty string
        """
        return ""
