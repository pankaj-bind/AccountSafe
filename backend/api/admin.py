# api/admin.py

from django.contrib import admin
from .models import PasswordResetOTP, UserProfile

@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ['user', 'otp', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'first_name', 'last_name', 'company_name', 'phone_number']
    list_filter = ['gender', 'created_at']
    search_fields = ['user__username', 'user__email', 'first_name', 'last_name', 'company_name']
