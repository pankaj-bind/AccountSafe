# api/zero_knowledge_auth.py
# ═══════════════════════════════════════════════════════════════════════════════
# TRUE Zero-Knowledge Authentication
# ═══════════════════════════════════════════════════════════════════════════════
#
# This module implements TRUE zero-knowledge authentication where:
# 1. ❌ Password is NEVER sent to the server
# 2. ✅ Only auth_hash (derived from password) is transmitted
# 3. ✅ Server cannot derive the encryption key from auth_hash
# 4. ✅ Server stores auth_hash for verification, NOT password
#
# Flow:
# 1. Registration: Client derives auth_hash from password → sends auth_hash → server stores it
# 2. Login: Client derives auth_hash → sends auth_hash → server compares with stored hash
# 3. Password Change: Client sends old_auth_hash + new_auth_hash → server verifies old, stores new
#
# Security Properties:
# - Server NEVER knows the user's password
# - auth_hash is derived with different context than encryption key
# - Even if server is compromised, attacker cannot derive encryption key
# ═══════════════════════════════════════════════════════════════════════════════

import secrets
import hashlib
import hmac
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, LoginRecord, MultiToken, DuressSession, UserSession
from .turnstile import verify_turnstile_token, get_client_ip
from .user_agent_parser import parse_user_agent
from .ip_location import get_ip_location


def constant_time_compare(a: str, b: str) -> bool:
    """
    Compare two strings in constant time to prevent timing attacks.
    """
    return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))


def track_zk_login_attempt(request, username: str, is_success: bool, user=None, is_duress: bool = False, send_notification: bool = True):
    """Track login attempt for zero-knowledge auth."""
    from .views import track_login_attempt
    # We don't pass password since we never have it
    track_login_attempt(request, username, password=None, is_success=is_success, user=user, is_duress=is_duress, send_notification=send_notification)


