# api/features/vault/urls.py
"""
Vault URL Configuration

All vault-related endpoints (categories, organizations, profiles, encrypted vault).
"""

from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    OrganizationListCreateView,
    OrganizationDetailView,
    ProfileListCreateView,
    ProfileDetailView,
    VaultView,
    VaultExportView,
    VaultImportView,
    # Trash/Recycle Bin views
    TrashListView,
    ProfileRestoreView,
    ProfileShredView,
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Organizations
    path('categories/<int:category_id>/organizations/', OrganizationListCreateView.as_view(), name='organization-list-create'),
    path('organizations/<int:organization_id>/', OrganizationDetailView.as_view(), name='organization-detail'),
    
    # Profiles
    path('organizations/<int:organization_id>/profiles/', ProfileListCreateView.as_view(), name='profile-list-create'),
    path('profiles/<int:profile_id>/', ProfileDetailView.as_view(), name='profile-detail'),
    
    # Trash / Recycle Bin
    path('profiles/trash/', TrashListView.as_view(), name='profile-trash-list'),
    path('profiles/<int:profile_id>/restore/', ProfileRestoreView.as_view(), name='profile-restore'),
    path('profiles/<int:profile_id>/shred/', ProfileShredView.as_view(), name='profile-shred'),
    
    # Zero-Knowledge Encrypted Vault
    path('vault/', VaultView.as_view(), name='vault'),
    path('vault/export/', VaultExportView.as_view(), name='vault-export'),
    path('vault/import/', VaultImportView.as_view(), name='vault-import'),
]
