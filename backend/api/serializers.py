# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import UserProfile, Category, Organization, Profile


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

# --- Organization Serializer ---
class OrganizationSerializer(serializers.ModelSerializer):
    profile_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'category', 'name', 'logo_url', 'logo_image', 'profile_count', 'created_at', 'updated_at']
        read_only_fields = ['category', 'created_at', 'updated_at']
    
    def get_profile_count(self, obj):
        return obj.profiles.count()


# --- Category Serializer ---
class CategorySerializer(serializers.ModelSerializer):
    organizations = OrganizationSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'organizations', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'description']


# --- Profile Serializer ---
class ProfileSerializer(serializers.ModelSerializer):
    document_url = serializers.SerializerMethodField()
    username = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'organization', 'title', 'username', 'password', 'document', 'document_url', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['organization', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        notes = validated_data.pop('notes', None)
        
        profile = Profile(**validated_data)
        if username:
            profile.username = username
        if password:
            profile.password = password
        if notes:
            profile.notes = notes
        profile.save()
        return profile
    
    def update(self, instance, validated_data):
        # Update regular fields
        instance.title = validated_data.get('title', instance.title)
        
        # Update encrypted fields using properties
        if 'username' in validated_data:
            instance.username = validated_data['username']
        if 'password' in validated_data:
            instance.password = validated_data['password']
        if 'notes' in validated_data:
            instance.notes = validated_data['notes']
        if 'document' in validated_data:
            instance.document = validated_data['document']
        
        instance.save()
        return instance
    
    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.document.url)
        return None