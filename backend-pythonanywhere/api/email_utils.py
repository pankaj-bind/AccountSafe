"""
Email utility functions for AccountSafe
Includes user-agent parsing and email template rendering
"""

import re
from user_agents import parse


def parse_user_agent(user_agent_string):
    """
    Parse user-agent string into human-readable device info
    Returns: dict with device_type, device_name, browser, os
    """
    if not user_agent_string:
        return {
            'device_type': 'unknown',
            'device_icon': '💻',
            'device_name': 'Unknown Device',
            'browser': None,
            'os': None
        }
    
    try:
        ua = parse(user_agent_string)
        
        # Determine device type and icon
        if ua.is_mobile:
            device_type = 'mobile'
            device_icon = '📱'
        elif ua.is_tablet:
            device_type = 'tablet'
            device_icon = '📱'
        elif ua.is_pc:
            device_type = 'desktop'
            device_icon = '💻'
        else:
            device_type = 'unknown'
            device_icon = '💻'
        
        # Build device name
        browser_name = ua.browser.family if ua.browser.family != 'Other' else None
        os_name = ua.os.family if ua.os.family != 'Other' else None
        
        # Create clean device name
        parts = []
        if browser_name:
            parts.append(browser_name)
        if os_name:
            parts.append(f"on {os_name}")
        
        device_name = ' '.join(parts) if parts else 'Unknown Device'
        
        return {
            'device_type': device_type,
            'device_icon': device_icon,
            'device_name': device_name,
            'browser': browser_name,
            'os': os_name
        }
    except Exception as e:
        return {
            'device_type': 'unknown',
            'device_icon': '💻',
            'device_name': 'Unknown Device',
            'browser': None,
            'os': None
        }


def get_alert_context(alert_type):
    """
    Get styling and content based on alert type
    alert_type: 'login' or 'duress'
    """
    if alert_type == 'duress':
        return {
            'type': 'duress',
            'accent_color': '#dc2626',
            'title': '🚨 Emergency: Duress Login',
            'subtitle': 'Critical Security Alert',
            'message': 'The duress password was used to access your AccountSafe account. This indicates you may be under coercion or unauthorized access is occurring.',
            'footer_message': 'If you did not trigger this alert, your account may be compromised. Take immediate action to secure your account.',
            'action_text': None,  # No action button for duress
            'action_url': None
        }
    else:  # login
        return {
            'type': 'login',
            'accent_color': '#10b981',
            'title': 'New Sign-in Detected',
            'subtitle': 'Account Activity',
            'message': 'We noticed a new login to your AccountSafe account. If this was you, no action is needed.',
            'footer_message': 'If you don\'t recognize this activity, please secure your account immediately.',
            'action_text': 'Review Account Activity',
            'action_url': None  # Can be set to dashboard URL
        }
