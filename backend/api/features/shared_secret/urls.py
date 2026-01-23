# api/features/shared_secret/urls.py
"""
Shared Secret URL Configuration

All shared secret endpoints.
"""

from django.urls import path
from .views import (
    create_shared_secret,
    get_shared_secret_metadata,
    view_shared_secret,
    list_user_secrets,
    revoke_shared_secret,
)

urlpatterns = [
    # Create shared secret
    path('create/', create_shared_secret, name='create-shared-secret'),
    
    # List user's shared secrets
    path('list/', list_user_secrets, name='list-shared-secrets'),
    
    # Get metadata (check if passphrase required)
    path('<str:link_id>/metadata/', get_shared_secret_metadata, name='shared-secret-metadata'),
    
    # View shared secret
    path('<str:link_id>/view/', view_shared_secret, name='view-shared-secret'),
    
    # Revoke shared secret
    path('<str:link_id>/revoke/', revoke_shared_secret, name='revoke-shared-secret'),
]
