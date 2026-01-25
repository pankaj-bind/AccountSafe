# api/tests/test_vault_api.py
"""
Zero-Knowledge Vault API Integration Tests
═══════════════════════════════════════════════════════════════════════════════

CRITICAL TEST FILE - These tests verify:
1. Vault isolation between users (User A cannot access User B's vault)
2. Exact blob preservation (server stores exactly what client sends)
3. Duress mode functionality (decoy vault handling)
4. Authentication requirements

Security Model Being Tested:
- Server CANNOT decrypt vault contents
- Server stores encrypted blobs exactly as received
- User vaults are strictly isolated
"""

import pytest
import json
from django.urls import reverse
from rest_framework import status

from api.models import UserProfile


# ═══════════════════════════════════════════════════════════════════════════════
# VAULT ISOLATION TESTS - The Most Critical Security Tests
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
@pytest.mark.security
class TestVaultIsolation:
    """
    Tests that verify users cannot access each other's vaults.
    A failure here is a CRITICAL SECURITY VULNERABILITY.
    """
    
    def test_user_a_cannot_fetch_user_b_vault_direct_profile_access(
        self, authenticated_client_a, user_b, sample_vault_blob
    ):
        """
        SECURITY: User A MUST NOT be able to access User B's vault data.
        
        Scenario:
        1. User B stores a vault blob
        2. User A tries to fetch vault data
        3. User A should only get their OWN vault (not User B's)
        """
        client_a, user_a_obj = authenticated_client_a
        user_b_obj, _, _, _ = user_b
        
        # User B stores a vault blob (directly via model for setup)
        profile_b = user_b_obj.userprofile
        profile_b.vault_blob = sample_vault_blob
        profile_b.save()
        
        # User A fetches vault via API
        response = client_a.get('/api/vault/')
        
        assert response.status_code == status.HTTP_200_OK
        
        # CRITICAL: User A's response should NOT contain User B's vault
        assert response.data.get('vault_blob') != sample_vault_blob
        
        # User A should get their own vault (which is None/empty)
        assert response.data.get('vault_blob') is None
    
    def test_user_a_put_does_not_affect_user_b(
        self, authenticated_client_a, authenticated_client_b, sample_vault_blob
    ):
        """
        SECURITY: User A updating their vault MUST NOT modify User B's vault.
        """
        client_a, user_a_obj = authenticated_client_a
        client_b, user_b_obj = authenticated_client_b
        
        # Set up User B's vault first
        user_b_original_blob = "USER_B_ORIGINAL_ENCRYPTED_BLOB_12345"
        profile_b = user_b_obj.userprofile
        profile_b.vault_blob = user_b_original_blob
        profile_b.save()
        
        # User A updates their vault
        response = client_a.put(
            '/api/vault/',
            data={'vault_blob': sample_vault_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Verify User B's vault is UNCHANGED
        profile_b.refresh_from_db()
        assert profile_b.vault_blob == user_b_original_blob
    
    def test_vault_requires_authentication(self, api_client, sample_vault_blob):
        """
        Unauthenticated requests MUST be rejected.
        """
        # GET without auth
        response = api_client.get('/api/vault/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # PUT without auth
        response = api_client.put(
            '/api/vault/',
            data={'vault_blob': sample_vault_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # DELETE without auth
        response = api_client.delete('/api/vault/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ═══════════════════════════════════════════════════════════════════════════════
# EXACT BLOB PRESERVATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
@pytest.mark.security
class TestBlobPreservation:
    """
    Tests that verify the server stores EXACTLY what the client sends.
    No server-side modification of encrypted data is allowed.
    """
    
    def test_vault_blob_stored_exactly_as_sent(
        self, authenticated_client_a, sample_vault_blob
    ):
        """
        The server MUST store the encrypted blob byte-for-byte as sent.
        Any modification would corrupt the encryption.
        """
        client, user = authenticated_client_a
        
        # Store the vault
        response = client.put(
            '/api/vault/',
            data={'vault_blob': sample_vault_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Fetch it back
        response = client.get('/api/vault/')
        assert response.status_code == status.HTTP_200_OK
        
        # CRITICAL: Blob must be exactly the same
        assert response.data['vault_blob'] == sample_vault_blob
    
    def test_special_characters_preserved(self, authenticated_client_a):
        """
        Encrypted blobs may contain special characters (base64).
        These MUST be preserved exactly.
        """
        client, user = authenticated_client_a
        
        # A blob with special base64 characters
        special_blob = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=="
        
        response = client.put(
            '/api/vault/',
            data={'vault_blob': special_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == special_blob
    
    def test_unicode_in_blob_preserved(self, authenticated_client_a):
        """
        Although rare, unicode in blobs MUST be preserved.
        """
        client, user = authenticated_client_a
        
        unicode_blob = "encrypted_data_with_émojis_🔐_and_中文"
        
        response = client.put(
            '/api/vault/',
            data={'vault_blob': unicode_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == unicode_blob
    
    def test_large_blob_preserved(self, authenticated_client_a):
        """
        Large vaults (many credentials) must be stored correctly.
        """
        client, user = authenticated_client_a
        
        # Simulate a large vault (~100KB of encrypted data)
        large_blob = "A" * 100_000
        
        response = client.put(
            '/api/vault/',
            data={'vault_blob': large_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == large_blob
        assert len(response.data['vault_blob']) == 100_000


# ═══════════════════════════════════════════════════════════════════════════════
# VAULT CRUD OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestVaultCRUD:
    """
    Standard CRUD operation tests for vault API.
    """
    
    def test_create_and_retrieve_vault(
        self, authenticated_client_a, sample_vault_blob
    ):
        """Basic create and read flow."""
        client, user = authenticated_client_a
        
        # Initially no vault
        response = client.get('/api/vault/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['vault_blob'] is None
        
        # Create vault
        response = client.put(
            '/api/vault/',
            data={'vault_blob': sample_vault_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'last_sync' in response.data
        
        # Retrieve vault
        response = client.get('/api/vault/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['vault_blob'] == sample_vault_blob
    
    def test_update_vault(self, authenticated_client_a, sample_vault_blob):
        """Updating vault should replace the old blob."""
        client, user = authenticated_client_a
        
        # Store initial vault
        client.put('/api/vault/', data={'vault_blob': 'initial_blob'}, format='json')
        
        # Update with new blob
        response = client.put(
            '/api/vault/',
            data={'vault_blob': sample_vault_blob},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Verify update
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == sample_vault_blob
    
    def test_delete_vault_requires_confirmation(self, authenticated_client_a):
        """Vault deletion requires explicit confirmation."""
        client, user = authenticated_client_a
        
        # Store a vault
        client.put('/api/vault/', data={'vault_blob': 'test_blob'}, format='json')
        
        # Try delete without confirmation
        response = client.delete('/api/vault/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'confirm' in response.data.get('error', '').lower()
        
        # Vault should still exist
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == 'test_blob'
    
    def test_delete_vault_with_confirmation(self, authenticated_client_a):
        """Vault deletion works with proper confirmation."""
        client, user = authenticated_client_a
        
        # Store a vault
        client.put('/api/vault/', data={'vault_blob': 'test_blob'}, format='json')
        
        # Delete with confirmation
        response = client.delete(
            '/api/vault/',
            data={'confirm_delete': 'DELETE_MY_VAULT'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Vault should be gone
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] is None


# ═══════════════════════════════════════════════════════════════════════════════
# DECOY VAULT / DURESS MODE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestDecoyVault:
    """
    Tests for the duress/decoy vault functionality.
    This allows users to have a "fake" vault shown under coercion.
    """
    
    def test_can_store_both_real_and_decoy_vault(
        self, authenticated_client_a, sample_vault_blob, sample_decoy_vault_blob
    ):
        """User can store both real vault and decoy vault."""
        client, user = authenticated_client_a
        
        response = client.put(
            '/api/vault/',
            data={
                'vault_blob': sample_vault_blob,
                'decoy_vault_blob': sample_decoy_vault_blob,
                'duress_salt': 'decoy_salt_12345'
            },
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Verify storage
        response = client.get('/api/vault/')
        assert response.data['vault_blob'] == sample_vault_blob
        assert response.data.get('has_duress_vault') is True
        assert response.data.get('duress_salt') == 'decoy_salt_12345'
    
    def test_decoy_and_real_vault_are_separate(
        self, authenticated_client_a, sample_vault_blob, sample_decoy_vault_blob
    ):
        """Real and decoy vaults must be stored separately."""
        client, user = authenticated_client_a
        
        # Store both
        client.put(
            '/api/vault/',
            data={
                'vault_blob': sample_vault_blob,
                'decoy_vault_blob': sample_decoy_vault_blob,
            },
            format='json'
        )
        
        # They must be different
        assert sample_vault_blob != sample_decoy_vault_blob
        
        # Verify both are stored correctly
        user_obj = user
        profile = user_obj.userprofile
        profile.refresh_from_db()
        
        assert profile.vault_blob == sample_vault_blob
        assert profile.decoy_vault_blob == sample_decoy_vault_blob


# ═══════════════════════════════════════════════════════════════════════════════
# ENCRYPTION SALT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestEncryptionSalt:
    """
    Tests for encryption salt management.
    Salt is needed for client-side key derivation.
    """
    
    def test_encryption_salt_returned_with_vault(self, authenticated_client_a):
        """Encryption salt should be included in vault response."""
        client, user = authenticated_client_a
        
        response = client.get('/api/vault/')
        assert response.status_code == status.HTTP_200_OK
        assert 'encryption_salt' in response.data
        assert response.data['encryption_salt'] is not None
    
    def test_salt_endpoint_returns_salt(self, authenticated_client_a):
        """Dedicated salt endpoint works."""
        client, user = authenticated_client_a
        
        response = client.get('/api/vault/salt/')
        assert response.status_code == status.HTTP_200_OK
        assert 'salt' in response.data or 'encryption_salt' in response.data


# ═══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLING TESTS
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestVaultErrorHandling:
    """
    Tests for proper error handling in vault operations.
    """
    
    def test_put_without_blob_returns_error(self, authenticated_client_a):
        """PUT without any blob should return an error."""
        client, user = authenticated_client_a
        
        response = client.put('/api/vault/', data={}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_invalid_token_rejected(self, api_client, sample_vault_blob):
        """Invalid auth token should be rejected."""
        api_client.credentials(HTTP_AUTHORIZATION='Token invalid_token_12345')
        
        response = api_client.get('/api/vault/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_malformed_auth_header_rejected(self, api_client):
        """Malformed Authorization header should be rejected."""
        api_client.credentials(HTTP_AUTHORIZATION='NotAToken')
        
        response = api_client.get('/api/vault/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
