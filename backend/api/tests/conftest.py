# api/tests/conftest.py
"""
Pytest Fixtures for AccountSafe Backend Tests
═══════════════════════════════════════════════════════════════════════════════

Provides reusable fixtures for:
- User creation with zero-knowledge auth
- API client configuration
- Test data factories
"""

import pytest
import secrets
import hashlib
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from api.models import UserProfile, MultiToken


# ═══════════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════════════════

def generate_auth_hash(password: str, salt: str) -> str:
    """
    Generate auth_hash exactly as the frontend would.
    This is NOT the encryption key - it's derived with 'auth' context.
    """
    # Frontend derivation: SHA-256(password + salt + 'accountsafe-auth')
    data = f"{password}{salt}accountsafe-auth".encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def generate_salt() -> str:
    """Generate a random 16-byte salt encoded as hex."""
    return secrets.token_hex(16)


def generate_fake_vault_blob() -> str:
    """
    Generate a fake encrypted vault blob.
    In real usage, this would be AES-256-GCM encrypted data.
    For tests, we just need something that looks like encrypted data.
    """
    # Format: base64(iv) + "." + base64(ciphertext)
    import base64
    iv = secrets.token_bytes(12)  # 96-bit IV for AES-GCM
    ciphertext = secrets.token_bytes(64)  # Fake encrypted content
    return base64.b64encode(iv).decode() + "." + base64.b64encode(ciphertext).decode()


# ═══════════════════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def api_client():
    """Return a fresh API client for each test."""
    return APIClient()


@pytest.fixture
def user_password():
    """A known password for testing."""
    return "TestPassword123!@#"


@pytest.fixture
def user_salt():
    """A known salt for testing."""
    return generate_salt()


@pytest.fixture
def create_zk_user(db):
    """
    Factory fixture to create users with zero-knowledge authentication.
    
    Usage:
        user, token, auth_hash = create_zk_user(username="alice", password="secret123")
    """
    def _create_zk_user(username: str, password: str, email: str = None):
        if email is None:
            email = f"{username}@test.accountsafe.local"
        
        # Generate salt and auth_hash (as frontend would)
        salt = generate_salt()
        auth_hash = generate_auth_hash(password, salt)
        
        # Create user with unusable password (ZK style)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=None  # Unusable password
        )
        user.set_unusable_password()
        user.save()
        
        # Get or create profile (signals may auto-create it)
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.encryption_salt = salt
        profile.auth_hash = auth_hash
        profile.save()
        
        # Create auth token
        token = MultiToken.objects.create(user=user)
        
        return user, token.key, auth_hash, salt
    
    return _create_zk_user


@pytest.fixture
def user_a(create_zk_user):
    """Create User A for isolation tests."""
    return create_zk_user(username="user_a", password="PasswordA123!")


@pytest.fixture
def user_b(create_zk_user):
    """Create User B for isolation tests."""
    return create_zk_user(username="user_b", password="PasswordB456!")


@pytest.fixture
def authenticated_client_a(api_client, user_a):
    """API client authenticated as User A."""
    user, token, auth_hash, salt = user_a
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
    return api_client, user


@pytest.fixture
def authenticated_client_b(api_client, user_b):
    """API client authenticated as User B."""
    client = APIClient()
    user, token, auth_hash, salt = user_b
    client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
    return client, user


@pytest.fixture
def sample_vault_blob():
    """A sample encrypted vault blob for testing."""
    return generate_fake_vault_blob()


@pytest.fixture
def sample_decoy_vault_blob():
    """A sample encrypted decoy vault blob for testing."""
    return generate_fake_vault_blob()
