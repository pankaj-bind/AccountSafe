# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import UserProfile


class CustomRegisterSerializer(RegisterSerializer):
    """Custom serializer for user registration"""
    pass


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class SetNewPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(min_length=8, write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'phone_number', 'company_name', 'gender',
            'profile_picture', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False, max_length=150)

    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'phone_number',
            'company_name', 'gender', 'profile_picture', 'email', 'username'
        ]

    def validate_username(self, value):
        """Check if username is already taken by another user"""
        if value:
            user = self.instance.user
            if User.objects.filter(username=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        """Check if email is already taken by another user"""
        if value:
            user = self.instance.user
            if User.objects.filter(email=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("This email is already taken.")
        return value

    def update(self, instance, validated_data):
        # Handle User model updates (username and email)
        username = validated_data.pop('username', None)
        email = validated_data.pop('email', None)
        
        if username:
            instance.user.username = username
        if email:
            instance.user.email = email
        
        if username or email:
            instance.user.save()
        
        # Update UserProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
