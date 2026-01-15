# api/views.py

import os
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .models import PasswordResetOTP, UserProfile, Category, Organization, Profile, LoginRecord
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
from .turnstile import verify_turnstile_token, get_client_ip


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username", None)
        if username:
            exists = User.objects.filter(username__iexact=username).exists()
            return Response({"exists": exists})
        return Response({"error": "Username parameter not provided"}, status=status.HTTP_400_BAD_REQUEST)


# Custom Login View with tracking
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate, login
        from rest_framework.authtoken.models import Token
        
        username = request.data.get('username')
        password = request.data.get('password')
        turnstile_token = request.data.get('turnstile_token')
        
        if not username or not password:
            return Response(
                {"error": "Both username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify Turnstile token if provided
        if turnstile_token:
            remote_ip = get_client_ip(request)
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                return Response(
                    {"error": "Verification failed. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Successful login
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            
            # Track successful login
            track_login_attempt(request, username, is_success=True, user=user)
            
            return Response({
                'key': token.key,
                'user': {
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            # Failed login - track with password
            track_login_attempt(request, username, password=password, is_success=False)
            
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
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
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: 'Segoe UI', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <!-- Header -->
                        <div style="text-align: center; padding: 30px 0;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 15px 25px; border-radius: 12px; margin-bottom: 15px;">
                                <span style="color: #ffffff; font-size: 28px; font-weight: 700;">AccountSafe</span>
                            </div>
                            <p style="color: #a1a1aa; margin: 10px 0 0 0; font-size: 14px;">Secure Password Manager</p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%); border: 1px solid #27272a; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
                            
                            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hello <strong style="color: #ffffff;">{display_name}</strong>,
                            </p>
                            
                            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                We received a request to reset your AccountSafe password. Use the verification code below to complete the process:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 20px 30px; display: inline-block;">
                                    <span style="color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                        {otp_code}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Instructions -->
                            <div style="background: #18181b; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                                <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.8;">
                                    <span style="color: #fbbf24;"></span> <strong style="color: #ffffff;">Expires in:</strong> 5 minutes<br>
                                    <span style="color: #22c55e;"></span> <strong style="color: #ffffff;">Security:</strong> Never share this code with anyone<br>
                                    <span style="color: #ef4444;"></span> <strong style="color: #ffffff;">Attempts:</strong> Maximum 5 verification attempts allowed
                                </p>
                            </div>
                            
                            <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                If you didn't request a password reset, please ignore this email. Your account is safe and no changes have been made.
                            </p>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 15px 20px; margin-top: 20px; text-align: center;">
                            <p style="color: #71717a; font-size: 12px; margin: 0;">
                                🛡️ This email was sent from AccountSafe's secure servers. We will never ask for your password via email.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 30px 20px;">
                            <p style="color: #52525b; font-size: 12px; margin: 0 0 5px 0;">
                                This is an automated message from AccountSafe
                            </p>
                            <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                                © 2026 AccountSafe. All rights reserved.
                            </p>
                        </div>
                    </div>
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
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_code = serializer.validated_data["otp"]
            password = serializer.validated_data["password"]
            
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
            
            # All validations passed - reset the password
            user.set_password(password)
            user.save()
            
            # Delete the OTP after successful password reset
            otp_instance.delete()
            
            # Log the successful password reset
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Password reset successful for user: {user.username} ({email})")
            
            return Response({
                "message": "Your password has been reset successfully. You can now login with your new password."
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Change password for authenticated users"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {"error": "Both current password and new password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Check if current password is correct
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password length
        if len(new_password) < 8:
            return Response(
                {"error": "New password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password changed successfully."})


class DeleteAccountView(APIView):
    """Delete account for authenticated users"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password')

        if not password:
            return Response(
                {"error": "Password is required to delete your account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Verify password
        if not user.check_password(password):
            return Response(
                {"error": "Password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete user profile if exists
        try:
            if hasattr(user, 'userprofile'):
                user.userprofile.delete()
        except:
            pass

        # Delete the user account
        user.delete()

        return Response({"message": "Account deleted successfully."})


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

# --- Category Views ---
class CategoryListCreateView(APIView):
    """List all categories for authenticated user or create a new category"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all categories for the authenticated user"""
        categories = Category.objects.filter(user=request.user)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new category for the authenticated user"""
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
        # Ensure user owns the organization through category
        try:
            organization = Organization.objects.get(pk=organization_id, category__user=request.user)
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Debug: Print incoming data
        print("Incoming request data:", request.data)
        print("Request FILES:", request.FILES)
        
        serializer = ProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(organization=organization)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Debug: Print validation errors
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileDetailView(APIView):
    """Retrieve, update, or delete a specific profile"""
    permission_classes = [IsAuthenticated]

    def get_profile(self, profile_id, user):
        """Helper method to get profile and ensure user ownership"""
        try:
            return Profile.objects.get(pk=profile_id, organization__category__user=user)
        except Profile.DoesNotExist:
            return None

    def get(self, request, profile_id):
        """Get a specific profile"""
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
        """Delete a specific profile"""
        profile = self.get_profile(profile_id, request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        profile.delete()
        return Response(
            {"message": "Profile deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
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
    """Send email notification for login attempt"""
    try:
        # Get user email - try to find the user if not provided
        if not user:
            try:
                user = User.objects.get(username=record.username_attempted)
            except User.DoesNotExist:
                return  # Can't send email if user doesn't exist
        
        recipient_email = user.email
        if not recipient_email:
            return  # No email to send to
        
        # Determine status and color
        if record.status == 'success':
            status_text = 'Successful Login'
            status_color = '#10b981'
            alert_level = 'INFO'
        else:
            status_text = 'Failed Login Attempt'
            status_color = '#ef4444'
            alert_level = 'SECURITY ALERT'
        
        # Format location
        location = f"{record.latitude}, {record.longitude}" if record.latitude and record.longitude else "N/A"
        
        # Create HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background: #1e293b; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                        🔐 AccountSafe
                                    </h1>
                                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                                        {alert_level}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid {status_color}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                        <h2 style="margin: 0 0 8px 0; color: {status_color}; font-size: 20px; font-weight: 600;">
                                            {status_text}
                                        </h2>
                                        <p style="margin: 0; color: #cbd5e1; font-size: 14px;">
                                            A login attempt was detected on your account.
                                        </p>
                                    </div>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">Username:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px; font-weight: 600;">{record.username_attempted}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">Status:</span><br/>
                                                <span style="color: {status_color}; font-size: 15px; font-weight: 600; text-transform: uppercase;">{record.status}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">Date & Time:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px;">{record.timestamp.strftime('%B %d, %Y at %I:%M %p')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">IP Address:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px; font-family: 'Courier New', monospace;">{record.ip_address or 'N/A'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">Location:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px;">{record.country or 'Unknown'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">ISP:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px;">{record.isp or 'Unknown'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">Coordinates:</span><br/>
                                                <span style="color: #e2e8f0; font-size: 15px; font-family: 'Courier New', monospace;">{location}</span>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    {f'''
                                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 16px; border-radius: 8px; margin-top: 24px;">
                                        <p style="margin: 0; color: #fca5a5; font-size: 13px; font-weight: 500;">
                                            ⚠️ <strong>Security Notice:</strong> This login attempt failed. If this wasn't you, your account may be under attack. Please change your password immediately.
                                        </p>
                                    </div>
                                    ''' if record.status == 'failed' else ''}
                                    
                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center;">
                                        <p style="margin: 0; color: #64748b; font-size: 12px;">
                                            If this wasn't you, please secure your account immediately.<br/>
                                            You can view all login activity in your AccountSafe dashboard.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background: #0f172a; padding: 20px 30px; text-align: center; border-top: 1px solid #334155;">
                                    <p style="margin: 0; color: #64748b; font-size: 12px;">
                                        © 2026 AccountSafe. All rights reserved.<br/>
                                        This is an automated security notification.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Plain text version
        security_notice = "⚠️ SECURITY NOTICE: This login attempt failed. If this wasn't you, your account may be under attack. Please change your password immediately."
        
        text_content = f"""
        AccountSafe - {alert_level}
        
        {status_text}
        
        A login attempt was detected on your account.
        
        Username: {record.username_attempted}
        Status: {record.status.upper()}
        Date & Time: {record.timestamp.strftime('%B %d, %Y at %I:%M %p')}
        IP Address: {record.ip_address or 'N/A'}
        Location: {record.country or 'Unknown'}
        ISP: {record.isp or 'Unknown'}
        Coordinates: {location}
        
        {security_notice if record.status == 'failed' else ''}
        
        If this wasn't you, please secure your account immediately.
        You can view all login activity in your AccountSafe dashboard.
        
        © 2026 AccountSafe. All rights reserved.
        This is an automated security notification.
        """
        
        # Send email
        subject = f"AccountSafe - {status_text} Detected"
        from_email = settings.EMAIL_HOST_USER
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=True)
        
    except Exception as e:
        # Log error but don't raise exception to prevent login flow interruption
        print(f"Failed to send login notification email: {str(e)}")


def track_login_attempt(request, username, password=None, is_success=False, user=None):
    """Track login attempt with location data and send email notification"""
    ip_address = get_client_ip(request)
    location_data = get_location_data(ip_address)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    record = LoginRecord.objects.create(
        user=user if is_success else None,
        username_attempted=username,
        password_attempted=password if not is_success else None,
        status='success' if is_success else 'failed',
        ip_address=ip_address,
        country=location_data['country'],
        isp=location_data['isp'],
        latitude=location_data['latitude'],
        longitude=location_data['longitude'],
        timezone=location_data['timezone'],
        user_agent=user_agent
    )
    
    # Send email notification
    send_login_notification_email(record, user)


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
    login_serializer = LoginRecordSerializer(recent_logins, many=True)
    
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
    serializer = LoginRecordSerializer(records, many=True)
    
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
        from .health_score import calculate_health_score
        
        try:
            score_data = calculate_health_score(request.user)
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
        from .health_score import update_password_strength
        
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
        
        success = update_password_strength(profile_id, strength_score)
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
        from .health_score import update_breach_status
        
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
        
        success = update_breach_status(profile_id, bool(is_breached), int(breach_count))
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
        from .health_score import update_password_hash
        
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
        
        success = update_password_hash(profile_id, password_hash)
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
        from .health_score import update_password_strength, update_breach_status
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
                        update_password_strength(profile_id, strength_score)
                except ValueError:
                    pass
            
            # Update breach status if provided
            if is_breached is not None:
                update_breach_status(profile_id, bool(is_breached))
            
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
