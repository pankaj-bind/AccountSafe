# Contributing to AccountSafe

This document outlines the requirements for contributing to AccountSafe. Read it completely before submitting code.

---

## Table of Contents

- [Security Requirements](#security-requirements)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## Security Requirements

AccountSafe is a security product. All contributions must adhere to these non-negotiable rules.

### The Iron Rules

1. **No secrets in version control.** API keys, passwords, tokens, and private keys must never be committed. Use environment variables exclusively.

2. **Client-side encryption only.** Sensitive data must be encrypted in the browser before transmission. The server must never receive plaintext credentials.

3. **No `any` type in TypeScript.** All code must use explicit types. The `any` keyword circumvents the type system and introduces risk.

4. **No `@ts-ignore` directives.** Fix the type error. Do not silence it.

5. **No `console.log` in production code.** Use structured logging for the backend. Remove debugging statements before submission.

6. **No disabled security headers.** CORS, CSRF, and CSP configurations must not be weakened.

7. **Dependencies require justification.** New packages must be reviewed for security posture. Prefer well-maintained libraries with minimal transitive dependencies.

8. **Cryptographic code is off-limits.** Do not modify encryption algorithms, key derivation parameters, or cryptographic primitives without explicit maintainer approval and security review.

### Security Review Triggers

The following changes require mandatory security review before merge:

- Any modification to `encryption.ts` or `encryption.py`
- Authentication or session management changes
- New API endpoints handling sensitive data
- Changes to CORS, CSRF, or CSP policies
- Database schema changes involving encrypted fields
- Dependency updates to security-critical packages

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 15+ (or SQLite for development) |
| Git | 2.40+ |

### Repository Setup

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/AccountSafe.git
cd AccountSafe
git remote add upstream https://github.com/pankaj-bind/AccountSafe.git
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # Configure local settings
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env        # Configure API URL
npm start
```

### Verify Installation

```bash
# Backend tests
cd backend && python -m pytest -v

# Frontend tests
cd frontend && npm test

# Type checking
cd frontend && npx tsc --noEmit
```

---

## Code Standards

### TypeScript (Frontend)

Configuration: `tsconfig.json` with strict mode enabled.

**Required compiler options:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Style requirements:**

- Functional components only. No class components.
- Explicit return types on all functions.
- Interface definitions for all props and state.
- Error handling with typed catch blocks (`catch (error: unknown)`).
- Imports grouped: React, external, internal, types.

**Example:**

```typescript
interface ProfileCardProps {
  profile: Profile;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
}): JSX.Element => {
  const handleEdit = (): void => {
    onEdit(profile.id);
  };

  return (
    <div className="rounded-lg border p-4">
      <h3>{profile.title}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};
```

### Python (Backend)

Configuration: PEP 8 compliance. Black formatter. Flake8 linting.

**Style requirements:**

- Type hints on all function signatures.
- Docstrings for all public functions and classes.
- Maximum line length: 88 characters.
- Imports sorted with isort.

**Example:**

```python
from typing import Optional

from rest_framework import status
from rest_framework.response import Response


def encrypt_credential(plaintext: str, key: bytes) -> Optional[str]:
    """
    Encrypt a credential using AES-256-GCM.

    Args:
        plaintext: The string to encrypt.
        key: The 256-bit encryption key.

    Returns:
        Base64-encoded ciphertext, or None if encryption fails.

    Raises:
        ValueError: If plaintext is empty.
    """
    if not plaintext:
        raise ValueError("Plaintext cannot be empty")
    
    # Implementation
    ...
```

### File Organization

```
# Frontend component structure
src/
├── components/           # Shared UI components
├── features/
│   └── vault/
│       ├── components/   # Feature-specific components
│       ├── hooks/        # Feature-specific hooks
│       ├── services/     # API layer
│       └── types/        # Type definitions
├── pages/                # Route components
├── hooks/                # Shared hooks
├── services/             # Shared services
├── contexts/             # React context providers
├── utils/                # Utility functions
└── types/                # Shared type definitions
```

---

## Testing Requirements

### Coverage Expectations

| Area | Minimum Coverage |
|------|------------------|
| Encryption utilities | 90% |
| Authentication flows | 85% |
| API endpoints | 80% |
| UI components | 70% |

### Backend Testing

Framework: pytest with Django test client.

```bash
cd backend
python -m pytest -v --cov=api --cov-report=term-missing
```

Required test categories:
- Unit tests for encryption/decryption
- Integration tests for API endpoints
- Authentication flow tests
- Permission and access control tests

### Frontend Testing

Framework: Jest with React Testing Library.

```bash
cd frontend
npm test -- --coverage
```

Required test categories:
- Component rendering tests
- Hook behavior tests
- Encryption utility tests
- Error boundary tests

---

## Commit Guidelines

Format: Conventional Commits specification.

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `security` | Security fix or improvement |
| `refactor` | Code change with no functional difference |
| `perf` | Performance improvement |
| `test` | Test addition or modification |
| `docs` | Documentation |
| `chore` | Build, dependency, or tooling changes |

### Rules

- Subject line: imperative mood, no period, under 50 characters.
- Body: explain what and why, not how. Wrap at 72 characters.
- Reference issues: `Closes #123` or `Fixes #456`.

### Examples

```
feat(vault): add credential export functionality

Implement encrypted export of credentials to JSON format.
Export uses the existing encryption key for consistency.

Closes #234
```

```
security(auth): enforce rate limiting on login endpoint

Add per-IP rate limiting to prevent brute-force attacks.
Limit: 5 attempts per minute, lockout for 15 minutes.

Refs #189
```

---

## Pull Request Process

### Before Submitting

Verify the following:

- [ ] Code compiles without errors (`tsc --noEmit`)
- [ ] All tests pass (`pytest`, `npm test`)
- [ ] No linting errors (`flake8`, `eslint`)
- [ ] Commits follow conventional format
- [ ] Documentation updated if applicable
- [ ] No secrets or credentials in diff

### Submission

1. Push your branch to your fork.
2. Open a pull request against `main`.
3. Fill out the PR template completely.
4. Request review from maintainers.

### PR Title Format

Same as commit message format:

```
feat(vault): add credential search functionality
fix(auth): resolve session timeout race condition
security(api): patch IDOR vulnerability in profile endpoint
```

### Review Process

1. Automated checks must pass (CI/CD).
2. At least one maintainer approval required.
3. Security-sensitive changes require two approvals.
4. Address all review comments before merge.
5. Squash commits on merge.

### After Merge

- Delete your feature branch.
- Verify deployment to staging (if applicable).
- Monitor for regressions.

---

## Issue Reporting

### Bug Reports

Use the bug report template. Include:

1. **Title**: Clear, specific description.
2. **Environment**: OS, browser, versions.
3. **Steps to reproduce**: Numbered, minimal steps.
4. **Expected behavior**: What should happen.
5. **Actual behavior**: What happens instead.
6. **Logs/Screenshots**: Relevant output (sanitize sensitive data).

### Feature Requests

Use the feature request template. Include:

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches evaluated.
4. **Security implications**: Any security considerations.

### Security Vulnerabilities

Do not open public issues for security vulnerabilities.

See [SECURITY.md](SECURITY.md) for responsible disclosure procedures.

---

## Questions

For questions about contributing:

1. Check existing issues and discussions.
2. Open a GitHub Discussion for general questions.
3. Contact maintainers for security-related questions.
