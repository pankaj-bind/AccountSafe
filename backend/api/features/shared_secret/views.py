# api/features/shared_secret/views.py
"""
Shared Secret Views

Views for zero-knowledge secret sharing.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .services import SharedSecretService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shared_secret(request):
    """
    Create a new shared secret.
    
    Request body:
        - encrypted_data: Required. Client-side encrypted data.
        - max_views: Optional. Maximum views (1-10). Default: 1
        - expires_in_hours: Optional. Hours until expiration (1-168). Default: 24
        - passphrase_hash: Optional. Hash of passphrase for extra protection.
        - passphrase_salt: Optional. Salt used for passphrase hashing.
    """
    encrypted_data = request.data.get('encrypted_data')
    
    if not encrypted_data:
        return Response(
            {'error': 'encrypted_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate size (max 100KB)
    if len(encrypted_data) > 100 * 1024:
        return Response(
            {'error': 'Data too large. Maximum size is 100KB.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    max_views = request.data.get('max_views', 1)
    expires_in_hours = request.data.get('expires_in_hours', 24)
    passphrase_hash = request.data.get('passphrase_hash')
    passphrase_salt = request.data.get('passphrase_salt')
    
    result = SharedSecretService.create_shared_secret(
        user=request.user,
        encrypted_data=encrypted_data,
        max_views=max_views,
        expires_in_hours=expires_in_hours,
        passphrase_hash=passphrase_hash,
        passphrase_salt=passphrase_salt,
    )
    
    return Response(result, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_shared_secret_metadata(request, link_id):
    """
    Get metadata about a shared secret.
    Used to check if passphrase is required before viewing.
    """
    result = SharedSecretService.get_shared_secret_metadata(link_id)
    
    if 'error' in result:
        http_status = result.pop('status', 400)
        return Response(result, status=http_status)
    
    return Response(result)


@api_view(['POST'])
@permission_classes([AllowAny])
def view_shared_secret(request, link_id):
    """
    View a shared secret.
    
    Request body (optional):
        - passphrase_hash: Required if secret is passphrase protected.
    """
    passphrase_hash = request.data.get('passphrase_hash')
    
    result = SharedSecretService.view_shared_secret(link_id, passphrase_hash)
    
    if 'error' in result:
        http_status = result.pop('status', 400)
        return Response(result, status=http_status)
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_secrets(request):
    """List all shared secrets created by the authenticated user."""
    secrets = SharedSecretService.list_user_secrets(request.user)
    return Response({
        'count': len(secrets),
        'secrets': secrets
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def revoke_shared_secret(request, link_id):
    """Revoke a shared secret owned by the authenticated user."""
    result = SharedSecretService.revoke_shared_secret(link_id, request.user)
    
    if 'error' in result:
        http_status = result.pop('status', 400)
        return Response(result, status=http_status)
    
    return Response(result)
