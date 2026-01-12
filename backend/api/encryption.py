# api/encryption.py

from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib


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
