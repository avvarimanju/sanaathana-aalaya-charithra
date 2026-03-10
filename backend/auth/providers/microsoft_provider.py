"""
Microsoft OAuth Provider Implementation

This module implements Microsoft OAuth 2.0 authentication using OpenID Connect.
Microsoft provides ID tokens that can be validated using their JWKS endpoint.

Requirements: 7.1, 7.2, 7.3
"""

from typing import Dict
import jwt
from .base_provider import BaseOAuthProvider


class MicrosoftOAuthProvider(BaseOAuthProvider):
    """
    Microsoft OAuth 2.0 provider implementation.
    
    Implements Microsoft authentication using OAuth 2.0 and OpenID Connect.
    Supports ID token validation using Microsoft's public keys.
    """
    
    # Microsoft OAuth endpoints (common tenant)
    AUTHORIZATION_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    USERINFO_ENDPOINT = "https://graph.microsoft.com/v1.0/me"
    JWKS_URI = "https://login.microsoftonline.com/common/discovery/v2.0/keys"
    ISSUER_PREFIX = "https://login.microsoftonline.com/"
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize Microsoft OAuth provider.
        
        Args:
            client_id: Microsoft Application (client) ID
            client_secret: Microsoft Client Secret
            redirect_uri: Callback URL for OAuth redirect
        """
        scopes = [
            "openid",
            "email",
            "profile",
            "User.Read"
        ]
        super().__init__(client_id, client_secret, redirect_uri, scopes, "microsoft")
    
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate Microsoft authorization URL.
        
        Args:
            state: CSRF protection token
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Microsoft authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "state": state,
            "response_mode": "query"
        }
        return self.build_authorization_url(self.AUTHORIZATION_ENDPOINT, params)
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from Microsoft
            redirect_uri: Callback URL (must match authorization request)
            
        Returns:
            Dict: Token response with access_token, id_token, refresh_token
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "scope": " ".join(self.scopes)
        }
        return self.make_token_request(self.TOKEN_ENDPOINT, data)
    
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate Microsoft ID token and extract claims.
        
        Args:
            id_token: JWT ID token from Microsoft
            
        Returns:
            Dict: Validated user claims
            
        Raises:
            Exception: If token validation fails
        """
        # Fetch Microsoft's public keys
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
            # Microsoft uses tenant-specific issuers, so we need to verify the issuer format
            unverified_claims = jwt.decode(id_token, options={"verify_signature": False})
            issuer = unverified_claims.get("iss")
            
            if not issuer or not issuer.startswith(self.ISSUER_PREFIX):
                raise Exception(f"Invalid issuer: {issuer}")
            
            claims = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=issuer,
                options={"verify_aud": True, "verify_iss": True}
            )
            
            # Extract standard claims
            return {
                "sub": claims.get("sub") or claims.get("oid"),  # Use oid as fallback
                "email": claims.get("email") or claims.get("preferred_username"),
                "email_verified": True,  # Microsoft verifies emails
                "name": claims.get("name"),
                "picture": None,  # Not in ID token, need to fetch from Graph API
                "given_name": claims.get("given_name"),
                "family_name": claims.get("family_name")
            }
        except jwt.ExpiredSignatureError:
            raise Exception("ID token has expired")
        except jwt.InvalidTokenError as e:
            raise Exception(f"Invalid ID token: {str(e)}")
    
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile from Microsoft Graph API.
        
        Args:
            access_token: Valid Microsoft access token
            
        Returns:
            Dict: User profile information
        """
        user_info = self.make_user_info_request(self.USERINFO_ENDPOINT, access_token)
        
        return {
            "id": user_info.get("id"),
            "email": user_info.get("mail") or user_info.get("userPrincipalName"),
            "name": user_info.get("displayName"),
            "given_name": user_info.get("givenName"),
            "family_name": user_info.get("surname"),
            "picture": None  # Would need separate request to /me/photo
        }
    
    def get_jwks_uri(self) -> str:
        """
        Get Microsoft's JWKS URI.
        
        Returns:
            str: Microsoft JWKS endpoint URL
        """
        return self.JWKS_URI
