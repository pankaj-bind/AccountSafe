# api/features/auth/serializers.py
"""
Authentication Serializers

Serializers for authentication-related data.
"""

from django.contrib.auth.models import User
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer

from api.features.common.turnstile import verify_turnstile_token, get_client_ip


class CustomRegisterSerializer(RegisterSerializer):
    """Custom serializer for user registration with Turnstile verification"""
    turnstile_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    def validate(self, data):
        turnstile_token = data.pop('turnstile_token', None)
        if turnstile_token:
            request = self.context.get('request')
            remote_ip = get_client_ip(request) if request else None
            result = verify_turnstile_token(turnstile_token, remote_ip)
            if not result.get('success'):
                raise serializers.ValidationError({
                    'turnstile_token': 'Verification failed. Please try again.'
                })
        
        return super().validate(data)


class OTPRequestSerializer(serializers.Serializer):
    """Serializer for OTP request"""
    email = serializers.EmailField()
    turnstile_token = serializers.CharField(write_only=True, required=False, allow_blank=True)


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class SetNewPasswordSerializer(serializers.Serializer):
    """
    TRUE Zero-Knowledge Password Reset Serializer.
    Password is NEVER sent to server - only auth_hash (derived from password).
    """
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_auth_hash = serializers.CharField(min_length=64, max_length=64)
    new_salt = serializers.CharField(min_length=1)
