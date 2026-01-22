# api/features/urls.py
"""
Feature-based URL routing.

This aggregates all feature module URLs into a single router.
"""

from django.urls import path, include

urlpatterns = [
    # Zero-Knowledge Authentication
    path('zk/', include('api.features.auth.urls')),
    
    # Vault Management (categories, organizations, profiles)
    path('vault/', include('api.features.vault.urls')),
    
    # Security Features (health score, sessions, settings)
    path('security/', include('api.features.security.urls')),
    
    # Shared Secrets
    path('shared-secrets/', include('api.features.shared_secret.urls')),
]
