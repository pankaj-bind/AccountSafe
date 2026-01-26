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


# ===========================
# CANARY TRAP (HONEYTOKEN) VIEWS
# ===========================

class CanaryTrapListCreateView(APIView):
    """List and create canary traps."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all canary traps for the authenticated user."""
        from .models import CanaryTrap
        from .serializers import CanaryTrapSerializer
        
        traps = CanaryTrap.objects.filter(user=request.user)
        serializer = CanaryTrapSerializer(traps, many=True, context={'request': request})
        
        return Response({
            'count': traps.count(),
            'traps': serializer.data
        })
    
    def post(self, request):
        """Create a new canary trap."""
        from .serializers import CanaryTrapSerializer
        
        serializer = CanaryTrapSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            trap = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CanaryTrapDetailView(APIView):
    """Get, update, or delete a specific canary trap."""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, trap_id, user):
        """Get trap object with ownership check."""
        from .models import CanaryTrap
        try:
            return CanaryTrap.objects.get(id=trap_id, user=user)
        except CanaryTrap.DoesNotExist:
            return None
    
    def get(self, request, trap_id):
        """Get a specific canary trap with its trigger history."""
        from .serializers import CanaryTrapSerializer, CanaryTrapTriggerSerializer
        
        trap = self.get_object(trap_id, request.user)
        if not trap:
            return Response({'error': 'Trap not found'}, status=status.HTTP_404_NOT_FOUND)
        
        trap_serializer = CanaryTrapSerializer(trap, context={'request': request})
        triggers = trap.triggers.all()[:20]  # Last 20 triggers
        trigger_serializer = CanaryTrapTriggerSerializer(triggers, many=True)
        
        return Response({
            'trap': trap_serializer.data,
            'triggers': trigger_serializer.data
        })
    
    def patch(self, request, trap_id):
        """Update a canary trap (label, description, is_active)."""
        from .serializers import CanaryTrapSerializer
        
        trap = self.get_object(trap_id, request.user)
        if not trap:
            return Response({'error': 'Trap not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only allow updating certain fields
        allowed_fields = {'label', 'description', 'is_active'}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = CanaryTrapSerializer(trap, data=update_data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, trap_id):
        """Delete a canary trap."""
        trap = self.get_object(trap_id, request.user)
        if not trap:
            return Response({'error': 'Trap not found'}, status=status.HTTP_404_NOT_FOUND)
        
        trap.delete()
        return Response({'message': 'Trap deleted successfully'}, status=status.HTTP_200_OK)


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import time
import random


@method_decorator(csrf_exempt, name='dispatch')
class CanaryTrapTriggerView(APIView):
    """
    The "Tripwire" endpoint - PUBLICLY ACCESSIBLE.
    
    When an attacker accesses this URL, it:
    1. Logs everything (IP, User-Agent, Referer, Timestamp)
    2. Fires an alert email to the trap owner
    3. Returns a deceptive response (403 Forbidden or fake login page)
    
    CRITICAL: This endpoint must be UNAUTHENTICATED so attackers can trigger it.
    
    Security Features:
    - CSRF exempt (allows POST from any origin)
    - Timing attack protection (random delay)
    - Consistent response for all cases (no information leakage)
    """
    permission_classes = []  # No authentication required!
    authentication_classes = []  # No authentication classes!
    
    def get(self, request, token):
        """Handle trap trigger via GET request."""
        return self._trigger_trap(request, token)
    
    def post(self, request, token):
        """Handle trap trigger via POST request (for form submissions)."""
        return self._trigger_trap(request, token)
    
    def _trigger_trap(self, request, token):
        """Process the trap trigger."""
        from .models import CanaryTrap
        from .services import SecurityService
        from django.http import HttpResponse
        
        # Timing attack protection: Add random delay to prevent
        # attackers from distinguishing valid vs invalid tokens
        time.sleep(random.uniform(0.1, 0.3))
        
        try:
            trap = CanaryTrap.objects.get(token=token)
        except CanaryTrap.DoesNotExist:
            # DECEPTION: Don't reveal it's a trap - return same response as valid trap
            return self._deceptive_response()
        
        if not trap.is_active:
            # Trap is disabled, still return deceptive response
            return self._deceptive_response()
        
        # Capture all forensic data
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        referer = request.META.get('HTTP_REFERER', '')
        
        # Additional data
        additional_data = {
            'method': request.method,
            'path': request.path,
            'query_string': request.META.get('QUERY_STRING', ''),
            'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
            'accept_encoding': request.META.get('HTTP_ACCEPT_ENCODING', ''),
        }
        
        # Record the trigger
        trigger = trap.trigger(
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            additional_data=additional_data
        )
        
        # Send alert email asynchronously (best effort)
        try:
            SecurityService.send_canary_alert(trap, trigger)
            trigger.alert_sent = True
            trigger.save(update_fields=['alert_sent'])
        except Exception as e:
            print(f"[CANARY ALERT] Failed to send: {e}")
        
        return self._deceptive_response()
    
    def _get_client_ip(self, request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
    
    def _deceptive_response(self):
        """
        Return a deceptive response that doesn't reveal this is a trap.
        
        Options:
        1. 403 Forbidden (looks like access denied)
        2. Fake login page HTML
        3. Generic error page
        
        Using 403 is recommended - it's believable and doesn't confirm/deny the trap.
        """
        from django.http import HttpResponse
        
        # Option 1: Simple 403 response
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Access Denied</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; padding: 40px; background: white; 
                     border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #dc2626; margin-bottom: 16px; }
        p { color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <h1>403 Forbidden</h1>
        <p>You don't have permission to access this resource.</p>
        <p style="font-size: 12px; margin-top: 20px; color: #9ca3af;">Error Code: AUTH-403-DENIED</p>
    </div>
</body>
</html>
        """
        return HttpResponse(html, status=403, content_type='text/html')
