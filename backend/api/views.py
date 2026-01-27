# api/views.py
"""
Minimal API Views - Router/Controller Only

This file contains only:
1. API Root endpoint - Service discovery
2. User Profile management (get/update)

All business logic has been moved to:
- api.features.auth - Authentication (login, register, OTP, PIN)
- api.features.vault - Vault management (categories, organizations, profiles)
- api.features.security - Security (health score, sessions, canary traps)
- api.features.shared_secret - Shared secrets
- api.utils.notifications - Login tracking and security email notifications

This file is intentionally kept under 150 lines following
separation of concerns principles.
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfileUpdateSerializer

logger = logging.getLogger(__name__)


# 
# API ROOT
# 

@api_view(['GET'])
@permission_classes([AllowAny])
def root_route(request):
    """
    API Root - Returns available endpoints and API info.
    """
    return Response({
        'name': 'AccountSafe API',
        'version': '2.0.0',
        'architecture': 'Zero-Knowledge',
        'description': 'Secure password manager with TRUE zero-knowledge encryption',
        'endpoints': {
            'auth': {
                'register': '/api/zk/register/',
                'login': '/api/zk/login/',
                'salt': '/api/zk/salt/',
                'change_password': '/api/zk/change-password/',
                'delete_account': '/api/zk/delete-account/',
                'verify': '/api/zk/verify/',
            },
            'password_reset': {
                'request_otp': '/api/password-reset/request-otp/',
                'verify_otp': '/api/password-reset/verify-otp/',
                'set_new_password': '/api/password-reset/set-new-password/',
            },
            'pin': {
                'setup': '/api/pin/setup/',
                'verify': '/api/pin/verify/',
                'status': '/api/pin/status/',
                'clear': '/api/pin/clear/',
            },
            'vault': {
                'categories': '/api/categories/',
                'vault': '/api/vault/',
                'export': '/api/vault/export/',
                'import': '/api/vault/import/',
                'smart_import': '/api/vault/smart-import/',
            },
            'security': {
                'health_score': '/api/security/health-score/',
                'settings': '/api/security/settings/',
                'sessions': '/api/sessions/',
                'canary_traps': '/api/security/traps/',
            },
            'profile': '/api/profile/',
            'dashboard': '/api/dashboard/statistics/',
        },
        'security': {
            'encryption': 'AES-256-GCM (client-side)',
            'key_derivation': 'Argon2id',
            'authentication': 'Zero-Knowledge (auth_hash only)',
            'server_knowledge': 'Server CANNOT decrypt vault data',
        },
    })


# 
# USER PROFILE MANAGEMENT
# 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get the profile of the authenticated user."""
    try:
        profile = request.user.userprofile
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update the profile of the authenticated user."""
    try:
        profile = request.user.userprofile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)

    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        profile.refresh_from_db()
        profile.user.refresh_from_db()
        response_serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
