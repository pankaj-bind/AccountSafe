# core/urls.py
"""
AccountSafe URL Configuration

This is the master URL router that delegates to feature modules.
All API endpoints are organized under /api/ with feature-based routing.

Architecture:
    /api/zk/*           -> Auth features (register, login, password reset, PIN)
    /api/vault/*        -> Vault features (categories, organizations, profiles)
    /api/security/*     -> Security features (health, sessions, canary traps)
    /api/shared-secrets/* -> Shared secret features
    /api/profile/*      -> User profile management
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

# Import user profile views (minimal views kept in api.views)
from api.views import (
    get_user_profile,
    update_user_profile,
    root_route,
)

# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE-BASED IMPORTS
# All views are now organized by feature module
# ═══════════════════════════════════════════════════════════════════════════════

# Authentication Features
from api.features.auth.views import (
    CheckUsernameView,
    CustomLoginView,
    RequestPasswordResetOTPView,
    VerifyPasswordResetOTPView,
    SetNewPasswordView,
    ChangePasswordView,
    DeleteAccountView,
    SetupPinView,
    VerifyPinView,
    PinStatusView,
    ClearPinView,
    ResetPinView,
)

# Zero-Knowledge Authentication
from api.features.auth.zero_knowledge import (
    ZeroKnowledgeRegisterView,
    ZeroKnowledgeLoginView,
    ZeroKnowledgeGetSaltView,
    ZeroKnowledgeChangePasswordView,
    ZeroKnowledgeDeleteAccountView,
    ZeroKnowledgeSetDuressView,
    ZeroKnowledgeClearDuressView,
    ZeroKnowledgeVerifyView,
    ZeroKnowledgeSwitchModeView,
)

# Vault Features
from api.features.vault.views import (
    CategoryListCreateView,
    CategoryDetailView,
    OrganizationListCreateView,
    OrganizationDetailView,
    ProfileListCreateView,
    ProfileDetailView,
    TrashListView,
    ProfileRestoreView,
    ProfileShredView,
    SmartImportView,
)

# Zero-Knowledge Vault
from api.features.vault.zk_views import (
    VaultView,
    VaultSaltView,
    VaultAuthHashView,
    VaultExportView,
    VaultImportView,
)

# Security Features
from api.features.security.views import (
    SecurityHealthScoreView,
    UpdatePasswordStrengthView,
    UpdateBreachStatusView,
    UpdatePasswordHashView,
    BatchUpdateSecurityMetricsView,
    SecuritySettingsView,
    ActiveSessionsView,
    ValidateSessionView,
    RevokeSessionView,
    RevokeAllSessionsView,
    CanaryTrapListCreateView,
    CanaryTrapDetailView,
    CanaryTrapTriggerView,
    dashboard_statistics,
    login_records,
    search_organizations,
    lookup_organization_by_url,
)

# Shared Secrets
from api.features.shared_secret.legacy_views import (
    create_shared_secret,
    view_shared_secret,
    list_user_shared_secrets,
    revoke_shared_secret,
)

# Health Check (Observability)
from api.features.common.health import health_check


urlpatterns = [
    # ═══════════════════════════════════════════════════════════════════════════
    # ADMIN
    # ═══════════════════════════════════════════════════════════════════════════
    path('admin/', admin.site.urls),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # API ROOT
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/', root_route, name='api-root'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HEALTH CHECK (Observability - no auth required)
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/health/', health_check, name='health-check'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FEATURE-BASED ROUTING (New Architecture)
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/features/', include('api.features.urls')),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUTHENTICATION ENDPOINTS
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('api/auth/login/', CustomLoginView.as_view(), name='custom-login'),
    
    # Dashboard and login records
    path('api/dashboard/statistics/', dashboard_statistics, name='dashboard-statistics'),
    path('api/login-records/', login_records, name='login-records'),
    
    # Password Reset
    path('api/password-reset/request-otp/', RequestPasswordResetOTPView.as_view(), name='request-otp'),
    path('api/password-reset/verify-otp/', VerifyPasswordResetOTPView.as_view(), name='verify-otp'),
    path('api/password-reset/set-new-password/', SetNewPasswordView.as_view(), name='set-new-password'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/delete-account/', DeleteAccountView.as_view(), name='delete-account'),

    # Profile endpoints
    path('api/profile/', get_user_profile, name='get-profile'),
    path('api/profile/update/', update_user_profile, name='update-profile'),

    # Category endpoints
    path('api/categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('api/categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    # Organization endpoints
    path('api/categories/<int:category_id>/organizations/', OrganizationListCreateView.as_view(), name='organization-list-create'),
    path('api/organizations/<int:organization_id>/', OrganizationDetailView.as_view(), name='organization-detail'),

    # Profile endpoints
    path('api/organizations/<int:organization_id>/profiles/', ProfileListCreateView.as_view(), name='profile-list-create'),
    path('api/profiles/<int:profile_id>/', ProfileDetailView.as_view(), name='profile-detail'),

    # Trash / Recycle Bin endpoints
    path('api/profiles/trash/', TrashListView.as_view(), name='profile-trash-list'),
    path('api/profiles/<int:profile_id>/restore/', ProfileRestoreView.as_view(), name='profile-restore'),
    path('api/profiles/<int:profile_id>/shred/', ProfileShredView.as_view(), name='profile-shred'),

    # Security PIN endpoints
    path('api/pin/setup/', SetupPinView.as_view(), name='setup-pin'),
    path('api/pin/verify/', VerifyPinView.as_view(), name='verify-pin'),
    path('api/pin/status/', PinStatusView.as_view(), name='pin-status'),
    path('api/pin/clear/', ClearPinView.as_view(), name='clear-pin'),
    path('api/pin/reset/', ResetPinView.as_view(), name='reset-pin'),

    # Security Health Score endpoints
    path('api/security/health-score/', SecurityHealthScoreView.as_view(), name='security-health-score'),
    path('api/security/profiles/<int:profile_id>/strength/', UpdatePasswordStrengthView.as_view(), name='update-password-strength'),
    path('api/security/profiles/<int:profile_id>/breach/', UpdateBreachStatusView.as_view(), name='update-breach-status'),
    path('api/security/profiles/<int:profile_id>/hash/', UpdatePasswordHashView.as_view(), name='update-password-hash'),
    path('api/security/batch-update/', BatchUpdateSecurityMetricsView.as_view(), name='batch-update-security-metrics'),
    
    # Panic & Duress Security Settings
    path('api/security/settings/', SecuritySettingsView.as_view(), name='security-settings'),
    
    # Canary Traps (Honeytokens) - Breach Detection
    path('api/security/traps/', CanaryTrapListCreateView.as_view(), name='canary-trap-list'),
    path('api/security/traps/<int:trap_id>/', CanaryTrapDetailView.as_view(), name='canary-trap-detail'),
    # Tripwire Endpoint (PUBLICLY ACCESSIBLE - No Auth Required for attackers to trigger)
    path('api/security/trap/<uuid:token>/', CanaryTrapTriggerView.as_view(), name='canary-trap-trigger'),

    # Session Management (Multi-Device)
    path('api/sessions/', ActiveSessionsView.as_view(), name='active-sessions'),
    path('api/sessions/validate/', ValidateSessionView.as_view(), name='validate-session'),
    path('api/sessions/<int:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
    path('api/sessions/revoke-all/', RevokeAllSessionsView.as_view(), name='revoke-all-sessions'),

    # Hybrid Organization Search (Local + Clearbit API)
    path('api/organizations/search/', search_organizations, name='search-organizations'),
    path('api/organizations/lookup/', lookup_organization_by_url, name='lookup-organization-by-url'),

    # Shared Secret endpoints (Secure Link Sharing)
    path('api/shared-secrets/create/', create_shared_secret, name='create-shared-secret'),
    path('api/shared-secrets/<uuid:share_id>/', view_shared_secret, name='view-shared-secret'),
    path('api/shared-secrets/', list_user_shared_secrets, name='list-shared-secrets'),
    path('api/shared-secrets/<uuid:share_id>/revoke/', revoke_shared_secret, name='revoke-shared-secret'),

    # ═══════════════════════════════════════════════════════════════════════════
    # ZERO-KNOWLEDGE VAULT ENDPOINTS
    # Server stores encrypted blobs - CANNOT decrypt them
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/vault/', VaultView.as_view(), name='vault'),
    path('api/vault/salt/', VaultSaltView.as_view(), name='vault-salt'),
    path('api/vault/auth-hash/', VaultAuthHashView.as_view(), name='vault-auth-hash'),
    path('api/vault/export/', VaultExportView.as_view(), name='vault-export'),
    path('api/vault/import/', VaultImportView.as_view(), name='vault-import'),
    path('api/vault/smart-import/', SmartImportView.as_view(), name='vault-smart-import'),

    # ═══════════════════════════════════════════════════════════════════════════
    # TRUE ZERO-KNOWLEDGE AUTHENTICATION
    # Password is NEVER sent to server - only auth_hash (derived from password)
    # ═══════════════════════════════════════════════════════════════════════════
    path('api/zk/register/', ZeroKnowledgeRegisterView.as_view(), name='zk-register'),
    path('api/zk/login/', ZeroKnowledgeLoginView.as_view(), name='zk-login'),
    path('api/zk/salt/', ZeroKnowledgeGetSaltView.as_view(), name='zk-salt'),
    # REMOVED: path('api/zk/migrate/', ...) - Migration endpoint DISABLED
    # Legacy users must use password reset via email OTP to set up ZK auth
    # This ensures password is NEVER sent to server, even for migration
    path('api/zk/change-password/', ZeroKnowledgeChangePasswordView.as_view(), name='zk-change-password'),
    path('api/zk/delete-account/', ZeroKnowledgeDeleteAccountView.as_view(), name='zk-delete-account'),
    path('api/zk/set-duress/', ZeroKnowledgeSetDuressView.as_view(), name='zk-set-duress'),
    path('api/zk/clear-duress/', ZeroKnowledgeClearDuressView.as_view(), name='zk-clear-duress'),
    path('api/zk/verify/', ZeroKnowledgeVerifyView.as_view(), name='zk-verify'),
    path('api/zk/switch-mode/', ZeroKnowledgeSwitchModeView.as_view(), name='zk-switch-mode'),

    # ════════════════════════════════════════════════════════════════════════════
    # SECURITY: dj-rest-auth endpoints DISABLED for zero-knowledge architecture
    # All authentication MUST go through /api/zk/* endpoints which use auth_hash
    # instead of password to maintain true zero-knowledge encryption.
    # 
    # The following routes have been removed:
    # - /api/auth/login/ → Use /api/zk/login/ (auth_hash only)
    # - /api/auth/registration/ → Use /api/zk/register/ (auth_hash only)
    # - /api/auth/password/change/ → Use /api/zk/change-password/ (auth_hash only)
    #
    # Only logout endpoint is kept for session cleanup:
    # path('api/auth/', include('dj_rest_auth.urls')),  # DISABLED
    # path('api/auth/registration/', include('dj_rest_auth.registration.urls')),  # DISABLED
    # ════════════════════════════════════════════════════════════════════════════
]

if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
