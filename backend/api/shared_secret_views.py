# api/shared_secret_views.py

import json
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import SharedSecret, Profile
from .encryption import (
    encrypt_shared_secret,
    decrypt_shared_secret,
    generate_salt,
    secure_erase_field,
)
from .decorators import no_store


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shared_secret(request):
    """
    Create a secure one-time shareable link for a credential.
    
    POST /api/shared-secrets/create/
    Body: {
        "profile_id": <int>,
        "expiry_hours": <int> (optional, default: 24, max: 168),
        "decrypted_data": {
            "title": <str>,
            "username": <str> (optional),
            "password": <str> (optional),
            "email": <str> (optional),
            "notes": <str> (optional),
            "recovery_codes": <str> (optional),
            "organization": <str>
        }
    }
    
    Returns: {
        "success": true,
        "share_url": "https://domain.com/shared/<uuid>",
        "expires_at": "2026-01-17T00:00:00Z",
        "share_id": "<uuid>"
    }
    """
    try:
        profile_id = request.data.get('profile_id')
        expiry_hours = int(request.data.get('expiry_hours', 24))
        decrypted_data = request.data.get('decrypted_data', {})
        
        # Validate expiry (max 7 days)
        if expiry_hours < 1 or expiry_hours > 168:
            return Response({
                'error': 'Expiry hours must be between 1 and 168 (7 days)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the profile and verify ownership via organization
        try:
            profile = Profile.objects.get(
                id=profile_id,
                organization__category__user=request.user
            )
        except Profile.DoesNotExist:
            return Response({
                'error': 'Profile not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prepare plaintext data to encrypt with Fernet
        # The frontend sends already-decrypted data
        profile_data = {
            'title': decrypted_data.get('title', profile.title),
            'username': decrypted_data.get('username', ''),
            'password': decrypted_data.get('password', ''),
            'email': decrypted_data.get('email', ''),
            'notes': decrypted_data.get('notes', ''),
            'recovery_codes': decrypted_data.get('recovery_codes', ''),
            'organization': decrypted_data.get('organization', profile.organization.name),
        }
        
        # Include document URL if it exists
        if profile.document:
            profile_data['document_url'] = request.build_absolute_uri(profile.document.url)
        
        # Generate unique salt for this secret
        salt = generate_salt()
        
        # Encrypt the plaintext profile data with Fernet
        encrypted_blob = encrypt_shared_secret(json.dumps(profile_data), salt)
        
        if not encrypted_blob:
            return Response({
                'error': 'Failed to encrypt data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create the shared secret (multiple links can be created for same profile)
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        shared_secret = SharedSecret.objects.create(
            profile=profile,
            encrypted_blob=encrypted_blob,
            salt=salt,
            expires_at=expires_at,
        )
        
        # Build the share URL - point to React frontend, not API
        # Use environment variable for frontend URL, with fallbacks
        import os
        is_local = 'localhost' in request.get_host() or '127.0.0.1' in request.get_host()
        
        if is_local:
            frontend_url = 'http://localhost:3000'
        else:
            # In production, use the configured frontend URL (Vercel)
            frontend_url = os.getenv('FRONTEND_URL', 'https://accountsafe.vercel.app')
        
        share_url = f"{frontend_url}/shared/{shared_secret.id}"
        
        return Response({
            'success': True,
            'share_url': share_url,
            'expires_at': shared_secret.expires_at.isoformat(),
            'share_id': str(shared_secret.id),
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
    View and burn (delete) a shared secret atomically.
    
    GET /api/shared-secrets/<uuid>/
    
    Returns: {
        "success": true,
        "data": { <decrypted profile data> },
        "message": "This link has been destroyed and can no longer be accessed"
    }
    
    Errors:
    - 404: Link not found or already viewed
    - 410: Link expired
    - 500: Decryption failed
    """
    try:
        # Use atomic transaction with row-level locking to prevent race conditions
        with transaction.atomic():
            try:
                # Lock the row for update (prevents concurrent access)
                shared_secret = SharedSecret.objects.select_for_update(nowait=True).get(id=share_id)
            except SharedSecret.DoesNotExist:
                return Response({
                    'error': 'Link not found or has already been viewed',
                    'code': 'LINK_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if expired
            if shared_secret.is_expired():
                # Secure erase and delete expired secret
                shared_secret.encrypted_blob = secure_erase_field(shared_secret.encrypted_blob)
                shared_secret.save()
                shared_secret.delete()
                
                return Response({
                    'error': 'This link has expired',
                    'code': 'LINK_EXPIRED'
                }, status=status.HTTP_410_GONE)
            
            # Decrypt the data
            decrypted_json = decrypt_shared_secret(
                shared_secret.encrypted_blob,
                shared_secret.salt
            )
            
            if not decrypted_json:
                # Secure erase and delete on decryption failure
                shared_secret.encrypted_blob = secure_erase_field(shared_secret.encrypted_blob)
                shared_secret.save()
                shared_secret.delete()
                
                return Response({
                    'error': 'Failed to decrypt data',
                    'code': 'DECRYPTION_FAILED'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Parse the JSON data
            profile_data = json.loads(decrypted_json)
            
            # SECURE ERASURE: Overwrite encrypted field with random garbage
            shared_secret.encrypted_blob = secure_erase_field(shared_secret.encrypted_blob)
            shared_secret.view_count += 1
            shared_secret.save()
            
            # ATOMIC DELETE: Remove the record
            shared_secret.delete()
            
            return Response({
                'success': True,
                'data': profile_data,
                'message': 'This link has been destroyed and can no longer be accessed',
                'warning': 'Save this information now - you will not be able to access it again'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        # Handle database lock timeout or other errors
        return Response({
            'error': 'This link is being accessed by another request. Please try again in a moment.',
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
            secret.encrypted_blob = secure_erase_field(secret.encrypted_blob)
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
