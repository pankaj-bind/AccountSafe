# api/features/security/urls.py
"""
Security URL Configuration

All security-related endpoints (health score, sessions, settings, canary traps).
"""

from django.urls import path
from .views import (
    SecurityHealthScoreView,
    UpdatePasswordStrengthView,
    UpdateBreachStatusView,
    UpdatePasswordHashView,
    BatchUpdateSecurityMetricsView,
    ActiveSessionsView,
    ValidateSessionView,
    RevokeSessionView,
    RevokeAllSessionsView,
    SecuritySettingsView,
    login_records,
    # Canary Traps
    CanaryTrapListCreateView,
    CanaryTrapDetailView,
    CanaryTrapTriggerView,
)

urlpatterns = [
    # Health Score
    path('health/', SecurityHealthScoreView.as_view(), name='security-health'),
    path('profiles/<int:profile_id>/strength/', UpdatePasswordStrengthView.as_view(), name='update-strength'),
    path('profiles/<int:profile_id>/breach/', UpdateBreachStatusView.as_view(), name='update-breach'),
    path('profiles/<int:profile_id>/hash/', UpdatePasswordHashView.as_view(), name='update-hash'),
    path('batch-update/', BatchUpdateSecurityMetricsView.as_view(), name='batch-update'),
    
    # Sessions
    path('sessions/', ActiveSessionsView.as_view(), name='active-sessions'),
    path('sessions/validate/', ValidateSessionView.as_view(), name='validate-session'),
    path('sessions/<int:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
    path('sessions/revoke-all/', RevokeAllSessionsView.as_view(), name='revoke-all-sessions'),
    
    # Settings
    path('settings/', SecuritySettingsView.as_view(), name='security-settings'),
    
    # Login Records
    path('login-records/', login_records, name='login-records'),
    
    # Canary Traps (Honeytokens)
    path('traps/', CanaryTrapListCreateView.as_view(), name='canary-trap-list'),
    path('traps/<int:trap_id>/', CanaryTrapDetailView.as_view(), name='canary-trap-detail'),
    
    # Tripwire Endpoint (PUBLICLY ACCESSIBLE - No Auth Required)
    # This is the URL that attackers will access, triggering alerts
    path('trap/<uuid:token>/', CanaryTrapTriggerView.as_view(), name='canary-trap-trigger'),
]
