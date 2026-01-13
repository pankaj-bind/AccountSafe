# api/models.py

import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from .encryption import encrypt_data, decrypt_data


def validate_file_size(file):
    """
    Validate that uploaded file size does not exceed 10MB.
    """
    max_size_mb = 10
    max_size_bytes = max_size_mb * 1024 * 1024  # 10MB in bytes
    
    if file.size > max_size_bytes:
        raise ValidationError(f'File size cannot exceed {max_size_mb}MB. Current size: {file.size / (1024 * 1024):.2f}MB')


# --- Model for Password Reset ---
class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    attempts = models.IntegerField(default=0)  # Track verification attempts
    max_attempts = models.IntegerField(default=5)  # Maximum allowed attempts
    is_used = models.BooleanField(default=False)  # Track if OTP was already used

    def is_valid(self):
        """Check if OTP is still valid (not expired, not used, attempts not exceeded)"""
        if self.is_used:
            return False
        if self.attempts >= self.max_attempts:
            return False
        return timezone.now() < self.created_at + timedelta(minutes=5)
    
    def is_expired(self):
        """Check if OTP has expired"""
        return timezone.now() >= self.created_at + timedelta(minutes=5)
    
    def increment_attempts(self):
        """Increment the attempt counter"""
        self.attempts += 1
        self.save()
    
    def mark_as_used(self):
        """Mark the OTP as used"""
        self.is_used = True
        self.save()
    
    def get_remaining_time(self):
        """Get remaining time in seconds before OTP expires"""
        expiry_time = self.created_at + timedelta(minutes=5)
        remaining = expiry_time - timezone.now()
        return max(0, int(remaining.total_seconds()))

    @staticmethod
    def generate_otp():
        """Generate a cryptographically secure 6-digit OTP"""
        import secrets
        return str(secrets.randbelow(900000) + 100000)
    
    @staticmethod
    def can_request_new_otp(user, cooldown_seconds=60):
        """Check if user can request a new OTP (rate limiting)"""
        recent_otp = PasswordResetOTP.objects.filter(user=user).order_by('-created_at').first()
        if not recent_otp:
            return True, 0
        
        time_since_last = timezone.now() - recent_otp.created_at
        if time_since_last.total_seconds() < cooldown_seconds:
            remaining = cooldown_seconds - int(time_since_last.total_seconds())
            return False, remaining
        return True, 0
    
    class Meta:
        verbose_name = "Password Reset OTP"
        verbose_name_plural = "Password Reset OTPs"


# --- User Profile Model ---
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userprofile')

    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=100, blank=True, help_text="Your company name")

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)

    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        help_text="Upload your profile picture"
    )

    # Security PIN for organization access
    security_pin = models.CharField(max_length=4, blank=True, null=True, help_text="4-digit security PIN for accessing organizations")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def set_pin(self, pin: str) -> bool:
        """Set a 4-digit security PIN"""
        if pin and len(pin) == 4 and pin.isdigit():
            self.security_pin = pin
            self.save()
            return True
        return False

    def verify_pin(self, pin: str) -> bool:
        """Verify the security PIN"""
        return self.security_pin and self.security_pin == pin

    def has_pin(self) -> bool:
        """Check if PIN is set"""
        return bool(self.security_pin)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def display_name(self):
        return self.full_name if self.full_name else self.user.username

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

# --- Category Model ---
class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['-created_at']


# --- Organization Model ---
class Organization(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='organizations')
    name = models.CharField(max_length=100)
    logo_url = models.URLField(blank=True, null=True)
    logo_image = models.ImageField(
        upload_to='organization_logos/',
        blank=True,
        null=True,
        help_text="Upload organization logo"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        ordering = ['-created_at']


# --- Profile Model ---
class Profile(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='profiles')
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Profile title or name")
    _username = models.TextField(blank=True, null=True, db_column='username')
    _password = models.TextField(blank=True, null=True, db_column='password')
    _email = models.TextField(blank=True, null=True, db_column='email')
    _recovery_codes = models.TextField(blank=True, null=True, db_column='recovery_codes')
    document = models.FileField(
        upload_to='profile_documents/',
        blank=True,
        null=True,
        validators=[validate_file_size],
        help_text="Upload document (PDF, images, etc.) - Max 10MB"
    )
    _notes = models.TextField(blank=True, null=True, db_column='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def username(self):
        """Decrypt and return username"""
        return decrypt_data(self._username) if self._username else None
    
    @username.setter
    def username(self, value):
        """Encrypt and store username"""
        self._username = encrypt_data(value) if value else None

    @property
    def password(self):
        """Decrypt and return password"""
        return decrypt_data(self._password) if self._password else None
    
    @password.setter
    def password(self, value):
        """Encrypt and store password"""
        self._password = encrypt_data(value) if value else None

    @property
    def notes(self):
        """Decrypt and return notes"""
        return decrypt_data(self._notes) if self._notes else None
    
    @notes.setter
    def notes(self, value):
        """Encrypt and store notes"""
        self._notes = encrypt_data(value) if value else None

    @property
    def email(self):
        """Decrypt and return email"""
        return decrypt_data(self._email) if self._email else None
    
    @email.setter
    def email(self, value):
        """Encrypt and store email"""
        self._email = encrypt_data(value) if value else None

    @property
    def recovery_codes(self):
        """Decrypt and return recovery codes"""
        return decrypt_data(self._recovery_codes) if self._recovery_codes else None
    
    @recovery_codes.setter
    def recovery_codes(self, value):
        """Encrypt and store recovery codes"""
        self._recovery_codes = encrypt_data(value) if value else None

    def __str__(self):
        return f"{self.title or 'Untitled'} - {self.organization.name}"

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"
        ordering = ['-created_at']


# --- Login Record Model ---
class LoginRecord(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_records', null=True, blank=True)
    username_attempted = models.CharField(max_length=150)
    password_attempted = models.CharField(max_length=255, blank=True, null=True)  # Only stored for failed attempts
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    isp = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.username_attempted} - {self.status} at {self.timestamp}"
    
    class Meta:
        verbose_name = "Login Record"
        verbose_name_plural = "Login Records"
        ordering = ['-timestamp']