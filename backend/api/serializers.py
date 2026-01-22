# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import UserProfile, Category, Organization, Profile, LoginRecord, UserSession
from .turnstile import verify_turnstile_token, get_client_ip


class CustomRegisterSerializer(RegisterSerializer):
    """Custom serializer for user registration with Turnstile verification"""
    turnstile_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    def validate(self, data):
        # Verify Turnstile token if provided
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
    email = serializers.EmailField()
    turnstile_token = serializers.CharField(write_only=True, required=False, allow_blank=True)


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class SetNewPasswordSerializer(serializers.Serializer):
    """
    TRUE Zero-Knowledge Password Reset Serializer.
    
    Password is NEVER sent to server - only auth_hash (derived from password).
    """
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_auth_hash = serializers.CharField(min_length=64, max_length=64)  # SHA-256 hex = 64 chars
    new_salt = serializers.CharField(min_length=1)  # Base64-encoded salt


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'company_name', 'gender',
            'profile_picture', 'profile_picture_url', 'display_name',
            'encryption_salt', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_profile_picture_url(self, obj):
        """Return the full URL of the profile picture if it exists"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_display_name(self, obj):
        """Return the display name (full name or username)"""
        return obj.display_name


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False, max_length=150)
    encryption_salt = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'phone_number',
            'company_name', 'gender', 'profile_picture', 'email', 'username', 'encryption_salt'
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
        fields = ['id', 'category', 'name', 'logo_url', 'website_link', 'logo_image', 'profile_count', 'created_at', 'updated_at']
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


# --- Profile Serializer (Client-Side Encrypted) ---
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
        """Validate document file size (max 10MB)"""
        if value:
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"File size cannot exceed 10MB. Current size: {value.size / (1024 * 1024):.2f}MB"
                )
        return value
    
    def create(self, validated_data):
        """Store client-encrypted data as-is"""
        profile = Profile.objects.create(**validated_data)
        return profile
    
    def update(self, instance, validated_data):
        """Update profile with client-encrypted data"""
        # Update all fields
        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        
        instance.save()
        return instance
    
    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.document.url)
        return None


# --- Login Record Serializer ---
class LoginRecordSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = LoginRecord
        # SECURITY: password_attempted field REMOVED - zero-knowledge architecture
        fields = [
            'id', 'username_attempted', 'status', 'is_duress',
            'ip_address', 'country', 'isp', 'latitude', 'longitude',
            'date', 'time', 'location', 'user_agent', 'timestamp', 'timezone'
        ]
        read_only_fields = fields
    
    def get_local_datetime(self, obj):
        """Convert UTC timestamp to local timezone"""
        import pytz
        from django.utils import timezone as dj_timezone
        
        # Get the timestamp (in UTC)
        utc_time = obj.timestamp
        if dj_timezone.is_naive(utc_time):
            utc_time = dj_timezone.make_aware(utc_time, pytz.UTC)
        
        # Convert to local timezone if available
        if obj.timezone:
            try:
                local_tz = pytz.timezone(obj.timezone)
                local_time = utc_time.astimezone(local_tz)
                return local_time
            except:
                pass
        
        return utc_time
    
    def get_date(self, obj):
        """Return formatted date in local timezone"""
        local_time = self.get_local_datetime(obj)
        return local_time.strftime('%Y-%m-%d')
    
    def get_time(self, obj):
        """Return formatted time in local timezone with timezone abbreviation"""
        local_time = self.get_local_datetime(obj)
        # Get timezone abbreviation from the timezone string
        if obj.timezone:
            # Extract common timezone abbreviations
            tz_map = {
                'Asia/Kolkata': 'IST',
                'Asia/Calcutta': 'IST',
                'America/New_York': 'EST',
                'America/Chicago': 'CST',
                'America/Denver': 'MST',
                'America/Los_Angeles': 'PST',
                'Europe/London': 'GMT',
                'Europe/Paris': 'CET',
                'Australia/Sydney': 'AEDT',
            }
            tz_abbr = tz_map.get(obj.timezone, obj.timezone.split('/')[-1][:3].upper())
        else:
            tz_abbr = 'UTC'
        return f"{local_time.strftime('%H:%M:%S')} ({tz_abbr})"
    
    def get_location(self, obj):
        """Return location as latitude,longitude string"""
        if obj.latitude and obj.longitude:
            return f"{obj.latitude},{obj.longitude}"
        return None
    
    def to_representation(self, instance):
        """Hide is_duress in duress mode session"""
        data = super().to_representation(instance)
        
        # SECURITY: password_attempted field removed - never store/return passwords

        # Check if current request is from a duress session
        request = self.context.get('request')
        if request:
            from api.views import is_duress_session
            if is_duress_session(request):
                # In duress mode: hide the duress flag (show all as 'success')
                data['is_duress'] = False
                if data['status'] == 'duress':
                    data['status'] = 'success'
        
        return data


# --- User Session Serializer ---
class UserSessionSerializer(serializers.ModelSerializer):
    is_current = serializers.SerializerMethodField()
    last_active_display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'device_type', 'browser', 'os', 'location', 'country_code',
            'ip_address', 'created_at', 'last_active', 'last_active_display',
            'is_current', 'is_active'
        ]
        read_only_fields = fields
    
    def get_is_current(self, obj):
        """Check if this session is the current one"""
        request = self.context.get('request')
        if request and hasattr(request, 'auth'):
            return obj.token.key == request.auth.key
        return False
    
    def get_last_active_display(self, obj):
        """Return human-readable last active time"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.last_active
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            return obj.last_active.strftime('%b %d, %Y')