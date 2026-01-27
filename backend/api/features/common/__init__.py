# api/features/common/__init__.py
"""
Common utilities module.

Contains shared utilities used across multiple features:
- turnstile: Cloudflare Turnstile verification
- ip_location: IP geolocation
- user_agent: User agent parsing
- email_utils: Email template utilities
- decorators: Common view decorators
- health: Health check endpoint for observability
"""

from .turnstile import verify_turnstile_token, get_client_ip
from .ip_location import get_ip_location, get_location_string, get_country_code
from .user_agent import parse_user_agent, parse_user_agent_basic
from .email_utils import get_alert_context
from .decorators import no_store
from .health import health_check

__all__ = [
    'verify_turnstile_token',
    'get_client_ip',
    'get_ip_location',
    'get_location_string',
    'get_country_code',
    'parse_user_agent',
    'parse_user_agent_basic',
    'get_alert_context',
    'no_store',
    'health_check',
]