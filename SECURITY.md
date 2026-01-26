# Security Policy

This document outlines the security policy for AccountSafe, including supported versions and vulnerability reporting procedures.

---

## Supported Versions

| Version | Supported | Notes |
|---------|-----------|-------|
| 1.x (current) | Yes | Active development; security patches prioritized |
| < 1.0 | No | Pre-release versions; upgrade required |

Only the latest minor release receives security updates. Users are expected to maintain current versions.

---

## Security Model

AccountSafe implements a zero-knowledge architecture. Understanding this model is essential for accurate vulnerability assessment.

### Zero-Knowledge Architecture

The server **never** has access to your plaintext credentials. Here's how it works:

```
Master Password (client-side only)
        │
        ▼
    PBKDF2 (600,000 iterations)
        │
   ┌────┴────┐
   ▼         ▼
auth_key   enc_key
   │         │
   │         └──► AES-256-GCM Encrypt ──► Ciphertext ──► Server stores blob
   │
   └──► SHA-256 ──► auth_hash ──► Server verifies identity
```

**Key Points:**
- `enc_key` (encryption key) **never** leaves the browser
- `auth_hash` (authentication hash) is derived separately and only used for identity verification
- Server stores only encrypted blobs; a database breach yields no usable data

### Active Defense Features

#### Duress Mode (Ghost Vault)

AccountSafe supports a secondary "duress password" that reveals a **decoy vault** containing fake, low-value credentials. If you are forced to reveal your password:

1. Enter your duress password instead of your master password
2. You will be logged in normally (no visible difference)
3. The vault displays fake credentials (Netflix, Spotify, etc.)
4. Your real vault remains completely hidden
5. Optionally, an **SOS email** is silently sent to a trusted contact

**Security Consideration:** The duress password should be memorable but distinct from your master password. It should appear plausible under coercion.

#### Canary Trap Credentials

Canary Traps are "honey credentials" you can plant in exports or share intentionally. If an attacker attempts to use them:

1. The service receiving the login attempt triggers an alert
2. You receive an email notification with:
   - Timestamp of the access attempt
   - IP address and geolocation
   - User-agent of the attacker's browser
3. You know your data has been compromised before any real damage occurs

** WARNING:** Do NOT use canary credentials on real services. They are designed to trigger alerts when accessed. Using a canary password on a real account will lock you out.

### In Scope

The following are considered security-relevant:

- Client-side encryption implementation (`frontend/src/utils/encryption.ts`)
- Zero-knowledge authentication (`backend/api/features/auth/zero_knowledge.py`)
- Key derivation and management
- Authentication and session handling
- Authorization and access control
- Server-side input validation
- Cryptographic parameter choices
- Secret storage and transmission
- Duress mode implementation
- Canary trap trigger mechanism
- Cross-site scripting (XSS) vectors
- Cross-site request forgery (CSRF)
- SQL injection and ORM misuse
- Information disclosure in API responses
- Rate limiting and brute-force protection

### Out of Scope

The following are not considered vulnerabilities in AccountSafe:

- Attacks requiring physical access to user device
- Social engineering attacks
- Denial of service via resource exhaustion (report separately)
- Vulnerabilities in dependencies (report to upstream)
- Self-XSS requiring user to paste malicious code
- Issues in development/debug configurations
- Theoretical attacks without practical exploit

---

## Reporting a Vulnerability

### Do Not

- Open a public GitHub issue
- Disclose on social media or public forums
- Exploit the vulnerability beyond proof-of-concept
- Access data belonging to other users

### Do

Report vulnerabilities privately using one of these methods:

**Option 1: GitHub Security Advisories (Preferred)**

1. Navigate to the repository on GitHub
2. Click "Security" tab
3. Click "Report a vulnerability"
4. Complete the advisory form

**Option 2: Direct Contact**

Email: pankajbind30@gmail.com

Use the following PGP key for encrypted communication (optional):

```
[PGP key to be added]
```

### Required Information

Include the following in your report:

1. **Summary**: One-sentence description of the vulnerability.

2. **Severity Assessment**: Your estimation (Critical/High/Medium/Low) with justification.

3. **Affected Component**: File path, endpoint, or feature.

4. **Reproduction Steps**: Minimal, numbered steps to reproduce.

5. **Proof of Concept**: Code, screenshots, or HTTP requests demonstrating the issue.

6. **Impact Analysis**: What an attacker could achieve.

7. **Suggested Fix**: Optional, but appreciated.

### Example Report

```
Summary: IDOR allows unauthorized access to other users' profiles

Severity: High - Authenticated users can read any profile

Affected Component: /api/profiles/{id}/ endpoint

Steps to Reproduce:
1. Authenticate as user A
2. Note user A's profile ID (e.g., 42)
3. Request GET /api/profiles/43/ (another user's profile)
4. Observe: Response returns profile belonging to user B

Impact: Any authenticated user can enumerate and access all profiles
in the database, exposing encrypted credential blobs.

Suggested Fix: Add owner verification in ProfileViewSet.get_queryset()
```

---

## Response Timeline

| Phase | Target Duration |
|-------|-----------------|
| Initial acknowledgment | 48 hours |
| Severity assessment | 5 business days |
| Fix development | Varies by severity |
| Patch release | Critical: 7 days; High: 14 days; Medium: 30 days |
| Public disclosure | After patch release + 30 days |

### Severity Definitions

| Level | Definition | Examples |
|-------|------------|----------|
| Critical | Remote code execution; full database access; authentication bypass | - |
| High | Significant data exposure; privilege escalation | IDOR; broken access control |
| Medium | Limited data exposure; requires user interaction | Stored XSS; CSRF |
| Low | Minor information disclosure; defense-in-depth issues | Version disclosure; verbose errors |

---

## Coordinated Disclosure

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately.
2. We acknowledge receipt and begin assessment.
3. We develop and test a fix.
4. We prepare a security advisory.
5. We release the patch.
6. We publish the advisory with credit to reporter.
7. Reporter may publish their own writeup after advisory.

### Credit

Security researchers who report valid vulnerabilities will be credited in:

- The security advisory
- The CHANGELOG
- The project's security acknowledgments (if maintained)

Credit format: Name/handle and optional affiliation, as specified by reporter.

If you wish to remain anonymous, indicate this in your report.

---

## Security Updates

Security patches are released as:

1. **Patch releases**: Increment the patch version (e.g., 1.2.3 -> 1.2.4)
2. **Security advisories**: Published via GitHub Security Advisories
3. **CHANGELOG entries**: Documented with `[SECURITY]` prefix

Subscribe to repository releases to receive notifications.

---

## Security Best Practices for Users

### Deployment

- Use HTTPS exclusively; enable HSTS
- Keep Docker images and dependencies updated
- Use strong, unique `SECRET_KEY` (64+ characters)
- Enable rate limiting at reverse proxy
- Restrict CORS to production origin only
- Run containers as non-root user
- Enable database connection encryption

### Operations

- Regular encrypted backups
- Monitor authentication logs for anomalies
- Rotate secrets periodically
- Review active sessions
- Keep client browsers updated

---

## Contact

For security matters: pankajbind30@gmail.com

For general support: Open a GitHub issue (non-security matters only)
