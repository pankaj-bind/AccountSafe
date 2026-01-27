# System Administration Guide

> **Audience:** Sysadmins, DevOps engineers, and self-hosters responsible for running AccountSafe in production.

This guide covers day-to-day operations, monitoring, backups, and troubleshooting.

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Service Management](#service-management)
- [Backup & Restore](#backup--restore)
- [Monitoring & Observability](#monitoring--observability)
- [Log Management](#log-management)
- [SSL Certificate Management](#ssl-certificate-management)
- [Database Administration](#database-administration)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Essential Commands

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# View running containers
docker ps --filter "name=accountsafe"

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Trigger manual backup NOW
docker exec accountsafe-backup /backup.sh

# Restore from backup
./scripts/restore.sh

# Check API health
curl http://localhost:8000/api/health/
```

### Key Directories

| Path | Purpose |
|------|---------|
| `./backups/` | Database backup files |
| `./certbot/` | SSL certificates (Let's Encrypt) |
| `./nginx/` | Nginx configuration |
| `./backend/.env` | Backend environment variables |
| `./frontend/.env` | Frontend environment variables |

---

## Service Management

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL NETWORK                         │
│  ┌─────────────┐                                            │
│  │   frontend  │ ◄── Ports 80, 443 (Nginx + React)         │
│  │   (nginx)   │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
├─────────┼───────────────────────────────────────────────────┤
│         │           INTERNAL NETWORK                        │
│         ▼                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   backend   │───►│     db      │◄───│   backup    │     │
│  │  (gunicorn) │    │ (postgres)  │    │  (cron)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────┐                                            │
│  │   certbot   │ (SSL certificate renewal)                  │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Starting Services

```bash
# Production (recommended)
docker compose -f docker-compose.prod.yml up -d --build

# Development (with hot reload)
docker compose -f docker-compose.dev.yml up -d
```

### Stopping Services

```bash
# Graceful shutdown (preserves data)
docker compose -f docker-compose.prod.yml down

# Full cleanup (REMOVES VOLUMES - DATA LOSS!)
docker compose -f docker-compose.prod.yml down -v  # DANGEROUS
```

### Restarting Individual Services

```bash
# Restart backend only (after code changes)
docker compose -f docker-compose.prod.yml restart backend

# Restart with rebuild (after requirements.txt changes)
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Viewing Logs

```bash
# All services (follow mode)
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs accountsafe-backend --tail 100 -f

# Filter by time
docker logs accountsafe-backend --since 1h
```

---

## Backup & Restore

> **Full documentation:** [docs/DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)

### Automated Backup Schedule

| Setting | Value |
|---------|-------|
| **Schedule** | Every 6 hours (00:00, 06:00, 12:00, 18:00) |
| **Retention** | 7 daily + 4 weekly + 3 monthly |
| **Location** | `./backups/` |
| **Format** | Compressed SQL (`.sql.gz`) |

### Manual Backup

**Before any risky operation:**

```bash
# Option 1: Using script
./scripts/backup_now.sh

# Option 2: Direct container command
docker exec accountsafe-backup /backup.sh

# Verify backup created
ls -la backups/daily/
```

### Restore Process

```bash
# Restore from latest backup
./scripts/restore.sh

# Restore from specific file
./scripts/restore.sh backups/daily/accountsafe-2026-01-27T060001.sql.gz
```

> ⚠️ **WARNING:** Restore DELETES all current data. The script requires two confirmations.

### Off-site Backup Sync

Add to host crontab for S3 sync:

```bash
crontab -e

# Add this line (syncs every hour)
0 * * * * aws s3 sync /path/to/AccountSafe/backups s3://your-bucket/accountsafe/ --delete
```

---

## Monitoring & Observability

### Health Check Endpoint

```bash
# Full health check
curl http://localhost:8000/api/health/

# Quick check (for load balancers)
curl http://localhost:8000/api/health/?quick=1
```

**Response example:**
```json
{
  "status": "ok",
  "timestamp": 1737987600.0,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": { "status": "ok", "latency_ms": 1.23 },
    "cache": { "status": "not_configured" },
    "disk": { "status": "ok", "free_mb": 15360 }
  }
}
```

### Sentry Error Tracking (Optional)

To enable Sentry for error tracking:

1. Create a Sentry project at https://sentry.io/
2. Get your DSN (Data Source Name)
3. Add to `backend/.env`:

```bash
SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

4. Restart backend:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

**Features when enabled:**
- Automatic exception capture
- Performance monitoring (10% sample rate)
- Release tracking
- Environment tagging

### Container Health Monitoring

```bash
# Check all container statuses
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check specific container health
docker inspect accountsafe-db --format='{{.State.Health.Status}}'
```

### Resource Usage

```bash
# CPU and memory usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Disk usage by container
docker system df -v
```

---

## Log Management

### Log Format

In production, logs are output as **JSON** for easy parsing by log aggregators:

```json
{"asctime": "2026-01-27T10:30:00+0000", "levelname": "INFO", "name": "api", "message": "User login successful"}
```

### Viewing Logs

```bash
# Backend logs
docker logs accountsafe-backend --tail 100 -f

# Database logs
docker logs accountsafe-db --tail 50

# Nginx access logs
docker logs accountsafe-frontend --tail 100
```

### Log Aggregation

Logs can be collected by:
- **AWS CloudWatch** (via awslogs driver)
- **DigitalOcean App Platform** (automatic)
- **Datadog/Splunk** (via log shippers)

Example: AWS CloudWatch logging driver:

```yaml
# Add to docker-compose.prod.yml backend service
logging:
  driver: awslogs
  options:
    awslogs-group: accountsafe
    awslogs-region: us-east-1
    awslogs-stream-prefix: backend
```

---

## SSL Certificate Management

### Automatic Renewal

Certbot automatically renews certificates every 12 hours (if needed).

### Manual Renewal

```bash
# Force renewal
docker exec accountsafe-certbot certbot renew --force-renewal

# Reload Nginx to pick up new certs
docker exec accountsafe-frontend nginx -s reload
```

### Check Certificate Expiry

```bash
# Using OpenSSL
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Initial SSL Setup

For new deployments:

```bash
make init-ssl
```

This runs `scripts/init-letsencrypt.sh` to obtain initial certificates.

---

## Database Administration

### Connect to Database

```bash
# Interactive psql shell
docker exec -it accountsafe-db psql -U postgres -d accountsafe
```

### Common Queries

```sql
-- User count
SELECT COUNT(*) FROM auth_user;

-- Active sessions
SELECT COUNT(*) FROM api_userprofile WHERE last_activity > NOW() - INTERVAL '24 hours';

-- Database size
SELECT pg_size_pretty(pg_database_size('accountsafe'));
```

### Run Migrations

```bash
docker exec accountsafe-backend python manage.py migrate
```

### Create Superuser

```bash
docker exec -it accountsafe-backend python manage.py createsuperuser
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker logs accountsafe-backend --tail 50

# Common fixes:
# 1. Database not ready - wait and restart
docker compose -f docker-compose.prod.yml restart backend

# 2. Migration needed
docker exec accountsafe-backend python manage.py migrate

# 3. Environment variable missing
docker exec accountsafe-backend env | grep -E "SECRET_KEY|DB_"
```

### Database Connection Failed

```bash
# Check if DB is running
docker ps | grep accountsafe-db

# Check DB health
docker exec accountsafe-db pg_isready -U postgres

# Restart DB
docker compose -f docker-compose.prod.yml restart db
```

### SSL Certificate Issues

```bash
# Check certificate status
docker exec accountsafe-certbot certbot certificates

# Manual renewal
docker exec accountsafe-certbot certbot renew --dry-run

# Check Nginx config
docker exec accountsafe-frontend nginx -t
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes  # CAREFUL: removes unused volumes

# Check backup sizes
du -sh backups/*
```

### Backup Container Not Running

```bash
# Check status
docker ps -a | grep backup

# View logs
docker logs accountsafe-backup

# Restart
docker compose -f docker-compose.prod.yml up -d backup
```

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Primary Maintainer | pankajbind30@gmail.com |
| GitHub Issues | https://github.com/pankaj-bind/AccountSafe/issues |
| Security Issues | See [SECURITY.md](../SECURITY.md) |

---

## Maintenance Checklist

### Daily
- [ ] Check `/api/health/` endpoint responds 200
- [ ] Review error logs for anomalies

### Weekly
- [ ] Verify backups are being created
- [ ] Check disk space (`df -h`)
- [ ] Review container resource usage

### Monthly
- [ ] Test restore process on staging
- [ ] Check SSL certificate expiry
- [ ] Update dependencies (with testing)
- [ ] Review access logs for suspicious activity
