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

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=5)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))


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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

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