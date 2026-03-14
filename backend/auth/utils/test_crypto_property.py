"""
Property-based tests for encryption utilities.

**Validates: Requirements 10.5**
**Property 15: Refresh Token Encryption Round Trip**

This module contains property-based tests that verify the encryption
round trip property holds for all possible refresh token values.
"""

import pytest
import os
import base64
from hypothesis import given, settings, strategies as st
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .crypto import (
    encrypt_refresh_token,
    decrypt_refresh_token,
    EncryptionError,
    _clear_key_cache
)


class TestEncryptionRoundTripProperties:
    """Property-based tests for encryption round trip."""
    
    def setup_method(self):
        """Set up test encryption key."""
        # Clear any cached key
        _clear_key_cache()
        # Generate a test key
        test_key = AESGCM.generate_key(bit_length=256)
        os.environ["ENCRYPTION_KEY"] = base64.b64encode(test_key).decode('utf-8')
        # Clear cache again to force reload from environment
        _clear_key_cache()
    
    def teardown_method(self):
        """Clean up environment."""
        _clear_key_cache()
        if "ENCRYPTION_KEY" in os.environ:
            del os.environ["ENCRYPTION_KEY"]

    @given(refresh_token=st.text(min_size=1, max_size=1000))
    @settings(max_examples=100, deadline=5000)
    def test_encryption_round_trip_property(self, refresh_token):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip**
        
        For any refresh token, when stored in the database it should be encrypted,
        and when retrieved it should be decrypted back to the original value.
        
        This property verifies that:
        1. encrypt_refresh_token(token) produces encrypted output
        2. decrypt_refresh_token(encrypted) returns the original token
        3. The round trip is lossless for all possible token values
        """
        # Encrypt the refresh token
        encrypted_token = encrypt_refresh_token(refresh_token)
        
        # Verify the encrypted token is different from the original
        # (unless the original is somehow the same as base64 encoded encrypted data,
        # which is extremely unlikely)
        assert encrypted_token != refresh_token, "Encrypted token should differ from original"
        
        # Verify the encrypted token is valid base64
        try:
            base64.b64decode(encrypted_token)
        except Exception:
            pytest.fail("Encrypted token should be valid base64")
        
        # Decrypt the token
        decrypted_token = decrypt_refresh_token(encrypted_token)
        
        # Verify the round trip is lossless
        assert decrypted_token == refresh_token, (
            f"Round trip failed: original='{refresh_token}', "
            f"decrypted='{decrypted_token}'"
        )

    @given(refresh_token=st.text(min_size=1, max_size=500))
    @settings(max_examples=100, deadline=5000)
    def test_encryption_produces_different_ciphertext_property(self, refresh_token):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip (Nonce Uniqueness)**
        
        For any refresh token, encrypting it multiple times should produce
        different ciphertext due to random nonce generation, but all
        ciphertexts should decrypt to the same original value.
        
        This ensures that the encryption is non-deterministic (secure against
        pattern analysis) while maintaining correctness.
        """
        # Encrypt the same token twice
        encrypted1 = encrypt_refresh_token(refresh_token)
        encrypted2 = encrypt_refresh_token(refresh_token)
        
        # Ciphertexts should be different (due to random nonce)
        assert encrypted1 != encrypted2, (
            "Multiple encryptions of the same token should produce different ciphertext"
        )
        
        # Both should decrypt to the original value
        decrypted1 = decrypt_refresh_token(encrypted1)
        decrypted2 = decrypt_refresh_token(encrypted2)
        
        assert decrypted1 == refresh_token
        assert decrypted2 == refresh_token

    @given(refresh_token=st.text(
        alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Ps', 'Pe', 'Sm', 'Sc'),
            whitelist_characters='!@#$%^&*()_+-=[]{}|;:,.<>?'
        ),
        min_size=1,
        max_size=200
    ))
    @settings(max_examples=100, deadline=5000)
    def test_encryption_special_characters_property(self, refresh_token):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip (Special Characters)**
        
        For any refresh token containing special characters, numbers, and
        mixed case letters, the encryption round trip should preserve
        all characters exactly.
        
        This ensures the encryption works correctly with realistic JWT
        refresh tokens that contain various character sets.
        """
        # Encrypt the token
        encrypted_token = encrypt_refresh_token(refresh_token)
        
        # Decrypt the token
        decrypted_token = decrypt_refresh_token(encrypted_token)
        
        # Verify exact preservation of all characters
        assert decrypted_token == refresh_token
        assert len(decrypted_token) == len(refresh_token)

    @given(refresh_token=st.text(
        alphabet=st.characters(min_codepoint=1, max_codepoint=0x10FFFF),
        min_size=1,
        max_size=100
    ))
    @settings(max_examples=100, deadline=5000)
    def test_encryption_unicode_property(self, refresh_token):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip (Unicode Support)**
        
        For any refresh token containing Unicode characters, the encryption
        round trip should preserve all Unicode characters exactly.
        
        This ensures the encryption works correctly with internationalized
        content and various Unicode character sets.
        """
        # Encrypt the token
        encrypted_token = encrypt_refresh_token(refresh_token)
        
        # Decrypt the token
        decrypted_token = decrypt_refresh_token(encrypted_token)
        
        # Verify exact preservation of Unicode characters
        assert decrypted_token == refresh_token
        assert decrypted_token.encode('utf-8') == refresh_token.encode('utf-8')

    @given(refresh_token=st.text(min_size=1, max_size=50))
    @settings(max_examples=50, deadline=10000)
    def test_encryption_idempotent_decryption_property(self, refresh_token):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip (Idempotency)**
        
        For any refresh token, multiple decryption attempts of the same
        encrypted token should always return the same result.
        
        This ensures that decryption is deterministic and consistent.
        """
        # Encrypt the token once
        encrypted_token = encrypt_refresh_token(refresh_token)
        
        # Decrypt multiple times
        decrypted1 = decrypt_refresh_token(encrypted_token)
        decrypted2 = decrypt_refresh_token(encrypted_token)
        decrypted3 = decrypt_refresh_token(encrypted_token)
        
        # All decryptions should be identical
        assert decrypted1 == decrypted2 == decrypted3 == refresh_token

    @given(
        refresh_token=st.text(min_size=1, max_size=100),
        iterations=st.integers(min_value=2, max_value=5)
    )
    @settings(max_examples=50, deadline=10000)
    def test_encryption_multiple_round_trips_property(self, refresh_token, iterations):
        """
        **Validates: Requirements 10.5**
        **Property 15: Refresh Token Encryption Round Trip (Multiple Rounds)**
        
        For any refresh token, performing multiple encryption/decryption
        round trips should always preserve the original value.
        
        This tests the robustness of the encryption implementation
        across multiple operations.
        """
        current_token = refresh_token
        
        # Perform multiple round trips
        for i in range(iterations):
            encrypted = encrypt_refresh_token(current_token)
            decrypted = decrypt_refresh_token(encrypted)
            
            # Each round trip should preserve the value
            assert decrypted == current_token
            
            # Use the decrypted value for the next iteration
            current_token = decrypted
        
        # Final result should match the original
        assert current_token == refresh_token


if __name__ == "__main__":
    pytest.main([__file__, "-v"])