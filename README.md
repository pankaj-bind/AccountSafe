# AccountSafe

<div align="center">

![AccountSafe](https://img.shields.io/badge/AccountSafe-Secure%20Vault-blue?style=for-the-badge&logo=shield&logoColor=white)
[![Security](https://img.shields.io/badge/Security-AES--256%20Encryption-green?style=flat-square)](./backend/api/encryption.py)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](./frontend)
[![Django](https://img.shields.io/badge/Django-5.x-green?style=flat-square&logo=django)](./backend)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](./frontend)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

**Self-hosted password manager with AES-256 encryption and modern web interface**

[Features](#features) • [Security](#security-architecture) • [Installation](#installation) • [Contributing](./CONTRIBUTING.md)

</div>

---

## Overview

AccountSafe is a self-hosted credential management system built with security-first principles. It provides encrypted storage for passwords, recovery codes, and sensitive documents with a responsive React frontend and Django REST backend.

## Features

### Core Functionality
- **Secure Credential Storage**: Store usernames, passwords, recovery codes, and document attachments
- **Category Organization**: Organize credentials by custom categories (Social Media, Finance, Work, etc.)
- **Organization Management**: Group credentials by service/platform with metadata
- **Smart Brand Detection**: Auto-complete with brand logos using integrated search API
- **Credential Pinning**: Pin frequently used credentials for quick access
- **Responsive Layout**: Optimized grid layout for desktop, tablet, and mobile viewports

### Security Features
- **AES-256 Encryption**: All sensitive data encrypted at rest using Fernet (AES-256-CBC mode)
- **PIN Protection**: 4-digit security PIN hashed with bcrypt (server-side validation)
- **JWT Authentication**: Token-based session management with refresh mechanism
- **Cross-Tab Logout**: Instant synchronization across all browser tabs using Broadcast Channel API
- **Login Activity Monitoring**: Track authentication attempts with IP geolocation
- **Rate Limiting**: API throttling to prevent brute-force attacks
- **Security Health Score**: Automated password strength analysis and breach detection
- **Clipboard Auto-Clear**: Automatic clipboard clearing after copy operations

### User Interface
- **Dark/Light Mode**: System preference detection with manual override
- **Skeleton Loading States**: Progressive loading indicators for improved perceived performance
- **Framer Motion Animations**: Smooth page transitions and micro-interactions
- **Keyboard Navigation**: Full accessibility support with ARIA labels
- **Relative Timestamps**: Human-readable time formatting using date-fns

---

## Security Architecture

### Encryption Implementation

AccountSafe uses **Fernet symmetric encryption** (built on AES-256-CBC) for all sensitive data:

```python
# backend/api/encryption.py
from cryptography.fernet import Fernet

def encrypt_data(plain_text):
    """
    Encrypts sensitive data using AES-256-CBC via Fernet.
    Key derived from Django SECRET_KEY using SHA-256.
    """
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet = Fernet(base64.urlsafe_b64encode(key))
    return fernet.encrypt(plain_text.encode()).decode()
```

### What's Encrypted?
| Field | Encryption Status | Notes |
|-------|------------------|-------|
| Passwords | ✅ Encrypted | AES-256 at rest |
| Recovery Codes | ✅ Encrypted | AES-256 at rest |
| Usernames | ✅ Encrypted | AES-256 at rest |
| Notes | ✅ Encrypted | AES-256 at rest |
| Email addresses | ✅ Encrypted | AES-256 at rest |
| Security PIN | ✅ Hashed | bcrypt with salt |

### Security Best Practices Implemented

1. **Never store plaintext credentials** - All sensitive data encrypted before database storage
2. **Secure key derivation** - Encryption key derived from SECRET_KEY using SHA-256
3. **PIN hashing** - Security PIN hashed server-side with bcrypt (not stored in localStorage)
4. **CSRF protection** - Django's built-in CSRF middleware
5. **CORS configuration** - Restrictive CORS policies for API endpoints
6. **Input validation** - Server-side validation for all user inputs

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| date-fns | Date Formatting |
| Axios | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| Django 5.x | Web Framework |
| Django REST Framework | API |
| Cryptography (Fernet) | AES-256 Encryption |
| SQLite / PostgreSQL | Database |

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit with your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend API: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

---

## Live Demo

- **Frontend:** [accountsafe.vercel.app](https://accountsafe.vercel.app)
- **Backend API:** https://accountsafe.pythonanywhere.com/api/

### Screenshots

![Dashboard View](./screenshots/dashboard.png)
*Main dashboard with category organization and credential grid*

![Credential Detail](./screenshots/credential-detail.png)
*Credential card with expandable fields and copy-to-clipboard functionality*

![Mobile View](./screenshots/mobile-view.png)
*Responsive mobile layout with touch-optimized controls*

---

## Project Structure

```
AccountSafe/
├── backend/
│   ├── api/
│   │   ├── encryption.py    # AES-256 encryption utilities
│   │   ├── models.py        # Database models (Profile, Category, Organization)
│   │   ├── views.py         # REST API endpoints
│   │   ├── serializers.py   # DRF serializers
│   │   └── health_score.py  # Password strength analyzer
│   ├── core/
│   │   ├── settings.py      # Django configuration
│   │   └── urls.py          # URL routing
│   ├── requirements.txt     # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── contexts/        # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   ├── api/             # API client configuration
│   │   └── services/        # API service layer
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind CSS configuration
└── tests/
```

---

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-super-secret-key-min-50-chars
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register/` | POST | User registration |
| `/api/login/` | POST | User authentication |
| `/api/categories/` | GET/POST | Category management |
| `/api/organizations/` | GET/POST | Organization management |
| `/api/profiles/` | GET/POST | Credential profiles |
| `/api/dashboard/statistics/` | GET | Dashboard stats |
| `/api/pin/verify/` | POST | PIN verification |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support

For bug reports and feature requests, please [open an issue](https://github.com/yourusername/accountsafe/issues).

For security vulnerabilities, please email security@yourdomain.com instead of using the issue tracker.