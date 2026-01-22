# api/features/shared_secret/services.py
"""
Shared Secret Service Layer

Business logic for zero-knowledge secret sharing.
"""

import os
import hashlib
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from api.models import SharedSecret


class SharedSecretService:
    """Service layer for shared secret operations."""
    
    @staticmethod
    def generate_link_id() -> str:
        """Generate a unique, cryptographically secure link ID."""
        return hashlib.sha256(os.urandom(32)).hexdigest()[:32]
    
    @staticmethod
    def create_shared_secret(
        user,
        encrypted_data: str,
        max_views: int = 1,
        expires_in_hours: int = 24,
        passphrase_hash: str = None,
        passphrase_salt: str = None
    ) -> dict:
        """
        Create a new shared secret with zero-knowledge encryption.
        
        Args:
            user: The owner user
            encrypted_data: Client-side encrypted data blob
            max_views: Maximum number of views (1-10)
            expires_in_hours: Hours until expiration (1-168)
            passphrase_hash: Optional passphrase hash for extra protection
            passphrase_salt: Salt used for passphrase hashing
        
        Returns:
            Dictionary with link_id and expiration info
        """
        max_views = max(1, min(10, int(max_views)))
        expires_in_hours = max(1, min(168, int(expires_in_hours)))  # 1 hour to 7 days
        
        link_id = SharedSecretService.generate_link_id()
        expiration_time = timezone.now() + timedelta(hours=expires_in_hours)
        
        shared_secret = SharedSecret.objects.create(
            link_id=link_id,
            owner=user,
            encrypted_data=encrypted_data,
            max_views=max_views,
            expires_at=expiration_time,
            passphrase_hash=passphrase_hash,
            passphrase_salt=passphrase_salt,
            is_passphrase_protected=bool(passphrase_hash),
        )
        
        return {
            'link_id': link_id,
            'expires_at': expiration_time.isoformat(),
            'max_views': max_views,
            'is_passphrase_protected': shared_secret.is_passphrase_protected,
        }
    
    @staticmethod
    def get_shared_secret_metadata(link_id: str) -> dict:
        """
        Get metadata about a shared secret without decrypting.
        Used to check if passphrase is required.
        """
        try:
            secret = SharedSecret.objects.get(link_id=link_id)
        except SharedSecret.DoesNotExist:
            return {'error': 'Secret not found', 'status': 404}
        
        if secret.is_expired():
            return {'error': 'Secret has expired', 'status': 410}
        
        if secret.view_count >= secret.max_views:
            return {'error': 'Secret has reached maximum views', 'status': 410}
        
        return {
            'is_passphrase_protected': secret.is_passphrase_protected,
            'passphrase_salt': secret.passphrase_salt if secret.is_passphrase_protected else None,
            'views_remaining': secret.max_views - secret.view_count,
            'expires_at': secret.expires_at.isoformat(),
        }
    
    @staticmethod
    def view_shared_secret(link_id: str, passphrase_hash: str = None) -> dict:
        """
        View a shared secret.
        
        Args:
            link_id: The unique link identifier
            passphrase_hash: Hash of passphrase if protected
        
        Returns:
            Dictionary with encrypted_data or error
        """
        try:
            secret = SharedSecret.objects.get(link_id=link_id)
        except SharedSecret.DoesNotExist:
            return {'error': 'Secret not found', 'status': 404}
        
        if secret.is_expired():
            return {'error': 'Secret has expired', 'status': 410}
        
        if secret.view_count >= secret.max_views:
            return {'error': 'Secret has reached maximum views', 'status': 410}
        
        # Verify passphrase if protected
        if secret.is_passphrase_protected:
            if not passphrase_hash:
                return {'error': 'Passphrase required', 'status': 401}
            
            # Constant-time comparison to prevent timing attacks
            import hmac
            if not hmac.compare_digest(passphrase_hash, secret.passphrase_hash):
                return {'error': 'Invalid passphrase', 'status': 401}
        
        # Atomically increment view count
        with transaction.atomic():
            secret.view_count += 1
            secret.last_viewed_at = timezone.now()
            secret.save(update_fields=['view_count', 'last_viewed_at'])
        
        return {
            'encrypted_data': secret.encrypted_data,
            'views_remaining': secret.max_views - secret.view_count,
            'expires_at': secret.expires_at.isoformat(),
        }
    
    @staticmethod
    def list_user_secrets(user) -> list:
        """List all shared secrets created by a user."""
        secrets = SharedSecret.objects.filter(owner=user).order_by('-created_at')
        
        result = []
        for secret in secrets:
            result.append({
                'link_id': secret.link_id,
                'created_at': secret.created_at.isoformat(),
                'expires_at': secret.expires_at.isoformat(),
                'max_views': secret.max_views,
                'view_count': secret.view_count,
                'is_passphrase_protected': secret.is_passphrase_protected,
                'is_expired': secret.is_expired(),
                'is_fully_viewed': secret.view_count >= secret.max_views,
            })
        
        return result
    
    @staticmethod
    def revoke_shared_secret(link_id: str, user) -> dict:
        """Revoke a shared secret owned by the user."""
        try:
            secret = SharedSecret.objects.get(link_id=link_id, owner=user)
        except SharedSecret.DoesNotExist:
            return {'error': 'Secret not found or not owned by you', 'status': 404}
        
        secret.delete()
        return {'message': 'Secret revoked successfully'}
    
    @staticmethod
    def cleanup_expired_secrets() -> int:
        """Delete all expired shared secrets. Returns count of deleted secrets."""
        deleted_count, _ = SharedSecret.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()
        return deleted_count
