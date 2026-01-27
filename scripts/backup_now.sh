#!/bin/bash
# =============================================================================
# AccountSafe - Manual Backup Trigger Script
# =============================================================================
# 
# Triggers an immediate backup outside of the scheduled 6-hour cycle.
# Useful before deployments, migrations, or major changes.
#
# Usage:
#   ./scripts/backup_now.sh
#
# =============================================================================

set -e

COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_CONTAINER="accountsafe-backup"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running from project root
if [[ ! -f "$COMPOSE_FILE" ]]; then
    log_error "Cannot find $COMPOSE_FILE. Please run from the project root."
    exit 1
fi

# Check if backup container is running
if ! docker ps --format '{{.Names}}' | grep -q "$BACKUP_CONTAINER"; then
    log_error "Backup container is not running."
    log_info "Start it with: docker-compose -f $COMPOSE_FILE up -d backup"
    exit 1
fi

log_info "Triggering immediate backup..."

# The postgres-backup-local image supports triggering via the /backup endpoint
docker exec "$BACKUP_CONTAINER" /backup.sh

log_success "Backup completed!"
log_info "Backups are stored in: ./backups/"

# Show latest backup
LATEST=$(find ./backups -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
if [[ -n "$LATEST" ]]; then
    SIZE=$(ls -lh "$LATEST" | awk '{print $5}')
    log_info "Latest backup: $(basename "$LATEST") ($SIZE)"
fi
