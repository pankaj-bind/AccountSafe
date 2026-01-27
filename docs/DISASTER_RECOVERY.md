# Disaster Recovery Runbook

> **"Break Glass in Case of Emergency"**
> 
> This document is for when everything has gone wrong. Follow these steps exactly.

---

## Table of Contents

- [TL;DR - I Need to Restore NOW](#tldr---i-need-to-restore-now)
- [How Backups Work](#how-backups-work)
- [Manual Backup (Before Dangerous Operations)](#manual-backup-before-dangerous-operations)
- [The Restore Process](#the-restore-process)
- [Off-site Backup Sync](#off-site-backup-sync)
- [Troubleshooting](#troubleshooting)

---

## TL;DR - I Need to Restore NOW

```bash
# 1. Make sure you're in the project root
cd /path/to/AccountSafe

# 2. Run the restore script
./scripts/restore.sh

# 3. Follow the prompts (type "RESTORE" then "y")
```

That's it. The script handles everything.

---

## How Backups Work

### Automatic Backups

AccountSafe runs automated PostgreSQL backups using a dedicated Docker container.

| Setting | Value |
|---------|-------|
| **Schedule** | Every 6 hours (00:00, 06:00, 12:00, 18:00) |
| **Retention** | 7 daily + 4 weekly + 3 monthly |
| **Format** | Compressed SQL (`.sql.gz`) |
| **Location** | `./backups/` directory |
| **Encryption** | Optional GPG (if `BACKUP_ENCRYPTION_KEY` is set) |

### Backup File Structure

```
backups/
├── daily/
│   └── accountsafe-2026-01-27T060001.sql.gz
├── weekly/
│   └── accountsafe-2026-01-20T060001.sql.gz
└── monthly/
    └── accountsafe-2026-01-01T060001.sql.gz
```

### What Gets Backed Up

✅ All database tables (users, credentials, categories, sessions)  
✅ Encrypted vault data (ciphertext blobs)  
✅ User profiles and settings  
❌ Media files (profile pictures) - stored separately in `./media/`  
❌ SSL certificates - managed by Certbot  

---

## Manual Backup (Before Dangerous Operations)

**Always trigger a manual backup before:**
- Database migrations
- Major version upgrades
- Server migrations
- Any `DROP` or `DELETE` operations

### Trigger Immediate Backup

```bash
# Option 1: Using the backup script
./scripts/backup_now.sh

# Option 2: Direct Docker command
docker exec accountsafe-backup /backup.sh
```

### Verify Backup Was Created

```bash
# List recent backups
ls -la backups/daily/

# Check backup file size (should be > 0)
du -h backups/daily/*.sql.gz | tail -5
```

---

## The Restore Process

### DANGER ZONE

> **WARNING: Restoring a backup will PERMANENTLY DELETE all current data.**
> 
> - All users created after the backup will be lost
> - All credentials added after the backup will be lost
> - All sessions will be terminated
> 
> **This cannot be undone.**

### Prerequisites

Before restoring, ensure:

- [ ] You are in the project root directory
- [ ] Docker is running
- [ ] The `backups/` directory contains valid backup files
- [ ] You have the `.env` file with `DB_PASSWORD` set
- [ ] (If encrypted) You have `BACKUP_ENCRYPTION_KEY` set

### Step-by-Step Restore

#### Step 1: Navigate to Project Root

```bash
cd /path/to/AccountSafe
```

#### Step 2: List Available Backups

```bash
find ./backups -name "*.sql.gz" -type f | sort
```

#### Step 3: Run the Restore Script

**Restore from latest backup (recommended):**
```bash
./scripts/restore.sh
```

**Restore from specific backup:**
```bash
./scripts/restore.sh backups/daily/accountsafe-2026-01-27T060001.sql.gz
```

#### Step 4: Confirm the Operation

The script will show a warning and ask for confirmation:

1. **First prompt:** Type `RESTORE` (case-sensitive)
2. **Second prompt:** Type `y` to confirm

#### Step 5: Wait for Completion

The script will:
1. ✅ Stop the backend service
2. ✅ Terminate database connections
3. ✅ Drop the existing database
4. ✅ Create a fresh database
5. ✅ Restore from backup
6. ✅ Restart the backend service
7. ✅ Verify backend health

#### Step 6: Verify the Application

```bash
# Check backend is running
docker ps | grep accountsafe-backend

# Check logs for errors
docker logs accountsafe-backend --tail 50

# Test the API health endpoint
curl http://localhost:8000/api/health/
```

---

## Off-site Backup Sync

**Local backups are not enough.** If the server burns down, you lose everything.

### Option 1: AWS S3 (Recommended)

Add to host machine's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (syncs every hour)
0 * * * * aws s3 sync /path/to/AccountSafe/backups s3://your-bucket/accountsafe-backups/ --delete
```

### Option 2: Google Cloud Storage

```bash
0 * * * * gsutil -m rsync -r /path/to/AccountSafe/backups gs://your-bucket/accountsafe-backups/
```

### Option 3: Rclone (Any Cloud)

```bash
# Configure rclone first
rclone config

# Add to crontab
0 * * * * rclone sync /path/to/AccountSafe/backups remote:accountsafe-backups/
```

### Option 4: Rsync to Remote Server

```bash
0 * * * * rsync -avz --delete /path/to/AccountSafe/backups/ user@backup-server:/backups/accountsafe/
```

### Verify Off-site Backups

```bash
# AWS S3
aws s3 ls s3://your-bucket/accountsafe-backups/ --recursive | tail -10

# Google Cloud
gsutil ls -l gs://your-bucket/accountsafe-backups/
```

---

## Troubleshooting

### Backup container not starting

```bash
# Check container status
docker ps -a | grep backup

# View logs
docker logs accountsafe-backup

# Common fix: Ensure DB is healthy first
docker-compose -f docker-compose.prod.yml up -d db
sleep 10
docker-compose -f docker-compose.prod.yml up -d backup
```

### "No backup files found"

```bash
# Check if backups directory exists
ls -la backups/

# Create if missing
mkdir -p backups

# Trigger a manual backup
docker exec accountsafe-backup /backup.sh
```

### Restore fails with "database in use"

```bash
# Force stop all services except DB
docker-compose -f docker-compose.prod.yml stop backend frontend

# Try restore again
./scripts/restore.sh
```

### Encrypted backup but no key

If you see `.gpg` files but don't have `BACKUP_ENCRYPTION_KEY`:

**You cannot restore without the encryption key.**

This is by design. Store your encryption key securely (password manager, vault, etc.).

### Restore completes but app doesn't work

```bash
# Run migrations (schema may have changed)
docker exec accountsafe-backend python manage.py migrate

# Collect static files
docker exec accountsafe-backend python manage.py collectstatic --noinput

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Primary Maintainer | pankajbind30@gmail.com |
| GitHub Issues | https://github.com/pankaj-bind/AccountSafe/issues |

---

## Checklist: Monthly DR Test

- [ ] Trigger manual backup
- [ ] Verify backup file exists and has reasonable size
- [ ] Verify off-site sync is working
- [ ] (On staging) Test full restore process
- [ ] Document any issues encountered

**Last DR test date:** ____________

**Tested by:** ____________
