# api/features/security/services.py
"""
Security Service Layer

Business logic for security features: health scores, sessions, duress mode, login tracking.
"""

import hashlib
import requests
from datetime import timedelta
from typing import Dict, Tuple

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Count, Case, When, IntegerField, Q, Avg, Value

from api.models import (
    UserProfile, Profile, LoginRecord, UserSession, DuressSession, MultiToken
)
from api.features.common.ip_location import get_ip_location
from api.features.common.user_agent import parse_user_agent
from api.features.common.email_utils import get_alert_context


class SecurityService:
    """Service layer for security operations."""
    
    # ===========================
    # LOGIN TRACKING
    # ===========================
    
    @staticmethod
    def track_login_attempt(request, username: str, is_success: bool, 
                            user=None, is_duress: bool = False, 
                            send_notification: bool = True):
        """Track login attempt with location data and optionally send email notification."""
        from api.features.common.turnstile import get_client_ip
        
        ip_address = get_client_ip(request) if request else None
        location_data = SecurityService._get_location_data(ip_address) if ip_address else {}
        user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
        
        # Determine status
        if is_duress:
            status = 'duress'
        elif is_success:
            status = 'success'
        else:
            status = 'failed'
        
        record = LoginRecord.objects.create(
            user=user if is_success else None,
            username_attempted=username,
            status=status,
            is_duress=is_duress,
            ip_address=ip_address,
            country=location_data.get('country', ''),
            isp=location_data.get('isp', ''),
            latitude=location_data.get('latitude'),
            longitude=location_data.get('longitude'),
            timezone=location_data.get('timezone'),
            user_agent=user_agent
        )
        
        if send_notification and is_success and user:
            SecurityService._send_login_notification(record, user)
    
    @staticmethod
    def send_duress_alert(user, request):
        """Send SOS alert email when duress password is used."""
        try:
            if not hasattr(user, 'userprofile') or not user.userprofile.sos_email:
                return
            
            from api.features.common.turnstile import get_client_ip
            
            sos_email = user.userprofile.sos_email
            ip_address = get_client_ip(request) if request else None
            location_data = SecurityService._get_location_data(ip_address) if ip_address else {}
            user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
            timestamp = timezone.now()
            
            device = parse_user_agent(user_agent)
            alert = get_alert_context('duress')
            
            location = location_data.get('country') if location_data.get('country') not in ['Unknown', 'N/A', ''] else None
            timestamp_str = timestamp.strftime('%B %d, %Y at %I:%M %p %Z')
            
            context = {
                'alert': alert,
                'username': user.username,
                'device': device,
                'timestamp': timestamp_str,
                'location': location,
                'ip_address': ip_address or 'Unknown',
                'isp': location_data.get('isp') if location_data.get('isp') not in ['Unknown', 'N/A', ''] else None,
            }
            
            html_content = render_to_string('security_notification_email.html', context)
            
            text_content = f"""
            DURESS LOGIN ALERT - AccountSafe
            
            {alert['title']}
            {alert['message']}
            
            Account: {user.username}
            Device: {device['device_name']}
            Time: {timestamp_str}
            IP Address: {ip_address or 'Unknown'}
            {f'Location: {location}' if location else ''}
            
            {alert['footer_message']}
            """
            
            email = EmailMultiAlternatives(
                subject="🚨 URGENT: Duress Login Detected - AccountSafe",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[sos_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
        except Exception as e:
            print(f"[DURESS ALERT] Failed to send: {e}")
    
    @staticmethod
    def _send_login_notification(record, user):
        """Send email notification for login attempt."""
        try:
            recipient_email = user.email
            if not recipient_email:
                return
            
            device = parse_user_agent(record.user_agent)
            alert = get_alert_context('login')
            
            location = record.country if record.country not in ['Unknown', 'N/A', ''] else None
            timestamp = record.timestamp.strftime('%B %d, %Y at %I:%M %p %Z') if record.timestamp else 'Unknown'
            
            context = {
                'alert': alert,
                'username': user.username,
                'device': device,
                'timestamp': timestamp,
                'location': location,
                'ip_address': record.ip_address or 'Unknown',
                'isp': record.isp if record.isp and record.isp not in ['Unknown', 'N/A', ''] else None,
            }
            
            html_content = render_to_string('security_notification_email.html', context)
            
            text_content = f"""
            SECURITY NOTIFICATION - AccountSafe
            
            {alert['title']}
            {alert['message']}
            
            Account: {user.username}
            Device: {device['device_name']}
            Time: {timestamp}
            IP Address: {record.ip_address or 'Unknown'}
            {f'Location: {location}' if location else ''}
            """
            
            email = EmailMultiAlternatives(
                subject=f"🔐 {alert['title']} - AccountSafe",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
        except Exception as e:
            print(f"[LOGIN NOTIFICATION] Failed: {e}")
    
    @staticmethod
    def _get_location_data(ip_address: str) -> dict:
        """Get location data from IP address."""
        if not ip_address or ip_address in ['127.0.0.1', 'localhost']:
            return {
                'country': 'Local',
                'isp': 'Local Network',
                'latitude': None,
                'longitude': None,
                'timezone': None
            }
        
        try:
            response = requests.get(f'https://ipinfo.io/{ip_address}/json', timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                location = data.get('loc', '')
                latitude, longitude = None, None
                if location and ',' in location:
                    try:
                        lat, lon = location.split(',')
                        latitude = float(lat.strip())
                        longitude = float(lon.strip())
                    except:
                        pass
                
                city = data.get('city', '')
                region = data.get('region', '')
                country = data.get('country', '')
                
                location_parts = [p for p in [city, region, country] if p]
                location_str = ', '.join(location_parts) if location_parts else 'Unknown'
                
                return {
                    'country': location_str,
                    'isp': data.get('org', 'Unknown'),
                    'latitude': latitude,
                    'longitude': longitude,
                    'timezone': data.get('timezone', None)
                }
        except Exception as e:
            print(f"Error fetching location data: {e}")
        
        return {
            'country': 'Unknown',
            'isp': 'Unknown',
            'latitude': None,
            'longitude': None,
            'timezone': None
        }
    
    # ===========================
    # HEALTH SCORE
    # ===========================
    
    @staticmethod
    def calculate_health_score(user) -> Dict:
        """
        Calculate security health score for user's vault.
        Score = (Strength × 40%) + (Uniqueness × 30%) + (Integrity × 20%) + (Hygiene × 10%)
        """
        profiles = Profile.objects.filter(organization__category__user=user)
        total_count = profiles.count()
        
        if total_count == 0:
            return {
                'overall_score': 100,
                'total_passwords': 0,
                'strength_score': 100,
                'uniqueness_score': 100,
                'integrity_score': 100,
                'hygiene_score': 100,
                'breakdown': {
                    'weak_passwords': 0,
                    'reused_passwords': 0,
                    'breached_passwords': 0,
                    'outdated_passwords': 0,
                }
            }
        
        # Strength Score (40%)
        avg_strength = profiles.aggregate(avg_strength=Avg('password_strength'))['avg_strength'] or 0
        strength_score = (avg_strength / 4) * 100
        
        # Uniqueness Score (30%)
        profiles_with_hash = profiles.exclude(password_hash__isnull=True).exclude(password_hash='')
        hash_count = profiles_with_hash.count()
        
        if hash_count > 0:
            password_counts = profiles_with_hash.values('password_hash').annotate(count=Count('id'))
            unique_passwords = sum(1 for pc in password_counts if pc['count'] == 1)
            uniqueness_score = (unique_passwords / hash_count) * 100
        else:
            uniqueness_score = 100
            unique_passwords = 0
        
        # Integrity Score (20%)
        safe_count = profiles.filter(is_breached=False).count()
        integrity_score = (safe_count / total_count) * 100 if total_count > 0 else 100
        
        # Hygiene Score (10%)
        one_year_ago = timezone.now() - timedelta(days=365)
        recent_count = profiles.filter(
            Q(last_password_update__gte=one_year_ago) | Q(last_password_update__isnull=True)
        ).count()
        hygiene_score = (recent_count / total_count) * 100 if total_count > 0 else 100
        
        # Overall score
        overall_score = (
            strength_score * 0.40 +
            uniqueness_score * 0.30 +
            integrity_score * 0.20 +
            hygiene_score * 0.10
        )
        
        # Breakdown counts
        weak_passwords = profiles.filter(password_strength__lte=2).count()
        reused_passwords = hash_count - unique_passwords if hash_count > 0 else 0
        breached_passwords = profiles.filter(is_breached=True).count()
        outdated_passwords = profiles.filter(
            last_password_update__lt=one_year_ago,
            last_password_update__isnull=False
        ).count()
        
        return {
            'overall_score': round(overall_score, 1),
            'total_passwords': total_count,
            'strength_score': round(strength_score, 1),
            'uniqueness_score': round(uniqueness_score, 1),
            'integrity_score': round(integrity_score, 1),
            'hygiene_score': round(hygiene_score, 1),
            'breakdown': {
                'weak_passwords': weak_passwords,
                'reused_passwords': reused_passwords,
                'breached_passwords': breached_passwords,
                'outdated_passwords': outdated_passwords,
            }
        }
    
    @staticmethod
    def check_password_breach(password: str) -> Tuple[bool, int]:
        """Check if password has been breached using HIBP k-Anonymity API."""
        if not password:
            return False, 0
        
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        try:
            response = requests.get(
                f'https://api.pwnedpasswords.com/range/{prefix}',
                timeout=5,
                headers={'User-Agent': 'AccountSafe-SecurityChecker'}
            )
            
            if response.status_code == 200:
                hashes = response.text.split('\n')
                for hash_line in hashes:
                    if ':' in hash_line:
                        hash_suffix, count = hash_line.split(':')
                        if hash_suffix.strip() == suffix:
                            return True, int(count.strip())
                return False, 0
            else:
                return False, 0
                
        except Exception as e:
            print(f"HIBP API error: {e}")
            return False, 0
    
    @staticmethod
    def update_password_strength(profile_id: int, strength_score: int) -> bool:
        """Update password strength score for a profile."""
        try:
            profile = Profile.objects.get(id=profile_id)
            profile.password_strength = max(0, min(4, strength_score))
            profile.save(update_fields=['password_strength'])
            return True
        except Profile.DoesNotExist:
            return False
    
    @staticmethod
    def update_breach_status(profile_id: int, is_breached: bool) -> bool:
        """Update breach status for a profile."""
        try:
            profile = Profile.objects.get(id=profile_id)
            profile.is_breached = is_breached
            profile.last_breach_check_date = timezone.now()
            profile.save(update_fields=['is_breached', 'last_breach_check_date'])
            return True
        except Profile.DoesNotExist:
            return False
    
    @staticmethod
    def update_password_hash(profile_id: int, password_hash: str) -> bool:
        """Update password hash for uniqueness checking."""
        try:
            profile = Profile.objects.get(id=profile_id)
            profile.password_hash = password_hash
            profile.save(update_fields=['password_hash'])
            return True
        except Profile.DoesNotExist:
            return False
    
    # ===========================
    # SESSION MANAGEMENT
    # ===========================
    
    @staticmethod
    def list_active_sessions(user):
        """List all active sessions for a user."""
        return UserSession.objects.filter(user=user, is_active=True).order_by('-last_active')
    
    @staticmethod
    def revoke_session(session_id: int, user, current_token_key: str) -> dict:
        """Revoke a specific session."""
        try:
            session = UserSession.objects.get(id=session_id, user=user, is_active=True)
            
            if session.token.key == current_token_key:
                return {'error': 'Cannot revoke current session', 'status': 400}
            
            session.revoke()
            return {'message': 'Session revoked successfully'}
            
        except UserSession.DoesNotExist:
            return {'error': 'Session not found', 'status': 404}
    
    @staticmethod
    def revoke_all_sessions(user, current_token_key: str) -> dict:
        """Revoke all sessions except current one."""
        sessions_to_revoke = UserSession.objects.filter(
            user=user, 
            is_active=True
        ).exclude(token__key=current_token_key)
        
        count = sessions_to_revoke.count()
        
        MultiToken.objects.filter(user=user).exclude(key=current_token_key).delete()
        
        return {
            'message': f'Successfully revoked {count} session{"s" if count != 1 else ""}',
            'revoked_count': count
        }
    
    # ===========================
    # DURESS MODE SETTINGS
    # ===========================
    
    @staticmethod
    def get_security_settings(user, is_duress: bool = False) -> dict:
        """Get current security settings."""
        try:
            profile = user.userprofile
            
            if is_duress:
                return {
                    'panic_shortcut': profile.panic_shortcut or [],
                    'has_duress_password': False,
                    'sos_email': ''
                }
            
            return {
                'panic_shortcut': profile.panic_shortcut or [],
                'has_duress_password': profile.has_duress_password(),
                'sos_email': profile.sos_email or ''
            }
        except UserProfile.DoesNotExist:
            return {
                'panic_shortcut': [],
                'has_duress_password': False,
                'sos_email': ''
            }
    
    @staticmethod
    def set_panic_shortcut(user, shortcut: list) -> dict:
        """Set panic button shortcut."""
        FORBIDDEN_SHORTCUTS = [
            ['Control', 'w'], ['Control', 'W'],
            ['Control', 't'], ['Control', 'T'],
            ['Control', 'n'], ['Control', 'N'],
            ['Control', 'Tab'],
            ['Alt', 'F4'],
            ['Control', 'r'], ['Control', 'R'],
            ['F5'], ['Control', 'F5'],
            ['F11'], ['F12'],
            ['Control', 'Shift', 'i'], ['Control', 'Shift', 'I'],
            ['Control', 'p'], ['Control', 'P'],
            ['Control', 's'], ['Control', 'S'],
            ['Control', 'f'], ['Control', 'F'],
            ['Alt', 'Tab'],
        ]
        
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        if not isinstance(shortcut, list):
            return {'error': 'Shortcut must be a list of key names', 'status': 400}
        
        if len(shortcut) < 2:
            return {'error': 'Shortcut must have at least 2 keys', 'status': 400}
        
        shortcut_normalized = [k.lower() for k in shortcut]
        for forbidden in FORBIDDEN_SHORTCUTS:
            forbidden_normalized = [k.lower() for k in forbidden]
            if shortcut_normalized == forbidden_normalized or set(shortcut_normalized) == set(forbidden_normalized):
                return {'error': f'This shortcut is reserved by the browser', 'status': 400}
        
        profile.panic_shortcut = shortcut
        profile.save()
        
        return {
            'message': 'Panic shortcut saved successfully',
            'panic_shortcut': shortcut
        }
    
    @staticmethod
    def clear_panic_shortcut(user) -> dict:
        """Clear panic button shortcut."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        profile.panic_shortcut = []
        profile.save()
        
        return {
            'message': 'Panic shortcut cleared',
            'panic_shortcut': []
        }
    
    # ===========================
    # CANARY TRAP (HONEYTOKEN) ALERTS
    # ===========================
    
    @staticmethod
    def send_canary_alert(trap, trigger):
        """
        Send alert email when a canary trap is triggered.
        
        Args:
            trap: The CanaryTrap object that was triggered
            trigger: The CanaryTrapTrigger record with forensic data
        """
        try:
            user = trap.user
            recipient_email = user.email
            
            if not recipient_email:
                print(f"[CANARY ALERT] No email for user {user.username}")
                return
            
            # Get geolocation for IP if possible
            if trigger.ip_address and trigger.ip_address not in ['Unknown', '127.0.0.1']:
                location_data = SecurityService._get_location_data(trigger.ip_address)
                trigger.country = location_data.get('country', '')
                trigger.isp = location_data.get('isp', '')
                trigger.save(update_fields=['country', 'isp'])
            
            device = parse_user_agent(trigger.user_agent)
            timestamp_str = trigger.triggered_at.strftime('%B %d, %Y at %I:%M %p UTC')
            
            # Build email context
            context = {
                'trap_label': trap.label,
                'trap_type': trap.get_trap_type_display(),
                'triggered_count': trap.triggered_count,
                'username': user.username,
                'device': device,
                'timestamp': timestamp_str,
                'ip_address': trigger.ip_address or 'Unknown',
                'location': trigger.country if trigger.country not in ['Unknown', 'N/A', ''] else None,
                'isp': trigger.isp if trigger.isp not in ['Unknown', 'N/A', ''] else None,
                'referer': trigger.referer if trigger.referer else None,
                'user_agent': trigger.user_agent[:200] if trigger.user_agent else None,
            }
            
            html_content = render_to_string('canary_trap_alert.html', context)
            
            text_content = f"""
🚨 CANARY TRAP TRIGGERED - AccountSafe

CRITICAL SECURITY ALERT: Your trap credential was accessed!

Trap: {trap.label}
Type: {trap.get_trap_type_display()}
Trigger Count: {trap.triggered_count}

ACCESS DETAILS:
Time: {timestamp_str}
IP Address: {trigger.ip_address or 'Unknown'}
{f'Location: {trigger.country}' if trigger.country else ''}
{f'ISP: {trigger.isp}' if trigger.isp else ''}
Device: {device['device_name']}
{f'Referer: {trigger.referer}' if trigger.referer else ''}

This indicates that someone has accessed a trap credential you placed.
This is likely an indicator of a security breach.

RECOMMENDED ACTIONS:
1. Change all passwords in your vault immediately
2. Check for unauthorized access to your accounts
3. Enable 2FA on all critical accounts
4. Review the IP address and location for suspicious activity
5. Consider if your vault password has been compromised

Stay safe,
AccountSafe Security
            """
            
            email = EmailMultiAlternatives(
                subject=f"🚨 BREACH ALERT: Trap '{trap.label}' Triggered - AccountSafe",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            print(f"[CANARY ALERT] Sent alert for trap '{trap.label}' to {recipient_email}")
            
        except Exception as e:
            print(f"[CANARY ALERT] Failed to send: {e}")
            raise
