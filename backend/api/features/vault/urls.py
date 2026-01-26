# api/features/vault/urls.py
"""
Vault URL Configuration

All vault-related endpoints:
- Categories (CRUD)
- Organizations (CRUD)
- Profiles (CRUD)
- Trash/Recycle Bin
- Zero-Knowledge Encrypted Vault
- Smart Import
"""

from django.urls import path
from .views import (
    # Categories
    CategoryListCreateView,
    CategoryDetailView,
    # Organizations
    OrganizationListCreateView,
    OrganizationDetailView,
    # Profiles
    ProfileListCreateView,
    ProfileDetailView,
    # Trash/Recycle Bin
    TrashListView,
    ProfileRestoreView,
    ProfileShredView,
    # Smart Import
    SmartImportView,
)
from .zk_views import (
    VaultView,
    VaultSaltView,
    VaultAuthHashView,
    VaultExportView,
    VaultImportView,
)

urlpatterns = [
    # ═══════════════════════════════════════════════════════════════════════════
    # CATEGORIES
    # ═══════════════════════════════════════════════════════════════════════════
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ORGANIZATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    path('categories/<int:category_id>/organizations/', OrganizationListCreateView.as_view(), name='organization-list-create'),
    path('organizations/<int:organization_id>/', OrganizationDetailView.as_view(), name='organization-detail'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PROFILES
    # ═══════════════════════════════════════════════════════════════════════════
    path('organizations/<int:organization_id>/profiles/', ProfileListCreateView.as_view(), name='profile-list-create'),
    path('profiles/<int:profile_id>/', ProfileDetailView.as_view(), name='profile-detail'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TRASH / RECYCLE BIN
    # ═══════════════════════════════════════════════════════════════════════════
    path('profiles/trash/', TrashListView.as_view(), name='profile-trash-list'),
    path('profiles/<int:profile_id>/restore/', ProfileRestoreView.as_view(), name='profile-restore'),
    path('profiles/<int:profile_id>/shred/', ProfileShredView.as_view(), name='profile-shred'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ZERO-KNOWLEDGE ENCRYPTED VAULT
    # Server stores encrypted blobs - CANNOT decrypt them
    # ═══════════════════════════════════════════════════════════════════════════
    path('', VaultView.as_view(), name='vault'),
    path('salt/', VaultSaltView.as_view(), name='vault-salt'),
    path('auth-hash/', VaultAuthHashView.as_view(), name='vault-auth-hash'),
    path('export/', VaultExportView.as_view(), name='vault-export'),
    path('import/', VaultImportView.as_view(), name='vault-import'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SMART IMPORT (Zero-Knowledge CSV Import)
    # ═══════════════════════════════════════════════════════════════════════════
    path('smart-import/', SmartImportView.as_view(), name='vault-smart-import'),
]
