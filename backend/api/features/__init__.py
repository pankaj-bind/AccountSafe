# api/features/__init__.py
"""
Feature-Based/Domain-Driven Architecture

This package contains the refactored codebase organized by business domain:

- auth: Zero-knowledge authentication (register, login, password management)
- vault: Password vault management (categories, organizations, profiles)
- security: Security features (health score, sessions, duress mode)
- shared_secret: Zero-knowledge secret sharing
- common: Shared utilities (turnstile, IP location, user agent parsing)

Each feature module follows the Service Layer pattern:
- services.py: Business logic (pure Python, testable)
- views.py: HTTP request/response handling only
- serializers.py: Data serialization/validation
- urls.py: URL routing for the feature
"""