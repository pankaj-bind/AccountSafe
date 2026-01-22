# api/features/auth/services.py
"""
Authentication Service Layer

Business logic for authentication is extracted here.
Views handle HTTP only; Services handle business logic.
"""

import hmac
import secrets
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.db import transaction

from api.models import UserProfile, LoginRecord, MultiToken, DuressSession, UserSession
from api.features.common.turnstile import verify_turnstile_token, get_client_ip
from api.features.common.user_agent import parse_user_agent
from api.features.common.ip_location import get_ip_location


def constant_time_compare(a: str, b: str) -> bool:
    """Compare two strings in constant time to prevent timing attacks."""
    return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))


class AuthService:
    """Service layer for authentication operations."""
    
    @staticmethod
    def get_user_salt(username: str) -> dict:
        """
        Get encryption salt(s) for a user.
        Returns salt, duress_salt, and whether ZK auth is set up.
        """
        try:
            user = User.objects.get(username__iexact=username)
            profile = user.userprofile
            
            if not profile.encryption_salt:
                return {'error': 'User has no encryption salt', 'status': 404}
            
            response = {
                'salt': profile.encryption_salt,
                'has_zk_auth': bool(profile.auth_hash)
            }
            
            if profile.duress_salt:
                response['duress_salt'] = profile.duress_salt
            
            return response
            
        except User.DoesNotExist:
            return {'error': 'Salt not found', 'status': 404}
        except UserProfile.DoesNotExist:
            return {'error': 'Salt not found', 'status': 404}
    
    @staticmethod
    def register_user(username: str, email: str, auth_hash: str, salt: str, 
                      request=None, turnstile_token: str = None) -> dict:
        """
        Register a new user with zero-knowledge authentication.
        Password is NEVER sent - only auth_hash.
        """
        # Validate required fields
        if not username:
            return {'error': 'Username is required', 'status': 400}
        if not email:
            return {'error': 'Email is required', 'status': 400}
        if not auth_hash:
            return {'error': 'auth_hash is required', 'status': 400}
        if not salt:
            return {'error': 'salt is required', 'status': 400}
        
        # Validate auth_hash format
        if len(auth_hash) != 64 or not all(c in '0123456789abcdef' for c in auth_hash.lower()):
            return {'error': 'Invalid auth_hash format', 'status': 400}
        
        # Verify Turnstile if provided
        if turnstile_token and request:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return {'error': 'Verification failed', 'status': 400}
        
        # Check existing user/email
        if User.objects.filter(username__iexact=username).exists():
            return {'error': 'Username already exists', 'status': 400}
        if User.objects.filter(email__iexact=email).exists():
            return {'error': 'Email already exists', 'status': 400}
        
        try:
            with transaction.atomic():
                # Create user with UNUSABLE password
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=None
                )
                user.set_unusable_password()
                user.save()
                
                # Update profile with ZK auth
                profile = user.userprofile
                profile.auth_hash = auth_hash.lower()
                profile.encryption_salt = salt
                profile.save()
                
                # Create token and session
                token = MultiToken.objects.create(user=user)
                session = AuthService._create_session(user, token, request)
                
                return {
                    'key': token.key,
                    'user': {'username': user.username, 'email': user.email},
                    'message': 'Registration successful (zero-knowledge)',
                    'status': 201
                }
                
        except Exception as e:
            return {'error': 'Registration failed', 'status': 500}
    
    @staticmethod
    def login_user(username: str, auth_hash: str, request=None, 
                   turnstile_token: str = None, is_relogin: bool = False) -> dict:
        """
        Login with zero-knowledge authentication.
        Password is NEVER sent - only auth_hash.
        """
        if not username:
            return {'error': 'Username is required', 'status': 400}
        if not auth_hash:
            return {'error': 'auth_hash is required', 'status': 400}
        
        # Verify Turnstile if provided
        if turnstile_token and request:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return {'error': 'Verification failed', 'status': 400}
        
        # Find user
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            AuthService._track_login(request, username, False)
            return {'error': 'Invalid credentials', 'status': 401}
        
        # Get profile
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            AuthService._track_login(request, username, False)
            return {'error': 'Invalid credentials', 'status': 401}
        
        # Check ZK auth setup
        if not profile.auth_hash:
            return {
                'error': 'Account not migrated to zero-knowledge authentication',
                'needs_migration': True,
                'salt': profile.encryption_salt,
                'status': 400
            }
        
        # Verify auth_hash
        auth_hash = auth_hash.lower()
        stored_hash = profile.auth_hash.lower()
        is_master_match = constant_time_compare(auth_hash, stored_hash)
        
        is_duress_match = False
        if not is_master_match and profile.duress_auth_hash:
            duress_hash = profile.duress_auth_hash.lower()
            is_duress_match = constant_time_compare(auth_hash, duress_hash)
        
        if not is_master_match and not is_duress_match:
            AuthService._track_login(request, username, False, user)
            return {'error': 'Invalid credentials', 'status': 401}
        
        # Successful login
        if request:
            login(request, user)
        
        # Clean up old duress sessions and create new token
        DuressSession.objects.filter(user=user).delete()
        token = MultiToken.objects.create(user=user)
        
        # Handle duress mode
        if is_duress_match:
            DuressSession.objects.create(
                token_key=token.key,
                user=user,
                ip_address=get_client_ip(request) if request else None
            )
            # Send SOS alert in background (import here to avoid circular)
            import threading
            from api.features.security.services import SecurityService
            threading.Thread(
                target=SecurityService.send_duress_alert,
                args=(user, request),
                daemon=True
            ).start()
        
        # Create session
        if request:
            AuthService._create_session(user, token, request)
        
        # Track login
        send_email = not is_relogin and not is_duress_match
        AuthService._track_login(request, username, True, user, is_duress_match, send_email)
        
        response = {
            'key': token.key,
            'user': {'username': user.username, 'email': user.email},
            'is_duress': is_duress_match
        }
        
        if is_duress_match:
            response['salt'] = profile.duress_salt
        else:
            response['salt'] = profile.encryption_salt
        
        return response
    
    @staticmethod
    def change_password(user, current_auth_hash: str, new_auth_hash: str, new_salt: str) -> dict:
        """Change password using zero-knowledge verification."""
        if not current_auth_hash:
            return {'error': 'current_auth_hash is required', 'status': 400}
        if not new_auth_hash:
            return {'error': 'new_auth_hash is required', 'status': 400}
        if not new_salt:
            return {'error': 'new_salt is required', 'status': 400}
        
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            return {'error': 'User profile not found', 'status': 404}
        
        if not profile.auth_hash:
            return {'error': 'Zero-knowledge auth not set up', 'status': 400}
        
        # Verify current password
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(current_auth_hash.lower(), stored_hash):
            return {'error': 'Current password is incorrect', 'status': 401}
        
        # Update to new auth_hash
        profile.auth_hash = new_auth_hash.lower()
        profile.encryption_salt = new_salt
        profile.save()
        
        return {'message': 'Password changed successfully', 'status': 200}
    
    @staticmethod
    def verify_auth_hash(user, auth_hash: str) -> dict:
        """Verify auth_hash without creating new session."""
        if not auth_hash:
            return {'error': 'auth_hash is required', 'status': 400}
        
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            return {'error': 'User profile not found', 'status': 404}
        
        if not profile.auth_hash:
            return {'error': 'Zero-knowledge auth not set up', 'status': 400}
        
        auth_hash = auth_hash.lower()
        stored_hash = profile.auth_hash.lower()
        
        # Check master
        if constant_time_compare(auth_hash, stored_hash):
            return {
                'verified': True,
                'is_duress': False,
                'salt': profile.encryption_salt
            }
        
        # Check duress
        if profile.duress_auth_hash:
            duress_hash = profile.duress_auth_hash.lower()
            if constant_time_compare(auth_hash, duress_hash):
                return {
                    'verified': True,
                    'is_duress': True,
                    'salt': profile.duress_salt
                }
        
        return {'verified': False, 'error': 'Invalid credentials', 'status': 401}
    
    @staticmethod
    def delete_account(user, auth_hash: str) -> dict:
        """Delete account using zero-knowledge verification."""
        if not auth_hash:
            return {'error': 'auth_hash is required', 'status': 400}
        
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            return {'error': 'User profile not found', 'status': 404}
        
        if not profile.auth_hash:
            return {'error': 'Zero-knowledge auth not set up', 'status': 400}
        
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(auth_hash.lower(), stored_hash):
            return {'error': 'Verification failed', 'status': 401}
        
        username = user.username
        user.delete()
        
        return {'message': 'Account deleted successfully', 'status': 200}
    
    @staticmethod
    def _create_session(user, token, request):
        """Create a UserSession record."""
        if not request:
            return None
        
        user_agent_str = request.META.get('HTTP_USER_AGENT', '')
        ua_data = parse_user_agent(user_agent_str)
        ip_address = get_client_ip(request)
        location_data = get_ip_location(ip_address)
        
        return UserSession.objects.create(
            user=user,
            token=token,
            ip_address=ip_address,
            user_agent=user_agent_str,
            device_type=ua_data['device_type'],
            browser=ua_data['browser'],
            os=ua_data['os'],
            location=location_data.get('location', ''),
            country_code=location_data.get('country_code', ''),
            is_active=True
        )
    
    @staticmethod
    def _track_login(request, username, is_success, user=None, is_duress=False, send_notification=True):
        """Track login attempt."""
        from api.features.security.services import SecurityService
        SecurityService.track_login_attempt(
            request, username, is_success, user, is_duress, send_notification
        )
