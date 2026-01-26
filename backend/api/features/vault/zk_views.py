# ═══════════════════════════════════════════════════════════════════════════════
# Zero-Knowledge Vault API Views
# ═══════════════════════════════════════════════════════════════════════════════
#
# CRITICAL: These endpoints handle encrypted vault blobs.
# The server CANNOT decrypt or read the contents - this is by design.
#
# Flow:
# 1. Client encrypts vault locally using Argon2id-derived key
# 2. Client sends encrypted blob to server
# 3. Server stores blob as-is (cannot read it)
# 4. Client fetches blob and decrypts locally
#
# Security:
# - Server never sees plaintext passwords
# - Server never sees master key
# - Even database breaches reveal NO user secrets
# - This is TRUE zero-knowledge architecture
#
# ═══════════════════════════════════════════════════════════════════════════════

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import UserProfile, DuressSession


class VaultView(APIView):
    """
    GET /vault/ - Retrieve encrypted vault blob
    PUT /vault/ - Update encrypted vault blob
    
    The server stores encrypted blobs and CANNOT decrypt them.
    This is the core of zero-knowledge architecture.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve the user's encrypted vault.
        
        Returns:
        - vault_blob: Encrypted vault (main vault or decoy based on session)
        - decoy_vault_blob: Only returned if user has duress mode enabled
        - encryption_salt: Salt for key derivation
        - duress_salt: Salt for duress key derivation (if set)
        - vault_version: Version of vault schema
        - last_sync: Last sync timestamp
        """
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            # Create profile if doesn't exist
            profile = UserProfile.objects.create(user=request.user)
        
        # Check if this is a duress session
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        is_duress = DuressSession.is_duress_token(token_key)
        
        response_data = {
            'encryption_salt': profile.encryption_salt,
            'vault_version': profile.vault_version,
            'last_sync': profile.last_vault_sync,
        }
        
        if is_duress:
            # In duress mode - return decoy vault as main vault
            # Attacker sees fake data, cannot distinguish from real
            response_data['vault_blob'] = profile.decoy_vault_blob
            # Use duress_salt for key derivation (so duress password can decrypt)
            response_data['encryption_salt'] = profile.duress_salt
            # Don't reveal that decoy vault exists
        else:
            # Normal mode - return real vault
            response_data['vault_blob'] = profile.vault_blob
            
            # Include duress info if user has it set up (for client to know)
            if profile.decoy_vault_blob:
                response_data['has_duress_vault'] = True
                response_data['duress_salt'] = profile.duress_salt
        
        return Response(response_data)
    
    def put(self, request):
        """
        Update the user's encrypted vault.
        
        Request body:
        - vault_blob: Encrypted vault blob (required)
        - decoy_vault_blob: Encrypted decoy vault (optional, for duress mode)
        - duress_salt: Salt for duress vault (optional)
        
        The server stores these blobs without modification or decryption.
        """
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        vault_blob = request.data.get('vault_blob')
        decoy_vault_blob = request.data.get('decoy_vault_blob')
        duress_salt = request.data.get('duress_salt')
        
        # At least one vault blob must be provided
        if not vault_blob and not decoy_vault_blob:
            return Response(
                {'error': 'Either vault_blob or decoy_vault_blob is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is a duress session - don't allow vault updates in duress mode
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        is_duress = DuressSession.is_duress_token(token_key)
        
        if is_duress:
            # In duress mode - pretend to save but don't actually modify real vault
            # This prevents attacker from corrupting the real vault
            return Response({
                'message': 'Vault updated successfully',
                'last_sync': timezone.now().isoformat(),
            })
        
        # Update main vault blob if provided
        if vault_blob:
            profile.vault_blob = vault_blob
            profile.last_vault_sync = timezone.now()
        
        # Handle decoy vault update
        if decoy_vault_blob:
            profile.decoy_vault_blob = decoy_vault_blob
        
        if duress_salt:
            profile.duress_salt = duress_salt
        
        profile.save()
        
        return Response({
            'message': 'Vault updated successfully',
            'last_sync': profile.last_vault_sync.isoformat() if profile.last_vault_sync else None,
        })
    
    def delete(self, request):
        """
        Delete the user's vault (dangerous - requires confirmation).
        
        This permanently deletes the encrypted vault.
        Since the server cannot decrypt it, this data is unrecoverable.
        """
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'No vault found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Require confirmation
        confirm = request.data.get('confirm_delete')
        if confirm != 'DELETE_MY_VAULT':
            return Response(
                {'error': 'Confirmation required. Send confirm_delete: "DELETE_MY_VAULT"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is a duress session - don't allow deletion in duress mode
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        is_duress = DuressSession.is_duress_token(token_key)
        
        if is_duress:
            # Pretend to delete but don't actually
            return Response({'message': 'Vault deleted successfully'})
        
        # Actually delete
        profile.vault_blob = None
        profile.decoy_vault_blob = None
        profile.duress_salt = None
        profile.last_vault_sync = None
        profile.save()
        
        return Response({'message': 'Vault deleted successfully'})


class VaultSaltView(APIView):
    """
    GET /vault/salt/ - Get user's encryption salt (public, needed for key derivation)
    POST /vault/salt/ - Set user's encryption salt (during registration)
    
    The salt is public and safe to transmit.
    It's used for Argon2id key derivation on the client.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's encryption salt."""
        try:
            profile = request.user.userprofile
            return Response({
                'encryption_salt': profile.encryption_salt,
                'duress_salt': profile.duress_salt,
            })
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def post(self, request):
        """Set the user's encryption salt (usually during registration)."""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        encryption_salt = request.data.get('encryption_salt')
        
        if not encryption_salt:
            return Response(
                {'error': 'encryption_salt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow setting salt if not already set (prevent changing salt)
        # Changing salt would break existing encrypted data
        if profile.encryption_salt and profile.encryption_salt != encryption_salt:
            return Response(
                {'error': 'Salt already set. Cannot change salt without re-encrypting vault.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.encryption_salt = encryption_salt
        profile.save()
        
        return Response({
            'message': 'Salt saved successfully',
            'encryption_salt': profile.encryption_salt,
        })


class VaultAuthHashView(APIView):
    """
    POST /vault/auth-hash/ - Set or verify auth hash for zero-knowledge authentication
    
    The auth hash is derived from the password on the client using Argon2id.
    It's different from the encryption key (different derivation context).
    Server stores the hash and can verify login without knowing the password.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check if auth hash is set."""
        try:
            profile = request.user.userprofile
            return Response({
                'has_auth_hash': bool(profile.auth_hash),
            })
        except UserProfile.DoesNotExist:
            return Response({'has_auth_hash': False})
    
    def post(self, request):
        """Set or update the auth hash."""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        auth_hash = request.data.get('auth_hash')
        
        if not auth_hash:
            return Response(
                {'error': 'auth_hash is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.auth_hash = auth_hash
        profile.save()
        
        return Response({
            'message': 'Auth hash saved successfully',
        })


class VaultExportView(APIView):
    """
    GET /vault/export/ - Export encrypted vault blob
    
    Returns the raw encrypted vault blob for backup purposes.
    The user can store this backup and import it later.
    Since it's encrypted, backup is safe even if compromised.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Export the encrypted vault."""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'No vault found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if this is a duress session
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        is_duress = DuressSession.is_duress_token(token_key)
        
        if is_duress:
            # Export decoy vault in duress mode
            vault_blob = profile.decoy_vault_blob
        else:
            vault_blob = profile.vault_blob
        
        if not vault_blob:
            return Response(
                {'error': 'No vault to export'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'vault_blob': vault_blob,
            'encryption_salt': profile.encryption_salt,
            'vault_version': profile.vault_version,
            'exported_at': timezone.now().isoformat(),
            'username': request.user.username,
        })


class VaultImportView(APIView):
    """
    POST /vault/import/ - Import encrypted vault blob
    
    Allows importing a previously exported vault backup.
    The blob is stored as-is (server cannot verify or decrypt it).
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Import an encrypted vault backup."""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        vault_blob = request.data.get('vault_blob')
        encryption_salt = request.data.get('encryption_salt')
        
        if not vault_blob:
            return Response(
                {'error': 'vault_blob is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is a duress session
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        is_duress = DuressSession.is_duress_token(token_key)
        
        if is_duress:
            # Pretend to import but don't actually
            return Response({
                'message': 'Vault imported successfully',
            })
        
        # If salt is provided and different, update it
        # (this allows importing vault from different device)
        if encryption_salt and encryption_salt != profile.encryption_salt:
            profile.encryption_salt = encryption_salt
        
        profile.vault_blob = vault_blob
        profile.last_vault_sync = timezone.now()
        profile.save()
        
        return Response({
            'message': 'Vault imported successfully',
            'last_sync': profile.last_vault_sync.isoformat() if profile.last_vault_sync else None,
        })
