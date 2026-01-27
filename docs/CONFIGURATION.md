# Configuration Reference

Environment variables and configuration options for AccountSafe.

---

## Table of Contents

- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Docker Configuration](#docker-configuration)
- [Nginx Configuration](#nginx-configuration)
- [Production Hardening](#production-hardening)

---

## Backend Configuration

Location: `backend/.env`

Copy from template:
```bash
cp backend/.env.example backend/.env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key. Must be at least 64 characters, cryptographically random. | `your-64-char-random-string` |
| `DEBUG` | Enable debug mode. Must be `False` in production. | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of permitted hostnames. | `yourdomain.com,www.yourdomain.com` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgres://user:pass@db:5432/accountsafe` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of permitted CORS origins. | `https://yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key for bot protection. | - |
| `EMAIL_HOST` | SMTP server hostname. | - |
| `EMAIL_PORT` | SMTP server port. | `587` |
| `EMAIL_HOST_USER` | SMTP username. | - |
| `EMAIL_HOST_PASSWORD` | SMTP password. | - |
| `EMAIL_USE_TLS` | Enable TLS for email. | `True` |
| `DEFAULT_FROM_EMAIL` | Default sender email address. | - |

### Backup Configuration

These variables configure the automated backup service. See [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) for full documentation.

| Variable | Description | Default |
|----------|-------------|--------|
| `SCHEDULE` | Cron expression for backup frequency. | `0 */6 * * *` (every 6 hours) |
| `BACKUP_KEEP_DAYS` | Days to retain daily backups. | `7` |
| `BACKUP_KEEP_WEEKS` | Weeks to retain weekly backups. | `4` |
| `BACKUP_KEEP_MONTHS` | Months to retain monthly backups. | `3` |
| `BACKUP_ENCRYPTION_KEY` | GPG passphrase for encrypted backups. If not set, backups are unencrypted. | - |

**Example: Enable encrypted backups every 12 hours**

```bash
SCHEDULE=0 */12 * * *
BACKUP_ENCRYPTION_KEY=your-very-strong-gpg-passphrase-here
BACKUP_KEEP_DAYS=14
```

> **WARNING:** Store `BACKUP_ENCRYPTION_KEY` securely. If you lose this key, you **cannot restore encrypted backups**.

### Database Configuration

For local development (SQLite):
```
# No DATABASE_URL needed; Django defaults to SQLite
```

For production (PostgreSQL):
```
DATABASE_URL=postgres://accountsafe_user:strong_password@db:5432/accountsafe
```

PostgreSQL connection parameters:

| Parameter | Description |
|-----------|-------------|
| User | Database user with limited privileges |
| Password | Strong, unique password |
| Host | `db` (Docker service name) or hostname |
| Port | `5432` (default) |
| Database | Database name |

### Security Settings

```bash
# Production security settings
DEBUG=False
SECRET_KEY=<64-character-random-string>
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

Generate a secure secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Frontend Configuration

Location: `frontend/.env`

Copy from template:
```bash
cp frontend/.env.example frontend/.env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL. | `https://yourdomain.com/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key. | - |
| `REACT_APP_CLIPBOARD_TIMEOUT` | Clipboard auto-clear timeout in seconds. | `30` |
| `REACT_APP_SESSION_TIMEOUT` | Session inactivity timeout in minutes. | `15` |

### Development Configuration

```bash
REACT_APP_API_URL=http://localhost:8000/api
```

### Production Configuration

```bash
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_TURNSTILE_SITE_KEY=0x4AAAAAAxxxxxxx
```

---

## Docker Configuration

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base configuration |
| `docker-compose.local.yml` | Local development |
| `docker-compose.dev.yml` | Development with hot reload |
| `docker-compose.prod.yml` | Production deployment |

### Service Configuration

#### Backend Service

```yaml
backend:
  build: ./backend
  environment:
    - SECRET_KEY=${SECRET_KEY}
    - DEBUG=${DEBUG}
    - DATABASE_URL=${DATABASE_URL}
  depends_on:
    - db
  volumes:
    - ./backend:/app  # Development only
```

#### Frontend Service

```yaml
frontend:
  build: ./frontend
  environment:
    - REACT_APP_API_URL=${REACT_APP_API_URL}
  ports:
    - "3000:80"  # Development
```

#### Database Service

```yaml
db:
  image: postgres:15-alpine
  environment:
    - POSTGRES_USER=accountsafe_user
    - POSTGRES_PASSWORD=strong_password
    - POSTGRES_DB=accountsafe
  volumes:
    - pg_data:/var/lib/postgresql/data
```

### Volume Mounts

| Volume | Purpose |
|--------|---------|
| `pg_data` | PostgreSQL data persistence |
| `certbot_conf` | Let's Encrypt certificates |
| `certbot_www` | ACME challenge files |

---

## Nginx Configuration

Location: `nginx/nginx.conf`

### SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
}
```

### Security Headers

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend:8000;
}
```

---

## Production Hardening

### Checklist

| Category | Setting | Value |
|----------|---------|-------|
| Django | `DEBUG` | `False` |
| Django | `SECRET_KEY` | 64+ characters |
| Django | `ALLOWED_HOSTS` | Explicit domain list |
| CORS | Origins | Production URL only |
| SSL | Protocol | TLS 1.2+ |
| SSL | HSTS | Enabled |
| Headers | CSP | Configured |
| Headers | X-Frame-Options | SAMEORIGIN |
| Database | Connection | Encrypted |
| Database | User | Limited privileges |
| Logs | Sensitive data | Never logged |

### Security Headers Configuration

Add to Django settings:
```python
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Database Security

PostgreSQL configuration for production:
```
# pg_hba.conf
hostssl all all 0.0.0.0/0 scram-sha-256
```

Connection string with SSL:
```
DATABASE_URL=postgres://user:pass@db:5432/accountsafe?sslmode=require
```

### Backup Configuration

Automated backup script:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U accountsafe_user accountsafe | gzip > backup_$TIMESTAMP.sql.gz
```

Schedule with cron:
```
0 2 * * * /path/to/backup.sh
```

---

## Environment Templates

### Development (.env.example)

```bash
# Backend
SECRET_KEY=dev-secret-key-not-for-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

### Production (.env.production)

```bash
# Backend
SECRET_KEY=<generate-64-char-random-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:pass@db:5432/accountsafe
CORS_ALLOWED_ORIGINS=https://yourdomain.com
TURNSTILE_SECRET_KEY=<your-turnstile-secret>

# Frontend
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_TURNSTILE_SITE_KEY=<your-turnstile-site-key>
```
