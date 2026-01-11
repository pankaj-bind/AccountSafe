# api/views.py

import os
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .models import PasswordResetOTP, UserProfile
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    SetNewPasswordSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username", None)
        if username:
            exists = User.objects.filter(username__iexact=username).exists()
            return Response({"exists": exists})
        return Response({"error": "Username parameter not provided"}, status=status.HTTP_400_BAD_REQUEST)


# OTP Views
class RequestPasswordResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            
            # Check if user exists
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                return Response({"error": "No user found with this email address."}, status=status.HTTP_404_NOT_FOUND)
            
            PasswordResetOTP.objects.filter(user=user).delete()
            otp_code = PasswordResetOTP.generate_otp()
            PasswordResetOTP.objects.create(user=user, otp=otp_code)
            
            # Send email using Django's SMTP backend
            try:
                from django.core.mail import EmailMultiAlternatives
                
                html_content = f'''
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <!-- Header -->
                        <div style="text-align: center; padding: 30px 0;">
                            <h1 style="color: #0078d4; margin: 0; font-size: 32px; font-weight: 600;">Auth Template</h1>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Authentication System</p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
                            
                            <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hello,
                            </p>
                            
                            <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                We received a request to reset your password. Please use the verification code below to complete the process:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="color: #ffffff; font-size: 14px; margin: 0 0 15px 0; opacity: 0.9;">Your Verification Code</p>
                                <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; display: inline-block;">
                                    <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 10px; font-family: 'Courier New', monospace;">
                                        {otp_code}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Instructions -->
                            <div style="background: #f8f9fa; border-left: 4px solid #0078d4; padding: 20px; border-radius: 5px; margin: 25px 0;">
                                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                                    <strong>⏱️ Time Limit:</strong> This code will expire in <strong>5 minutes</strong><br>
                                    <strong>🔒 Security:</strong> Never share this code with anyone<br>
                                    <strong>❓ Didn't request this?</strong> Ignore this email - your account is safe
                                </p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 30px 20px;">
                            <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
                                This is an automated message from Auth Template
                            </p>
                            <p style="color: #999; font-size: 11px; margin: 0;">
                                © 2026 Auth Template. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                '''
                
                # Print OTP to console for development/testing
                print(f"\n{'='*60}")
                print(f"PASSWORD RESET OTP")
                print(f"{'='*60}")
                print(f"Email: {email}")
                print(f"OTP Code: {otp_code}")
                print(f"Valid for: 5 minutes")
                print(f"{'='*60}\n")
                
                email_message = EmailMultiAlternatives(
                    subject="Auth Template - Password Reset OTP",
                    body=f"Your OTP for password reset is: {otp_code}. It is valid for 5 minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                )
                email_message.attach_alternative(html_content, "text/html")
                email_message.send(fail_silently=True)
                
                return Response({"message": "An OTP has been sent to your email."})
                    
            except Exception as e:
                print(f"Email Error: {str(e)}")
                # Even if email fails, print OTP to console for testing
                print(f"\n{'='*60}")
                print(f"PASSWORD RESET OTP (Email failed, but OTP is valid)")
                print(f"{'='*60}")
                print(f"Email: {email}")
                print(f"OTP Code: {otp_code}")
                print(f"Valid for: 5 minutes")
                print(f"{'='*60}\n")
                return Response({"message": "An OTP has been sent to your email."})
                
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
                otp_instance = PasswordResetOTP.objects.get(user=user, otp=otp_code)
                if otp_instance.is_valid():
                    return Response({"message": "OTP verified successfully."})
                else:
                    otp_instance.delete()
                    return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
                return Response({"error": "Invalid OTP or email."}, status=status.HTTP_400_BAD_REQUEST)
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
                otp_instance = PasswordResetOTP.objects.get(user=user, otp=otp_code)
                if otp_instance.is_valid():
                    user.set_password(password)
                    user.save()
                    otp_instance.delete()
                    return Response(
                        {"message": "Password has been reset successfully."}
                    )
                else:
                    otp_instance.delete()
                    return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
                return Response(
                    {"error": "Invalid OTP or email. Please start over."}, status=status.HTTP_400_BAD_REQUEST
                )
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
        serializer = UserProfileSerializer(profile)
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

    serializer = UserProfileUpdateSerializer(
        profile, 
        data=request.data, 
        partial=True,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        # Return full profile data
        response_serializer = UserProfileSerializer(profile)
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
