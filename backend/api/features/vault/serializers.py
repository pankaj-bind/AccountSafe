# api/features/vault/serializers.py
"""
Vault Serializers

Serializers for vault-related data (categories, organizations, profiles).
"""

from rest_framework import serializers
from api.models import Category, Organization, Profile


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Profile with CLIENT-SIDE ENCRYPTION.
    
    The server stores encrypted ciphertext and IV pairs exactly as received
    from the browser. No server-side decryption occurs.
    """
    document_url = serializers.SerializerMethodField()
    
    # Client-encrypted fields with IVs
    username_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    username_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    
    password_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    password_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    
    email_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    email_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    
    notes_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    notes_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    
    recovery_codes_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    recovery_codes_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'organization', 'title',
            'username_encrypted', 'username_iv',
            'password_encrypted', 'password_iv',
            'email_encrypted', 'email_iv',
            'notes_encrypted', 'notes_iv',
            'recovery_codes_encrypted', 'recovery_codes_iv',
            'document', 'document_url',
            'is_breached', 'last_breach_check_date', 'password_strength', 
            'password_hash', 'last_password_update',
            'is_pinned',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['organization', 'created_at', 'updated_at']
    
    def validate_document(self, value):
        if value:
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"File size cannot exceed 10MB. Current size: {value.size / (1024 * 1024):.2f}MB"
                )
        return value
    
    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.document.url)
        return None


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization"""
    profile_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'category', 'name', 'logo_url', 'website_link', 'logo_image', 'profile_count', 'created_at', 'updated_at']
        read_only_fields = ['category', 'created_at', 'updated_at']
    
    def get_profile_count(self, obj):
        return obj.profiles.count()


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category with nested organizations"""
    organizations = OrganizationSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'organizations', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Category"""
    class Meta:
        model = Category
        fields = ['name', 'description']
