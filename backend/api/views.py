# api/views.py

import os
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .models import PasswordResetOTP, UserProfile, Category, Organization, Profile, LoginRecord, CuratedOrganization, UserSession, DuressSession
from .features.common import parse_user_agent, get_alert_context
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    SetNewPasswordSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    CategorySerializer,
    CategoryCreateSerializer,
    OrganizationSerializer,
    ProfileSerializer,
    LoginRecordSerializer,
)
from .features.common import verify_turnstile_token, get_client_ip


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username", None)
        if username:
            exists = User.objects.filter(username__iexact=username).exists()
            return Response({"exists": exists})
        return Response({"error": "Username parameter not provided"}, status=status.HTTP_400_BAD_REQUEST)


# Custom Login View with tracking
# DEPRECATED: Use /api/zk/login/ for TRUE zero-knowledge authentication
class CustomLoginView(APIView):
    """
    DEPRECATED: This endpoint is disabled for TRUE zero-knowledge architecture.
    
    Use /api/zk/login/ instead - password is NEVER sent to server,
    only auth_hash (derived from password) is transmitted.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {
                "error": "This endpoint is deprecated. Use /api/zk/login/ for zero-knowledge authentication.",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/login/",
                "message": "Password is NEVER sent to server in zero-knowledge architecture. Use /api/zk/login/ with auth_hash instead."
            },
            status=status.HTTP_410_GONE
        )


# OTP Views
class RequestPasswordResetOTPView(APIView):
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
                return Response({"error": "No user found with this email address."}, status=status.HTTP_404_NOT_FOUND)
            
            # Rate limiting - check if user can request a new OTP
            can_request, remaining_seconds = PasswordResetOTP.can_request_new_otp(user, cooldown_seconds=60)
            if not can_request:
                return Response({
                    "error": f"Please wait {remaining_seconds} seconds before requesting a new OTP.",
                    "retry_after": remaining_seconds
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Delete old OTPs for this user
            PasswordResetOTP.objects.filter(user=user).delete()
            
            # Generate new OTP
            otp_code = PasswordResetOTP.generate_otp()
            otp_instance = PasswordResetOTP.objects.create(user=user, otp=otp_code)
            
            # Get user's display name
            display_name = user.first_name or user.username
            
            # Send email using Django's SMTP backend
            try:
                from django.core.mail import EmailMultiAlternatives
                import logging
                logger = logging.getLogger(__name__)
                
                html_content = f'''
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset - AccountSafe</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif; background-color: #f3f4f6; line-height: 1.5;">
                    
                    <!-- Email Container -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <!-- Main Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; overflow: hidden;">
                                    
                                    <!-- Accent Bar (Blue for Password Reset) -->
                                    <tr>
                                        <td style="height: 4px; background-color: #3b82f6;"></td>
                                    </tr>
                                    
                                    <!-- Header with Logo -->
                                    <tr>
                                        <td style="background-color: #111827; padding: 20px 32px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="vertical-align: middle;">
                                                        <!-- Logo Container -->
                                                        <table cellpadding="0" cellspacing="0" style="display: inline-block;">
                                                            <tr>
                                                                <td style="background: linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%); padding: 8px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
                                                                    <img src="https://accountsafe.vercel.app/logo.png" alt="AccountSafe" width="24" height="24" style="display: block; border: 0;" />
                                                                </td>
                                                                <td style="padding-left: 12px; vertical-align: middle;">
                                                                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">AccountSafe</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 32px 32px;">
                                            
                                            <!-- Headline -->
                                            <h1 style="margin: 0 0 24px; color: #111827; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.3;">
                                                Password Reset Request
                                            </h1>
                                            
                                            <!-- Greeting -->
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
                                                Hi <strong style="color: #111827;">{display_name}</strong>,
                                            </p>
                                            
                                            <!-- Message -->
                                            <p style="margin: 0 0 28px; color: #374151; font-size: 15px; line-height: 1.6;">
                                                We received a request to reset your AccountSafe password. Use the verification code below to complete the process:
                                            </p>
                                            
                                            <!-- OTP Box -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                                <tr>
                                                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center;">
                                                        <p style="color: rgba(255,255,255,0.95); font-size: 12px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">YOUR VERIFICATION CODE</p>
                                                        <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 18px 28px; display: inline-block;">
                                                            <span style="color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                                                                {otp_code}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Security Info Grid -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; margin-bottom: 28px; overflow: hidden;">
                                                <tr>
                                                    <!-- Expires -->
                                                    <td width="50%" style="padding: 16px 18px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; vertical-align: top;">
                                                        <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Expires In</div>
                                                        <div style="color: #111827; font-size: 14px; font-weight: 600;">5 minutes</div>
                                                    </td>
                                                    <!-- Attempts -->
                                                    <td width="50%" style="padding: 16px 18px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                                                        <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Max Attempts</div>
                                                        <div style="color: #111827; font-size: 14px; font-weight: 600;">5 attempts</div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <!-- Security Notice -->
                                                    <td colspan="2" style="padding: 16px 18px;">
                                                        <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Security</div>
                                                        <div style="color: #111827; font-size: 13px; font-weight: 500;">Never share this code with anyone</div>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Warning Notice -->
                                            <div style="background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 16px 18px; margin-bottom: 24px; border-radius: 4px;">
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="vertical-align: top; padding-right: 10px;">
                                                            <!-- Info Icon SVG -->
                                                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style="display: block; margin-top: 1px;">
                                                                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                                <path d="M10 14V10" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                                <path d="M10 6H10.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                            </svg>
                                                        </td>
                                                        <td style="vertical-align: top;">
                                                            <div style="color: #92400e; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Security Notice</div>
                                                            <div style="color: #78350f; font-size: 13px; line-height: 1.5;">If you didn't request a password reset, please ignore this email. Your account is safe and no changes have been made.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Help Text -->
                                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                                We will never ask for your password via email. If you have concerns, 
                                                <a href="#" style="color: #2563eb; text-decoration: none; font-weight: 500;">contact support</a>.
                                            </p>
                                            
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                                                This is an automated security notification from AccountSafe
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                                End-to-end encrypted • Zero-knowledge architecture
                                            </p>
                                            <p style="margin: 12px 0 0; color: #d1d5db; font-size: 10px;">
                                                © 2026 AccountSafe. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                </body>
                </html>
                '''
                
                # Plain text version for email clients that don't support HTML
                plain_text = f"""AccountSafe - Password Reset

Hello {display_name},

We received a request to reset your AccountSafe password.

Your verification code is: {otp_code}

This code will expire in 5 minutes.
Maximum 5 verification attempts are allowed.

If you didn't request this, please ignore this email.

