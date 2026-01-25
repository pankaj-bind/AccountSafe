# AccountSafe

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](backend/)
[![Security: Zero-Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge-green.svg)](#why-accountsafe)

A self-hosted, zero-knowledge credential manager.

---

## Why AccountSafe

The server is blind.

AccountSafe encrypts all sensitive data in the browser before transmission. The server stores only ciphertext. A compromised database yields no usable information.

```
Browser                                Server
   |                                      |
   |  master_password                     |
   |        |                             |
   |        v                             |
   |  PBKDF2 (600k iterations)            |
   |        |                             |
   |   +----+----+                        |
   |   |         |                        |
   |   v         v                        |
   | auth_key  enc_key                    |
   |   |         |                        |
   |   |         +---> AES-256-GCM        |
   |   |                    |             |
   |   |              ciphertext -------> | Store
   |   |                                  |
   |   +---> auth_hash -----------------> | Verify
   |                                      |
```

The encryption key never leaves your device.

---

## Features

- **Zero-Knowledge Encryption**: AES-256-GCM with PBKDF2 key derivation (600k iterations)
- **Panic Mode**: Alternate PIN reveals a decoy vault under duress
- **Digital Wallet**: Visual credit card storage with masked display
- **Breach Detection**: Integration with Have I Been Pwned
- **Shared Secrets**: Time-limited, passphrase-protected sharing
- **Session Management**: View and revoke active sessions across devices

---

## Quick Start

### Production

```bash
git clone https://github.com/pankaj-bind/AccountSafe.git
cd AccountSafe
cp backend/.env.example backend/.env    # Configure
cp frontend/.env.example frontend/.env  # Configure
make init-ssl
make deploy
```

### Development

```bash
make dev
```

Or manually:

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python manage.py migrate && python manage.py runserver

# Frontend
cd frontend && npm install && npm start
```

---

## Architecture

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript 5.x, Tailwind CSS |
| Backend | Django 5.x, Django REST Framework |
| Database | PostgreSQL 15+ |
| Encryption | AES-256-GCM (Web Crypto API) |
| Auth | JWT with refresh rotation |
| Deployment | Docker Compose, Nginx, Let's Encrypt |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/API.md](docs/API.md) | API endpoints and request/response formats |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Environment variables and deployment settings |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development guidelines and code standards |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting and security policy |

---

## Testing

```bash
make test            # All tests
make test-backend    # Backend only (pytest)
make test-frontend   # Frontend only (jest)
```

---

## License

MIT. See [LICENSE](LICENSE).
