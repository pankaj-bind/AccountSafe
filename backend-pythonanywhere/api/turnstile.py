# api/turnstile.py
import os
import requests
from django.conf import settings

TURNSTILE_SECRET_KEY = os.getenv('TURNSTILE_SECRET_KEY', '')
TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'


def verify_turnstile_token(token: str, remote_ip: str = None) -> dict:
    """
    Verify Cloudflare Turnstile token.
    
    Args:
        token: The Turnstile token from the frontend
        remote_ip: Optional IP address of the user
        
    Returns:
        dict with 'success' boolean and optional 'error-codes' list
    """
    if not token:
        return {
            'success': False,
            'error-codes': ['missing-token']
        }
    
    payload = {
        'secret': TURNSTILE_SECRET_KEY,
        'response': token,
    }
    
    if remote_ip:
        payload['remoteip'] = remote_ip
    
    try:
        response = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        return result
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error-codes': ['verification-failed'],
            'error_message': str(e)
        }


def get_client_ip(request) -> str:
    """
    Get the client's IP address from the request.
    Handles proxy headers like X-Forwarded-For.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
