# api/authentication.py

from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import MultiToken


class MultiTokenAuthentication(TokenAuthentication):
    """
    Custom token authentication that supports multiple tokens per user.
    Uses the MultiToken model instead of rest_framework.authtoken.Token.
    Also checks if the associated UserSession is active.
    """
    model = MultiToken
    keyword = 'Token'
    
    def authenticate_credentials(self, key):
        try:
            token = MultiToken.objects.select_related('user', 'session').get(key=key)
        except MultiToken.DoesNotExist:
            raise AuthenticationFailed('Invalid token.')
        
        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted.')
        
        # Check if the session is active
        if hasattr(token, 'session') and not token.session.is_active:
            raise AuthenticationFailed('Session has been revoked. Please login again.')
        
        # Update last_active on the associated UserSession if exists
        try:
            if hasattr(token, 'session'):
                from django.utils import timezone
                token.session.last_active = timezone.now()
                token.session.save(update_fields=['last_active'])
        except Exception:
            pass  # Ignore errors updating last_active
        
        return (token.user, token)
