# api/features/auth/urls.py
"""
Authentication URL Configuration

All authentication-related endpoints.
"""

from django.urls import path
from .views import (
    ZeroKnowledgeRegisterView,
    ZeroKnowledgeLoginView,
    ZeroKnowledgeGetSaltView,
    ZeroKnowledgeChangePasswordView,
    ZeroKnowledgeVerifyView,
    ZeroKnowledgeDeleteAccountView,
    ZeroKnowledgeSetDuressView,
    ZeroKnowledgeClearDuressView,
    ZeroKnowledgeSwitchModeView,
    ZeroKnowledgeMigrateView,
)

urlpatterns = [
    # Zero-Knowledge Authentication
    path('register/', ZeroKnowledgeRegisterView.as_view(), name='zk-register'),
    path('login/', ZeroKnowledgeLoginView.as_view(), name='zk-login'),
    path('salt/', ZeroKnowledgeGetSaltView.as_view(), name='zk-salt'),
    path('change-password/', ZeroKnowledgeChangePasswordView.as_view(), name='zk-change-password'),
    path('verify/', ZeroKnowledgeVerifyView.as_view(), name='zk-verify'),
    path('delete-account/', ZeroKnowledgeDeleteAccountView.as_view(), name='zk-delete-account'),
    
    # Duress Mode
    path('set-duress/', ZeroKnowledgeSetDuressView.as_view(), name='zk-set-duress'),
    path('clear-duress/', ZeroKnowledgeClearDuressView.as_view(), name='zk-clear-duress'),
    path('switch-mode/', ZeroKnowledgeSwitchModeView.as_view(), name='zk-switch-mode'),
    
    # Legacy Migration
    path('migrate/', ZeroKnowledgeMigrateView.as_view(), name='zk-migrate'),
]
