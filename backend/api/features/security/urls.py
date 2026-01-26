# api/features/security/urls.py
"""
Security URL Configuration

All security-related endpoints:
- Health Score & Metrics
- Session Management
- Security Settings (Panic/Duress)
- Login Records
- Canary Traps (Honeytokens)
- Organization Search
"""

from django.urls import path
from .views import (
    # Health Score
    SecurityHealthScoreView,
    UpdatePasswordStrengthView,
    UpdateBreachStatusView,
    UpdatePasswordHashView,
    BatchUpdateSecurityMetricsView,
    # Sessions
    ActiveSessionsView,
    ValidateSessionView,
    RevokeSessionView,
    RevokeAllSessionsView,
    # Settings
    SecuritySettingsView,
    # Login Records
    login_records,
    dashboard_statistics,
    # Canary Traps
    CanaryTrapListCreateView,
    CanaryTrapDetailView,
    CanaryTrapTriggerView,
    # Organization Search
    search_organizations,
    lookup_organization_by_url,
)

urlpatterns = [
    # ═══════════════════════════════════════════════════════════════════════════
    # HEALTH SCORE & METRICS
    # ═══════════════════════════════════════════════════════════════════════════
    path('health-score/', SecurityHealthScoreView.as_view(), name='security-health-score'),
    path('profiles/<int:profile_id>/strength/', UpdatePasswordStrengthView.as_view(), name='update-password-strength'),
    path('profiles/<int:profile_id>/breach/', UpdateBreachStatusView.as_view(), name='update-breach-status'),
    path('profiles/<int:profile_id>/hash/', UpdatePasswordHashView.as_view(), name='update-password-hash'),
    path('batch-update/', BatchUpdateSecurityMetricsView.as_view(), name='batch-update-security-metrics'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SESSION MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    path('sessions/', ActiveSessionsView.as_view(), name='active-sessions'),
    path('sessions/validate/', ValidateSessionView.as_view(), name='validate-session'),
    path('sessions/<int:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
    path('sessions/revoke-all/', RevokeAllSessionsView.as_view(), name='revoke-all-sessions'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SECURITY SETTINGS (Panic/Duress)
    # ═══════════════════════════════════════════════════════════════════════════
    path('settings/', SecuritySettingsView.as_view(), name='security-settings'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LOGIN RECORDS & DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    path('login-records/', login_records, name='login-records'),
    path('dashboard/', dashboard_statistics, name='dashboard-statistics'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CANARY TRAPS (Honeytokens)
    # ═══════════════════════════════════════════════════════════════════════════
    path('traps/', CanaryTrapListCreateView.as_view(), name='canary-trap-list'),
    path('traps/<int:trap_id>/', CanaryTrapDetailView.as_view(), name='canary-trap-detail'),
    # Tripwire Endpoint (PUBLICLY ACCESSIBLE - No Auth Required)
    path('trap/<uuid:token>/', CanaryTrapTriggerView.as_view(), name='canary-trap-trigger'),
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ORGANIZATION SEARCH (Hybrid: Local + Clearbit)
    # ═══════════════════════════════════════════════════════════════════════════
    path('organizations/search/', search_organizations, name='search-organizations'),
    path('organizations/lookup/', lookup_organization_by_url, name='lookup-organization-by-url'),
]
