"""
Property-based tests for token validation utilities.

**Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
**Property 2: Token Signature Validation**

This module contains property-based tests that verify the token signature
validation property holds for all social providers and token types.
"""

import pytest
import jwt
import time
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from hypothesis import given, settings, strategies as st
from unittest.mock import patch, MagicMock

from .validators import (
    validate_jwt_signature,
    validate_redirect_uri,
    TokenValidationError,
    RedirectURIValidationError,
    _clear_jwks_cache
)
from ..config import AuthConfig, AuthErrorCode


class TestTokenSignatureValidationProperties:
    """Property-based tests for token signature validation."""
    
    def setup_method(self):
        """Set up test environment."""
        # Clear JWKS cache before each test
        _clear_jwks_cache()
        
        # Generate test RSA key pair
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
        
        # Create JWK representation for mocking
        self.mock_jwk = MagicMock()
        self.mock_jwk.key = self.public_key
        
        # Create mock JWKS client
        self.mock_jwks_client = MagicMock()
        self.mock_jwks_client.get_signing_key_from_jwt.return_value = self.mock_jwk
    
    def teardown_method(self):
        """Clean up test environment."""
        _clear_jwks_cache()
    
    def _create_valid_jwt(self, provider: str, client_id: str, **extra_claims) -> str:
        """Create a valid JWT token for testing."""
        now = datetime.utcnow()
        
        # Base claims for a valid token
        claims = {
            "iss": self._get_issuer_for_provider(provider),
            "aud": client_id,
            "sub": f"provider-user-{provider}-123",
            "email": f"user@{provider}.com",
            "email_verified": True,
            "name": f"Test User {provider.title()}",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "nbf": int(now.timestamp()),
        }
        
        # Add any extra claims
        claims.update(extra_claims)
        
        # Sign with our test private key
        return jwt.encode(
            claims,
            self.private_key,
            algorithm="RS256",
            headers={"kid": "test-key-id"}
        )
    
    def _create_invalid_jwt(self, provider: str, client_id: str, **extra_claims) -> str:
        """Create an invalid JWT token (signed with different key) for testing."""
        # Generate a different private key for invalid signature
        invalid_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        now = datetime.utcnow()
        
        claims = {
            "iss": self._get_issuer_for_provider(provider),
            "aud": client_id,
            "sub": f"provider-user-{provider}-123",
            "email": f"user@{provider}.com",
            "email_verified": True,
            "name": f"Test User {provider.title()}",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "nbf": int(now.timestamp()),
        }
        
        claims.update(extra_claims)
        
        # Sign with the DIFFERENT private key (making signature invalid)
        return jwt.encode(
            claims,
            invalid_private_key,
            algorithm="RS256",
            headers={"kid": "test-key-id"}
        )
    
    def _get_issuer_for_provider(self, provider: str) -> str:
        """Get expected issuer for a provider."""
        issuers = {
            "google": "https://accounts.google.com",
            "apple": "https://appleid.apple.com",
            "microsoft": "https://login.microsoftonline.com/common/v2.0"
        }
        return issuers.get(provider, f"https://{provider}.com")
    
    @given(
        provider=st.sampled_from(["google", "apple", "microsoft"]),  # JWKS-supported providers
        client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        ))
    )
    @settings(max_examples=100, deadline=10000)
    def test_valid_token_signature_validation_property(self, provider, client_id):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Valid Tokens)**
        
        For any social provider and any ID token with a VALID signature,
        the token validation function should return success and extract
        the token claims correctly.
        
        This property verifies that:
        1. Valid tokens are accepted by the validation function
        2. Claims are correctly extracted from valid tokens
        3. The validation works consistently across all JWKS-supported providers
        """
        # Create a valid JWT token
        valid_token = self._create_valid_jwt(provider, client_id)
        
        # Mock the JWKS client to return our test public key
        with patch('backend.auth.utils.validators._get_jwks_client') as mock_get_client:
            mock_get_client.return_value = self.mock_jwks_client
            
            # Validate the token - should succeed
            claims = validate_jwt_signature(
                id_token=valid_token,
                provider=provider,
                client_id=client_id,
                issuer=self._get_issuer_for_provider(provider)
            )
            
            # Verify claims are extracted correctly
            assert claims is not None
            assert isinstance(claims, dict)
            assert claims["aud"] == client_id
            assert claims["iss"] == self._get_issuer_for_provider(provider)
            assert "sub" in claims
            assert "email" in claims
            assert "exp" in claims
            assert "iat" in claims
    
    @given(
        provider=st.sampled_from(["google", "apple", "microsoft"]),  # JWKS-supported providers
        client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        ))
    )
    @settings(max_examples=100, deadline=10000)
    def test_invalid_token_signature_validation_property(self, provider, client_id):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Invalid Tokens)**
        
        For any social provider and any ID token with an INVALID signature,
        the token validation function should fail and raise a TokenValidationError
        with the appropriate error code.
        
        This property verifies that:
        1. Invalid tokens are rejected by the validation function
        2. Appropriate error is raised for signature validation failures
        3. The validation consistently rejects invalid signatures across providers
        """
        # Create an invalid JWT token (signed with wrong key)
        invalid_token = self._create_invalid_jwt(provider, client_id)
        
        # Mock the JWKS client to return our test public key
        # (which won't match the key used to sign the invalid token)
        with patch('backend.auth.utils.validators._get_jwks_client') as mock_get_client:
            mock_get_client.return_value = self.mock_jwks_client
            
            # Validate the token - should fail
            with pytest.raises(TokenValidationError) as exc_info:
                validate_jwt_signature(
                    id_token=invalid_token,
                    provider=provider,
                    client_id=client_id,
                    issuer=self._get_issuer_for_provider(provider)
                )
            
            # Verify appropriate error is raised
            assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_TOKEN
            assert "signature" in str(exc_info.value).lower()
    
    @given(
        provider=st.sampled_from(["google", "apple", "microsoft"]),
        client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        )),
        malformed_token=st.one_of(
            st.just(""),  # Empty token
            st.just("not.a.jwt"),  # Not a JWT
            st.just("invalid"),  # Single part
            st.just("header.payload"),  # Missing signature
            st.just("header.payload.signature.extra"),  # Too many parts
            st.text(min_size=1, max_size=50, alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll', 'Nd'),
                whitelist_characters='!@#$%^&*()'
            ))  # Random text
        )
    )
    @settings(max_examples=100, deadline=10000)
    def test_malformed_token_validation_property(self, provider, client_id, malformed_token):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Malformed Tokens)**
        
        For any social provider and any malformed or invalid token format,
        the token validation function should fail gracefully and raise
        a TokenValidationError.
        
        This property verifies that:
        1. Malformed tokens are rejected consistently
        2. The function handles various types of invalid input gracefully
        3. Appropriate errors are raised for different malformation types
        """
        # Skip empty tokens as they're handled by a specific check
        if not malformed_token:
            return
        
        # Mock the JWKS client
        with patch('backend.auth.utils.validators._get_jwks_client') as mock_get_client:
            mock_get_client.return_value = self.mock_jwks_client
            
            # Validate the malformed token - should fail
            with pytest.raises(TokenValidationError) as exc_info:
                validate_jwt_signature(
                    id_token=malformed_token,
                    provider=provider,
                    client_id=client_id,
                    issuer=self._get_issuer_for_provider(provider)
                )
            
            # Verify appropriate error code is used
            assert exc_info.value.error_code in [
                AuthErrorCode.AUTH_INVALID_TOKEN,
                AuthErrorCode.AUTH_INTERNAL_ERROR
            ]
    
    @given(
        provider=st.sampled_from(["google", "apple", "microsoft"]),
        client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        )),
        exp_offset=st.integers(min_value=-3600, max_value=-1)  # Expired tokens (1 hour ago to 1 second ago)
    )
    @settings(max_examples=100, deadline=10000)
    def test_expired_token_validation_property(self, provider, client_id, exp_offset):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Expired Tokens)**
        
        For any social provider and any expired ID token (even with valid signature),
        the token validation function should fail and raise a TokenValidationError
        with AUTH_SESSION_EXPIRED error code.
        
        This property verifies that:
        1. Expired tokens are consistently rejected regardless of valid signature
        2. Expiration checking works across all providers
        3. Appropriate error code is returned for expired tokens
        """
        now = datetime.utcnow()
        
        # Create an expired token (but with valid signature)
        expired_token = self._create_valid_jwt(
            provider, 
            client_id,
            exp=int((now + timedelta(seconds=exp_offset)).timestamp())  # Expired
        )
        
        # Mock the JWKS client to return our test public key
        with patch('backend.auth.utils.validators._get_jwks_client') as mock_get_client:
            mock_get_client.return_value = self.mock_jwks_client
            
            # Validate the expired token - should fail
            with pytest.raises(TokenValidationError) as exc_info:
                validate_jwt_signature(
                    id_token=expired_token,
                    provider=provider,
                    client_id=client_id,
                    issuer=self._get_issuer_for_provider(provider)
                )
            
            # Verify appropriate error code for expiration
            assert exc_info.value.error_code == AuthErrorCode.AUTH_SESSION_EXPIRED
            assert "expired" in str(exc_info.value).lower()
    
    @given(
        provider=st.sampled_from(["google", "apple", "microsoft"]),
        correct_client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        )),
        wrong_client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        ))
    )
    @settings(max_examples=100, deadline=10000)
    def test_audience_mismatch_validation_property(self, provider, correct_client_id, wrong_client_id):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Audience Mismatch)**
        
        For any social provider and any ID token with valid signature but
        wrong audience (client_id), the token validation function should fail
        and raise a TokenValidationError.
        
        This property verifies that:
        1. Audience validation is enforced across all providers
        2. Tokens intended for different clients are rejected
        3. Appropriate error is raised for audience mismatch
        """
        # Skip if client IDs are the same
        if correct_client_id == wrong_client_id:
            return
        
        # Create a token for the correct client ID
        token = self._create_valid_jwt(provider, correct_client_id)
        
        # Mock the JWKS client to return our test public key
        with patch('backend.auth.utils.validators._get_jwks_client') as mock_get_client:
            mock_get_client.return_value = self.mock_jwks_client
            
            # Try to validate with wrong client ID - should fail
            with pytest.raises(TokenValidationError) as exc_info:
                validate_jwt_signature(
                    id_token=token,
                    provider=provider,
                    client_id=wrong_client_id,  # Wrong audience
                    issuer=self._get_issuer_for_provider(provider)
                )
            
            # Verify appropriate error for audience mismatch
            assert exc_info.value.error_code == AuthErrorCode.AUTH_INVALID_TOKEN
            assert "audience" in str(exc_info.value).lower()
    
    @given(
        unsupported_provider=st.sampled_from(["facebook", "instagram", "twitter", "github"]),  # Non-JWKS providers
        client_id=st.text(min_size=10, max_size=100, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='.-_'
        ))
    )
    @settings(max_examples=100, deadline=5000)
    def test_unsupported_provider_validation_property(self, unsupported_provider, client_id):
        """
        **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
        **Property 2: Token Signature Validation (Unsupported Providers)**
        
        For any provider that doesn't support JWKS validation and any token,
        the token validation function should fail and raise a TokenValidationError
        indicating the provider doesn't support JWKS validation.
        
        This property verifies that:
        1. Non-JWKS providers are handled appropriately
        2. Clear error messages are provided for unsupported validation methods
        3. The function fails fast for providers without JWKS support
        """
        # Create any token (doesn't matter if valid or not)
        token = self._create_valid_jwt("google", client_id)  # Use google format but test with unsupported provider
        
        # Validate with unsupported provider - should fail
        with pytest.raises(TokenValidationError) as exc_info:
            validate_jwt_signature(
                id_token=token,
                provider=unsupported_provider,
                client_id=client_id
            )
        
        # Verify appropriate error for unsupported provider
        assert exc_info.value.error_code == AuthErrorCode.AUTH_PROVIDER_ERROR
        assert "does not support JWKS" in str(exc_info.value)


class TestRedirectURIValidationProperties:
    """Property-based tests for redirect URI validation."""
    
    def setup_method(self):
        """Set up test environment."""
        # Store original whitelist
        self.original_whitelist = AuthConfig.ALLOWED_REDIRECT_URIS.copy()
    
    def teardown_method(self):
        """Clean up test environment."""
        # Restore original whitelist
        AuthConfig.ALLOWED_REDIRECT_URIS = self.original_whitelist
    
    @given(
        whitelisted_uri=st.sampled_from([
            "https://app.example.com/callback",
            "https://mobile.example.com/auth",
            "https://admin.example.com/oauth/callback",
            "https://localhost:3000/callback",
            "http://localhost:8080/auth",
            "http://127.0.0.1:3000/callback"
        ])
    )
    @settings(max_examples=100, deadline=5000)
    def test_whitelisted_redirect_uri_validation_property(self, whitelisted_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (Whitelisted URIs)**
        
        For any redirect URL that is in the approved whitelist,
        the OAuth flow initiation should succeed and validate_redirect_uri
        should return True.
        
        This property verifies that:
        1. All whitelisted URIs are accepted by the validation function
        2. The whitelist validation works consistently
        3. Valid URIs return True as expected
        """
        # Add the URI to the whitelist
        AuthConfig.ALLOWED_REDIRECT_URIS = [whitelisted_uri]
        
        # Validate the whitelisted URI - should succeed
        result = validate_redirect_uri(whitelisted_uri)
        
        # Verify the URI is accepted
        assert result is True
    
    @given(
        non_whitelisted_uri=st.one_of(
            # Generate various non-whitelisted HTTPS URIs
            st.builds(
                lambda domain, path: f"https://{domain}.com{path}",
                domain=st.text(
                    min_size=3, max_size=20,
                    alphabet=st.characters(whitelist_categories=('Ll', 'Nd'))
                ).filter(lambda x: x not in ["app.example", "mobile.example", "admin.example"]),
                path=st.sampled_from(["/callback", "/auth", "/oauth/callback", "/login"])
            ),
            # Generate various non-whitelisted domains with common paths
            st.builds(
                lambda domain: f"https://{domain}/callback",
                domain=st.sampled_from([
                    "evil.com", "malicious.org", "phishing.net", "bad-actor.io",
                    "fake-app.com", "not-authorized.net", "unauthorized.org"
                ])
            ),
            # Generate URIs with different schemes
            st.builds(
                lambda scheme, domain: f"{scheme}://{domain}/callback",
                scheme=st.sampled_from(["ftp", "file", "data", "javascript"]),
                domain=st.text(
                    min_size=3, max_size=15,
                    alphabet=st.characters(whitelist_categories=('Ll', 'Nd'))
                )
            )
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_non_whitelisted_redirect_uri_validation_property(self, non_whitelisted_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (Non-whitelisted URIs)**
        
        For any redirect URL that is NOT in the approved whitelist,
        the OAuth flow initiation should fail and validate_redirect_uri
        should raise a RedirectURIValidationError.
        
        This property verifies that:
        1. All non-whitelisted URIs are rejected by the validation function
        2. The whitelist enforcement works consistently
        3. Appropriate error is raised for unauthorized URIs
        """
        # Set up a whitelist that doesn't contain the test URI
        AuthConfig.ALLOWED_REDIRECT_URIS = [
            "https://app.example.com/callback",
            "https://mobile.example.com/auth"
        ]
        
        # Skip if the generated URI happens to be in our test whitelist
        if non_whitelisted_uri in AuthConfig.ALLOWED_REDIRECT_URIS:
            return
        
        # Validate the non-whitelisted URI - should fail
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri(non_whitelisted_uri)
        
        # Verify appropriate error is raised
        assert "not in whitelist" in str(exc_info.value).lower()
    
    @given(
        valid_uri=st.builds(
            lambda domain, path, query: f"https://{domain}.com{path}{query}",
            domain=st.text(
                min_size=3, max_size=15,
                alphabet=st.characters(whitelist_categories=('Ll', 'Nd'))
            ),
            path=st.sampled_from(["/callback", "/auth", "/oauth/callback", "/login", "/redirect"]),
            query=st.one_of(
                st.just(""),
                st.builds(
                    lambda param, value: f"?{param}={value}",
                    param=st.sampled_from(["state", "code", "session"]),
                    value=st.text(min_size=5, max_size=20, alphabet=st.characters(
                        whitelist_categories=('Lu', 'Ll', 'Nd')
                    ))
                )
            )
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_whitelist_exact_match_property(self, valid_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (Exact Match)**
        
        For any redirect URL, the whitelist validation should perform exact matching.
        A URI should only be accepted if it exactly matches an entry in the whitelist,
        not if it's similar or a substring match.
        
        This property verifies that:
        1. Only exact matches are accepted from the whitelist
        2. Similar URIs (with different query params, paths, etc.) are rejected
        3. The validation is strict and secure
        """
        # Set up whitelist with the exact URI
        AuthConfig.ALLOWED_REDIRECT_URIS = [valid_uri]
        
        # The exact URI should be accepted
        result = validate_redirect_uri(valid_uri)
        assert result is True
        
        # Generate a slightly different URI that should be rejected
        if "?" in valid_uri:
            # Remove query parameters
            modified_uri = valid_uri.split("?")[0]
        else:
            # Add query parameters
            modified_uri = valid_uri + "?extra=param"
        
        # The modified URI should be rejected (not exact match)
        if modified_uri != valid_uri:
            with pytest.raises(RedirectURIValidationError) as exc_info:
                validate_redirect_uri(modified_uri)
            assert "not in whitelist" in str(exc_info.value).lower()
    
    @given(
        malformed_uri=st.one_of(
            st.just(""),  # Empty URI
            st.just("not-a-uri"),  # Not a URI at all
            st.just("://missing-scheme"),  # Missing scheme
            st.just("https://"),  # Missing hostname
            st.just("https:///path"),  # Empty hostname
            st.just("javascript:alert('xss')"),  # Dangerous scheme
            st.just("data:text/html,<script>alert('xss')</script>"),  # Data URI
            st.text(min_size=1, max_size=30, alphabet=st.characters(
                whitelist_categories=('P', 'S'),  # Punctuation and symbols only
                blacklist_characters=':/.'
            ))  # Random punctuation
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_malformed_redirect_uri_validation_property(self, malformed_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (Malformed URIs)**
        
        For any malformed or invalid redirect URL format,
        the validation function should fail gracefully and raise
        a RedirectURIValidationError with appropriate error message.
        
        This property verifies that:
        1. Malformed URIs are consistently rejected
        2. The function handles various types of invalid input gracefully
        3. Appropriate error messages are provided for different malformation types
        """
        # Set up a whitelist (doesn't matter what's in it for malformed URIs)
        AuthConfig.ALLOWED_REDIRECT_URIS = ["https://app.example.com/callback"]
        
        # Validate the malformed URI - should fail
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri(malformed_uri)
        
        # Verify appropriate error message
        error_message = str(exc_info.value).lower()
        assert any(keyword in error_message for keyword in [
            "empty", "invalid", "format", "hostname", "https", "whitelist"
        ])
    
    @given(
        http_uri=st.builds(
            lambda domain, path: f"http://{domain}.com{path}",
            domain=st.text(
                min_size=3, max_size=15,
                alphabet=st.characters(whitelist_categories=('Ll', 'Nd'))
            ).filter(lambda x: x not in ["localhost", "127"]),  # Exclude localhost
            path=st.sampled_from(["/callback", "/auth", "/oauth/callback"])
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_http_redirect_uri_validation_property(self, http_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (HTTP URIs)**
        
        For any redirect URL using HTTP protocol (except localhost),
        the validation function should fail and raise a RedirectURIValidationError
        requiring HTTPS protocol for security.
        
        This property verifies that:
        1. HTTP URIs are rejected for security reasons
        2. Only HTTPS is allowed for production redirect URIs
        3. Appropriate error message about HTTPS requirement is provided
        """
        # Set up whitelist with the HTTP URI (it should still be rejected due to protocol)
        AuthConfig.ALLOWED_REDIRECT_URIS = [http_uri]
        
        # Validate the HTTP URI - should fail due to protocol
        with pytest.raises(RedirectURIValidationError) as exc_info:
            validate_redirect_uri(http_uri)
        
        # Verify HTTPS requirement error
        assert "https" in str(exc_info.value).lower()
    
    @given(
        localhost_uri=st.builds(
            lambda host, port, path: f"http://{host}:{port}{path}",
            host=st.sampled_from(["localhost", "127.0.0.1"]),
            port=st.integers(min_value=3000, max_value=9999),
            path=st.sampled_from(["/callback", "/auth", "/oauth/callback"])
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_localhost_http_redirect_uri_validation_property(self, localhost_uri):
        """
        **Validates: Requirements 10.6**
        **Property 16: Redirect URL Whitelist Validation (Localhost HTTP)**
        
        For any redirect URL using HTTP protocol with localhost or 127.0.0.1,
        the validation function should allow it (development exception) if it's
        in the whitelist, since HTTPS is not required for localhost.
        
        This property verifies that:
        1. HTTP is allowed for localhost development
        2. Localhost URIs still require whitelist validation
        3. Development convenience is balanced with security
        """
        # Add the localhost URI to the whitelist
        AuthConfig.ALLOWED_REDIRECT_URIS = [localhost_uri]
        
        # Validate the localhost HTTP URI - should succeed
        result = validate_redirect_uri(localhost_uri)
        
        # Verify localhost HTTP is accepted when whitelisted
        assert result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])