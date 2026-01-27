# api/utils/notifications.py
"""
Notification utilities for login tracking and security alerts.

This module provides backwards-compatible wrapper functions that delegate
to the SecurityService. These functions are used by authentication views
to record login attempts and send security notifications.

Note: The actual implementations live in api.features.security.services.SecurityService.
This module provides a cleaner import path for cross-feature usage.
"""

import logging

from api.features.security.services import SecurityService
from api.features.common import get_ip_location, get_client_ip

logger = logging.getLogger(__name__)


def get_location_data(ip_address: str) -> dict:
    """
    Get location data from IP address.
    
    This is a wrapper around the ip_location module with backwards-compatible
    response format including ISP, latitude, longitude, and timezone.
    
    Args:
        ip_address: The IP address to look up.
        
    Returns:
        dict with keys: country, isp, latitude, longitude, timezone
    """
    # Use the existing ip_location module
    location = get_ip_location(ip_address)
    
    return {
        'country': location.get('location', 'Unknown') or 'Unknown',
        'isp': 'Unknown',  # ip-api.com doesn't return ISP in current setup
        'latitude': None,
        'longitude': None,
        'timezone': None
    }


def track_login_attempt(
    request,
    username: str,
    password: str = None,  # Kept for signature compatibility, never used
    is_success: bool = False,
    user=None,
    is_duress: bool = False,
    send_notification: bool = True
):
    """
    Track login attempt with location data and optionally send email notification.
    
    This is used by authentication views to record login attempts for security
    auditing and to trigger email notifications on successful logins.
    
    Args:
        request: Django request object
        username: Username attempted
        password: DEPRECATED - Never used, kept for signature compatibility
        is_success: Whether login was successful
        user: User object if login successful
        is_duress: Whether this was a duress login
        send_notification: Whether to send email notification
    """
    # Delegate to SecurityService
    SecurityService.track_login_attempt(
        request=request,
        username=username,
        is_success=is_success,
        user=user,
        is_duress=is_duress,
        send_notification=send_notification
    )


def send_duress_alert_email(user, request):
    """
    Send SOS alert email when duress password is used.
    
    This runs in background thread to not delay login response.
    The alert is sent to the user's configured SOS email address.
    
    Args:
        user: The User object for the duress login
        request: Django request object
    """
    SecurityService.send_duress_alert(user, request)


def send_login_notification_email(record, user):
    """
    Send email notification for login attempt.
    
    This is typically called automatically by track_login_attempt when
    send_notification=True.
    
    Args:
        record: LoginRecord instance
        user: User object
    """
    SecurityService._send_login_notification(record, user)


# Backwards compatibility alias
_send_login_notification_email = send_login_notification_email

__all__ = [
    'get_location_data',
    'track_login_attempt',
    'send_duress_alert_email',
    'send_login_notification_email',
    '_send_login_notification_email',
]
