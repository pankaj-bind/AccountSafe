# api/features/security/views.py
"""
Security Views

Views handle HTTP request/response only.
Business logic is delegated to SecurityService.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import SecurityService
from .serializers import LoginRecordSerializer, UserSessionSerializer


# ===========================
# HEALTH SCORE VIEWS
# ===========================

class SecurityHealthScoreView(APIView):
    """Calculate and return security health score for user's vault."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            score_data = SecurityService.calculate_health_score(request.user)
            return Response(score_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate health score: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdatePasswordStrengthView(APIView):
    """Update password strength score for a profile."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        strength_score = request.data.get('strength_score')
        
        if strength_score is None:
            return Response({'error': 'strength_score is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            strength_score = int(strength_score)
            if not (0 <= strength_score <= 4):
                return Response({'error': 'strength_score must be between 0 and 4'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'strength_score must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify ownership
        from api.models import Profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        success = SecurityService.update_password_strength(profile_id, strength_score)
        if success:
            return Response({'message': 'Password strength updated successfully'})
        return Response({'error': 'Failed to update'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateBreachStatusView(APIView):
    """Update breach status for a profile."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        is_breached = request.data.get('is_breached')
        
        if is_breached is None:
            return Response({'error': 'is_breached is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify ownership
        from api.models import Profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        success = SecurityService.update_breach_status(profile_id, bool(is_breached))
        if success:
            return Response({'message': 'Breach status updated successfully'})
        return Response({'error': 'Failed to update'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdatePasswordHashView(APIView):
    """Update password hash for uniqueness checking."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        password_hash = request.data.get('password_hash')
        
        if not password_hash:
            return Response({'error': 'password_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify ownership
        from api.models import Profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        success = SecurityService.update_password_hash(profile_id, password_hash)
        if success:
            return Response({'message': 'Password hash updated successfully'})
        return Response({'error': 'Failed to update'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BatchUpdateSecurityMetricsView(APIView):
    """Batch update security metrics for multiple profiles."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from api.models import Profile
        from django.utils import timezone
        
        updates = request.data.get('updates', [])
        
        if not isinstance(updates, list):
            return Response({'error': 'updates must be an array'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        
        for update in updates:
            profile_id = update.get('profile_id')
            strength_score = update.get('strength_score')
            is_breached = update.get('is_breached')
            
            if not profile_id:
                continue
            
            try:
                profile = Profile.objects.get(id=profile_id)
                if profile.organization.category.user != request.user:
                    results.append({'profile_id': profile_id, 'success': False, 'error': 'Permission denied'})
                    continue
            except Profile.DoesNotExist:
                results.append({'profile_id': profile_id, 'success': False, 'error': 'Profile not found'})
                continue
            
            if strength_score is not None:
                try:
                    strength_score = int(strength_score)
                    if 0 <= strength_score <= 4:
                        SecurityService.update_password_strength(profile_id, strength_score)
                except ValueError:
                    pass
            
            if is_breached is not None:
                SecurityService.update_breach_status(profile_id, bool(is_breached))
            
            if not profile.last_password_update:
                profile.last_password_update = timezone.now()
                profile.save(update_fields=['last_password_update'])
            
            results.append({'profile_id': profile_id, 'success': True})
        
        return Response({
            'message': f'Updated {len(results)} profiles',
            'results': results
        })


# ===========================
# SESSION MANAGEMENT VIEWS
# ===========================

class ActiveSessionsView(APIView):
    """List all active sessions for the current user."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        sessions = SecurityService.list_active_sessions(request.user)
        serializer = UserSessionSerializer(sessions, many=True, context={'request': request})
        return Response(serializer.data)


class ValidateSessionView(APIView):
    """Check if the current session is still active."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'is_active': True, 'message': 'Session is valid'})


class RevokeSessionView(APIView):
    """Revoke a specific session."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        current_token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        result = SecurityService.revoke_session(session_id, request.user, current_token_key)
        
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)
    
    def delete(self, request, session_id):
        return self.post(request, session_id)


class RevokeAllSessionsView(APIView):
    """Revoke all sessions except the current one."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        current_token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        result = SecurityService.revoke_all_sessions(request.user, current_token_key)
        return Response(result)
    
    def delete(self, request):
        return self.post(request)


# ===========================
# SECURITY SETTINGS VIEWS
# ===========================

class SecuritySettingsView(APIView):
    """Manage panic button and duress password settings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from api.features.vault.services import VaultService
        is_duress = VaultService.is_duress_session(request)
        settings = SecurityService.get_security_settings(request.user, is_duress)
        return Response(settings)
    
    def post(self, request):
        action = request.data.get('action')
        
        if action == 'set_panic_shortcut':
            shortcut = request.data.get('shortcut', [])
            result = SecurityService.set_panic_shortcut(request.user, shortcut)
            http_status = result.pop('status', 200) if 'status' in result else 200
            return Response(result, status=http_status)
        
        elif action == 'clear_panic_shortcut':
            result = SecurityService.clear_panic_shortcut(request.user)
            return Response(result)
        
        elif action in ['set_duress_password', 'clear_duress_password', 'verify_password']:
            return Response(
                {
                    "error": f"This action is deprecated. Use /api/zk/ endpoints for {action}.",
                    "code": "USE_ZK_ENDPOINT"
                },
                status=status.HTTP_410_GONE
            )
        
        return Response(
            {"error": "Invalid action"},
            status=status.HTTP_400_BAD_REQUEST
        )


# ===========================
# LOGIN RECORDS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_records(request):
    """Get all login records for the authenticated user."""
    from api.models import LoginRecord
    
    limit = request.query_params.get('limit', 50)
    try:
        limit = int(limit)
        if limit > 100:
            limit = 100
    except:
        limit = 50
    
    records = LoginRecord.objects.filter(
        username_attempted=request.user.username
    ).order_by('-timestamp')[:limit]
    
    serializer = LoginRecordSerializer(records, many=True, context={'request': request})
    
    return Response({
        'count': records.count(),
        'records': serializer.data
    })
