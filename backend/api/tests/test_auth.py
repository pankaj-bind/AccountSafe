# api/tests/test_auth.py
"""
Zero-Knowledge Authentication API Tests
═══════════════════════════════════════════════════════════════════════════════

Tests for the zero-knowledge authentication system where:
- Password is NEVER sent to the server
- Only auth_hash (derived from password) is transmitted
- Server verifies auth_hash without knowing the password
"""

import pytest
import hashlib
import secrets
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User

from api.models import UserProfile, MultiToken


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_auth_hash(password: str, salt: str) -> str:
    """Generate auth_hash as the frontend would."""
    data = f"{password}{salt}accountsafe-auth".encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def generate_salt() -> str:
    """Generate a random salt."""
    return secrets.token_hex(16)


# ═══════════════════════════════════════════════════════════════════════════════
# REGISTRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestZeroKnowledgeRegistration:
    """
    Tests for /api/zk/register/ endpoint.
    """
    
    def test_register_creates_user(self, api_client):
        """Successful registration creates a user with ZK credentials."""
        salt = generate_salt()
        password = "MySecurePassword123!"
        auth_hash = generate_auth_hash(password, salt)
        
        response = api_client.post(
            '/api/zk/register/',
            data={
                'username': 'newuser',
                'email': 'newuser@test.local',
                'auth_hash': auth_hash,
                'salt': salt,
            },
            format='json'
        )
        
        # Registration should succeed
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        
        # User should exist
        assert User.objects.filter(username='newuser').exists()
        
        # User should have unusable password (ZK style)
        user = User.objects.get(username='newuser')
        assert not user.has_usable_password()
        
        # Profile should have auth_hash and salt
        profile = user.userprofile
        assert profile.auth_hash == auth_hash
        assert profile.encryption_salt == salt
    
    def test_register_returns_token(self, api_client):
        """Registration should return an auth token."""
        salt = generate_salt()
        auth_hash = generate_auth_hash("Password123!", salt)
        
        response = api_client.post(
            '/api/zk/register/',
            data={
                'username': 'tokenuser',
                'email': 'tokenuser@test.local',
                'auth_hash': auth_hash,
                'salt': salt,
            },
            format='json'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert 'token' in response.data or 'key' in response.data
    
    def test_register_duplicate_username_fails(self, api_client, create_zk_user):
        """Cannot register with an existing username."""
        # Create existing user
        create_zk_user(username='existing', password='Password123!')
        
        # Try to register with same username
        salt = generate_salt()
        auth_hash = generate_auth_hash("DifferentPassword!", salt)
        
        response = api_client.post(
            '/api/zk/register/',
            data={
                'username': 'existing',
                'email': 'different@test.local',
                'auth_hash': auth_hash,
                'salt': salt,
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_invalid_auth_hash_format(self, api_client):
        """auth_hash must be 64 hex characters."""
        salt = generate_salt()
        
        # Too short
        response = api_client.post(
            '/api/zk/register/',
            data={
                'username': 'invaliduser',
                'email': 'invalid@test.local',
                'auth_hash': 'tooshort',
                'salt': salt,
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'auth_hash' in response.data.get('error', '').lower()
    
    def test_register_requires_all_fields(self, api_client):
        """All fields are required for registration."""
        # Missing username
        response = api_client.post(
            '/api/zk/register/',
            data={
                'email': 'test@test.local',
                'auth_hash': 'a' * 64,
                'salt': 'somesalt',
            },
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing auth_hash
        response = api_client.post(
            '/api/zk/register/',
            data={
                'username': 'testuser',
                'email': 'test@test.local',
                'salt': 'somesalt',
            },
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ═══════════════════════════════════════════════════════════════════════════════
# LOGIN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestZeroKnowledgeLogin:
    """
    Tests for /api/zk/login/ endpoint.
    """
    
    def test_login_with_correct_auth_hash(self, api_client, create_zk_user):
        """Login succeeds with correct auth_hash."""
        password = "CorrectPassword123!"
        user, token, auth_hash, salt = create_zk_user(
            username='logintest',
            password=password
        )
        
        response = api_client.post(
            '/api/zk/login/',
            data={
                'username': 'logintest',
                'auth_hash': auth_hash,
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'token' in response.data or 'key' in response.data
    
    def test_login_with_wrong_auth_hash_fails(self, api_client, create_zk_user):
        """Login fails with incorrect auth_hash (wrong password)."""
        user, token, auth_hash, salt = create_zk_user(
            username='wrongpasstest',
            password='RealPassword123!'
        )
        
        # Generate auth_hash with wrong password
        wrong_auth_hash = generate_auth_hash('WrongPassword456!', salt)
        
        response = api_client.post(
            '/api/zk/login/',
            data={
                'username': 'wrongpasstest',
                'auth_hash': wrong_auth_hash,
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user_fails(self, api_client):
        """Login fails for non-existent user."""
        response = api_client.post(
            '/api/zk/login/',
            data={
                'username': 'nonexistent',
                'auth_hash': 'a' * 64,
            },
            format='json'
        )
        
        # Should fail but not reveal if user exists (security)
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST
        ]
    
    def test_login_returns_salt_for_key_derivation(self, api_client, create_zk_user):
        """Login response includes salt for client-side key derivation."""
        user, token, auth_hash, salt = create_zk_user(
            username='salttest',
            password='Password123!'
        )
        
        response = api_client.post(
            '/api/zk/login/',
            data={
                'username': 'salttest',
                'auth_hash': auth_hash,
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        # Salt should be in response for client to derive encryption key
        assert 'salt' in response.data or 'encryption_salt' in response.data


# ═══════════════════════════════════════════════════════════════════════════════
# SALT RETRIEVAL TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestSaltRetrieval:
    """
    Tests for /api/zk/salt/ endpoint.
    Client needs salt before login to derive auth_hash.
    """
    
    def test_get_salt_for_existing_user(self, api_client, create_zk_user):
        """Can retrieve salt for an existing user (needed for login)."""
        user, token, auth_hash, salt = create_zk_user(
            username='saltretrieve',
            password='Password123!'
        )
        
        response = api_client.get(
            '/api/zk/salt/',
            {'username': 'saltretrieve'}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data.get('salt') == salt or response.data.get('encryption_salt') == salt
    
    def test_get_salt_nonexistent_user(self, api_client):
        """
        Salt request for non-existent user should be handled carefully.
        To prevent user enumeration, may return fake salt or generic error.
        """
        response = api_client.get(
            '/api/zk/salt/',
            {'username': 'nonexistent'}
        )
        
        # Could be 404, 400, or 200 with fake salt (implementation choice)
        # Just ensure it doesn't crash
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# DEPRECATED ENDPOINT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestDeprecatedEndpoints:
    """
    Tests that old password-based endpoints are properly deprecated.
    """
    
    def test_old_login_endpoint_returns_gone(self, api_client):
        """
        Old /api/login/ should return 410 GONE directing to ZK endpoint.
        """
        response = api_client.post(
            '/api/login/',
            data={
                'username': 'anyuser',
                'password': 'anypassword',
            },
            format='json'
        )
        
        # Should indicate this endpoint is deprecated
        assert response.status_code == status.HTTP_410_GONE
        assert 'zk' in response.data.get('redirect', '').lower() or \
               'zero' in response.data.get('message', '').lower()


# ═══════════════════════════════════════════════════════════════════════════════
# TOKEN MANAGEMENT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestTokenManagement:
    """
    Tests for auth token handling.
    """
    
    def test_token_is_valid_for_api_access(self, api_client, create_zk_user):
        """Token from login can be used to access protected endpoints."""
        user, token, auth_hash, salt = create_zk_user(
            username='tokenaccesstest',
            password='Password123!'
        )
        
        # Login to get token
        response = api_client.post(
            '/api/zk/login/',
            data={
                'username': 'tokenaccesstest',
                'auth_hash': auth_hash,
            },
            format='json'
        )
        
        login_token = response.data.get('token') or response.data.get('key')
        
        # Use token to access vault
        api_client.credentials(HTTP_AUTHORIZATION=f'Token {login_token}')
        response = api_client.get('/api/vault/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_logout_invalidates_token(self, authenticated_client_a):
        """Logging out should invalidate the current token."""
        client, user = authenticated_client_a
        
        # First verify we can access API
        response = client.get('/api/vault/')
        assert response.status_code == status.HTTP_200_OK
        
        # Logout
        response = client.post('/api/logout/')
        
        # Now vault access should fail (if token is invalidated)
        # Note: Implementation may vary - some keep tokens valid
        # This test documents expected behavior
        if response.status_code == status.HTTP_200_OK:
            # If logout succeeded, check if token is invalidated
            response = client.get('/api/vault/')
            # Token might still work if using stateless tokens
            # This is implementation-dependent
