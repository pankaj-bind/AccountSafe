# api/features/auth/views.py
"""
Authentication Views

Handles all authentication-related HTTP requests:
- Zero-Knowledge Registration/Login
- Password Reset (OTP-based)
- Security PIN Management
- Password Change/Delete Account

Views handle HTTP request/response only.
Business logic is delegated to AuthService.
"""

import logging
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import PasswordResetOTP, UserProfile
from api.serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    SetNewPasswordSerializer,
)
from api.features.common import verify_turnstile_token, get_client_ip
from .services import AuthService

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# USERNAME CHECK
# ═══════════════════════════════════════════════════════════════════════════════

class CheckUsernameView(APIView):
    """Check if a username is already taken."""
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username", None)
        if username:
            exists = User.objects.filter(username__iexact=username).exists()
            return Response({"exists": exists})
        return Response(
            {"error": "Username parameter not provided"},
            status=status.HTTP_400_BAD_REQUEST
        )


# ═══════════════════════════════════════════════════════════════════════════════
# DEPRECATED LOGIN (REDIRECTS TO ZK)
# ═══════════════════════════════════════════════════════════════════════════════

class CustomLoginView(APIView):
    """
    DEPRECATED: This endpoint is disabled for TRUE zero-knowledge architecture.
    Use /api/zk/login/ instead.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {
                "error": "This endpoint is deprecated. Use /api/zk/login/ for zero-knowledge authentication.",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/login/",
                "message": "Password is NEVER sent to server in zero-knowledge architecture."
            },
            status=status.HTTP_410_GONE
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PASSWORD RESET VIA OTP
# ═══════════════════════════════════════════════════════════════════════════════

class RequestPasswordResetOTPView(APIView):
    """Request OTP for password reset via email."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            turnstile_token = serializer.validated_data.get("turnstile_token")
            
            # Verify Turnstile token if provided
            if turnstile_token:
                remote_ip = get_client_ip(request)
                result = verify_turnstile_token(turnstile_token, remote_ip)
                if not result.get('success'):
                    return Response(
                        {"error": "Verification failed. Please try again."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if user exists
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                return Response(
                    {"error": "No user found with this email address."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Rate limiting
            can_request, remaining_seconds = PasswordResetOTP.can_request_new_otp(user, cooldown_seconds=60)
            if not can_request:
                return Response({
                    "error": f"Please wait {remaining_seconds} seconds before requesting a new OTP.",
                    "retry_after": remaining_seconds
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Delete old OTPs and generate new
            PasswordResetOTP.objects.filter(user=user).delete()
            otp_code = PasswordResetOTP.generate_otp()
            PasswordResetOTP.objects.create(user=user, otp=otp_code)
            
            display_name = user.first_name or user.username
            
            # Send email
            try:
                html_content = self._get_otp_email_html(display_name, otp_code)
                plain_text = self._get_otp_email_text(display_name, otp_code)
                
                if settings.DEBUG:
                    logger.debug(f"PASSWORD RESET OTP - Email: {email}, OTP: {otp_code}")
                
                email_message = EmailMultiAlternatives(
                    subject="AccountSafe - Password Reset Code",
                    body=plain_text,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                )
                email_message.attach_alternative(html_content, "text/html")
                email_message.send(fail_silently=False)
                
                logger.info(f"OTP email sent successfully to {email}")
                
            except Exception as e:
                logger.error(f"Email Error for {email}: {str(e)}")
                if settings.DEBUG:
                    logger.warning(f"OTP (email failed): {email}, OTP: {otp_code}")
            
            return Response({
                "message": "A verification code has been sent to your email.",
                "expires_in": 300
            })
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _get_otp_email_text(self, display_name, otp_code):
        return f"""AccountSafe - Password Reset

Hello {display_name},

Your verification code is: {otp_code}

This code will expire in 5 minutes.
Maximum 5 verification attempts are allowed.

If you didn't request this, please ignore this email.

---
AccountSafe - Secure Password Manager
"""

    def _get_otp_email_html(self, display_name, otp_code):
        return f'''<!DOCTYPE html>
<html><head><title>Password Reset</title></head>
<body style="font-family: sans-serif; background: #f3f4f6; padding: 40px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
<div style="background: #111827; padding: 20px; color: white;">
<strong>AccountSafe</strong> - Password Reset
</div>
<div style="padding: 32px;">
<h1 style="color: #111827;">Password Reset Request</h1>
<p>Hi <strong>{display_name}</strong>,</p>
<p>Your verification code is:</p>
<div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; padding: 30px; text-align: center;">
<span style="color: white; font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: monospace;">{otp_code}</span>
</div>
<p style="margin-top: 20px;">This code expires in <strong>5 minutes</strong>.</p>
<p style="color: #92400e; background: #fffbeb; padding: 16px; border-radius: 4px;">
If you didn't request this, please ignore this email.
</p>
</div>
<div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
© 2026 AccountSafe. Zero-knowledge architecture.
</div>
</div></body></html>'''


class VerifyPasswordResetOTPView(APIView):
    """Verify OTP code for password reset."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_code = serializer.validated_data["otp"]
            
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid email address."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                otp_instance = PasswordResetOTP.objects.get(user=user)
            except PasswordResetOTP.DoesNotExist:
                return Response({
                    "error": "No OTP found. Please request a new verification code.",
                    "code": "OTP_NOT_FOUND"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.is_expired():
                otp_instance.delete()
                return Response({
                    "error": "Verification code has expired.",
                    "code": "OTP_EXPIRED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.attempts >= otp_instance.max_attempts:
                otp_instance.delete()
                return Response({
                    "error": "Too many failed attempts.",
                    "code": "MAX_ATTEMPTS_EXCEEDED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.is_used:
                otp_instance.delete()
                return Response({
                    "error": "This code has already been used.",
                    "code": "OTP_ALREADY_USED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.otp != otp_code:
                otp_instance.increment_attempts()
                remaining = otp_instance.max_attempts - otp_instance.attempts
                if remaining <= 0:
                    otp_instance.delete()
                    return Response({
                        "error": "Too many failed attempts.",
                        "code": "MAX_ATTEMPTS_EXCEEDED"
                    }, status=status.HTTP_400_BAD_REQUEST)
                return Response({
                    "error": f"Invalid code. {remaining} attempt(s) remaining.",
                    "code": "INVALID_OTP",
                    "remaining_attempts": remaining
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "message": "Verification code verified successfully.",
                "remaining_time": otp_instance.get_remaining_time()
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordView(APIView):
    """
    TRUE Zero-Knowledge Password Reset.
    Client sends new_auth_hash (derived from password) - server NEVER sees password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_code = serializer.validated_data["otp"]
            new_auth_hash = serializer.validated_data["new_auth_hash"].lower()
            new_salt = serializer.validated_data["new_salt"]
            
            if not all(c in '0123456789abcdef' for c in new_auth_hash):
                return Response({
                    "error": "Invalid auth_hash format",
                    "code": "INVALID_AUTH_HASH"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response({
                    "error": "Invalid email address.",
                    "code": "USER_NOT_FOUND"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                otp_instance = PasswordResetOTP.objects.get(user=user)
            except PasswordResetOTP.DoesNotExist:
                return Response({
                    "error": "Session expired. Please start over.",
                    "code": "OTP_NOT_FOUND"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.otp != otp_code:
                return Response({
                    "error": "Invalid verification code.",
                    "code": "INVALID_OTP"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.is_expired():
                otp_instance.delete()
                return Response({
                    "error": "Session expired.",
                    "code": "OTP_EXPIRED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_instance.attempts >= otp_instance.max_attempts:
                otp_instance.delete()
                return Response({
                    "error": "Too many failed attempts.",
                    "code": "MAX_ATTEMPTS_EXCEEDED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update profile with new auth_hash
            try:
                profile = user.userprofile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            profile.auth_hash = new_auth_hash
            profile.encryption_salt = new_salt
            profile.save()
            
            user.set_unusable_password()
            user.save()
            
            otp_instance.delete()
            
            logger.info(f"[ZK-AUTH] Password reset successful for: {user.username}")
            
            return Response({
                "message": "Your password has been reset successfully."
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════════════════
# DEPRECATED ENDPOINTS (REDIRECT TO ZK)
# ═══════════════════════════════════════════════════════════════════════════════

class ChangePasswordView(APIView):
    """DEPRECATED: Use /api/zk/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "error": "Deprecated. Use /api/zk/change-password/",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/change-password/"
            },
            status=status.HTTP_410_GONE
        )


class DeleteAccountView(APIView):
    """DEPRECATED: Use /api/zk/delete-account/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "error": "Deprecated. Use /api/zk/delete-account/",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/delete-account/"
            },
            status=status.HTTP_410_GONE
        )


# ═══════════════════════════════════════════════════════════════════════════════
# SECURITY PIN MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class SetupPinView(APIView):
    """Setup a 4-digit security PIN."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin')
        
        if not pin:
            return Response({"error": "PIN is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not (len(pin) == 4 and pin.isdigit()):
            return Response({"error": "PIN must be exactly 4 digits."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            user_profile = UserProfile.objects.create(user=request.user)
        
        if user_profile.set_pin(pin):
            return Response({"message": "PIN set successfully."})
        return Response({"error": "Failed to set PIN."}, status=status.HTTP_400_BAD_REQUEST)


class VerifyPinView(APIView):
    """Verify the user's security PIN."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin')
        
        if not pin:
            return Response({"error": "PIN is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response({"error": "No PIN has been set."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_profile.has_pin():
            return Response({"error": "No PIN has been set."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user_profile.verify_pin(pin):
            return Response({"message": "PIN verified successfully.", "valid": True})
        return Response({"error": "Invalid PIN.", "valid": False}, status=status.HTTP_400_BAD_REQUEST)


class PinStatusView(APIView):
    """Check if the user has a PIN set."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_profile = request.user.userprofile
            has_pin = user_profile.has_pin()
        except UserProfile.DoesNotExist:
            has_pin = False
        return Response({"has_pin": has_pin})


class ClearPinView(APIView):
    """Clear/remove the user's security PIN."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user_profile = request.user.userprofile
            if not user_profile.has_pin():
                return Response({"error": "No PIN is currently set."}, status=status.HTTP_400_BAD_REQUEST)
            
            user_profile.security_pin = None
            user_profile.save()
            return Response({"message": "PIN cleared successfully."})
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)


class ResetPinView(APIView):
    """Reset security PIN after OTP verification."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_pin = request.data.get('new_pin')
        
        if not all([email, otp, new_pin]):
            return Response({"error": "Email, OTP, and new PIN are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not (len(new_pin) == 4 and new_pin.isdigit()):
            return Response({"error": "PIN must be exactly 4 digits."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email__iexact=email)
            otp_instance = PasswordResetOTP.objects.get(user=user, otp=otp)
            
            if not otp_instance.is_valid():
                otp_instance.delete()
                return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user_profile = user.userprofile
            except UserProfile.DoesNotExist:
                user_profile = UserProfile.objects.create(user=user)
            
            if user_profile.set_pin(new_pin):
                otp_instance.delete()
                return Response({"message": "PIN reset successfully."})
            return Response({"error": "Failed to reset PIN."}, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except PasswordResetOTP.DoesNotExist:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════════════════
# ZERO-KNOWLEDGE AUTH VIEWS (Delegated to AuthService)
# ═══════════════════════════════════════════════════════════════════════════════

class ZeroKnowledgeRegisterView(APIView):
    """
    POST /api/zk/register/
    
    TRUE zero-knowledge registration.
    Client sends auth_hash (derived from password) - server NEVER sees password.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        result = AuthService.register_user(
            username=request.data.get('username', '').strip(),
            email=request.data.get('email', '').strip().lower(),
            auth_hash=request.data.get('auth_hash', '').strip(),
            salt=request.data.get('salt', '').strip(),
            request=request,
            turnstile_token=request.data.get('turnstile_token')
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeLoginView(APIView):
    """
    POST /api/zk/login/
    
    TRUE zero-knowledge login.
    Client sends auth_hash (derived from password) - server NEVER sees password.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        result = AuthService.login_user(
            username=request.data.get('username', '').strip(),
            auth_hash=request.data.get('auth_hash', '').strip().lower(),
            request=request,
            turnstile_token=request.data.get('turnstile_token'),
            is_relogin=request.data.get('is_relogin', False)
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeGetSaltView(APIView):
    """
    GET /api/zk/salt/?username=xxx
    
    Get encryption salt(s) for client-side key derivation.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        username = request.query_params.get('username', '').strip()
        
        if not username:
            return Response({'error': 'username parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = AuthService.get_user_salt(username)
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class ZeroKnowledgeChangePasswordView(APIView):
    """
    POST /api/zk/change-password/
    
    Change password using zero-knowledge auth.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.change_password(
            user=request.user,
            current_auth_hash=request.data.get('current_auth_hash', '').strip().lower(),
            new_auth_hash=request.data.get('new_auth_hash', '').strip().lower(),
            new_salt=request.data.get('new_salt', '').strip()
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


class ZeroKnowledgeVerifyView(APIView):
    """
    POST /api/zk/verify/
    
    Verify auth_hash without creating new session.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.verify_auth_hash(
            user=request.user,
            auth_hash=request.data.get('auth_hash', '').strip()
        )
        
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class ZeroKnowledgeDeleteAccountView(APIView):
    """
    POST /api/zk/delete-account/
    
    Delete account using zero-knowledge verification.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = AuthService.delete_account(
            user=request.user,
            auth_hash=request.data.get('auth_hash', '').strip()
        )
        
        http_status = result.pop('status', 200)
        return Response(result, status=http_status)


# Re-export from zero_knowledge module (now in same feature folder)
from .zero_knowledge import (
    ZeroKnowledgeSetDuressView,
    ZeroKnowledgeClearDuressView,
    ZeroKnowledgeSwitchModeView,
    # REMOVED: ZeroKnowledgeMigrateView - Attack Surface Reduction
)
