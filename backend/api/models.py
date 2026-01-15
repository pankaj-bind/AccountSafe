# api/models.py

import random
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


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
    
    # Encryption salt for client-side encryption
    encryption_salt = models.CharField(max_length=255, blank=True, null=True, help_text="Salt for deriving client-side encryption key")

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


# --- Profile Model (Client-Side Encrypted) ---
class Profile(models.Model):
    """
    Profile stores user credentials with CLIENT-SIDE ENCRYPTION.
    
    Encryption is performed in the browser using AES-256-GCM before transmission.
    The server stores encrypted ciphertext and never sees plaintext credentials.
    This implements a zero-knowledge architecture.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='profiles')
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Profile title or name")
    
    # Client-encrypted fields (stored as-is from browser encryption)
    username_encrypted = models.TextField(blank=True, null=True, help_text="AES-256-GCM encrypted username")
    username_iv = models.CharField(max_length=100, blank=True, null=True, help_text="Initialization vector for username")
    
    password_encrypted = models.TextField(blank=True, null=True, help_text="AES-256-GCM encrypted password")
    password_iv = models.CharField(max_length=100, blank=True, null=True, help_text="Initialization vector for password")
    
    email_encrypted = models.TextField(blank=True, null=True, help_text="AES-256-GCM encrypted email")
    email_iv = models.CharField(max_length=100, blank=True, null=True, help_text="Initialization vector for email")
    
    notes_encrypted = models.TextField(blank=True, null=True, help_text="AES-256-GCM encrypted notes")
    notes_iv = models.CharField(max_length=100, blank=True, null=True, help_text="Initialization vector for notes")
    
    recovery_codes_encrypted = models.TextField(blank=True, null=True, help_text="AES-256-GCM encrypted recovery codes")
    recovery_codes_iv = models.CharField(max_length=100, blank=True, null=True, help_text="Initialization vector for recovery codes")
    
    document = models.FileField(
        upload_to='profile_documents/',
        blank=True,
        null=True,
        validators=[validate_file_size],
        help_text="Upload document (PDF, images, etc.) - Max 10MB"
    )
    
    # Security health tracking fields
    is_breached = models.BooleanField(default=False, help_text="Whether this password has been found in known data breaches")
    last_breach_check_date = models.DateTimeField(null=True, blank=True, help_text="Last time this password was checked against HIBP")
    password_strength = models.IntegerField(default=0, help_text="zxcvbn strength score (0-4)")
    password_hash = models.CharField(max_length=64, blank=True, null=True, help_text="SHA-256 hash of password for uniqueness checking (not for authentication)")
    last_password_update = models.DateTimeField(null=True, blank=True, help_text="Last time the password was changed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    timezone = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'Asia/Kolkata'
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.username_attempted} - {self.status} at {self.timestamp}"
    
    class Meta:
        verbose_name = "Login Record"
        verbose_name_plural = "Login Records"
        ordering = ['-timestamp']


# --- Model for Secure Link Sharing (Burn-on-Read) ---
class SharedSecret(models.Model):
    """
    Stores encrypted credential data for one-time secure sharing.
    Implements burn-on-read: automatically deleted after first view.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='shared_secrets')
    encrypted_blob = models.TextField()  # Fernet-encrypted JSON of credential data
    salt = models.CharField(max_length=64)  # Unique salt for this secret (hex-encoded)
    expires_at = models.DateTimeField()  # Expiry time (default: 24 hours)
    view_count = models.IntegerField(default=0)  # Track views (should only be 0 or 1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"SharedSecret {self.id} - expires {self.expires_at}"
    
    def is_expired(self):
        """Check if the secret has expired"""
        return timezone.now() >= self.expires_at
    
    class Meta:
        verbose_name = "Shared Secret"
        verbose_name_plural = "Shared Secrets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['expires_at']),
            models.Index(fields=['profile', 'created_at']),
        ]