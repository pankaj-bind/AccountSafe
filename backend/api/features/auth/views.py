# api/features/auth/views.py
"""
Authentication Views

Views handle HTTP request/response only.
Business logic is delegated to AuthService.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import AuthService


class ZeroKnowledgeRegisterView(APIView):
    """
    POST /api/zk/register/
    
    TRUE zero-knowledge registration.
    Client sends auth_hash (derived from password) - server NEVER sees password.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        result = AuthService.register_user(
            username=request.data.get('username', '').strip(),
            email=request.data.get('email', '').strip().lower(),
            auth_hash=request.data.get('auth_hash', '').strip(),
            salt=request.data.get('salt', '').strip(),
            request=request,
            turnstile_token=request.data.get('turnstile_token')
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeLoginView(APIView):
    """
    POST /api/zk/login/
    
    TRUE zero-knowledge login.
    Client sends auth_hash (derived from password) - server NEVER sees password.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        result = AuthService.login_user(
            username=request.data.get('username', '').strip(),
            auth_hash=request.data.get('auth_hash', '').strip().lower(),
            request=request,
            turnstile_token=request.data.get('turnstile_token'),
            is_relogin=request.data.get('is_relogin', False)
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeGetSaltView(APIView):
    """
    GET /api/zk/salt/?username=xxx
    
    Get encryption salt(s) for client-side key derivation.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        username = request.query_params.get('username', '').strip()
        
        if not username:
            return Response({'error': 'username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = AuthService.get_user_salt(username)
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class ZeroKnowledgeChangePasswordView(APIView):
    """
    POST /api/zk/change-password/
    
    Change password using zero-knowledge auth.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.change_password(
            user=request.user,
            current_auth_hash=request.data.get('current_auth_hash', '').strip().lower(),
            new_auth_hash=request.data.get('new_auth_hash', '').strip().lower(),
            new_salt=request.data.get('new_salt', '').strip()
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeVerifyView(APIView):
    """
    POST /api/zk/verify/
    
    Verify auth_hash without creating new session.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.verify_auth_hash(
            user=request.user,
            auth_hash=request.data.get('auth_hash', '').strip()
        )
        
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class ZeroKnowledgeDeleteAccountView(APIView):
    """
    POST /api/zk/delete-account/
    
    Delete account using zero-knowledge verification.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.delete_account(
            user=request.user,
            auth_hash=request.data.get('auth_hash', '').strip()
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


# Re-export from zero_knowledge module (now in same feature folder)
from .zero_knowledge import (
    ZeroKnowledgeSetDuressView,
    ZeroKnowledgeClearDuressView,
    ZeroKnowledgeSwitchModeView,
    # REMOVED: ZeroKnowledgeMigrateView - Attack Surface Reduction
)
