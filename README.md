# AccountSafe

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](backend/)
[![Security: Zero-Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge-green.svg)](#security-model)

A self-hosted, zero-knowledge credential manager. The server stores only encrypted blobs. All cryptographic operations occur exclusively in the browser.

---

## Table of Contents

- [Overview](#overview)
- [Security Model](#security-model)
- [Features](#features)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Development](#development)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [License](#license)

---

## Overview

AccountSafe is a credential management system designed for users who require complete sovereignty over their sensitive data. Unlike commercial password managers, AccountSafe operates on a zero-knowledge architecture: the server functions as a blind storage node, receiving and returning encrypted payloads without the ability to decrypt them.

The encryption key never leaves the client. The server never sees plaintext. A compromised database yields only ciphertext.

---

## Security Model

### Zero-Knowledge Architecture

```
+------------------+                              +------------------+
|     Browser      |                              |      Server      |
|                  |                              |                  |
|  master_password |                              |                  |
|        |         |                              |                  |
|        v         |                              |                  |
|  PBKDF2-SHA256   |                              |                  |
|  (600k rounds)   |                              |                  |
|        |         |                              |                  |
|   +----+----+    |                              |                  |
|   |         |    |                              |                  |
|   v         v    |                              |                  |
| auth_key  enc_key|                              |                  |
|   |         |    |                              |                  |
|   |         v    |                              |                  |
|   |    AES-256-GCM ----> ciphertext -----+----> | Store(ciphertext)|
|   |              |                       |      |                  |
|   +-------+      |                       |      |                  |
|           |      |                       |      |                  |
|           v      |                       |      |                  |
|      auth_hash --+---------------------> |----> | Verify(auth_hash)|
|                  |                              |                  |
+------------------+                              +------------------+
```

### Cryptographic Parameters

| Parameter | Value | Standard |
|-----------|-------|----------|
| Key Derivation | PBKDF2-SHA256 | RFC 8018 |
| Iterations | 600,000 | OWASP 2023 |
| Encryption | AES-256-GCM | NIST SP 800-38D |
| Salt Length | 128 bits | - |
| IV Length | 96 bits | NIST recommendation |
| Auth Tag | 128 bits | - |

### Key Derivation

From a single master password, two independent keys are derived:

1. **Authentication Key**: Sent to server for identity verification. Never used for encryption.
2. **Encryption Key**: Used locally for AES-256-GCM. Never transmitted.

```
master_password + user_salt  -->  PBKDF2  -->  auth_key   -->  Server
master_password + enc_salt   -->  PBKDF2  -->  enc_key    -->  Browser Memory Only
```

### Data Protection

| Data Type | Client | Server | Protection |
|-----------|--------|--------|------------|
| Master Password | Memory | Never | - |
| Encryption Key | Memory | Never | Session-scoped |
| Auth Hash | Transmitted | Stored | Argon2id |
| Credentials | Encrypted | Ciphertext | AES-256-GCM |
| Documents | Encrypted | Ciphertext | AES-256-GCM |
| Security PIN | - | Hashed | bcrypt |

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Database breach | Server stores only ciphertext; no key material |
| Network interception | TLS 1.3; HSTS; certificate pinning recommended |
| Brute-force | Rate limiting; PBKDF2 cost factor; account lockout |
| Session hijacking | Short-lived JWT; refresh rotation; secure cookies |
| Coercion | Panic Mode: alternate PIN reveals decoy vault |
| Memory extraction | Keys cleared on logout; no persistent storage |

---

## Features

### Credential Management

- Encrypted storage for usernames, passwords, notes, and recovery codes
- Document attachments with client-side encryption
- Hierarchical organization: Categories > Organizations > Profiles
- Credential search with client-side decryption
- Password strength analysis (zxcvbn integration)

### Digital Wallet

- Visual credit card storage with masked display
- Card number, expiry, CVV encrypted client-side
- Copy-to-clipboard with auto-clear (configurable timeout)

### Security Controls

- **Panic Mode**: Alternate PIN triggers decoy vault under duress
- **Breach Detection**: Integration with Have I Been Pwned API
- **Session Management**: View and revoke active sessions
- **Auto-Lock**: Configurable inactivity timeout
- **Cross-Tab Sync**: Logout propagates via Broadcast Channel API

### Shared Secrets

- Time-limited secret sharing with unique URLs
- Optional passphrase protection
- Automatic expiration and deletion

---

## Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x |
| Build | Create React App | 5.x |
| Backend | Django | 5.x |
| API | Django REST Framework | 3.14+ |
| Database | PostgreSQL | 15+ |
| Auth | JWT (simplejwt) | 5.x |
| Proxy | Nginx | 1.24+ |
| Container | Docker Compose | 2.x |
| TLS | Let's Encrypt | - |

### Directory Structure

```
AccountSafe/
├── backend/
│   ├── api/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── vault_views.py
│   │   ├── serializers.py
│   │   ├── authentication.py
│   │   ├── zero_knowledge_auth.py
│   │   └── encryption.py
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   └── vault/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── utils/
│   │   │   └── encryption.ts
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── init-letsencrypt.sh
```

---

## Deployment

### Production (Docker Compose)

Prerequisites:
- Docker Engine 24.0+
- Docker Compose 2.0+
- Domain with DNS configured
- Ports 80 and 443 available

**Step 1: Clone and Configure**

```bash
git clone https://github.com/pankaj-bind/AccountSafe.git
cd AccountSafe

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Step 2: Set Environment Variables**

`backend/.env`:
```
SECRET_KEY=<generate-64-char-random-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:pass@db:5432/accountsafe
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

`frontend/.env`:
```
REACT_APP_API_URL=https://yourdomain.com/api
```

**Step 3: Initialize TLS**

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

**Step 4: Deploy**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Step 5: Verify**

```bash
docker-compose ps
curl -I https://yourdomain.com
```

### Production Hardening

| Setting | Recommendation |
|---------|---------------|
| `DEBUG` | `False` |
| `SECRET_KEY` | Minimum 64 characters, cryptographically random |
| HTTPS | Mandatory; HSTS enabled |
| CORS | Explicit origin whitelist |
| Rate Limiting | Enable at Nginx level |
| Database | Encrypted connections; regular backups |
| Logs | Ship to external aggregator; no sensitive data |

---

## Development

### Local Setup

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Server: `http://localhost:8000`

**Frontend**

```bash
cd frontend
npm install
npm start
```

Client: `http://localhost:3000`

### Running Tests

```bash
# Backend
cd backend
python -m pytest -v

# Frontend
cd frontend
npm test
```

### Code Quality

```bash
# TypeScript
cd frontend
npx tsc --noEmit

# Python
cd backend
python -m black .
python -m flake8 .
```

---

## Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode | Yes |
| `ALLOWED_HOSTS` | Permitted hostnames | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `CORS_ALLOWED_ORIGINS` | CORS whitelist | Yes |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | No |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_TURNSTILE_SITE_KEY` | Turnstile public key | No |

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zk/register/` | POST | Create account |
| `/api/zk/login/` | POST | Authenticate |
| `/api/zk/logout/` | POST | End session |
| `/api/token/refresh/` | POST | Refresh JWT |

### Vault

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories/` | GET, POST | Category CRUD |
| `/api/organizations/` | GET, POST | Organization CRUD |
| `/api/profiles/` | GET, POST | Credential CRUD |
| `/api/profiles/{id}/` | GET, PUT, DELETE | Single credential |

### Security

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pin/verify/` | POST | Verify PIN |
| `/api/pin/set/` | POST | Set/update PIN |
| `/api/sessions/` | GET | List sessions |
| `/api/sessions/{id}/revoke/` | POST | Terminate session |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and submission process.

---

## Security Policy

See [SECURITY.md](SECURITY.md) for vulnerability reporting procedures.

Do not open public issues for security vulnerabilities.

---

## License

MIT License. See [LICENSE](LICENSE) for full text.