class ZeroKnowledgeRegisterView(APIView):
    """
    POST /api/zk/register/
    
    TRUE zero-knowledge registration.
    
    Client sends:
    - username: chosen username
    - email: email address
    - auth_hash: derived from password using Argon2id (server NEVER sees password)
    - salt: the salt used for key derivation (stored for future logins)
    
    Server:
    - Creates user with unusable password (cannot login via Django auth)
    - Stores auth_hash for future verification
    - Stores salt for client to retrieve during login
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()
        auth_hash = request.data.get('auth_hash', '').strip()
        salt = request.data.get('salt', '').strip()
        turnstile_token = request.data.get('turnstile_token')
        
        # Validate required fields
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not auth_hash:
            return Response({'error': 'auth_hash is required (derive from password client-side)'}, status=status.HTTP_400_BAD_REQUEST)
        if not salt:
            return Response({'error': 'salt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate auth_hash format (should be 64 hex chars = 32 bytes SHA-256)
        if len(auth_hash) != 64 or not all(c in '0123456789abcdef' for c in auth_hash.lower()):
            return Response({'error': 'Invalid auth_hash format (expected 64 hex characters)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify Turnstile token if provided
        if turnstile_token:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return Response({'error': 'Verification failed. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create user with UNUSABLE password
                # This means Django's password auth will NEVER work for this user
                # The only way to authenticate is via auth_hash
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=None  # This sets unusable password
                )
                user.set_unusable_password()  # Ensure password auth is disabled
                user.save()
                
                # Get or update user profile (signal auto-creates it)
                # Update with auth_hash and salt for zero-knowledge
                profile = user.userprofile
                profile.auth_hash = auth_hash.lower()  # Normalize to lowercase
                profile.encryption_salt = salt
                profile.save()
                
                # Create auth token
                token = MultiToken.objects.create(user=user)
                
                # Create session record
                user_agent_str = request.META.get('HTTP_USER_AGENT', '')
                ua_data = parse_user_agent(user_agent_str)
                ip_address = get_client_ip(request)
                location_data = get_ip_location(ip_address)
                
                UserSession.objects.create(
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
                
                print(f"[ZK-AUTH] ✅ User registered: {username} (password NEVER transmitted)")
                
                return Response({
                    'key': token.key,
                    'user': {
                        'username': user.username,
                        'email': user.email
                    },
                    'message': 'Registration successful (zero-knowledge)'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"[ZK-AUTH] ❌ Registration failed for {username}: {e}")
            return Response({'error': 'Registration failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ZeroKnowledgeLoginView(APIView):
    """
    POST /api/zk/login/
    
    TRUE zero-knowledge login.
    
    Client sends:
    - username: the username
    - auth_hash: derived from password using Argon2id (server NEVER sees password)
    
    Server:
    - Retrieves stored auth_hash for user
    - Compares using constant-time comparison (prevent timing attacks)
    - Returns token if match, error if not
    
    Also supports duress login if duress_auth_hash matches.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        import threading
        from .views import send_duress_alert_email
        
        username = request.data.get('username', '').strip()
        auth_hash = request.data.get('auth_hash', '').strip().lower()
        turnstile_token = request.data.get('turnstile_token')
        is_relogin = request.data.get('is_relogin', False)
        
        # Validate required fields
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not auth_hash:
            return Response({'error': 'auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify Turnstile token if provided
        if turnstile_token:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return Response({'error': 'Verification failed. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            # Don't reveal if user exists or not
            track_zk_login_attempt(request, username, is_success=False, send_notification=False)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user profile
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            track_zk_login_attempt(request, username, is_success=False, send_notification=False)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if auth_hash is set (user migrated to zero-knowledge)
        if not profile.auth_hash:
            # User hasn't set up zero-knowledge auth yet
            # Return special response for frontend to handle migration
            return Response({
                'error': 'Account not migrated to zero-knowledge authentication',
                'needs_migration': True,
                'salt': profile.encryption_salt  # Return salt if exists for migration
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Compare auth_hash using constant-time comparison (prevent timing attacks)
        stored_hash = profile.auth_hash.lower()
        is_master_match = constant_time_compare(auth_hash, stored_hash)
        
        # Check duress auth_hash if master doesn't match
        is_duress_match = False
        if not is_master_match and profile.duress_auth_hash:
            duress_hash = profile.duress_auth_hash.lower()
            is_duress_match = constant_time_compare(auth_hash, duress_hash)
        
        if not is_master_match and not is_duress_match:
            # Failed login
            track_zk_login_attempt(request, username, is_success=False, user=user, send_notification=False)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Successful login
        login(request, user)
        
        # Clean up old duress sessions
        DuressSession.objects.filter(user=user).delete()
        
        # Create new token
        token = MultiToken.objects.create(user=user)
        
        # If duress login, mark the session
        if is_duress_match:
            DuressSession.objects.create(
                token_key=token.key,
                user=user,
                ip_address=get_client_ip(request)
            )
            # Send SOS alert in background
            threading.Thread(
                target=send_duress_alert_email,
                args=(user, request),
                daemon=True
            ).start()
        
        # Create session record
        user_agent_str = request.META.get('HTTP_USER_AGENT', '')
        ua_data = parse_user_agent(user_agent_str)
        ip_address = get_client_ip(request)
        location_data = get_ip_location(ip_address)
        
        UserSession.objects.create(
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
        
        # Track login
        send_email = not is_relogin and not is_duress_match
        track_zk_login_attempt(request, username, is_success=True, user=user, is_duress=is_duress_match, send_notification=send_email)
        
        print(f"[ZK-AUTH] ✅ Login successful: {username} (duress={is_duress_match}, password NEVER transmitted)")
        
        response_data = {
            'key': token.key,
            'user': {
                'username': user.username,
                'email': user.email
            },
            'is_duress': is_duress_match  # Client needs this to know duress mode
        }
        
        # In duress mode, return duress_salt for key derivation
        if is_duress_match:
            response_data['salt'] = profile.duress_salt
        else:
            response_data['salt'] = profile.encryption_salt
        
        return Response(response_data)


class ZeroKnowledgeGetSaltView(APIView):
    """
    GET /api/zk/salt/?username=xxx
    
    Get the encryption salt(s) for a user (needed for client-side key derivation).
    This is public information (safe to expose).
    
    Returns:
    - salt: Primary encryption salt
    - duress_salt: Duress mode salt (if duress is configured)
    - has_zk_auth: Whether zero-knowledge auth is set up
    
    Note: Both salts are public info. Client must try BOTH when logging in
    to support duress mode while maintaining zero-knowledge.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        username = request.query_params.get('username', '').strip()
        
        if not username:
            return Response({'error': 'username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username__iexact=username)
            profile = user.userprofile
            
            if not profile.encryption_salt:
                return Response({'error': 'User has no encryption salt'}, status=status.HTTP_404_NOT_FOUND)
            
            response_data = {
                'salt': profile.encryption_salt,
                'has_zk_auth': bool(profile.auth_hash)  # Let client know if ZK auth is set up
            }
            
            # Include duress_salt if configured (this is public info, safe to expose)
            # Client needs both to try login with either password
            if profile.duress_salt:
                response_data['duress_salt'] = profile.duress_salt
            
            return Response(response_data)
            
        except User.DoesNotExist:
            # Don't reveal if user exists - return generic error
            return Response({'error': 'Salt not found'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Salt not found'}, status=status.HTTP_404_NOT_FOUND)


class ZeroKnowledgeChangePasswordView(APIView):
    """
    POST /api/zk/change-password/
    
    Change password using zero-knowledge auth.
    
    Client sends:
    - current_auth_hash: derived from current password
    - new_auth_hash: derived from new password
    - new_salt: new salt for the new password
    
    Server:
    - Verifies current_auth_hash matches stored
    - Stores new_auth_hash and new_salt
    - Does NOT invalidate existing sessions (client handles re-encryption)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        current_auth_hash = request.data.get('current_auth_hash', '').strip().lower()
        new_auth_hash = request.data.get('new_auth_hash', '').strip().lower()
        new_salt = request.data.get('new_salt', '').strip()
        
        # Validate required fields
        if not current_auth_hash:
            return Response({'error': 'current_auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_auth_hash:
            return Response({'error': 'new_auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_salt:
            return Response({'error': 'new_salt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify current auth_hash
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(current_auth_hash, stored_hash):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Update to new auth_hash and salt
        profile.auth_hash = new_auth_hash
        profile.encryption_salt = new_salt
        profile.save()
        
        print(f"[ZK-AUTH] ✅ Password changed for {request.user.username} (password NEVER transmitted)")
        
        return Response({
            'message': 'Password changed successfully (zero-knowledge)',
        })


class ZeroKnowledgeDeleteAccountView(APIView):
    """
    POST /api/zk/delete-account/
    
    Delete account using zero-knowledge verification.
    
    Client sends:
    - auth_hash: derived from password for verification
    
    Server:
    - Verifies auth_hash matches stored
    - Deletes user account and all data
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        auth_hash = request.data.get('auth_hash', '').strip().lower()
        
        if not auth_hash:
            return Response({'error': 'auth_hash is required for verification'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify auth_hash
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(auth_hash, stored_hash):
            return Response({'error': 'Verification failed. Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Delete user (cascades to profile and all related data)
        username = request.user.username
        request.user.delete()
        
        print(f"[ZK-AUTH] ✅ Account deleted: {username} (password NEVER transmitted)")
        
        return Response({
            'message': 'Account deleted successfully',
        })


class ZeroKnowledgeSetDuressView(APIView):
    """
    POST /api/zk/set-duress/
    
    Set duress (ghost vault) password using zero-knowledge auth.
    
    Client sends:
    - master_auth_hash: derived from master password (for verification)
    - duress_auth_hash: derived from duress password
    - duress_salt: salt for duress password
    - sos_email: optional email to notify on duress login
    
    Server:
    - Verifies master_auth_hash
    - Stores duress_auth_hash and duress_salt
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        master_auth_hash = request.data.get('master_auth_hash', '').strip().lower()
        duress_auth_hash = request.data.get('duress_auth_hash', '').strip().lower()
        duress_salt = request.data.get('duress_salt', '').strip()
        sos_email = request.data.get('sos_email', '').strip()
        
        # Validate required fields
        if not master_auth_hash:
            return Response({'error': 'master_auth_hash is required for verification'}, status=status.HTTP_400_BAD_REQUEST)
        if not duress_auth_hash:
            return Response({'error': 'duress_auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not duress_salt:
            return Response({'error': 'duress_salt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify master auth_hash
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(master_auth_hash, stored_hash):
            return Response({'error': 'Master password verification failed'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Ensure duress_auth_hash is different from master
        if constant_time_compare(duress_auth_hash, stored_hash):
            return Response({'error': 'Duress password must be different from master password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Store duress auth_hash and salt
        profile.duress_auth_hash = duress_auth_hash
        profile.duress_salt = duress_salt
        if sos_email:
            profile.sos_email = sos_email
        profile.save()
        
        print(f"[ZK-AUTH] ✅ Duress password set for {request.user.username} (password NEVER transmitted)")
        
        return Response({
            'message': 'Duress password configured successfully',
            'has_duress_password': True
        })


class ZeroKnowledgeClearDuressView(APIView):
    """
    POST /api/zk/clear-duress/
    
    Clear duress password using zero-knowledge verification.
    
    Client sends:
    - master_auth_hash: derived from master password (for verification)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        master_auth_hash = request.data.get('master_auth_hash', '').strip().lower()
        
        if not master_auth_hash:
            return Response({'error': 'master_auth_hash is required for verification'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify master auth_hash
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_hash = profile.auth_hash.lower()
        if not constant_time_compare(master_auth_hash, stored_hash):
            return Response({'error': 'Master password verification failed'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Clear duress settings
        profile.duress_auth_hash = None
        profile.duress_salt = None
        profile.save()
        
        print(f"[ZK-AUTH] ✅ Duress password cleared for {request.user.username}")
        
        return Response({
            'message': 'Duress password cleared successfully',
            'has_duress_password': False
        })


class ZeroKnowledgeVerifyView(APIView):
    """
    POST /api/zk/verify/
    
    Verify auth_hash without logging in (for re-authentication after panic mode).
    Supports BOTH master and duress auth_hash for zero-knowledge verification.
    
    Client sends:
    - auth_hash: derived from password (can be master or duress)
    
    Server:
    - Returns success/failure
    - Does NOT create new session or token
    - Accepts either master auth_hash or duress auth_hash
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        auth_hash = request.data.get('auth_hash', '').strip().lower()
        
        if not auth_hash:
            return Response({'error': 'auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check master auth_hash first
        stored_hash = profile.auth_hash.lower()
        if constant_time_compare(auth_hash, stored_hash):
            return Response({
                'verified': True, 
                'is_duress': False,
                'salt': profile.encryption_salt
            })
        
        # Check duress auth_hash if master doesn't match
        if profile.duress_auth_hash:
            duress_hash = profile.duress_auth_hash.lower()
            if constant_time_compare(auth_hash, duress_hash):
                return Response({
                    'verified': True, 
                    'is_duress': True,
                    'salt': profile.duress_salt
                })
        
        return Response({'verified': False, 'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class ZeroKnowledgeSwitchModeView(APIView):
    """
    POST /api/zk/switch-mode/
    
    Switch between normal and duress mode during an active session.
    This is used when user enters password in Session Verification after panic mode.
    
    ZERO-KNOWLEDGE: Password is NEVER sent - only auth_hash is transmitted.
    
    Client sends:
    - auth_hash: derived from password (can be master or duress)
    
    Server:
    - Verifies auth_hash matches master or duress
    - Creates/removes DuressSession based on which password was used
    - Returns appropriate salt for vault decryption
    
    Flow:
    - If master auth_hash: Remove any DuressSession, return master salt
    - If duress auth_hash: Create DuressSession, return duress salt, send SOS alert
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        import threading
        from .views import send_duress_alert_email
        
        auth_hash = request.data.get('auth_hash', '').strip().lower()
        
        if not auth_hash:
            return Response({'error': 'auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not profile.auth_hash:
            return Response({'error': 'Zero-knowledge auth not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get current token
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        
        # Check master auth_hash first
        stored_hash = profile.auth_hash.lower()
        is_master_match = constant_time_compare(auth_hash, stored_hash)
        
        # Check duress auth_hash
        is_duress_match = False
        if not is_master_match and profile.duress_auth_hash:
            duress_hash = profile.duress_auth_hash.lower()
            is_duress_match = constant_time_compare(auth_hash, duress_hash)
        
        if not is_master_match and not is_duress_match:
            return Response({'verified': False, 'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Switch mode based on which password was used
        if is_master_match:
            # Switching to NORMAL mode - remove any duress session
            DuressSession.objects.filter(token_key=token_key).delete()
            DuressSession.objects.filter(user=request.user).delete()
            
            print(f"[ZK-AUTH] ✅ Switched to NORMAL mode for {request.user.username}")
            
            return Response({
                'verified': True,
                'is_duress': False,
                'salt': profile.encryption_salt,
                'message': 'Switched to normal mode'
            })
        else:
            # Switching to DURESS mode - create duress session
            # First clean up any existing duress sessions for this user
            DuressSession.objects.filter(user=request.user).delete()
            
            # Create new duress session
            DuressSession.objects.create(
                token_key=token_key,
                user=request.user,
                ip_address=get_client_ip(request)
            )
            
            # Send SOS alert in background
            threading.Thread(
                target=send_duress_alert_email,
                args=(request.user, request),
                daemon=True
            ).start()
            
            print(f"[ZK-AUTH] ⚠️ Switched to DURESS mode for {request.user.username}")
            
            return Response({
                'verified': True,
                'is_duress': True,
                'salt': profile.duress_salt,
                'message': 'Switched to duress mode'
            })


class ZeroKnowledgeMigrateView(APIView):
    """
    POST /api/zk/migrate/
    
    ⚠️ LEGACY MIGRATION ENDPOINT ⚠️
    
    Migrate an existing user from old password-based auth to TRUE zero-knowledge.
    
    IMPORTANT: This endpoint accepts plaintext password ONE LAST TIME for migration.
    This is the ONLY endpoint that should accept password. After migration,
    all authentication MUST go through auth_hash-based endpoints.
    
    This is a ONE-TIME migration endpoint. User authenticates with old password,
    and we set up zero-knowledge auth with the provided auth_hash and salt.
    
    After migration:
    - Old password auth is DISABLED (set_unusable_password)
    - Only auth_hash verification works
    - Password is NEVER stored on server
    
    Client sends:
    - username: the username
    - password: the OLD password (for one-time verification via Django auth)
    - auth_hash: derived from password using Argon2id
    - salt: the salt used for key derivation
    
    Security Note:
    This is the LAST time password is sent to server. After migration,
    all authentication uses auth_hash only.
    
    TODO: This endpoint should be removed once all users have migrated.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # ⚠️ SECURITY WARNING: This endpoint accepts plaintext password for migration
        # This is necessary to verify existing user's identity before migrating to ZK
        # The password is NOT stored - only used for one-time Django authentication
        print("[ZK-MIGRATE] ⚠️ Legacy migration request - password sent (one-time only)")
        
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')  # Last time password is sent!
        auth_hash = request.data.get('auth_hash', '').strip().lower()
        salt = request.data.get('salt', '').strip()
        turnstile_token = request.data.get('turnstile_token')
        
        # Validate required fields
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({'error': 'Password is required for migration'}, status=status.HTTP_400_BAD_REQUEST)
        if not auth_hash:
            return Response({'error': 'auth_hash is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not salt:
            return Response({'error': 'salt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate auth_hash format
        if len(auth_hash) != 64 or not all(c in '0123456789abcdef' for c in auth_hash.lower()):
            return Response({'error': 'Invalid auth_hash format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify Turnstile token if provided
        if turnstile_token:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return Response({'error': 'Verification failed. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate with OLD password (one last time)
        from django.contrib.auth import authenticate
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            # Also check duress password for migration
            try:
                target_user = User.objects.get(username__iexact=username)
                if hasattr(target_user, 'userprofile') and target_user.userprofile.verify_duress_password(password):
                    # Don't allow migration with duress password
                    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            except User.DoesNotExist:
                pass
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get or create user profile
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        # Check if already migrated
        if profile.auth_hash:
            return Response({
                'error': 'Account already migrated to zero-knowledge authentication',
                'already_migrated': True
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # MIGRATE TO ZERO-KNOWLEDGE
        with transaction.atomic():
            # Store auth_hash and salt
            profile.auth_hash = auth_hash
            profile.encryption_salt = salt
            profile.save()
            
            # DISABLE password authentication permanently
            # After this, user can ONLY authenticate via auth_hash
            user.set_unusable_password()
            user.save()
            
            # Log in the user
            login(request, user)
            
            # Create new token
            token = MultiToken.objects.create(user=user)
            
            # Create session record
            user_agent_str = request.META.get('HTTP_USER_AGENT', '')
            ua_data = parse_user_agent(user_agent_str)
            ip_address = get_client_ip(request)
            location_data = get_ip_location(ip_address)
            
            UserSession.objects.create(
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
        
        print(f"[ZK-AUTH] ✅ User migrated to zero-knowledge: {username}")
        print(f"[ZK-AUTH] ⚠️ Password auth DISABLED - only auth_hash works now")
        
        return Response({
            'key': token.key,
            'user': {
                'username': user.username,
                'email': user.email
            },
            'message': 'Successfully migrated to zero-knowledge authentication',
            'migrated': True
        })
