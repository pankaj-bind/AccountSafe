# api/admin.py

from django.contrib import admin
from .models import PasswordResetOTP, UserProfile, Category, Organization, Profile, CuratedOrganization

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

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'user', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description', 'user__username']
    ordering = ['-created_at']

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'logo_url', 'created_at']
    list_filter = ['created_at', 'updated_at', 'category']
    search_fields = ['name', 'category__name']
    ordering = ['-created_at']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'organization', 'encrypted_status', 'created_at']
    list_filter = ['created_at', 'updated_at', 'organization']
    search_fields = ['title', 'organization__name']
    ordering = ['-created_at']
    readonly_fields = ['encrypted_status']
    
    def encrypted_status(self, obj):
        """Show that data is encrypted"""
        status = []
        if obj._username:
            status.append('Username: [ENCRYPTED]')
        if obj._password:
            status.append('Password: [ENCRYPTED]')
        if obj._notes:
            status.append('Notes: [ENCRYPTED]')
        return ' | '.join(status) if status else 'No encrypted data'
    encrypted_status.short_description = 'Encrypted Data'

@admin.register(CuratedOrganization)
class CuratedOrganizationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'domain', 'logo_type', 'is_verified', 'priority', 'created_at']
    list_filter = ['logo_type', 'is_verified', 'created_at', 'updated_at']
    search_fields = ['name', 'domain']
    ordering = ['-priority', 'name']
    list_editable = ['priority', 'is_verified']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'domain', 'website_link')
        }),
        ('Logo Configuration', {
            'fields': ('logo_type', 'logo_url', 'logo_image', 'logo_svg'),
            'description': 'Choose how to provide the logo: External URL, Upload from system, or paste SVG code. Clear unwanted fields.'
        }),
        ('Settings', {
            'fields': ('is_verified', 'priority')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make logo fields conditionally readonly based on logo_type"""
        return []
    
    class Media:
        css = {
            'all': ('admin/css/curated_org_admin.css',)
        }
        js = ('admin/js/curated_org_admin.js',)

