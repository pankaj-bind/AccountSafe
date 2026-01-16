# core/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

from api.views import (
    CheckUsernameView,
    CustomLoginView,
    RequestPasswordResetOTPView,
    VerifyPasswordResetOTPView,
    SetNewPasswordView,
    ChangePasswordView,
    DeleteAccountView,
    get_user_profile,
    update_user_profile,
    CategoryListCreateView,
    CategoryDetailView,
    OrganizationListCreateView,
    OrganizationDetailView,
    ProfileListCreateView,
    ProfileDetailView,
    SetupPinView,
    VerifyPinView,
    PinStatusView,
    ResetPinView,
    dashboard_statistics,
    login_records,
    SecurityHealthScoreView,
    UpdatePasswordStrengthView,
    UpdateBreachStatusView,
    UpdatePasswordHashView,
    BatchUpdateSecurityMetricsView,
    SecuritySettingsView,
)

# Shared secret views
from api.shared_secret_views import (
    create_shared_secret,
    view_shared_secret,
    list_user_shared_secrets,
    revoke_shared_secret,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/check-username/', CheckUsernameView.as_view(), name='check-username'),
    
    # Custom login with tracking
    path('api/auth/login/', CustomLoginView.as_view(), name='custom-login'),
    
    # Dashboard and login records
    path('api/dashboard/statistics/', dashboard_statistics, name='dashboard-statistics'),
    path('api/login-records/', login_records, name='login-records'),
    
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

    # Security PIN endpoints
    path('api/pin/setup/', SetupPinView.as_view(), name='setup-pin'),
    path('api/pin/verify/', VerifyPinView.as_view(), name='verify-pin'),
    path('api/pin/status/', PinStatusView.as_view(), name='pin-status'),
    path('api/pin/reset/', ResetPinView.as_view(), name='reset-pin'),

    # Security Health Score endpoints
    path('api/security/health-score/', SecurityHealthScoreView.as_view(), name='security-health-score'),
    path('api/security/profiles/<int:profile_id>/strength/', UpdatePasswordStrengthView.as_view(), name='update-password-strength'),
    path('api/security/profiles/<int:profile_id>/breach/', UpdateBreachStatusView.as_view(), name='update-breach-status'),
    path('api/security/profiles/<int:profile_id>/hash/', UpdatePasswordHashView.as_view(), name='update-password-hash'),
    path('api/security/batch-update/', BatchUpdateSecurityMetricsView.as_view(), name='batch-update-security-metrics'),
    
    # Panic & Duress Security Settings
    path('api/security/settings/', SecuritySettingsView.as_view(), name='security-settings'),

    # Shared Secret endpoints (Secure Link Sharing)
    path('api/shared-secrets/create/', create_shared_secret, name='create-shared-secret'),
    path('api/shared-secrets/<uuid:share_id>/', view_shared_secret, name='view-shared-secret'),
    path('api/shared-secrets/', list_user_shared_secrets, name='list-shared-secrets'),
    path('api/shared-secrets/<uuid:share_id>/revoke/', revoke_shared_secret, name='revoke-shared-secret'),

    # dj-rest-auth endpoints (logout, user details, registration)
    # Note: login is handled by CustomLoginView above
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
