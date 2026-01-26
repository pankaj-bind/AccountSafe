# api/features/security/views.py
"""
Security Views

Views handle HTTP request/response only.
Business logic is delegated to SecurityService.
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import SecurityService
from .serializers import LoginRecordSerializer, UserSessionSerializer

# Module-level logger
logger = logging.getLogger(__name__)


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
from django.core.cache import cache
import time
import random


# ═══════════════════════════════════════════════════════════════════════════════
# RATE LIMITING FOR CANARY TRAPS
# ═══════════════════════════════════════════════════════════════════════════════

class CanaryTrapRateLimiter:
    """
    In-memory rate limiter for canary trap endpoints.
    
    Policy: 5 requests per minute per IP address.
    
    Uses Django's cache backend for storage, falling back to a simple
    in-memory dict if cache is unavailable.
    
    Security Note:
    - Prevents attackers from flooding the endpoint after discovery
    - Silently drops requests (no error messages that reveal rate limiting)
    - Rate-limited requests do NOT trigger email alerts (prevents alert fatigue)
    """
    
    # Configuration
    MAX_REQUESTS = 5      # Max requests allowed
    WINDOW_SECONDS = 60   # Time window in seconds
    CACHE_PREFIX = 'canary_trap_rl_'
    
    # Fallback in-memory storage if cache unavailable
    _memory_store: dict = {}
    
    @classmethod
    def is_rate_limited(cls, ip_address: str) -> bool:
        """
        Check if an IP address has exceeded the rate limit.
        
        Args:
            ip_address: The client's IP address
            
        Returns:
            True if rate limited (should block), False if allowed
        """
        if not ip_address:
            return False
        
        cache_key = f"{cls.CACHE_PREFIX}{ip_address}"
        current_time = time.time()
        
        try:
            # Try to use Django cache
            request_log = cache.get(cache_key, [])
        except Exception:
            # Fallback to memory if cache unavailable
            request_log = cls._memory_store.get(cache_key, [])
        
        # Clean old entries outside the window
        window_start = current_time - cls.WINDOW_SECONDS
        request_log = [ts for ts in request_log if ts > window_start]
        
        # Check if over limit
        if len(request_log) >= cls.MAX_REQUESTS:
            return True
        
        # Add current request
        request_log.append(current_time)
        
        try:
            # Store in cache with TTL
            cache.set(cache_key, request_log, timeout=cls.WINDOW_SECONDS * 2)
        except Exception:
            # Fallback to memory
            cls._memory_store[cache_key] = request_log
            # Clean old entries from memory store periodically
            if len(cls._memory_store) > 10000:
                cls._cleanup_memory_store()
        
        return False
    
    @classmethod
    def _cleanup_memory_store(cls):
        """Remove expired entries from memory store."""
        current_time = time.time()
        window_start = current_time - cls.WINDOW_SECONDS
        
        expired_keys = []
        for key, timestamps in cls._memory_store.items():
            valid = [ts for ts in timestamps if ts > window_start]
            if not valid:
                expired_keys.append(key)
            else:
                cls._memory_store[key] = valid
        
        for key in expired_keys:
            del cls._memory_store[key]


@method_decorator(csrf_exempt, name='dispatch')
class CanaryTrapTriggerView(APIView):
    """
    The "Tripwire" endpoint - PUBLICLY ACCESSIBLE.
    
    When an attacker accesses this URL, it:
    1. Logs everything (IP, User-Agent, Referer, Timestamp)
    2. Fires an alert email to the trap owner (ASYNC - non-blocking)
    3. Returns a deceptive response (403 Forbidden or fake login page)
    
    CRITICAL: This endpoint must be UNAUTHENTICATED so attackers can trigger it.
    
    Security Features:
    - CSRF exempt (allows POST from any origin)
    - Timing attack protection (random delay)
    - Consistent response for all cases (no information leakage)
    - Rate limiting (5 req/min per IP - prevents flooding)
    - Async email sending (instant response, email in background)
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
        from api.utils.concurrency import fire_and_forget
        
        # Get client IP first (needed for rate limiting)
        ip_address = self._get_client_ip(request)
        
        # ═══════════════════════════════════════════════════════════════════════
        # RATE LIMITING CHECK
        # If rate limited, silently return 403 WITHOUT triggering alert
        # This prevents alert fatigue from flooding attacks
        # ═══════════════════════════════════════════════════════════════════════
        if CanaryTrapRateLimiter.is_rate_limited(ip_address):
            # Silently drop - same response as normal, no email
            return self._deceptive_response()
        
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
        
        # Record the trigger (synchronous - we need the trigger object)
        trigger = trap.trigger(
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            additional_data=additional_data
        )
        
        # ═══════════════════════════════════════════════════════════════════════
        # ASYNC EMAIL SENDING
        # Fire-and-forget: Send email in background thread
        # Response returns instantly (<50ms), email sends separately
        # ═══════════════════════════════════════════════════════════════════════
        def send_alert_async():
            """Background task to send email and update trigger."""
            try:
                SecurityService.send_canary_alert(trap, trigger)
                trigger.alert_sent = True
                trigger.save(update_fields=['alert_sent'])
            except Exception as e:
                logger.error(f"[CANARY ALERT] Failed to send: {e}", exc_info=True)
        
        # Start background thread (non-blocking)
        fire_and_forget(
            target=send_alert_async,
            task_name=f"canary_alert_{trap.label}"
        )
        
        # Return IMMEDIATELY - don't wait for email
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


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD STATISTICS
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_statistics(request):
    """Get dashboard statistics for the authenticated user."""
    from api.models import Organization, Profile, LoginRecord
    
    user = request.user
    
    organization_count = Organization.objects.filter(category__user=user).count()
    profile_count = Profile.objects.filter(organization__category__user=user).count()
    
    recent_logins = LoginRecord.objects.filter(
        username_attempted=user.username
    ).order_by('-timestamp')[:10]
    
    login_serializer = LoginRecordSerializer(recent_logins, many=True, context={'request': request})
    
    return Response({
        'organization_count': organization_count,
        'profile_count': profile_count,
        'recent_logins': login_serializer.data
    })


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZATION SEARCH (Hybrid: Local + Clearbit API)
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([])
def lookup_organization_by_url(request):
    """
    Look up organization info by URL/domain.
    Extracts domain from URL and fetches organization name and logo.
    """
    import requests
    from urllib.parse import urlparse
    import re
    from bs4 import BeautifulSoup
    from api.models import CuratedOrganization
    
    url_input = request.GET.get('url', '').strip()
    
    if not url_input:
        return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Extract domain from URL
    url_clean = url_input.lower().strip()
    if not url_clean.startswith(('http://', 'https://')):
        url_clean = 'https://' + url_clean
    
    try:
        parsed = urlparse(url_clean)
        domain = parsed.netloc or parsed.path.split('/')[0]
    except Exception:
        domain = re.sub(r'^(https?://)?', '', url_input.lower())
        domain = domain.split('/')[0].split('?')[0]
    
    if not domain:
        return Response({"error": "Could not extract domain"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Remove common subdomains
    subdomain_patterns = ['www.', 'accounts.', 'auth.', 'login.', 'signin.', 'app.', 
                          'my.', 'portal.', 'console.', 'dashboard.', 'api.', 'm.', 'mobile.']
    main_domain = domain
    for pattern in subdomain_patterns:
        if main_domain.startswith(pattern):
            main_domain = main_domain[len(pattern):]
            break
    
    domain_name = main_domain.split('.')[0]
    
    # Step 1: Search local database
    try:
        local_org = CuratedOrganization.objects.filter(domain__icontains=main_domain).first()
        if local_org:
            return Response({
                'name': local_org.name,
                'domain': local_org.domain,
                'logo': local_org.get_logo(),
                'website_link': local_org.website_link or f'https://{local_org.domain}',
                'source': 'local',
                'is_verified': local_org.is_verified
            })
    except Exception:
        pass
    
    # Step 2: Try Clearbit API
    try:
        clearbit_url = f'https://autocomplete.clearbit.com/v1/companies/suggest?query={main_domain}'
        response = requests.get(clearbit_url, timeout=3)
        
        if response.status_code == 200:
            clearbit_data = response.json()
            for item in clearbit_data:
                item_domain = item.get('domain', '').lower()
                if item_domain == main_domain or item_domain == domain:
                    return Response({
                        'name': item.get('name', domain_name.capitalize()),
                        'domain': item_domain,
                        'logo': item.get('logo', f'https://www.google.com/s2/favicons?domain={item_domain}&sz=128'),
                        'website_link': f'https://{item_domain}',
                        'source': 'clearbit',
                        'is_verified': False
                    })
    except requests.RequestException:
        pass
    
    # Step 3: Fallback
    org_name = ' '.join(word.capitalize() for word in domain_name.replace('-', ' ').replace('_', ' ').split())
    
    return Response({
        'name': org_name or main_domain.split('.')[0].capitalize(),
        'domain': main_domain,
        'logo': f'https://www.google.com/s2/favicons?domain={main_domain}&sz=128',
        'website_link': f'https://{main_domain}',
        'source': 'fallback',
        'is_verified': False
    })


@api_view(['GET'])
@permission_classes([])
def search_organizations(request):
    """
    Hybrid organization search: Local database first, then Clearbit API fallback.
    """
    import requests
    from django.db.models import Case, When, Value, IntegerField
    from api.models import CuratedOrganization
    
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response({"error": "Query must be at least 2 characters"}, status=status.HTTP_400_BAD_REQUEST)
    
    results = []
    seen_domains = set()
    
    # Step 1: Search Local Database
    local_orgs = CuratedOrganization.objects.filter(
        name__icontains=query
    ).annotate(
        relevance=Case(
            When(name__iexact=query, then=Value(3)),
            When(name__istartswith=query, then=Value(2)),
            default=Value(1),
            output_field=IntegerField()
        )
    ).order_by('-relevance', '-priority', 'name')[:10]
    
    for org in local_orgs:
        results.append({
            'name': org.name,
            'domain': org.domain,
            'logo': org.get_logo(),
            'website_link': org.website_link or f'https://{org.domain}',
            'source': 'local',
            'is_verified': org.is_verified
        })
        seen_domains.add(org.domain.lower())
    
    # Step 2: Clearbit API Fallback
    if len(results) < 3:
        try:
            clearbit_url = f'https://autocomplete.clearbit.com/v1/companies/suggest?query={query}'
            response = requests.get(clearbit_url, timeout=3)
            
            if response.status_code == 200:
                clearbit_data = response.json()
                for item in clearbit_data[:6]:
                    domain = item.get('domain', '').lower()
                    if domain and domain not in seen_domains:
                        results.append({
                            'name': item.get('name', ''),
                            'domain': domain,
                            'logo': item.get('logo', f'https://www.google.com/s2/favicons?domain={domain}&sz=128'),
                            'website_link': f'https://{domain}',
                            'source': 'clearbit',
                            'is_verified': False
                        })
                        seen_domains.add(domain)
                        if len(results) >= 6:
                            break
        except requests.RequestException as e:
            logger.debug(f"Clearbit API error: {e}")
    
    return Response(results)
