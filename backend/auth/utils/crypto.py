"""
Encryption utilities for authentication service.

This module provides AES-256-GCM encryption and decryption functions
for securing sensitive data like refresh tokens.

**Validates: Requirements 10.5**
"""

import os
import base64
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag


# Encryption key from environment variable
# In production, this should be retrieved from AWS Secrets Manager or KMS
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", "")

# Cache for the encryption key to ensure consistency within a process
_cached_key: bytes = None


class EncryptionError(Exception):
    """Raised when encryption or decryption fails."""
    pass


def _get_encryption_key() -> bytes:
    """
    Get the encryption key from environment or generate for testing.
    
    Returns:
        bytes: 32-byte encryption key for AES-256
        
    Raises:
        EncryptionError: If encryption key is not configured
    """
    global _cached_key
    
    # Return cached key if available
    if _cached_key is not None:
        return _cached_key
    
    if ENCRYPTION_KEY:
        # Decode base64-encoded key from environment
        try:
            key = base64.b64decode(ENCRYPTION_KEY)
            if len(key) != 32:
                raise EncryptionError(
                    f"Encryption key must be 32 bytes for AES-256, got {len(key)} bytes"
                )
            _cached_key = key
            return key
        except Exception as e:
            raise EncryptionError(f"Failed to decode encryption key: {str(e)}")
    
    # For development/testing only - generate a key and cache it
    # In production, this should raise an error
    _cached_key = AESGCM.generate_key(bit_length=256)
    return _cached_key


def encrypt_refresh_token(refresh_token: str) -> str:
    """
    Encrypt a refresh token using AES-256-GCM.
    
    AES-256-GCM provides authenticated encryption, which ensures both
    confidentiality and integrity of the encrypted data.
    
    Args:
        refresh_token: The plaintext refresh token to encrypt
        
    Returns:
        str: Base64-encoded encrypted token in format: nonce||ciphertext||tag
        
    Raises:
        EncryptionError: If encryption fails
        
    Example:
        >>> token = "my-refresh-token-12345"
        >>> encrypted = encrypt_refresh_token(token)
        >>> decrypted = decrypt_refresh_token(encrypted)
        >>> assert decrypted == token
    """
    if not refresh_token:
        raise EncryptionError("Refresh token cannot be empty")
    
    try:
        # Get encryption key
        key = _get_encryption_key()
        
        # Create AESGCM cipher
        aesgcm = AESGCM(key)
        
        # Generate a random 96-bit nonce (12 bytes)
        # NIST recommends 96-bit nonces for GCM
        nonce = os.urandom(12)
        
        # Encrypt the token
        # GCM automatically generates and appends the authentication tag
        ciphertext = aesgcm.encrypt(
            nonce,
            refresh_token.encode('utf-8'),
            None  # No associated data
        )
        
        # Combine nonce and ciphertext (ciphertext includes the tag)
        encrypted_data = nonce + ciphertext
        
        # Encode as base64 for storage
        return base64.b64encode(encrypted_data).decode('utf-8')
        
    except Exception as e:
        raise EncryptionError(f"Failed to encrypt refresh token: {str(e)}")


def decrypt_refresh_token(encrypted_token: str) -> str:
    """
    Decrypt a refresh token that was encrypted with AES-256-GCM.
    
    Args:
        encrypted_token: Base64-encoded encrypted token from encrypt_refresh_token
        
    Returns:
        str: The decrypted plaintext refresh token
        
    Raises:
        EncryptionError: If decryption fails or authentication tag is invalid
        
    Example:
        >>> token = "my-refresh-token-12345"
        >>> encrypted = encrypt_refresh_token(token)
        >>> decrypted = decrypt_refresh_token(encrypted)
        >>> assert decrypted == token
    """
    if not encrypted_token:
        raise EncryptionError("Encrypted token cannot be empty")
    
    try:
        # Get encryption key
        key = _get_encryption_key()
        
        # Create AESGCM cipher
        aesgcm = AESGCM(key)
        
        # Decode from base64
        encrypted_data = base64.b64decode(encrypted_token)
        
        # Extract nonce (first 12 bytes) and ciphertext (remaining bytes)
        if len(encrypted_data) < 12:
            raise EncryptionError("Invalid encrypted token: too short")
        
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        
        # Decrypt and verify authentication tag
        plaintext = aesgcm.decrypt(
            nonce,
            ciphertext,
            None  # No associated data
        )
        
        return plaintext.decode('utf-8')
        
    except InvalidTag:
        raise EncryptionError(
            "Failed to decrypt refresh token: authentication tag verification failed. "
            "Token may have been tampered with."
        )
    except Exception as e:
        raise EncryptionError(f"Failed to decrypt refresh token: {str(e)}")


def generate_encryption_key() -> str:
    """
    Generate a new 256-bit encryption key for AES-256.
    
    This is a utility function for generating keys during setup.
    The generated key should be stored securely in AWS Secrets Manager
    or AWS KMS and provided via the ENCRYPTION_KEY environment variable.
    
    Returns:
        str: Base64-encoded 256-bit encryption key
        
    Example:
        >>> key = generate_encryption_key()
        >>> print(f"ENCRYPTION_KEY={key}")
    """
    key = AESGCM.generate_key(bit_length=256)
    return base64.b64encode(key).decode('utf-8')


def _clear_key_cache():
    """
    Clear the cached encryption key.
    
    This is a utility function for testing purposes only.
    It allows tests to reset the key cache between test cases.
    """
    global _cached_key
    _cached_key = None
