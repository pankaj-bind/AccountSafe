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

from .models import PasswordResetOTP, UserProfile, Category, Organization, Profile
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

    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        # Refresh the profile from database to get updated data
        profile.refresh_from_db()
        profile.user.refresh_from_db()
        # Return full profile data
        response_serializer = UserProfileSerializer(profile)
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
        
        serializer = ProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(organization=organization)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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