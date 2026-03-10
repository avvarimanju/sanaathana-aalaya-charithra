"""
Google OAuth Provider Implementation

This module implements Google OAuth 2.0 authentication using OpenID Connect.
Google provides ID tokens that can be validated using their JWKS endpoint.

Requirements: 1.1, 1.2, 1.3
"""

from typing import Dict, List
import jwt
from .base_provider import BaseOAuthProvider


class GoogleOAuthProvider(BaseOAuthProvider):
    """
    Google OAuth 2.0 provider implementation.
    
    Implements Google Sign-In using OAuth 2.0 and OpenID Connect.
    Supports ID token validation using Google's public keys.
    """
    
    # Google OAuth endpoints
    AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"
    JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs"
    ISSUER = "https://accounts.google.com"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Google OAuth provider.
        
        Args:
            client_id: Google OAuth client ID
            client_secret: Google OAuth client secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "openid",
            "email",
            "profile"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "google")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Google authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Google authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "state": state,
            "access_type": "offline",  # Request refresh token
            "prompt": "consent"  # Force consent screen to get refresh token
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from Google
            redirect_uri: Callback URL (must match authorization request)
            
        Returns:
            Dict: Token response with access_token, id_token, refresh_token
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        return self.make_token_request(self.TOKEN_ENDPOINT, data)
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate Google ID token and extract claims.
        
        Args:
            id_token: JWT ID token from Google
            
        Returns:
            Dict: Validated user claims
            
        Raises:
            Exception: If token validation fails
        """
        # Fetch Google's public keys
        jwks = self.fetch_jwks()
        
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise Exception("ID token missing key ID (kid)")
        
        # Find matching public key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        
        if not public_key:
            raise Exception(f"Public key not found for kid: {kid}")
        
        # Validate and decode token
        try:
            claims = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=self.ISSUER
            )
            
            # Extract standard claims
            return {
                "sub": claims.get("sub"),
                "email": claims.get("email"),
                "email_verified": claims.get("email_verified", False),
                "name": claims.get("name"),
                "picture": claims.get("picture"),
                "given_name": claims.get("given_name"),
                "family_name": claims.get("family_name")
            }
        except jwt.ExpiredSignatureError:
            raise Exception("ID token has expired")
        except jwt.InvalidTokenError as e:
            raise Exception(f"Invalid ID token: {str(e)}")
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Google.
        
        Args:
            access_token: Valid Google access token
            
        Returns:
            Dict: User profile information
        """
        user_info = self.make_user_info_request(self.USERINFO_ENDPOINT, access_token)
        
        return {
            "id": user_info.get("sub"),
            "email": user_info.get("email"),
            "email_verified": user_info.get("email_verified", False),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
            "given_name": user_info.get("given_name"),
            "family_name": user_info.get("family_name")
        }
    
    def get_jwks_uri(self) -> str:
        """
        Get Google's JWKS URI.
        
        Returns:
            str: Google JWKS endpoint URL
        """
        return self.JWKS_URI
