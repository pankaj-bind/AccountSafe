# api/features/common/email_utils.py
"""
Email utility functions for AccountSafe.
"""


def get_alert_context(alert_type: str) -> dict:
    """
    Get styling and content based on alert type.
    
    Args:
        alert_type: 'login' or 'duress'
    
    Returns:
        Dictionary with alert configuration for email templates.
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
