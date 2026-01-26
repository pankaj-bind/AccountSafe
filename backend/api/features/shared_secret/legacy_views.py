# api/shared_secret_views.py
#
# ════════════════════════════════════════════════════════════════════════════
# TRUE ZERO-KNOWLEDGE SHARED SECRETS
# ════════════════════════════════════════════════════════════════════════════
#
# This module implements TRUE zero-knowledge secret sharing:
# 1. Frontend encrypts credential data with a random key (AES-256-GCM)
# 2. Frontend sends ONLY the encrypted blob to server
# 3. Server stores encrypted blob - CANNOT decrypt it
# 4. Encryption key is in URL fragment (never sent to server)
# 5. Recipient's browser decrypts using key from URL fragment
#
# The server NEVER sees:
# - Plaintext credential data
# - Encryption key
# - Any sensitive information
#
# This maintains TRUE zero-knowledge architecture even for sharing.
# ════════════════════════════════════════════════════════════════════════════

import json
import secrets as py_secrets
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from api.models import SharedSecret, Profile
from api.features.common import no_store


def secure_erase_blob(blob: str) -> str:
    """Overwrite blob with random data before deletion."""
    if blob:
        return py_secrets.token_hex(len(blob) // 2)
    return ''


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shared_secret(request):
    """
    Create a zero-knowledge shareable link for a credential.
    
    TRUE ZERO-KNOWLEDGE: Server receives ONLY encrypted blob, CANNOT decrypt.
    
    POST /api/shared-secrets/create/
    Body: {
        "profile_id": <int> (optional, for tracking only),
        "expiry_hours": <int> (optional, default: 24, max: 168),
        "encrypted_blob": <str> (AES-256-GCM encrypted data, base64 encoded)
    }
    
    The encrypted_blob is created client-side:
    1. Frontend generates random 256-bit key
    2. Frontend encrypts credential data with AES-256-GCM
    3. Frontend sends encrypted blob here
    4. Encryption key goes in URL fragment (never sent to server)
    
    Returns: {
        "success": true,
        "share_url": "https://domain.com/shared/<uuid>",
        "expires_at": "2026-01-17T00:00:00Z",
        "share_id": "<uuid>"
    }
    
    Note: The full share URL with decryption key is:
    https://domain.com/shared/<uuid>#<encryption_key>
    The frontend adds the #<key> part - server never sees it.
    """
    try:
        profile_id = request.data.get('profile_id')
        expiry_hours = int(request.data.get('expiry_hours', 24))
        encrypted_blob = request.data.get('encrypted_blob', '')
        
        # Validate required fields
        if not encrypted_blob:
            return Response({
                'error': 'encrypted_blob is required (encrypt data client-side first)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate expiry (max 7 days)
        if expiry_hours < 1 or expiry_hours > 168:
            return Response({
                'error': 'Expiry hours must be between 1 and 168 (7 days)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the profile and verify ownership (optional, for tracking only)
        profile = None
        if profile_id:
            try:
                profile = Profile.objects.get(
                    id=profile_id,
                    organization__category__user=request.user
                )
            except Profile.DoesNotExist:
                pass  # Profile not required, continue without linking
        
        # Create the shared secret with encrypted blob
        # Server CANNOT decrypt this - only stores it
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        shared_secret = SharedSecret.objects.create(
            profile=profile,
            encrypted_blob=encrypted_blob,  # Already encrypted by frontend
            salt='zk',  # Marker that this is zero-knowledge encrypted
            expires_at=expires_at,
        )
        
        # Build the share URL - point to React frontend
        import os
        is_local = 'localhost' in request.get_host() or '127.0.0.1' in request.get_host()
        
        if is_local:
            frontend_url = 'http://localhost:3000'
        else:
            frontend_url = os.getenv('FRONTEND_URL', 'https://accountsafe.vercel.app')
        
        # Base URL without encryption key (key will be added by frontend in URL fragment)
        share_url = f"{frontend_url}/shared/{shared_secret.id}"
        
        return Response({
            'success': True,
            'share_url': share_url,
            'expires_at': shared_secret.expires_at.isoformat(),
            'share_id': str(shared_secret.id),
            'message': 'Zero-knowledge share created. Encryption key never sent to server.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create shared link: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
@no_store
def view_shared_secret(request, share_id):
    """
    Retrieve and burn (delete) an encrypted shared secret.
    
    TRUE ZERO-KNOWLEDGE: Server returns encrypted blob, CANNOT decrypt.
    Decryption happens in recipient's browser using key from URL fragment.
    
    GET /api/shared-secrets/<uuid>/
    
    Returns: {
        "success": true,
        "encrypted_blob": "<encrypted data>",
        "message": "Decrypt this data using the key from your link"
    }
    
    The frontend will:
    1. Get encryption key from URL fragment (e.g., #abc123...)
    2. Decrypt the encrypted_blob using AES-256-GCM
    3. Display the decrypted credential to the user
    
    Errors:
    - 404: Link not found or already viewed
    - 410: Link expired
    """
    try:
        with transaction.atomic():
            try:
                shared_secret = SharedSecret.objects.select_for_update(nowait=True).get(id=share_id)
            except SharedSecret.DoesNotExist:
                return Response({
                    'error': 'Link not found or has already been viewed',
                    'code': 'LINK_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if expired
            if shared_secret.is_expired():
                shared_secret.encrypted_blob = secure_erase_blob(shared_secret.encrypted_blob)
                shared_secret.save()
                shared_secret.delete()
                
                return Response({
                    'error': 'This link has expired',
                    'code': 'LINK_EXPIRED'
                }, status=status.HTTP_410_GONE)
            
            # Get encrypted blob (server CANNOT decrypt this)
            encrypted_blob = shared_secret.encrypted_blob
            
            # SECURE ERASURE and DELETE (one-time view)
            shared_secret.encrypted_blob = secure_erase_blob(shared_secret.encrypted_blob)
            shared_secret.view_count += 1
            shared_secret.save()
            shared_secret.delete()
            
            return Response({
                'success': True,
                'encrypted_blob': encrypted_blob,
                'message': 'Decrypt this data using the key from your link. This link has been destroyed.',
                'warning': 'Save this information now - you will not be able to access it again'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'error': 'This link is being accessed by another request. Please try again.',
            'code': 'CONCURRENT_ACCESS'
        }, status=status.HTTP_409_CONFLICT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_shared_secrets(request):
    """
    List all active shared secrets created by the current user.
    
    GET /api/shared-secrets/
    
    Returns: [
        {
            "id": "<uuid>",
            "expires_at": "2026-01-17T00:00:00Z",
            "view_count": 0,
            "created_at": "2026-01-16T00:00:00Z",
            "is_expired": false
        },
        ...
    ]
    """
    secrets = SharedSecret.objects.filter(
        profile__organization__category__user=request.user
    ).order_by('-created_at')
    
    data = [{
        'id': str(secret.id),
        'expires_at': secret.expires_at.isoformat(),
        'view_count': secret.view_count,
        'created_at': secret.created_at.isoformat(),
        'is_expired': secret.is_expired(),
    } for secret in secrets]
    
    return Response({
        'success': True,
        'secrets': data,
        'count': len(data)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def revoke_shared_secret(request, share_id):
    """
    Manually revoke (delete) a shared secret before it's viewed.
    
    DELETE /api/shared-secrets/<uuid>/
    
    Returns: {
        "success": true,
        "message": "Shared link revoked successfully"
    }
    """
    try:
        with transaction.atomic():
            secret = SharedSecret.objects.select_for_update().get(
                id=share_id,
                profile__organization__category__user=request.user
            )
            
            # Secure erase before delete
            secret.encrypted_blob = secure_erase_blob(secret.encrypted_blob)
            secret.save()
            secret.delete()
            
            return Response({
                'success': True,
                'message': 'Shared link revoked successfully'
            }, status=status.HTTP_200_OK)
            
    except SharedSecret.DoesNotExist:
        return Response({
            'error': 'Shared link not found or already revoked'
        }, status=status.HTTP_404_NOT_FOUND)