---
AccountSafe - Secure Password Manager
"""
                
                # Print OTP to console for development/testing
                print(f"\n{'='*60}")
                print(f"📧 PASSWORD RESET OTP")
                print(f"{'='*60}")
                print(f"Email: {email}")
                print(f"User: {display_name}")
                print(f"OTP Code: {otp_code}")
                print(f"Valid for: 5 minutes")
                print(f"Max attempts: 5")
                print(f"{'='*60}\n")
                
                email_message = EmailMultiAlternatives(
                    subject="AccountSafe - Password Reset Code",
                    body=plain_text,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                )
                email_message.attach_alternative(html_content, "text/html")
                
                # Send email and track result
                email_sent = email_message.send(fail_silently=False)
                
                if email_sent:
                    logger.info(f"OTP email sent successfully to {email}")
                    return Response({
                        "message": "A verification code has been sent to your email.",
                        "expires_in": 300  # 5 minutes in seconds
                    })
                else:
                    logger.warning(f"Email send returned 0 for {email}")
                    return Response({
                        "message": "A verification code has been sent to your email.",
                        "expires_in": 300
                    })
                    
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Email Error for {email}: {str(e)}")
                
                # Even if email fails, print OTP to console for testing
                print(f"\n{'='*60}")
                print(f"⚠️ PASSWORD RESET OTP (Email failed, but OTP is valid)")
                print(f"{'='*60}")
                print(f"Email: {email}")
                print(f"OTP Code: {otp_code}")
                print(f"Valid for: 5 minutes")
                print(f"Error: {str(e)}")
                print(f"{'='*60}\n")
                
                # Still return success to not reveal email configuration issues
                return Response({
                    "message": "A verification code has been sent to your email.",
                    "expires_in": 300
                })
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyPasswordResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_code = serializer.validated_data["otp"]
            
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response({"error": "Invalid email address."}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                otp_instance = PasswordResetOTP.objects.get(user=user)
            except PasswordResetOTP.DoesNotExist:
                return Response({
                    "error": "No OTP found. Please request a new verification code.",
                    "code": "OTP_NOT_FOUND"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP has expired
            if otp_instance.is_expired():
                otp_instance.delete()
                return Response({
                    "error": "Verification code has expired. Please request a new one.",
                    "code": "OTP_EXPIRED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if max attempts exceeded
            if otp_instance.attempts >= otp_instance.max_attempts:
                otp_instance.delete()
                return Response({
                    "error": "Too many failed attempts. Please request a new verification code.",
                    "code": "MAX_ATTEMPTS_EXCEEDED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP was already used
            if otp_instance.is_used:
                otp_instance.delete()
                return Response({
                    "error": "This verification code has already been used. Please request a new one.",
                    "code": "OTP_ALREADY_USED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the OTP code
            if otp_instance.otp != otp_code:
                otp_instance.increment_attempts()
                remaining_attempts = otp_instance.max_attempts - otp_instance.attempts
                
                if remaining_attempts <= 0:
                    otp_instance.delete()
                    return Response({
                        "error": "Too many failed attempts. Please request a new verification code.",
                        "code": "MAX_ATTEMPTS_EXCEEDED"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    "error": f"Invalid verification code. {remaining_attempts} attempt(s) remaining.",
                    "code": "INVALID_OTP",
                    "remaining_attempts": remaining_attempts
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # OTP is valid
            remaining_time = otp_instance.get_remaining_time()
            return Response({
                "message": "Verification code verified successfully.",
                "remaining_time": remaining_time
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordView(APIView):
    """
    TRUE Zero-Knowledge Password Reset.
    
    Password is NEVER sent to server - only auth_hash (derived from password).
    
    Client sends:
    - email: user's email
    - otp: verification code
    - new_auth_hash: derived from new password using Argon2id + SHA-256
    - new_salt: new salt for key derivation
    
    WARNING: After password reset, old vault data CANNOT be decrypted!
    User should export/backup vault before resetting password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_code = serializer.validated_data["otp"]
            new_auth_hash = serializer.validated_data["new_auth_hash"].lower()
            new_salt = serializer.validated_data["new_salt"]
            
            # Validate auth_hash format (64 hex chars = 32 bytes SHA-256)
            if not all(c in '0123456789abcdef' for c in new_auth_hash):
                return Response({
                    "error": "Invalid auth_hash format (expected 64 hex characters)",
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
                    "error": "Session expired. Please start the password reset process again.",
                    "code": "OTP_NOT_FOUND"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify OTP matches
            if otp_instance.otp != otp_code:
                return Response({
                    "error": "Invalid verification code. Please verify your OTP first.",
                    "code": "INVALID_OTP"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if OTP has expired
            if otp_instance.is_expired():
                otp_instance.delete()
                return Response({
                    "error": "Session expired. Please start the password reset process again.",
                    "code": "OTP_EXPIRED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if max attempts exceeded
            if otp_instance.attempts >= otp_instance.max_attempts:
                otp_instance.delete()
                return Response({
                    "error": "Too many failed attempts. Please start over.",
                    "code": "MAX_ATTEMPTS_EXCEEDED"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # All validations passed - reset using zero-knowledge
            # Get or create user profile
            try:
                profile = user.userprofile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            # Store new auth_hash and salt (TRUE zero-knowledge)
            profile.auth_hash = new_auth_hash
            profile.encryption_salt = new_salt
            profile.save()
            
            # Disable Django password auth (user authenticates via auth_hash only)
            user.set_unusable_password()
            user.save()
            
            # Delete the OTP after successful password reset
            otp_instance.delete()
            
            # Log the successful password reset
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[ZK-AUTH] Password reset successful for user: {user.username} ({email}) - password NEVER received")
            
            return Response({
                "message": "Your password has been reset successfully. You can now login with your new password."
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    DEPRECATED: This endpoint is disabled for TRUE zero-knowledge architecture.
    
    Use /api/zk/change-password/ instead - password is NEVER sent to server,
    only auth_hash (derived from password) is transmitted.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "error": "This endpoint is deprecated. Use /api/zk/change-password/ for zero-knowledge password change.",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/change-password/"
            },
            status=status.HTTP_410_GONE
        )


class DeleteAccountView(APIView):
    """
    DEPRECATED: This endpoint is disabled for TRUE zero-knowledge architecture.
    
    Use /api/zk/delete-account/ instead - password is NEVER sent to server,
    only auth_hash (derived from password) is transmitted.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "error": "This endpoint is deprecated. Use /api/zk/delete-account/ for zero-knowledge account deletion.",
                "code": "USE_ZK_ENDPOINT",
                "redirect": "/api/zk/delete-account/"
            },
            status=status.HTTP_410_GONE
        )


# --- User Profile Views ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get the profile of the authenticated user"""
    try:
        profile = request.user.userprofile
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update the profile of the authenticated user"""
    try:
        profile = request.user.userprofile
    except UserProfile.DoesNotExist:
        # Create profile if it doesn't exist
        profile = UserProfile.objects.create(user=request.user)

    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        # Refresh the profile from database to get updated data
        profile.refresh_from_db()
        profile.user.refresh_from_db()
        # Return full profile data with request context for proper URL construction
        response_serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Helper function to check duress mode and get fake vault data ---
def is_duress_session(request):
    """Check if the current request is from a duress token"""
    from .models import DuressSession
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header[6:]
        return DuressSession.is_duress_token(token_key)
    return False


def get_fake_vault_data():
    """
    Generate fake vault data for duress mode.
    Returns hardcoded low-value credentials to maintain the illusion.
    The fake data includes both encrypted (fake) and plaintext versions
    for frontend display without decryption.
    """
    fake_categories = [
        {
            "id": 99901,
            "name": "Entertainment",
            "description": "Streaming and entertainment services",
            "organizations": [
                {
                    "id": 99901,
                    "name": "Netflix",
                    "logo_url": "https://cdn.iconscout.com/icon/free/png-256/netflix-2296042-1912001.png",
                    "profile_count": 1,
                    "profiles": [
                        {
                            "id": 99901,
                            "title": "Personal Account",
                            "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "username_iv": "duress_fake_iv_1",
                            "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "password_iv": "duress_fake_iv_2",
                            "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "email_iv": "duress_fake_iv_3",
                            "notes_encrypted": None,
                            "notes_iv": None,
                            "password_strength": 2,
                            "is_breached": False,
                            "_plaintext": {
                                "username": "user@example.com",
                                "password": "netflix123",
                                "email": "user@example.com",
                                "notes": ""
                            }
                        }
                    ]
                },
                {
                    "id": 99902,
                    "name": "Spotify",
                    "logo_url": "https://cdn.iconscout.com/icon/free/png-256/spotify-11-432546.png",
                    "profile_count": 1,
                    "profiles": [
                        {
                            "id": 99902,
                            "title": "Music Account",
                            "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "username_iv": "duress_fake_iv_4",
                            "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "password_iv": "duress_fake_iv_5",
                            "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "email_iv": "duress_fake_iv_6",
                            "notes_encrypted": None,
                            "notes_iv": None,
                            "password_strength": 2,
                            "is_breached": False,
                            "_plaintext": {
                                "username": "musiclover42",
                                "password": "spotify2023",
                                "email": "user@example.com",
                                "notes": ""
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id": 99902,
            "name": "Social Media",
            "description": "Social networking accounts",
            "organizations": [
                {
                    "id": 99903,
                    "name": "Twitter/X",
                    "logo_url": "https://cdn.iconscout.com/icon/free/png-256/twitter-241-721979.png",
                    "profile_count": 1,
                    "profiles": [
                        {
                            "id": 99903,
                            "title": "Personal Twitter",
                            "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "username_iv": "duress_fake_iv_7",
                            "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "password_iv": "duress_fake_iv_8",
                            "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                            "email_iv": "duress_fake_iv_9",
                            "notes_encrypted": None,
                            "notes_iv": None,
                            "password_strength": 2,
                            "is_breached": False,
                            "_plaintext": {
                                "username": "@randomuser123",
                                "password": "twitter2023",
                                "email": "user@example.com",
                                "notes": ""
                            }
                        }
                    ]
                }
            ]
        }
    ]
    return fake_categories


# --- Category Views ---
class CategoryListCreateView(APIView):
    """List all categories for authenticated user or create a new category"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all categories for the authenticated user"""
        # Check if this is a duress session - return fake data
        if is_duress_session(request):
            return Response(get_fake_vault_data())
        
        categories = Category.objects.filter(user=request.user)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new category for the authenticated user"""
        # In duress mode, pretend to create but don't actually
        if is_duress_session(request):
            # Return fake success response
            return Response({
                "id": 99999,
                "name": request.data.get("name", "New Category"),
                "description": request.data.get("description", ""),
                "organizations": []
            }, status=status.HTTP_201_CREATED)
        
        serializer = CategoryCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            # Return the full serialized category with organizations
            category = Category.objects.get(pk=serializer.instance.pk)
            response_serializer = CategorySerializer(category)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    """Retrieve, update, or delete a specific category"""
    permission_classes = [IsAuthenticated]

    def get_category(self, pk, user):
        """Helper method to get category and ensure user ownership"""
        try:
            return Category.objects.get(pk=pk, user=user)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        """Get a specific category"""
        # In duress mode, return fake category if it matches fake IDs
        if is_duress_session(request):
            fake_data = get_fake_vault_data()
            for cat in fake_data:
                if cat['id'] == pk:
                    return Response(cat)
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        category = self.get_category(pk, request.user)
        if not category:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        """Update a specific category"""
        # In duress mode, pretend to update
        if is_duress_session(request):
            return Response({
                "id": pk,
                "name": request.data.get("name", "Updated Category"),
                "description": request.data.get("description", ""),
                "organizations": []
            })
        
        category = self.get_category(pk, request.user)
        if not category:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CategoryCreateSerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            category.refresh_from_db()
            response_serializer = CategorySerializer(category)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete a specific category"""
        # In duress mode, pretend to delete
        if is_duress_session(request):
            return Response({"message": "Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        
        category = self.get_category(pk, request.user)
        if not category:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        category.delete()
        return Response(
            {"message": "Category deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


# --- Organization Views ---
class OrganizationListCreateView(APIView):
    """List all organizations for a category or create a new organization"""
    permission_classes = [IsAuthenticated]

    def get_category(self, category_id, user):
        """Helper method to get category and ensure user ownership"""
        try:
            return Category.objects.get(pk=category_id, user=user)
        except Category.DoesNotExist:
            return None

    def get(self, request, category_id):
        """Get all organizations for a specific category"""
        # In duress mode, return fake organizations
        if is_duress_session(request):
            fake_data = get_fake_vault_data()
            for cat in fake_data:
                if cat['id'] == category_id:
                    return Response(cat.get('organizations', []))
            return Response([])
        
        category = self.get_category(category_id, request.user)
        if not category:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        organizations = category.organizations.all()
        serializer = OrganizationSerializer(organizations, many=True)
        return Response(serializer.data)

    def post(self, request, category_id):
        """Create a new organization for a specific category"""
        # In duress mode, pretend to create
        if is_duress_session(request):
            import random
            fake_id = random.randint(100000, 999999)
            return Response({
                "id": fake_id,
                "name": request.data.get("name", "New Organization"),
                "logo_url": request.data.get("logo_url"),
                "logo_image": None,
                "profile_count": 0,
                "profiles": []
            }, status=status.HTTP_201_CREATED)
        
        category = self.get_category(category_id, request.user)
        if not category:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = OrganizationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(category=category)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrganizationDetailView(APIView):
    """Retrieve, update, or delete a specific organization"""
    permission_classes = [IsAuthenticated]

    def get_organization(self, organization_id, user):
        """Helper method to get organization and ensure user ownership"""
        try:
            return Organization.objects.get(pk=organization_id, category__user=user)
        except Organization.DoesNotExist:
            return None

    def get(self, request, organization_id):
        """Get a specific organization"""
        # In duress mode, return fake organization if it matches
        if is_duress_session(request):
            fake_data = get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    if org['id'] == organization_id:
                        return Response(org)
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        organization = self.get_organization(organization_id, request.user)
        if not organization:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data)

    def put(self, request, organization_id):
        """Update a specific organization"""
        # In duress mode, pretend to update
        if is_duress_session(request):
            return Response({
                "id": organization_id,
                "name": request.data.get("name", "Updated Organization"),
                "logo_url": request.data.get("logo_url"),
                "logo_image": None,
                "profile_count": 1,
                "profiles": []
            })
        
        organization = self.get_organization(organization_id, request.user)
        if not organization:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = OrganizationSerializer(organization, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, organization_id):
        """Delete a specific organization"""
        # In duress mode, pretend to delete
        if is_duress_session(request):
            return Response({"message": "Organization deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        
        organization = self.get_organization(organization_id, request.user)
        if not organization:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        organization.delete()
        return Response(
            {"message": "Organization deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


# ===========================
# PROFILE MANAGEMENT VIEWS
# ===========================

class ProfileListCreateView(APIView):
    """List all profiles for an organization or create a new profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        """Get all profiles for a specific organization"""
        # In duress mode, return fake profiles
        if is_duress_session(request):
            fake_data = get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    if org['id'] == organization_id:
                        return Response(org.get('profiles', []))
            return Response([])
        
        # Ensure user owns the organization through category
        try:
            organization = Organization.objects.get(pk=organization_id, category__user=request.user)
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        profiles = Profile.objects.filter(organization=organization)
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, organization_id):
        """Create a new profile for an organization"""
        # In duress mode, pretend to create
        if is_duress_session(request):
            import random
            fake_id = random.randint(100000, 999999)
            return Response({
                "id": fake_id,
                "title": request.data.get("title", "New Profile"),
                "username_encrypted": request.data.get("username_encrypted"),
                "username_iv": request.data.get("username_iv"),
                "password_encrypted": request.data.get("password_encrypted"),
                "password_iv": request.data.get("password_iv"),
                "email_encrypted": request.data.get("email_encrypted"),
                "email_iv": request.data.get("email_iv"),
                "notes_encrypted": request.data.get("notes_encrypted"),
                "notes_iv": request.data.get("notes_iv"),
                "password_strength": request.data.get("password_strength", 0),
                "is_breached": False,
                "_plaintext": {
                    "username": "newuser@example.com",
                    "password": "password123",
                    "email": "newuser@example.com",
                    "notes": ""
                }
            }, status=status.HTTP_201_CREATED)
        
        # Ensure user owns the organization through category
        try:
            organization = Organization.objects.get(pk=organization_id, category__user=request.user)
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Note: Debug logging removed for security - never log request.data as it may contain sensitive info
        
        serializer = ProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(organization=organization)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileDetailView(APIView):
    """Retrieve, update, or delete a specific profile"""
    permission_classes = [IsAuthenticated]

    def get_profile(self, profile_id, user):
        """Helper method to get profile and ensure user ownership (excludes trashed profiles)"""
        try:
            return Profile.objects.get(
                pk=profile_id, 
                organization__category__user=user,
                deleted_at__isnull=True  # Exclude trashed profiles
            )
        except Profile.DoesNotExist:
            return None

    def get(self, request, profile_id):
        """Get a specific profile"""
        # In duress mode, return fake profile if it matches
        if is_duress_session(request):
            fake_data = get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    for profile in org.get('profiles', []):
                        if profile['id'] == profile_id:
                            return Response(profile)
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        profile = self.get_profile(profile_id, request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request, profile_id):
        """Update a specific profile"""
        # In duress mode, pretend to update
        if is_duress_session(request):
            return Response({
                "id": profile_id,
                "title": request.data.get("title", "Updated Profile"),
                "username_encrypted": request.data.get("username_encrypted"),
                "username_iv": request.data.get("username_iv"),
                "password_encrypted": request.data.get("password_encrypted"),
                "password_iv": request.data.get("password_iv"),
                "email_encrypted": request.data.get("email_encrypted"),
                "email_iv": request.data.get("email_iv"),
                "notes_encrypted": request.data.get("notes_encrypted"),
                "notes_iv": request.data.get("notes_iv"),
                "password_strength": request.data.get("password_strength", 0),
                "is_breached": False
            })
        
        profile = self.get_profile(profile_id, request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, profile_id):
        """Partially update a specific profile (e.g., for toggling is_pinned)"""
        # In duress mode, pretend to update
        if is_duress_session(request):
            return Response({
                "id": profile_id,
                "is_pinned": request.data.get("is_pinned", False)
            })
        
        profile = self.get_profile(profile_id, request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, profile_id):
        """Soft delete - moves profile to trash instead of permanent deletion."""
        from django.utils import timezone
        
        # In duress mode, pretend to delete
        if is_duress_session(request):
            return Response({"message": "Profile deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        
        # Only soft-delete profiles that are NOT already in trash
        try:
            profile = Profile.objects.get(
                pk=profile_id, 
                organization__category__user=request.user,
                deleted_at__isnull=True
            )
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Soft delete - set deleted_at timestamp
        profile.deleted_at = timezone.now()
        profile.save()
        
        return Response({
            "message": "Profile moved to trash. It will be permanently deleted after 30 days.",
            "recoverable_until": "30 days"
        }, status=status.HTTP_200_OK)


# ===========================
# TRASH / RECYCLE BIN VIEWS
# ===========================

class TrashListView(APIView):
    """
    GET /profiles/trash/ - List all profiles in trash (soft-deleted)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        
        # In duress mode, return empty trash (don't reveal deleted items)
        if is_duress_session(request):
            return Response([])
        
        profiles = Profile.objects.filter(
            organization__category__user=request.user,
            deleted_at__isnull=False
        ).select_related('organization', 'organization__category').order_by('-deleted_at')
        
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        
        # Enrich with days_remaining
        data = serializer.data
        for item, profile in zip(data, profiles):
            item['days_remaining'] = profile.days_until_permanent_delete()
            item['deleted_at'] = profile.deleted_at.isoformat() if profile.deleted_at else None
        
        return Response(data)


class ProfileRestoreView(APIView):
    """
    POST /profiles/{id}/restore/ - Restore a profile from trash
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id):
        # In duress mode, pretend to restore
        if is_duress_session(request):
            return Response({"message": "Profile restored successfully"})
        
        try:
            profile = Profile.objects.get(
                pk=profile_id,
                organization__category__user=request.user,
                deleted_at__isnull=False  # Must be in trash
            )
            profile.deleted_at = None
            profile.save()
            return Response({"message": "Profile restored successfully"})
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found in trash"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ProfileShredView(APIView):
    """
    DELETE /profiles/{id}/shred/ - Permanently delete with crypto-shredding
    
    SECURITY: Before deletion, encrypted data is overwritten with random bytes
    to prevent disk recovery attacks.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, profile_id):
        import os
        
        # In duress mode, pretend to shred
        if is_duress_session(request):
            return Response({
                "message": "Profile permanently destroyed",
                "shredded": True
            })
        
        # Require explicit confirmation
        confirm = request.data.get('confirm')
        if confirm != 'PERMANENTLY_DELETE':
            return Response(
                {
                    "error": "Confirmation required. Send confirm: 'PERMANENTLY_DELETE'",
                    "warning": "This action cannot be undone. All encrypted data will be destroyed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Can shred both active and trashed profiles
            profile = Profile.objects.get(pk=profile_id, organization__category__user=request.user)
            
            # Crypto-shred: Overwrite all encrypted fields with random bytes
            random_data = os.urandom(32).hex()
            
            profile.username_encrypted = random_data
            profile.username_iv = random_data[:24]
            profile.password_encrypted = random_data
            profile.password_iv = random_data[:24]
            profile.email_encrypted = random_data
            profile.email_iv = random_data[:24]
            profile.notes_encrypted = random_data
            profile.notes_iv = random_data[:24]
            profile.recovery_codes_encrypted = random_data
            profile.recovery_codes_iv = random_data[:24]
            profile.password_hash = random_data[:64]
            
            # Save the shredded data (overwrites disk sectors)
            profile.save()
            
            # Delete any associated documents
            if profile.document:
                profile.document.delete(save=False)
            
            # Now delete the record
            profile.delete()
            
            return Response({
                "message": "Profile permanently destroyed. Encryption data has been shredded.",
                "shredded": True
            })
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


# ===========================
# SECURITY PIN VIEWS
# ===========================

class SetupPinView(APIView):
    """Setup a 4-digit security PIN for the user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin')
        
        if not pin:
            return Response(
                {"error": "PIN is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not (len(pin) == 4 and pin.isdigit()):
            return Response(
                {"error": "PIN must be exactly 4 digits."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            user_profile = UserProfile.objects.create(user=request.user)
        
        if user_profile.set_pin(pin):
            return Response({"message": "PIN set successfully."})
        else:
            return Response(
                {"error": "Failed to set PIN."},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyPinView(APIView):
    """Verify the user's security PIN"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin')
        
        if not pin:
            return Response(
                {"error": "PIN is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "No PIN has been set."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user_profile.has_pin():
            return Response(
                {"error": "No PIN has been set."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user_profile.verify_pin(pin):
            return Response({"message": "PIN verified successfully.", "valid": True})
        else:
            return Response(
                {"error": "Invalid PIN.", "valid": False},
                status=status.HTTP_400_BAD_REQUEST
            )


class PinStatusView(APIView):
    """Check if the user has a PIN set"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_profile = request.user.userprofile
            has_pin = user_profile.has_pin()
        except UserProfile.DoesNotExist:
            has_pin = False
        
        return Response({"has_pin": has_pin})


class ClearPinView(APIView):
    """Clear/remove the user's security PIN"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user_profile = request.user.userprofile
            if not user_profile.has_pin():
                return Response(
                    {"error": "No PIN is currently set."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Clear the PIN by setting it to None/empty
            user_profile.security_pin = None
            user_profile.save()
            
            return Response({"message": "PIN cleared successfully."})
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ResetPinView(APIView):
    """Reset security PIN after OTP verification"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_pin = request.data.get('new_pin')
        
        if not all([email, otp, new_pin]):
            return Response(
                {"error": "Email, OTP, and new PIN are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not (len(new_pin) == 4 and new_pin.isdigit()):
            return Response(
                {"error": "PIN must be exactly 4 digits."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email__iexact=email)
            otp_instance = PasswordResetOTP.objects.get(user=user, otp=otp)
            
            if not otp_instance.is_valid():
                otp_instance.delete()
                return Response(
                    {"error": "OTP has expired."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user profile
            try:
                user_profile = user.userprofile
            except UserProfile.DoesNotExist:
                user_profile = UserProfile.objects.create(user=user)
            
            # Set the new PIN
            if user_profile.set_pin(new_pin):
                otp_instance.delete()
                return Response({"message": "PIN reset successfully."})
            else:
                return Response(
                    {"error": "Failed to reset PIN."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except PasswordResetOTP.DoesNotExist:
            return Response(
                {"error": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ===========================
# UTILITY FUNCTIONS
# ===========================

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_location_data(ip_address):
    """Get location data from IP address using ipinfo.io"""
    if not ip_address or ip_address in ['127.0.0.1', 'localhost']:
        return {
            'country': 'Local',
            'isp': 'Local Network',
            'latitude': None,
            'longitude': None,
            'timezone': None
        }
    
    try:
        # Use ipinfo.io for better accuracy
        response = requests.get(f'https://ipinfo.io/{ip_address}/json', timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Extract latitude and longitude from "loc" field
            location = data.get('loc', '')
            latitude, longitude = None, None
            if location and ',' in location:
                try:
                    lat, lon = location.split(',')
                    latitude = float(lat.strip())
                    longitude = float(lon.strip())
                except:
                    pass
            
            # Build location string: City, Region, Country
            city = data.get('city', '')
            region = data.get('region', '')
            country = data.get('country', '')
            
            location_parts = [p for p in [city, region, country] if p]
            location_str = ', '.join(location_parts) if location_parts else 'Unknown'
            
            return {
                'country': location_str,  # Full location string
                'isp': data.get('org', 'Unknown'),
                'latitude': latitude,
                'longitude': longitude,
                'timezone': data.get('timezone', None)  # e.g., 'Asia/Kolkata'
            }
    except Exception as e:
        print(f"Error fetching location data: {e}")
    
    return {
        'country': 'Unknown',
        'isp': 'Unknown',
        'latitude': None,
        'longitude': None,
        'timezone': None
    }


def send_login_notification_email(record, user):
    """Send email notification for login attempt using unified template"""
    try:
        from django.template.loader import render_to_string
        
        # Get user email - try to find the user if not provided
        if not user:
            try:
                user = User.objects.get(username=record.username_attempted)
            except User.DoesNotExist:
                return  # Can't send email if user doesn't exist
        
        recipient_email = user.email
        if not recipient_email:
            return  # No email to send to
        
        # Parse user agent
        device = parse_user_agent(record.user_agent)
        
        # Get alert context based on type
        alert = get_alert_context('login')
        
        # Format location (city, country code)
        location = None
        if record.country and record.country not in ['Unknown', 'N/A', '']:
            location = record.country
        
        # Format timestamp
        timestamp = record.timestamp.strftime('%B %d, %Y at %I:%M %p %Z') if record.timestamp else 'Unknown'
        
        # Prepare template context
        context = {
            'alert': alert,
            'username': user.username,
            'device': device,
            'timestamp': timestamp,
            'location': location,
            'ip_address': record.ip_address or 'Unknown',
            'isp': record.isp if record.isp and record.isp not in ['Unknown', 'N/A', ''] else None,
        }
        
        # Render HTML template
        html_content = render_to_string('security_notification_email.html', context)
        
        # Plain text version
        text_content = f"""
        SECURITY NOTIFICATION - AccountSafe
        
        {alert['title']}
        
        {alert['message']}
        
        Account: {user.username}
        Device: {device['device_name']}
        Time: {timestamp}
        IP Address: {record.ip_address or 'Unknown'}
        {f'Location: {location}' if location else ''}
        {f'ISP: {record.isp}' if record.isp and record.isp not in ['Unknown', 'N/A', ''] else ''}
        
        {alert['footer_message']}
        
        © 2026 AccountSafe. All rights reserved.
        """
        
        email = EmailMultiAlternatives(
            subject=f"🔐 {alert['title']} - AccountSafe",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        print(f"[LOGIN NOTIFICATION] Email sent successfully to {recipient_email}")
        
    except Exception as e:
        print(f"[LOGIN NOTIFICATION] Failed to send email: {str(e)}")
        import traceback
        traceback.print_exc()


def track_login_attempt(request, username, password=None, is_success=False, user=None, is_duress=False, send_notification=True):
    """Track login attempt with location data and optionally send email notification
    
    Args:
        request: Django request object
        username: Username attempted
        password: Password attempted (only for failed logins)
        is_success: Whether login was successful
        user: User object (for successful logins)
        is_duress: Whether this was a duress password login
        send_notification: Whether to send email notification (False for panic unlocks)
    """
    ip_address = get_client_ip(request)
    location_data = get_location_data(ip_address)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Determine status
    if is_duress:
        status = 'duress'
    elif is_success:
        status = 'success'
    else:
        status = 'failed'
    
    record = LoginRecord.objects.create(
        user=user if is_success else None,
        username_attempted=username,
        # SECURITY: Never store passwords - zero-knowledge architecture
        status=status,
        is_duress=is_duress,
        ip_address=ip_address,
        country=location_data['country'],
        isp=location_data['isp'],
        latitude=location_data['latitude'],
        longitude=location_data['longitude'],
        timezone=location_data['timezone'],
        user_agent=user_agent
    )
    
    # Send email notification only if requested (skip for panic unlocks)
    if send_notification:
        send_login_notification_email(record, user)


def send_duress_alert_email(user, request):
    """
    Send an SOS alert email when duress password is used using unified template.
    This runs in a background thread to not delay the login response.
    """
    try:
        from django.template.loader import render_to_string
        
        if not hasattr(user, 'userprofile') or not user.userprofile.sos_email:
            print(f"[DURESS ALERT] No SOS email configured for user {user.username}")
            return
        
        sos_email = user.userprofile.sos_email
        ip_address = get_client_ip(request)
        location_data = get_location_data(ip_address)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        timestamp = timezone.now()
        
        # Log to console for debugging
        print(f"\n{'='*60}")
        print(f"🚨 DURESS LOGIN ALERT")
        print(f"{'='*60}")
        print(f"User: {user.username}")
        print(f"SOS Email: {sos_email}")
        print(f"IP Address: {ip_address}")
        print(f"Location: {location_data.get('country', 'Unknown')}")
        print(f"Time: {timestamp}")
        print(f"{'='*60}\n")
        
        # Parse user agent
        device = parse_user_agent(user_agent)
        
        # Get alert context for duress
        alert = get_alert_context('duress')
        
        # Format location (city, country code)
        location = None
        if location_data.get('country') and location_data['country'] not in ['Unknown', 'N/A', '']:
            location = location_data['country']
        
        # Format timestamp
        timestamp_str = timestamp.strftime('%B %d, %Y at %I:%M %p %Z')
        
        # Prepare template context
        context = {
            'alert': alert,
            'username': user.username,
            'device': device,
            'timestamp': timestamp_str,
            'location': location,
            'ip_address': ip_address or 'Unknown',
            'isp': location_data.get('isp') if location_data.get('isp') not in ['Unknown', 'N/A', ''] else None,
        }
        
        # Render HTML template
        html_content = render_to_string('security_notification_email.html', context)
        
        # Plain text version
        text_content = f"""
        DURESS LOGIN ALERT - AccountSafe
        
        {alert['title']}
        
        {alert['message']}
        
        Account: {user.username}
        Device: {device['device_name']}
        Time: {timestamp_str}
        IP Address: {ip_address or 'Unknown'}
        {f'Location: {location}' if location else ''}
        {f'ISP: {location_data.get("isp")}' if location_data.get('isp') not in ['Unknown', 'N/A', ''] else ''}
        
        {alert['footer_message']}
        
        © 2026 AccountSafe. All rights reserved.
        """
        
        email = EmailMultiAlternatives(
            subject="🚨 URGENT: Duress Login Detected - AccountSafe",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[sos_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        print(f"[DURESS ALERT] SOS email sent successfully to {sos_email}")
        
    except Exception as e:
        print(f"[DURESS ALERT] Failed to send SOS email: {str(e)}")
        import traceback
        traceback.print_exc()


# ===========================
# DASHBOARD STATISTICS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_statistics(request):
    """Get dashboard statistics for the authenticated user"""
    user = request.user
    
    # Count organizations
    organization_count = Organization.objects.filter(category__user=user).count()
    
    # Count profiles
    profile_count = Profile.objects.filter(organization__category__user=user).count()
    
    # Get recent login records (last 10) - include both successful and failed attempts
    recent_logins = LoginRecord.objects.filter(
        username_attempted=user.username
    ).order_by('-timestamp')[:10]
    login_serializer = LoginRecordSerializer(recent_logins, many=True, context={'request': request})
    
    return Response({
        'organization_count': organization_count,
        'profile_count': profile_count,
        'recent_logins': login_serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_records(request):
    """Get all login records for the authenticated user"""
    user = request.user
    limit = request.query_params.get('limit', 50)
    
    try:
        limit = int(limit)
        if limit > 100:
            limit = 100
    except:
        limit = 50
    
    # Filter by username to include both successful and failed attempts
    records = LoginRecord.objects.filter(
        username_attempted=user.username
    ).order_by('-timestamp')[:limit]
    serializer = LoginRecordSerializer(records, many=True, context={'request': request})
    
    return Response({
        'count': records.count(),
        'records': serializer.data
    })


# --- Security Health Score Views ---
class SecurityHealthScoreView(APIView):
    """
    Calculate and return the security health score for the authenticated user's vault.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .features.security.services import SecurityService
        
        try:
            score_data = SecurityService.calculate_health_score(request.user)
            return Response(score_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate health score: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdatePasswordStrengthView(APIView):
    """
    Update the password strength score for a specific profile.
    Called from frontend after client-side zxcvbn calculation.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        from .features.security.services import SecurityService
        
        strength_score = request.data.get('strength_score')
        
        if strength_score is None:
            return Response(
                {'error': 'strength_score is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            strength_score = int(strength_score)
            if not (0 <= strength_score <= 4):
                return Response(
                    {'error': 'strength_score must be between 0 and 4'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'strength_score must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user owns this profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        success = SecurityService.update_password_strength(profile_id, strength_score)
        if success:
            return Response({'message': 'Password strength updated successfully'})
        else:
            return Response(
                {'error': 'Failed to update password strength'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateBreachStatusView(APIView):
    """
    Update the breach status for a specific profile.
    Called from frontend after client-side HIBP check.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        from .features.security.services import SecurityService
        
        is_breached = request.data.get('is_breached')
        breach_count = request.data.get('breach_count', 0)
        
        if is_breached is None:
            return Response(
                {'error': 'is_breached is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user owns this profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        success = SecurityService.update_breach_status(profile_id, bool(is_breached))
        if success:
            return Response({'message': 'Breach status updated successfully'})
        else:
            return Response(
                {'error': 'Failed to update breach status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdatePasswordHashView(APIView):
    """
    Update the password hash for a specific profile (for uniqueness checking).
    Called from frontend after creating/updating a password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, profile_id):
        from .features.security.services import SecurityService
        
        password_hash = request.data.get('password_hash')
        
        if not password_hash:
            return Response(
                {'error': 'password_hash is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user owns this profile
        try:
            profile = Profile.objects.get(id=profile_id)
            if profile.organization.category.user != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        success = SecurityService.update_password_hash(profile_id, password_hash)
        if success:
            return Response({'message': 'Password hash updated successfully'})
        else:
            return Response(
                {'error': 'Failed to update password hash'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchUpdateSecurityMetricsView(APIView):
    """
    Batch update security metrics (strength and breach status) for multiple profiles.
    Useful for client-side to update all metrics at once after decryption.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .features.security.services import SecurityService
        from django.utils import timezone
        
        updates = request.data.get('updates', [])
        
        if not isinstance(updates, list):
            return Response(
                {'error': 'updates must be an array'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        
        for update in updates:
            profile_id = update.get('profile_id')
            strength_score = update.get('strength_score')
            is_breached = update.get('is_breached')
            
            if not profile_id:
                continue
            
            # Verify user owns this profile
            try:
                profile = Profile.objects.get(id=profile_id)
                if profile.organization.category.user != request.user:
                    results.append({
                        'profile_id': profile_id,
                        'success': False,
                        'error': 'Permission denied'
                    })
                    continue
            except Profile.DoesNotExist:
                results.append({
                    'profile_id': profile_id,
                    'success': False,
                    'error': 'Profile not found'
                })
                continue
            
            # Update strength if provided
            if strength_score is not None:
                try:
                    strength_score = int(strength_score)
                    if 0 <= strength_score <= 4:
                        SecurityService.update_password_strength(profile_id, strength_score)
                except ValueError:
                    pass
            
            # Update breach status if provided
            if is_breached is not None:
                SecurityService.update_breach_status(profile_id, bool(is_breached))
            
            # Update last_password_update to now if not already set
            if not profile.last_password_update:
                profile.last_password_update = timezone.now()
                profile.save(update_fields=['last_password_update'])
            
            results.append({
                'profile_id': profile_id,
                'success': True
            })
        
        return Response({
            'message': f'Updated {len(results)} profiles',
            'results': results
        })


# ===========================
# PANIC & DURESS SETTINGS
# ===========================

# List of forbidden key combinations that could interfere with browser/OS
FORBIDDEN_SHORTCUTS = [
    ['Control', 'w'],  # Close tab
    ['Control', 'W'],
    ['Control', 't'],  # New tab
    ['Control', 'T'],
    ['Control', 'n'],  # New window
    ['Control', 'N'],
    ['Control', 'Tab'],  # Switch tab
    ['Alt', 'F4'],  # Close window
    ['Control', 'r'],  # Refresh
    ['Control', 'R'],
    ['F5'],  # Refresh
    ['Control', 'F5'],
    ['F11'],  # Fullscreen
    ['Control', 'Shift', 'i'],  # DevTools
    ['Control', 'Shift', 'I'],
    ['F12'],  # DevTools
    ['Control', 'p'],  # Print
    ['Control', 'P'],
    ['Control', 's'],  # Save
    ['Control', 'S'],
    ['Control', 'f'],  # Find
    ['Control', 'F'],
    ['Control', 'g'],  # Find next
    ['Control', 'G'],
    ['Alt', 'Tab'],  # Switch window
]


class SecuritySettingsView(APIView):
    """Manage panic button and duress password settings"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current security settings"""
        # Check if this is a duress session - if so, hide duress-related settings
        is_duress = is_duress_session(request)
        
        try:
            profile = request.user.userprofile
            
            # In duress mode, pretend there's no duress password set
            if is_duress:
                return Response({
                    'panic_shortcut': profile.panic_shortcut or [],
                    'has_duress_password': False,  # Hide that duress password exists
                    'sos_email': '',  # Hide SOS email
                    '_is_duress_session': False  # Don't reveal this is a duress session
                })
            
            return Response({
                'panic_shortcut': profile.panic_shortcut or [],
                'has_duress_password': profile.has_duress_password(),
                'sos_email': profile.sos_email or ''
            })
        except UserProfile.DoesNotExist:
            return Response({
                'panic_shortcut': [],
                'has_duress_password': False,
                'sos_email': ''
            })
    
    def post(self, request):
        """Update security settings"""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        action = request.data.get('action')
        
        if action == 'set_panic_shortcut':
            shortcut = request.data.get('shortcut', [])
            
            # Validate it's a list of strings
            if not isinstance(shortcut, list):
                return Response(
                    {"error": "Shortcut must be a list of key names"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate not empty or single key
            if len(shortcut) < 2:
                return Response(
                    {"error": "Shortcut must have at least 2 keys (e.g., Alt + X)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check against forbidden shortcuts (case-insensitive comparison)
            shortcut_normalized = [k.lower() for k in shortcut]
            for forbidden in FORBIDDEN_SHORTCUTS:
                forbidden_normalized = [k.lower() for k in forbidden]
                if shortcut_normalized == forbidden_normalized or set(shortcut_normalized) == set(forbidden_normalized):
                    return Response(
                        {"error": f"This shortcut ({'+'.join(shortcut)}) is reserved by the browser and cannot be used"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            profile.panic_shortcut = shortcut
            profile.save()
            
            return Response({
                "message": "Panic shortcut saved successfully",
                "panic_shortcut": shortcut
            })
        
        elif action == 'set_duress_password':
            # DEPRECATED: Use /api/zk/set-duress/ for TRUE zero-knowledge
            return Response(
                {
                    "error": "This action is deprecated. Use /api/zk/set-duress/ for zero-knowledge duress password setup.",
                    "code": "USE_ZK_ENDPOINT",
                    "redirect": "/api/zk/set-duress/"
                },
                status=status.HTTP_410_GONE
            )
        
        elif action == 'clear_duress_password':
            # DEPRECATED: Use /api/zk/clear-duress/ for TRUE zero-knowledge
            return Response(
                {
                    "error": "This action is deprecated. Use /api/zk/clear-duress/ for zero-knowledge duress password clearing.",
                    "code": "USE_ZK_ENDPOINT",
                    "redirect": "/api/zk/clear-duress/"
                },
                status=status.HTTP_410_GONE
            )
        
        elif action == 'clear_panic_shortcut':
            profile.panic_shortcut = []
            profile.save()
            
            return Response({
                "message": "Panic shortcut cleared",
                "panic_shortcut": []
            })
        
        elif action == 'verify_password':
            # DEPRECATED: Use /api/zk/verify/ for TRUE zero-knowledge
            return Response(
                {
                    "error": "This action is deprecated. Use /api/zk/verify/ for zero-knowledge password verification.",
                    "code": "USE_ZK_ENDPOINT",
                    "redirect": "/api/zk/verify/"
                },
                status=status.HTTP_410_GONE
            )
        
        else:
            return Response(
                {"error": "Invalid action. Use: set_panic_shortcut, clear_panic_shortcut. For duress and password operations, use /api/zk/ endpoints."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ═══════════════════════════════════════════════════════════════════════════════
# Hybrid Organization Search API (Local + Clearbit)
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def lookup_organization_by_url(request):
    """
    Look up organization info by URL/domain.
    Extracts domain from URL and fetches organization name and logo.
    
    Query Parameters:
        url (str): Full URL or domain (e.g., accounts.x.ai, www.google.com, https://github.com)
    
    Returns:
        JSON object with name, domain, logo, website_link
    """
    from urllib.parse import urlparse
    import re
    from bs4 import BeautifulSoup
    
    url_input = request.GET.get('url', '').strip()
    
    if not url_input:
        return Response(
            {"error": "URL parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Extract domain from URL
    # Handle various formats: accounts.x.ai, www.google.com, https://github.com/path
    url_clean = url_input.lower().strip()
    
    # Add protocol if missing for proper parsing
    if not url_clean.startswith(('http://', 'https://')):
        url_clean = 'https://' + url_clean
    
    try:
        parsed = urlparse(url_clean)
        domain = parsed.netloc or parsed.path.split('/')[0]
    except Exception:
        # Fallback: extract domain manually
        domain = re.sub(r'^(https?://)?', '', url_input.lower())
        domain = domain.split('/')[0].split('?')[0]
    
    if not domain:
        return Response(
            {"error": "Could not extract domain from URL"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Remove common subdomains to get the main domain
    subdomain_patterns = ['www.', 'accounts.', 'auth.', 'login.', 'signin.', 'app.', 
                          'my.', 'portal.', 'console.', 'dashboard.', 'api.', 'm.', 'mobile.']
    main_domain = domain
    for pattern in subdomain_patterns:
        if main_domain.startswith(pattern):
            main_domain = main_domain[len(pattern):]
            break
    
    # Try to extract organization name from domain
    # e.g., x.ai -> X, github.com -> GitHub
    domain_name = main_domain.split('.')[0]
    
    def fetch_website_title(url):
        """Try to fetch the website title from the page"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            resp = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                title_tag = soup.find('title')
                if title_tag and title_tag.string:
                    title = title_tag.string.strip()
                    # Clean up common title patterns
                    # Remove " - Home", " | Official Site", etc.
                    for suffix in [' - Home', ' | Home', ' - Official', ' | Official', 
                                   ' - Welcome', ' | Welcome', ' – Home', ' – Official']:
                        if title.endswith(suffix):
                            title = title[:-len(suffix)]
                    # Take first part if title has separators
                    for sep in [' | ', ' - ', ' – ', ' :: ', ' : ']:
                        if sep in title:
                            title = title.split(sep)[0].strip()
                            break
                    if title and len(title) < 100:  # Sanity check
                        return title
        except Exception:
            pass
        return None
    
    # Step 1: Search local database by domain
    try:
        local_org = CuratedOrganization.objects.filter(
            domain__icontains=main_domain
        ).first()
        
        if local_org:
            return Response({
                'name': local_org.name,
                'domain': local_org.domain,
                'logo': local_org.get_logo(),
                'website_link': local_org.website_link or f'https://{local_org.domain}',
                'source': 'local',
                'is_verified': local_org.is_verified
            })
    except Exception:
        pass
    
    # Step 2: Try Clearbit API - search with FULL domain first for exact match
    try:
        # First try with full domain for exact match
        clearbit_url = f'https://autocomplete.clearbit.com/v1/companies/suggest?query={main_domain}'
        response = requests.get(clearbit_url, timeout=3)
        
        if response.status_code == 200:
            clearbit_data = response.json()
            
            # Find exact domain match ONLY
            for item in clearbit_data:
                item_domain = item.get('domain', '').lower()
                # Only accept if the domain matches exactly or is very close
                if item_domain == main_domain or item_domain == domain:
                    return Response({
                        'name': item.get('name', domain_name.capitalize()),
                        'domain': item_domain,
                        'logo': item.get('logo', f'https://www.google.com/s2/favicons?domain={item_domain}&sz=128'),
                        'website_link': f'https://{item_domain}',
                        'source': 'clearbit',
                        'is_verified': False
                    })
    except requests.RequestException:
        pass
    
    # Step 3: Fallback - Use the ACTUAL domain entered
    # Try to fetch the website title for a better name
    website_url = f'https://{main_domain}'
    fetched_title = fetch_website_title(website_url)
    
    if fetched_title:
        org_name = fetched_title
    else:
        # Generate a readable name from the domain
        # e.g., utu.ac.in -> "Utu", github.com -> "Github"
        org_name = ' '.join(word.capitalize() for word in domain_name.replace('-', ' ').replace('_', ' ').split())
    
    return Response({
        'name': org_name or main_domain.split('.')[0].capitalize(),
        'domain': main_domain,
        'logo': f'https://www.google.com/s2/favicons?domain={main_domain}&sz=128',
        'website_link': f'https://{main_domain}',
        'source': 'fallback',
        'is_verified': False
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def search_organizations(request):
    """
    Hybrid organization search: Local database first, then Clearbit API fallback.
    
    Query Parameters:
        q (str): Search query
    
    Returns:
        JSON array of organizations with name, domain, logo, source
    """
    from django.db.models import Case, When, Value, IntegerField
    
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response(
            {"error": "Query must be at least 2 characters"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = []
    seen_domains = set()
    
    # Step 1: Search Local Database with relevance-based sorting
    # Priority: Exact match > Starts with > Contains
    local_orgs = CuratedOrganization.objects.filter(
        name__icontains=query
    ).annotate(
        relevance=Case(
            When(name__iexact=query, then=Value(3)),  # Exact match
            When(name__istartswith=query, then=Value(2)),  # Starts with
            default=Value(1),  # Contains
            output_field=IntegerField()
        )
    ).order_by('-relevance', '-priority', 'name')[:10]
    
    for org in local_orgs:
        # Get the appropriate logo based on logo_type
        logo = org.get_logo()
        
        results.append({
            'name': org.name,
            'domain': org.domain,
            'logo': logo,
            'website_link': org.website_link or f'https://{org.domain}',
            'source': 'local',
            'is_verified': org.is_verified
        })
        seen_domains.add(org.domain.lower())
    
    # Step 2: Clearbit API Fallback (if we have fewer than 3 results)
    if len(results) < 3:
        try:
            clearbit_url = f'https://autocomplete.clearbit.com/v1/companies/suggest?query={query}'
            response = requests.get(clearbit_url, timeout=3)
            
            if response.status_code == 200:
                clearbit_data = response.json()
                
                for item in clearbit_data[:6]:  # Limit to 6 from API
                    domain = item.get('domain', '').lower()
                    
                    # Skip duplicates
                    if domain and domain not in seen_domains:
                        results.append({
                            'name': item.get('name', ''),
                            'domain': domain,
                            'logo': item.get('logo', f'https://www.google.com/s2/favicons?domain={domain}&sz=128'),
                            'website_link': f'https://{domain}',
                            'source': 'clearbit',
                            'is_verified': False
                        })
                        seen_domains.add(domain)
                        
                        # Stop if we have enough results
                        if len(results) >= 6:
                            break
        
        except requests.RequestException as e:
            # If Clearbit fails, just return local results
            print(f"Clearbit API error: {e}")
    
    return Response(results)


# Active Session Management Views
class ActiveSessionsView(APIView):
    """List all active sessions for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .serializers import UserSessionSerializer
        
        # Only show active sessions
        sessions = UserSession.objects.filter(user=request.user, is_active=True).order_by('-last_active')
        serializer = UserSessionSerializer(sessions, many=True, context={'request': request})
        return Response(serializer.data)


class ValidateSessionView(APIView):
    """Check if the current session is still active"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # If authentication succeeded, session is valid
        return Response({'is_active': True, 'message': 'Session is valid'})


class RevokeSessionView(APIView):
    """Revoke a specific session by marking it inactive and deleting its token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        try:
            session = UserSession.objects.get(id=session_id, user=request.user, is_active=True)
            
            # Check if trying to revoke current session
            if hasattr(request, 'auth') and session.token.key == request.auth.key:
                return Response({'error': 'Cannot revoke current session'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Revoke the session (marks inactive and deletes token)
            session.revoke()
            
            return Response({'message': 'Session revoked successfully'}, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Also support DELETE method for backward compatibility
    def delete(self, request, session_id):
        return self.post(request, session_id)


class RevokeAllSessionsView(APIView):
    """Revoke all sessions except the current one"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Get current token from request
        current_token = request.auth
        
        # Get count of sessions to revoke
        sessions_to_revoke = UserSession.objects.filter(
            user=request.user, 
            is_active=True
        ).exclude(token__key=current_token.key)
        
        count = sessions_to_revoke.count()
        
        # Delete all other tokens (cascades to UserSession)
        from .models import MultiToken
        MultiToken.objects.filter(user=request.user).exclude(key=current_token.key).delete()
        
        return Response({
            'message': f'Successfully revoked {count} session{"s" if count != 1 else ""}',
            'revoked_count': count
        }, status=status.HTTP_200_OK)
    
    # Also support DELETE method for backward compatibility
    def delete(self, request):
        return self.post(request)
