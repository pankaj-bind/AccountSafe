# api/encryption.py

from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib
import os
import secrets


def get_encryption_key():
    """
    Generate encryption key from Django SECRET_KEY.
    This ensures consistent encryption key derived from SECRET_KEY.
    """
    # Use SHA256 to derive a 32-byte key from SECRET_KEY
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    # Fernet requires base64-encoded 32-byte key
    return base64.urlsafe_b64encode(key)


def encrypt_data(plain_text):
    """
    Encrypt plain text data.
    Returns encrypted string or None if input is None/empty.
    """
    if not plain_text:
        return None
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(plain_text.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        return None


def decrypt_data(encrypted_text):
    """
    Decrypt encrypted data.
    Returns decrypted string or None if input is None/empty.
    """
    if not encrypted_text:
        return None
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_text.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return None


# --- Shared Secret Encryption (with unique salt per secret) ---

def generate_salt():
    """Generate a random 32-byte salt and return as hex string"""
    return secrets.token_hex(32)


def get_shared_secret_key(salt):
    """
    Derive encryption key from SECRET_KEY + unique salt.
    This ensures each shared secret has a unique encryption key.
    """
    combined = f"{settings.SECRET_KEY}{salt}".encode()
    key = hashlib.sha256(combined).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_shared_secret(plain_text, salt):
    """
    Encrypt data for secure link sharing with unique salt.
    Returns encrypted string or None if input is None/empty.
    """
    if not plain_text:
        return None
    
    try:
        key = get_shared_secret_key(salt)
        fernet = Fernet(key)
        encrypted = fernet.encrypt(plain_text.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Shared secret encryption error: {e}")
        return None


def decrypt_shared_secret(encrypted_text, salt):
    """
    Decrypt shared secret data using the unique salt.
    Returns decrypted string or None if input is None/empty.
    """
    if not encrypted_text:
        return None
    
    try:
        key = get_shared_secret_key(salt)
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_text.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"Shared secret decryption error: {e}")
        return None


def secure_erase_field(value):
    """
    Generate cryptographically secure random data the same length as the input.
    Used for secure erasure before deletion (best-effort overwrite).
    """
    if not value:
        return value
    # Generate random bytes matching the length of the encrypted data
    random_bytes = os.urandom(len(value))
    return base64.b64encode(random_bytes).decode()[:len(value)]
