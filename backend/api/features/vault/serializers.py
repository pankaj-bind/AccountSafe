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


# ═══════════════════════════════════════════════════════════════════════════════
# SMART IMPORT SERIALIZERS
# ═══════════════════════════════════════════════════════════════════════════════

class SmartImportProfileSerializer(serializers.Serializer):
    """
    Serializer for a single profile in smart import.
    
    ZERO-KNOWLEDGE: Server stores encrypted ciphertext+IV pairs exactly as received.
    No server-side decryption occurs.
    """
    title = serializers.CharField(max_length=255)
    
    # Client-encrypted fields with IVs
    username_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    username_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    password_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    email_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    notes_encrypted = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes_iv = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class SmartImportOrganizationSerializer(serializers.Serializer):
    """
    Serializer for an organization in smart import.
    Includes nested profiles for bulk creation.
    """
    name = serializers.CharField(max_length=255)
    # Use CharField instead of URLField to allow empty strings
    logo_url = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=2048)
    website_link = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=2048)
    profiles = SmartImportProfileSerializer(many=True)


class SmartImportSerializer(serializers.Serializer):
    """
    Main serializer for smart import payload.
    
    Structure:
    {
        "category_name": "Microsoft Edge Passwords",
        "organizations": [
            {
                "name": "Google",
                "logo_url": "https://...",
                "website_link": "https://google.com",
                "profiles": [
                    {
                        "title": "Personal Account",
                        "username_encrypted": "...",
                        "username_iv": "...",
                        "password_encrypted": "...",
                        "password_iv": "...",
                        ...
                    }
                ]
            }
        ]
    }
    """
    category_name = serializers.CharField(max_length=255)
    organizations = SmartImportOrganizationSerializer(many=True)
    
    def validate_category_name(self, value):
        """Validate category name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Category name cannot be empty.")
        return value.strip()
    
    def validate_organizations(self, value):
        """Validate organizations list."""
        if not value:
            raise serializers.ValidationError("At least one organization is required.")
        if len(value) > 500:
            raise serializers.ValidationError("Maximum 500 organizations per import.")
        return value

