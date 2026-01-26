# api/features/urls.py
"""
Feature-based URL routing.

This aggregates all feature module URLs into a single router.
All API endpoints are organized by domain concern:
- auth: Authentication (ZK, OTP, PIN)
- vault: Vault management (categories, organizations, profiles)
- security: Security features (health score, sessions, settings, canary traps)
- shared-secrets: Secure link sharing
"""

from django.urls import path, include

urlpatterns = [
    # Zero-Knowledge Authentication & Auth Features
    path('zk/', include('api.features.auth.urls')),
    
    # Vault Management (categories, organizations, profiles, encrypted vault)
    path('vault/', include('api.features.vault.urls')),
    
    # Security Features (health score, sessions, settings, canary traps, org search)
    path('security/', include('api.features.security.urls')),
    
    # Shared Secrets (Secure Link Sharing)
    path('shared-secrets/', include('api.features.shared_secret.urls')),
]
