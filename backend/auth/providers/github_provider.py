"""
GitHub OAuth Provider Implementation

This module implements GitHub OAuth 2.0 authentication.
GitHub uses a straightforward OAuth 2.0 flow without ID tokens.

Requirements: 6.1, 6.2, 6.3
"""

from typing import Dict
import requests
from .base_provider import BaseOAuthProvider


class GitHubOAuthProvider(BaseOAuthProvider):
    """
    GitHub OAuth 2.0 provider implementation.
    
    Implements GitHub authentication using OAuth 2.0.
    """
    
    # GitHub OAuth endpoints
    AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize"
    TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token"
    USERINFO_ENDPOINT = "https://api.github.com/user"
    USER_EMAILS_ENDPOINT = "https://api.github.com/user/emails"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize GitHub OAuth provider.
        
        Args:
            client_id: GitHub OAuth App Client ID
            client_secret: GitHub OAuth App Client Secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "read:user",
            "user:email"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "github")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate GitHub authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: GitHub authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "allow_signup": "true"
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from GitHub
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
        
        # GitHub requires Accept header for JSON response
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        
        token_response = self.make_token_request(self.TOKEN_ENDPOINT, data, headers)
        
        # GitHub doesn't provide ID tokens
        return {
            "access_token": token_response.get("access_token"),
            "token_type": token_response.get("token_type", "bearer"),
            "scope": token_response.get("scope"),
            "id_token": None  # GitHub doesn't use ID tokens
        }
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate GitHub access token.
        
        Note: GitHub doesn't use ID tokens. This method validates the access token
        by fetching user info.
        
        Args:
            id_token: Access token (GitHub doesn't have separate ID tokens)
            
        Returns:
            Dict: User claims from user info
        """
        # Fetch user info to validate token and get profile
        user_info = self.get_user_info(id_token)
        
        return {
            "sub": str(user_info.get("id")),
            "email": user_info.get("email"),
            "email_verified": user_info.get("email") is not None,
            "name": user_info.get("name") or user_info.get("login"),
            "picture": user_info.get("avatar_url"),
            "login": user_info.get("login")
        }
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from GitHub.
        
        Args:
            access_token: Valid GitHub access token
            
        Returns:
            Dict: User profile information
        """
        try:
            # Get basic user info
            response = requests.get(
                self.USERINFO_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                timeout=5
            )
            response.raise_for_status()
            user_data = response.json()
            
            # Get user emails if not in basic info
            if not user_data.get("email"):
                try:
                    emails_response = requests.get(
                        self.USER_EMAILS_ENDPOINT,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Accept": "application/vnd.github.v3+json"
                        },
                        timeout=5
                    )
                    emails_response.raise_for_status()
                    emails = emails_response.json()
                    
                    # Find primary verified email
                    for email_obj in emails:
                        if email_obj.get("primary") and email_obj.get("verified"):
                            user_data["email"] = email_obj.get("email")
                            break
                except:
                    pass  # Email is optional
            
            return user_data
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch GitHub user info: {str(e)}")
    
    def get_jwks_uri(self) -> str:
        """
        Get JWKS URI (not used by GitHub).
        
        GitHub doesn't use JWKS for token validation.
        Returns empty string as placeholder.
        
        Returns:
            str: Empty string
        """
        return ""
