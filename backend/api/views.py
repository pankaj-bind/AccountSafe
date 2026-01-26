# api/views.py
"""
Minimal API Views

This file contains only:
1. API Root endpoint
2. User Profile management (get/update)
3. Shared utility functions used across features

All other views have been moved to feature modules:
- api.features.auth.views - Authentication (login, register, OTP, PIN)
- api.features.vault.views - Vault management (categories, organizations, profiles)
- api.features.security.views - Security (health score, sessions, canary traps)
- api.features.shared_secret.views - Shared secrets

This keeps the main views.py under 150 lines and follows
separation of concerns principles.
"""

import logging
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile, LoginRecord
from .serializers import UserProfileSerializer, UserProfileUpdateSerializer
from .features.common import parse_user_agent, get_alert_context, get_client_ip

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


# 
# SHARED UTILITIES (Used by feature modules)
# 

def get_location_data(ip_address):
    """Get location data from IP address using ipinfo.io."""
    import requests
    
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
        logger.warning(f"Error fetching location data: {e}")
    
    return {
        'country': 'Unknown',
        'isp': 'Unknown',
        'latitude': None,
        'longitude': None,
        'timezone': None
    }


def track_login_attempt(request, username, password=None, is_success=False, user=None, is_duress=False, send_notification=True):
    """
    Track login attempt with location data and optionally send email notification.
    
    Used by authentication views to record login attempts for security auditing.
    """
    ip_address = get_client_ip(request)
    location_data = get_location_data(ip_address)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    if is_duress:
        login_status = 'duress'
    elif is_success:
        login_status = 'success'
    else:
        login_status = 'failed'
    
    record = LoginRecord.objects.create(
        user=user if is_success else None,
        username_attempted=username,
        status=login_status,
        is_duress=is_duress,
        ip_address=ip_address,
        country=location_data['country'],
        isp=location_data['isp'],
        latitude=location_data['latitude'],
        longitude=location_data['longitude'],
        timezone=location_data['timezone'],
        user_agent=user_agent
    )
    
    if send_notification:
        _send_login_notification_email(record, user)


def _send_login_notification_email(record, user):
    """Send email notification for login attempt using unified template."""
    try:
        if not user:
            try:
                user = User.objects.get(username=record.username_attempted)
            except User.DoesNotExist:
                return
        
        recipient_email = user.email
        if not recipient_email:
            return
        
        device = parse_user_agent(record.user_agent)
        alert = get_alert_context('login')
        
        location = None
        if record.country and record.country not in ['Unknown', 'N/A', '']:
            location = record.country
        
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
        
        Account: {user.username}
        Device: {device['device_name']}
        Time: {timestamp}
        IP Address: {record.ip_address or 'Unknown'}
        {f'Location: {location}' if location else ''}
        
        {alert['footer_message']}
        """
        
        email = EmailMultiAlternatives(
            subject=f"{alert['title']} - AccountSafe",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        logger.info(f"[LOGIN NOTIFICATION] Email sent to {recipient_email}")
        
    except Exception as e:
        logger.error(f"[LOGIN NOTIFICATION] Failed: {str(e)}", exc_info=True)


def send_duress_alert_email(user, request):
    """
    Send SOS alert email when duress password is used.
    Runs in background thread to not delay login response.
    """
    try:
        if not hasattr(user, 'userprofile') or not user.userprofile.sos_email:
            logger.warning(f"[DURESS ALERT] No SOS email for {user.username}")
            return
        
        sos_email = user.userprofile.sos_email
        ip_address = get_client_ip(request)
        location_data = get_location_data(ip_address)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        timestamp = timezone.now()
        
        logger.warning(f"[DURESS ALERT] User: {user.username}, IP: {ip_address}")
        
        device = parse_user_agent(user_agent)
        alert = get_alert_context('duress')
        
        location = None
        if location_data.get('country') and location_data['country'] not in ['Unknown', 'N/A', '']:
            location = location_data['country']
        
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
        
        Account: {user.username}
        Device: {device['device_name']}
        Time: {timestamp_str}
        IP Address: {ip_address or 'Unknown'}
        {f'Location: {location}' if location else ''}
        
        {alert['footer_message']}
        """
        
        email = EmailMultiAlternatives(
            subject="URGENT: Duress Login Detected - AccountSafe",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[sos_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        logger.info(f"[DURESS ALERT] SOS email sent to {sos_email}")
        
    except Exception as e:
        logger.error(f"[DURESS ALERT] Failed: {str(e)}", exc_info=True)
