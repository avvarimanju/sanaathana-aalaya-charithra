"""
Base OAuth Provider Module

This module defines the abstract base class for all OAuth provider implementations.
Each social provider (Google, Facebook, Instagram, Apple, Twitter/X, GitHub, Microsoft)
must implement this interface to ensure consistent OAuth flow handling.

Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, List
import requests
import time
from urllib.parse import urlencode, parse_qs, urlparse
import secrets
import hashlib
import base64


class BaseOAuthProvider(ABC):
    """
    Abstract base class for OAuth 2.0 providers.
    
    All social media authentication providers must extend this class and implement
    the abstract methods for provider-specific OAuth endpoints, token validation,
    and user information retrieval.
    
    Attributes:
        client_id (str): OAuth client ID from provider
        client_secret (str): OAuth client secret from provider
        redirect_uri (str): Callback URL for OAuth redirect
        scopes (List[str]): OAuth scopes requested from provider
        provider_name (str): Name of the provider (e.g., 'google', 'facebook')
    """
    
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        scopes: List[str],
        provider_name: str
    ):
        """
        Initialize the OAuth provider.
        
        Args:
            client_id: OAuth client ID from provider
            client_secret: OAuth client secret from provider
            redirect_uri: Callback URL for OAuth redirect
            scopes: List of OAuth scopes to request
            provider_name: Name of the provider
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.scopes = scopes
        self.provider_name = provider_name
        self._jwks_cache: Optional[Dict] = None
        self._jwks_cache_time: float = 0
        self._jwks_cache_ttl: int = 3600  # Cache JWKS for 1 hour
    
    @abstractmethod
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generate provider-specific authorization URL for OAuth flow.
        
        This method constructs the URL where users will be redirected to authenticate
        with the social provider. The URL includes the client ID, scopes, redirect URI,
        and CSRF state parameter.
        
        Args:
            state: CSRF protection token (minimum 32 bytes)
            redirect_uri: Callback URL for OAuth redirect
            
        Returns:
            str: Complete authorization URL for the provider
            
        Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
        """
        pass
    
    @abstractmethod
    def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict:
        """
        Exchange authorization code for access and ID tokens.
        
        After the user authorizes the application, the provider returns an authorization
        code. This method exchanges that code for access tokens and ID tokens that can
        be used to access user information and validate identity.
        
        Args:
            code: Authorization code from OAuth callback
            redirect_uri: Callback URL used in authorization request (must match)
            
        Returns:
            Dict: Token response containing:
                - access_token (str): Access token for API calls
                - id_token (str): JWT identity token
                - refresh_token (Optional[str]): Refresh token if provided
                - expires_in (int): Token expiration in seconds
                - token_type (str): Token type (usually "Bearer")
                - scope (str): Granted scopes
                
        Raises:
            Exception: If token exchange fails
            
        Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
        """
        pass
    
    @abstractmethod
    def validate_id_token(self, id_token: str) -> Dict:
        """
        Validate ID token signature and extract user claims.
        
        This method verifies the JWT signature using the provider's public keys (JWKS),
        checks token expiration, validates issuer and audience claims, and extracts
        user information from the token.
        
        Args:
            id_token: JWT identity token from provider
            
        Returns:
            Dict: Validated user claims containing:
                - sub (str): Subject (user ID from provider)
                - email (str): User email address
                - email_verified (bool): Email verification status
                - name (str): User's full name
                - picture (Optional[str]): Profile picture URL
                - Additional provider-specific claims
                
        Raises:
            Exception: If token validation fails
            
        Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2
        """
        pass
    
    @abstractmethod
    def get_user_info(self, access_token: str) -> Dict:
        """
        Fetch user profile information from provider using access token.
        
        This method calls the provider's user info endpoint to retrieve detailed
        profile information. This is used as a fallback or supplement to the
        information contained in the ID token.
        
        Args:
            access_token: Valid access token from provider
            
        Returns:
            Dict: User profile information containing:
                - id (str): User ID from provider
                - email (str): User email address
                - name (str): User's full name
                - picture (Optional[str]): Profile picture URL
                - Additional provider-specific fields
                
        Raises:
            Exception: If user info request fails
            
        Requirements: 11.1, 11.2, 11.3
        """
        pass
    
    @abstractmethod
    def get_jwks_uri(self) -> str:
        """
        Get JSON Web Key Set URI for token validation.
        
        Returns the URL where the provider's public keys (JWKS) can be retrieved
        for validating JWT signatures. These keys are used to verify that ID tokens
        were actually issued by the provider.
        
        Returns:
            str: JWKS endpoint URL
            
        Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2
        """
        pass
    
    # Common helper methods
    
    def generate_state(self, length: int = 32) -> str:
        """
        Generate cryptographically secure random state parameter for CSRF protection.
        
        The state parameter is used to prevent CSRF attacks during the OAuth flow.
        It should be stored in the session and validated when the provider redirects
        back to the application.
        
        Args:
            length: Length of the state parameter in bytes (default: 32)
            
        Returns:
            str: URL-safe random state parameter
            
        Requirements: 10.6
        """
        return secrets.token_urlsafe(length)
    
    def build_authorization_url(
        self,
        auth_endpoint: str,
        params: Dict[str, str]
    ) -> str:
        """
        Build complete authorization URL with query parameters.
        
        Helper method to construct the authorization URL by combining the base
        endpoint with query parameters.
        
        Args:
            auth_endpoint: Base authorization endpoint URL
            params: Dictionary of query parameters
            
        Returns:
            str: Complete authorization URL with encoded parameters
        """
        query_string = urlencode(params)
        return f"{auth_endpoint}?{query_string}"
    
    def make_token_request(
        self,
        token_endpoint: str,
        data: Dict[str, str],
        headers: Optional[Dict[str, str]] = None
    ) -> Dict:
        """
        Make POST request to token endpoint with error handling.
        
        Helper method to exchange authorization codes for tokens or refresh
        access tokens. Includes retry logic and error handling.
        
        Args:
            token_endpoint: Provider's token endpoint URL
            data: Form data for token request
            headers: Optional HTTP headers
            
        Returns:
            Dict: Token response from provider
            
        Raises:
            Exception: If token request fails after retries
            
        Requirements: 10.1, 10.2
        """
        if headers is None:
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    token_endpoint,
                    data=data,
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code >= 500 and attempt < max_retries - 1:
                    # Retry on server errors
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                else:
                    # Client error or final retry
                    error_data = response.json() if response.content else {}
                    raise Exception(
                        f"Token request failed: {response.status_code} - "
                        f"{error_data.get('error_description', error_data.get('error', 'Unknown error'))}"
                    )
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))
                    continue
                raise Exception(f"Token request failed: {str(e)}")
        
        raise Exception("Token request failed after maximum retries")
    
    def fetch_jwks(self) -> Dict:
        """
        Fetch JSON Web Key Set from provider with caching.
        
        Retrieves the provider's public keys used for JWT signature validation.
        Results are cached for 1 hour to reduce network requests.
        
        Returns:
            Dict: JWKS response containing public keys
            
        Raises:
            Exception: If JWKS fetch fails
            
        Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2
        """
        current_time = time.time()
        
        # Return cached JWKS if still valid
        if (self._jwks_cache is not None and 
            current_time - self._jwks_cache_time < self._jwks_cache_ttl):
            return self._jwks_cache
        
        # Fetch fresh JWKS
        jwks_uri = self.get_jwks_uri()
        
        try:
            response = requests.get(jwks_uri, timeout=5)
            response.raise_for_status()
            
            self._jwks_cache = response.json()
            self._jwks_cache_time = current_time
            
            return self._jwks_cache
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch JWKS: {str(e)}")
    
    def make_user_info_request(
        self,
        user_info_endpoint: str,
        access_token: str
    ) -> Dict:
        """
        Make GET request to user info endpoint with access token.
        
        Helper method to retrieve user profile information from the provider's
        user info endpoint using the access token.
        
        Args:
            user_info_endpoint: Provider's user info endpoint URL
            access_token: Valid access token
            
        Returns:
            Dict: User profile information from provider
            
        Raises:
            Exception: If user info request fails
            
        Requirements: 11.1, 11.2, 11.3
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        
        try:
            response = requests.get(
                user_info_endpoint,
                headers=headers,
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch user info: {str(e)}")
    
    def generate_code_verifier(self) -> str:
        """
        Generate PKCE code verifier for enhanced security.
        
        PKCE (Proof Key for Code Exchange) adds an additional layer of security
        for OAuth flows, especially important for mobile applications.
        
        Returns:
            str: URL-safe random code verifier (43-128 characters)
            
        Requirements: 10.6
        """
        return secrets.token_urlsafe(32)  # Generates 43 characters
    
    def generate_code_challenge(self, code_verifier: str) -> str:
        """
        Generate PKCE code challenge from code verifier.
        
        The code challenge is derived from the code verifier using SHA-256 hashing
        and base64 URL encoding.
        
        Args:
            code_verifier: PKCE code verifier
            
        Returns:
            str: Base64 URL-encoded SHA-256 hash of code verifier
            
        Requirements: 10.6
        """
        digest = hashlib.sha256(code_verifier.encode()).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip('=')
    
    def parse_query_params(self, url: str) -> Dict[str, str]:
        """
        Parse query parameters from URL.
        
        Helper method to extract query parameters from callback URLs.
        
        Args:
            url: URL with query parameters
            
        Returns:
            Dict: Dictionary of query parameter key-value pairs
        """
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        # Convert lists to single values
        return {k: v[0] if len(v) == 1 else v for k, v in params.items()}
    
    def validate_state(self, received_state: str, expected_state: str) -> bool:
        """
        Validate OAuth state parameter for CSRF protection.
        
        Compares the state parameter received in the OAuth callback with the
        expected state that was stored in the session.
        
        Args:
            received_state: State parameter from OAuth callback
            expected_state: State parameter stored in session
            
        Returns:
            bool: True if states match, False otherwise
            
        Requirements: 10.6
        """
        return secrets.compare_digest(received_state, expected_state)
    
    def __repr__(self) -> str:
        """String representation of the provider."""
        return f"<{self.__class__.__name__} provider={self.provider_name}>"
