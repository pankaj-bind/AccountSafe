# core/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

from api.views import (
    CheckUsernameView,
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
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/check-username/', CheckUsernameView.as_view(), name='check-username'),
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

    # dj-rest-auth endpoints (login, logout, user details, registration)
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]
