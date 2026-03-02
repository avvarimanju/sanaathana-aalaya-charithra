"""
Unit tests for encryption utilities.

Tests the AES-256-GCM encryption and decryption functions.
"""

import pytest
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .crypto import (
    encrypt_refresh_token,
    decrypt_refresh_token,
    generate_encryption_key,
    EncryptionError,
    _clear_key_cache
)


class TestEncryptionUtilities:
    """Test suite for encryption utilities."""
    
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
    
    def test_encrypt_decrypt_round_trip(self):
        """Test that encryption and decryption are inverse operations."""
        original_token = "my-refresh-token-12345"
        
        # Encrypt
        encrypted = encrypt_refresh_token(original_token)
        
        # Verify it's different from original
        assert encrypted != original_token
        
        # Decrypt
        decrypted = decrypt_refresh_token(encrypted)
        
        # Verify we get back the original
        assert decrypted == original_token
    
    def test_encrypt_produces_different_ciphertext(self):
        """Test that encrypting the same token twice produces different ciphertext."""
        token = "my-refresh-token-12345"
        
        encrypted1 = encrypt_refresh_token(token)
        encrypted2 = encrypt_refresh_token(token)
        
        # Should be different due to random nonce
        assert encrypted1 != encrypted2
        
        # But both should decrypt to the same value
        assert decrypt_refresh_token(encrypted1) == token
        assert decrypt_refresh_token(encrypted2) == token
    
    def test_encrypt_empty_token_raises_error(self):
        """Test that encrypting an empty token raises an error."""
        with pytest.raises(EncryptionError, match="cannot be empty"):
            encrypt_refresh_token("")
    
    def test_decrypt_empty_token_raises_error(self):
        """Test that decrypting an empty token raises an error."""
        with pytest.raises(EncryptionError, match="cannot be empty"):
            decrypt_refresh_token("")
    
    def test_decrypt_invalid_token_raises_error(self):
        """Test that decrypting an invalid token raises an error."""
        with pytest.raises(EncryptionError):
            decrypt_refresh_token("invalid-base64-data")
    
    def test_decrypt_tampered_token_raises_error(self):
        """Test that decrypting a tampered token raises an error."""
        token = "my-refresh-token-12345"
        encrypted = encrypt_refresh_token(token)
        
        # Tamper with the encrypted data
        encrypted_bytes = base64.b64decode(encrypted)
        tampered_bytes = encrypted_bytes[:-1] + b'X'  # Change last byte
        tampered_encrypted = base64.b64encode(tampered_bytes).decode('utf-8')
        
        # Should fail authentication
        with pytest.raises(EncryptionError, match="authentication tag"):
            decrypt_refresh_token(tampered_encrypted)
    
    def test_decrypt_short_token_raises_error(self):
        """Test that decrypting a token that's too short raises an error."""
        # Create a token that's shorter than the nonce size
        short_data = base64.b64encode(b"short").decode('utf-8')
        
        with pytest.raises(EncryptionError, match="too short"):
            decrypt_refresh_token(short_data)
    
    def test_encrypt_long_token(self):
        """Test encrypting a long refresh token."""
        # Create a long token (typical JWT refresh token)
        long_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9." * 10
        
        encrypted = encrypt_refresh_token(long_token)
        decrypted = decrypt_refresh_token(encrypted)
        
        assert decrypted == long_token
    
    def test_encrypt_unicode_token(self):
        """Test encrypting a token with unicode characters."""
        unicode_token = "token-with-unicode-🔐-characters"
        
        encrypted = encrypt_refresh_token(unicode_token)
        decrypted = decrypt_refresh_token(encrypted)
        
        assert decrypted == unicode_token
    
    def test_generate_encryption_key(self):
        """Test that generate_encryption_key produces valid keys."""
        key1 = generate_encryption_key()
        key2 = generate_encryption_key()
        
        # Keys should be different
        assert key1 != key2
        
        # Keys should be valid base64
        decoded1 = base64.b64decode(key1)
        decoded2 = base64.b64decode(key2)
        
        # Keys should be 32 bytes (256 bits)
        assert len(decoded1) == 32
        assert len(decoded2) == 32
    
    def test_encryption_with_generated_key(self):
        """Test encryption works with a generated key."""
        # Clear cache and generate a new key
        _clear_key_cache()
        new_key = generate_encryption_key()
        os.environ["ENCRYPTION_KEY"] = new_key
        _clear_key_cache()  # Force reload from environment
        
        token = "test-token-with-generated-key"
        encrypted = encrypt_refresh_token(token)
        decrypted = decrypt_refresh_token(encrypted)
        
        assert decrypted == token


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
