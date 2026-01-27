# api/utils/__init__.py
"""
API Utilities Package

Common utilities for the AccountSafe API.

Modules:
- concurrency: Fire-and-forget async utilities
- notifications: Login tracking and security email notifications
"""

from .concurrency import FireAndForget, fire_and_forget
from .notifications import (
    get_location_data,
    track_login_attempt,
    send_duress_alert_email,
    send_login_notification_email,
)

__all__ = [
    # Concurrency
    'FireAndForget',
    'fire_and_forget',
    # Notifications
    'get_location_data',
    'track_login_attempt',
    'send_duress_alert_email',
    'send_login_notification_email',
]
