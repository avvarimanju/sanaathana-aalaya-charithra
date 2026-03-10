"""
Apple OAuth Provider Implementation

This module implements Apple Sign In using OAuth 2.0 and OpenID Connect.
Apple provides ID tokens and supports private relay email addresses.

Requirements: 4.1, 4.2, 4.3, 4.6
"""

from typing import Dict
import jwt
from .base_provider import BaseOAuthProvider


class AppleOAuthProvider(BaseOAuthProvider):
    """
    Apple Sign In provider implementation.
    
    Implements Apple Sign In using OAuth 2.0 and OpenID Connect.
    Supports private relay email addresses and ID token validation.
    """
    
    # Apple OAuth endpoints
    AUTHORIZATION_ENDPOINT = "https://appleid.apple.com/auth/authorize"
    TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token"
    JWKS_URI = "https://appleid.apple.com/auth/keys"
    ISSUER = "https://appleid.apple.com"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Apple OAuth provider.
        
        Args:
            client_id: Apple Services ID
            client_secret: Apple client secret (JWT signed with private key)
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "name",
            "email"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "apple")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Apple authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Apple authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "response_mode": "form_post",
            "scope": " ".join(self.scopes),
            "state": state
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from Apple
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
        Validate Apple ID token and extract claims.
        
        Handles Apple's private relay email addresses.
        
        Args:
            id_token: JWT ID token from Apple
            
        Returns:
            Dict: Validated user claims including private relay email if present
            
        Raises:
            Exception: If token validation fails
        """
        # Fetch Apple's public keys
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
            
            # Extract email (may be private relay email)
            email = claims.get("email")
            is_private_email = claims.get("is_private_email", False)
            
            # Extract standard claims
            return {
                "sub": claims.get("sub"),
                "email": email,
                "email_verified": claims.get("email_verified", True),  # Apple verifies emails
                "name": None,  # Name only provided on first sign-in
                "picture": None,  # Apple doesn't provide profile pictures
                "is_private_email": is_private_email  # Apple-specific claim
            }
        except jwt.ExpiredSignatureError:
            raise Exception("ID token has expired")
        except jwt.InvalidTokenError as e:
            raise Exception(f"Invalid ID token: {str(e)}")
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Apple.
        
        Note: Apple doesn't provide a user info endpoint. User information
        is only available in the ID token and the initial authorization response.
        
        Args:
            access_token: Valid Apple access token
            
        Returns:
            Dict: Limited user profile information
        """
        # Apple doesn't have a user info endpoint
        # User info is only in the ID token
        return {
            "id": None,
            "email": None,
            "name": None,
            "picture": None
        }
    
    def get_jwks_uri(self) -> str:
        """
        Get Apple's JWKS URI.
        
        Returns:
            str: Apple JWKS endpoint URL
        """
        return self.JWKS_URI
