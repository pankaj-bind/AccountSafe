# api/features/security/serializers.py
"""
Security Serializers

Serializers for security-related data (login records, sessions).
"""

import pytz
from rest_framework import serializers
from django.utils import timezone as dj_timezone

from api.models import LoginRecord, UserSession


class LoginRecordSerializer(serializers.ModelSerializer):
    """Serializer for login records."""
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = LoginRecord
        fields = [
            'id', 'username_attempted', 'status', 'is_duress',
            'ip_address', 'country', 'isp', 'latitude', 'longitude',
            'date', 'time', 'location', 'user_agent', 'timestamp', 'timezone'
        ]
        read_only_fields = fields
    
    def get_local_datetime(self, obj):
        """Convert UTC timestamp to local timezone."""
        utc_time = obj.timestamp
        if dj_timezone.is_naive(utc_time):
            utc_time = dj_timezone.make_aware(utc_time, pytz.UTC)
        
        if obj.timezone:
            try:
                local_tz = pytz.timezone(obj.timezone)
                local_time = utc_time.astimezone(local_tz)
                return local_time
            except:
                pass
        
        return utc_time
    
    def get_date(self, obj):
        """Return formatted date in local timezone."""
        local_time = self.get_local_datetime(obj)
        return local_time.strftime('%Y-%m-%d')
    
    def get_time(self, obj):
        """Return formatted time in local timezone with timezone abbreviation."""
        local_time = self.get_local_datetime(obj)
        if obj.timezone:
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
        """Return location as latitude,longitude string."""
        if obj.latitude and obj.longitude:
            return f"{obj.latitude},{obj.longitude}"
        return None
    
    def to_representation(self, instance):
        """Hide is_duress in duress mode session."""
        data = super().to_representation(instance)
        
        request = self.context.get('request')
        if request:
            from api.features.vault.services import VaultService
            if VaultService.is_duress_session(request):
                data['is_duress'] = False
                if data['status'] == 'duress':
                    data['status'] = 'success'
        
        return data


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions."""
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
        """Check if this session is the current one."""
        request = self.context.get('request')
        if request and hasattr(request, 'auth'):
            return obj.token.key == request.auth.key
        return False
    
    def get_last_active_display(self, obj):
        """Return human-readable last active time."""
        from datetime import timedelta
        
        now = dj_timezone.now()
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
