# 🔐 AccountSafe

<div align="center">

![AccountSafe](https://img.shields.io/badge/AccountSafe-Secure%20Vault-blue?style=for-the-badge&logo=shield&logoColor=white)
[![Security](https://img.shields.io/badge/Security-AES--256%20Encryption-green?style=flat-square)](./backend/api/encryption.py)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](./frontend)
[![Django](https://img.shields.io/badge/Django-5.x-green?style=flat-square&logo=django)](./backend)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](./frontend)

**A MAANG-grade secure credential management system with military-grade encryption**

[Features](#-features) • [Security](#-security-architecture) • [Quick Start](#-quick-start) • [Demo](#-live-demo)

</div>

---

## ✨ Features

### Core Functionality
- 🔑 **Secure Credential Storage** - Store usernames, passwords, recovery codes, and documents
- 📁 **Category Organization** - Organize credentials by categories (Social Media, Finance, Work, etc.)
- 🏢 **Organization Management** - Group credentials by service/platform
- 🎨 **Smart Brand Search** - Auto-complete with brand logos when creating organizations
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### Security Features
- 🔒 **AES-256 Encryption** - All sensitive data encrypted at rest using Fernet (AES-256-CBC)
- 🔐 **PIN Protection** - 4-digit PIN required to access the vault (server-side hashed)
- 🛡️ **Token Authentication** - Secure JWT-based session management
- 📊 **Login Activity Monitoring** - Track login attempts with IP geolocation
- 🚫 **Rate Limiting** - Protection against brute-force attacks

### User Experience
- 🌓 **Dark/Light Mode** - Beautiful theme toggle with smooth transitions
- ⚡ **Skeleton Loaders** - MAANG-grade loading states for slow networks
- 🎭 **Micro-interactions** - Framer Motion animations throughout
- ♿ **Accessibility** - Full keyboard navigation and ARIA labels
- 📅 **Relative Timestamps** - "2 minutes ago" instead of raw dates

---

## 🔐 Security Architecture

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

## 🛠️ Tech Stack

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

## 🚀 Quick Start

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

## 🌐 Live Demo

- **Frontend:** [accountsafe.vercel.app](https://accountsafe.vercel.app)
- **Backend API:** https://accountsafe.pythonanywhere.com/api/

---

## 📁 Project Structure

```
AccountSafe/
├── backend/
│   ├── api/
│   │   ├── encryption.py    # 🔐 AES-256 encryption utilities
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API endpoints
│   │   └── serializers.py   # Data serialization
│   ├── core/
│   │   └── settings.py      # Django configuration
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utility functions
│   │   └── services/        # API services
│   └── public/
└── tests/
```

---

## 🔧 Environment Variables

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

## 📊 API Endpoints

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📜 License

MIT License - feel free to use for your own projects!