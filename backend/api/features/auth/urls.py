# api/features/auth/urls.py
"""
Authentication URL Configuration

All authentication-related endpoints including:
- Zero-Knowledge Auth (register, login, salt, change-password, delete)
- Password Reset (OTP-based)
- Security PIN Management
- Duress Mode
"""

from django.urls import path
from .views import (
    # Username Check
    CheckUsernameView,
    # Legacy Login (deprecated)
    CustomLoginView,
    # Password Reset OTP
    RequestPasswordResetOTPView,
    VerifyPasswordResetOTPView,
    SetNewPasswordView,
    # Deprecated endpoints
    ChangePasswordView,
    DeleteAccountView,
    # PIN Management
    SetupPinView,
    VerifyPinView,
    PinStatusView,
    ClearPinView,
    ResetPinView,
    # Zero-Knowledge Authentication
    ZeroKnowledgeRegisterView,
    ZeroKnowledgeLoginView,
    ZeroKnowledgeGetSaltView,
    ZeroKnowledgeChangePasswordView,
    ZeroKnowledgeVerifyView,
    ZeroKnowledgeDeleteAccountView,
    ZeroKnowledgeSetDuressView,
    ZeroKnowledgeClearDuressView,
    ZeroKnowledgeSwitchModeView,
)

urlpatterns = [
    # ═══════════════════════════════════════════════════════════════════════════
    # ZERO-KNOWLEDGE AUTHENTICATION (Primary Auth Endpoints)
    # ═══════════════════════════════════════════════════════════════════════════
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
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PASSWORD RESET VIA OTP
    # ═══════════════════════════════════════════════════════════════════════════
    path('password-reset/request-otp/', RequestPasswordResetOTPView.as_view(), name='request-otp'),
    path('password-reset/verify-otp/', VerifyPasswordResetOTPView.as_view(), name='verify-otp'),
    path('password-reset/set-new-password/', SetNewPasswordView.as_view(), name='set-new-password'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SECURITY PIN MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    path('pin/setup/', SetupPinView.as_view(), name='setup-pin'),
    path('pin/verify/', VerifyPinView.as_view(), name='verify-pin'),
    path('pin/status/', PinStatusView.as_view(), name='pin-status'),
    path('pin/clear/', ClearPinView.as_view(), name='clear-pin'),
    path('pin/reset/', ResetPinView.as_view(), name='reset-pin'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # UTILITY ENDPOINTS
    # ═══════════════════════════════════════════════════════════════════════════
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DEPRECATED ENDPOINTS (kept for backwards compatibility)
    # ═══════════════════════════════════════════════════════════════════════════
    path('legacy/login/', CustomLoginView.as_view(), name='custom-login'),
    path('legacy/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('legacy/delete-account/', DeleteAccountView.as_view(), name='delete-account'),
]
