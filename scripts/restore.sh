#!/bin/bash
# =============================================================================
# AccountSafe - Database Restore Script (The Doomsday Protocol)
# =============================================================================
# 
# This script restores the PostgreSQL database from a backup file.
# 
# Usage:
#   ./scripts/restore.sh                    # Restore from latest backup
#   ./scripts/restore.sh backup_file.sql.gz # Restore from specific file
#
# Requirements:
#   - Docker and docker-compose installed
#   - Running from the project root directory
#   - Backups directory exists with valid backup files
#
# WARNING: This script will DROP the existing database!
# =============================================================================

set -e  # Exit on any error

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
DB_CONTAINER="accountsafe-db"
BACKEND_CONTAINER="accountsafe-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check if running from project root
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Cannot find $COMPOSE_FILE. Please run this script from the project root."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "Backup directory '$BACKUP_DIR' does not exist."
        exit 1
    fi
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Ensure required env vars are set
    if [[ -z "$DB_NAME" ]]; then
        DB_NAME="accountsafe"
    fi
    if [[ -z "$DB_USER" ]]; then
        DB_USER="postgres"
    fi
    if [[ -z "$DB_PASSWORD" ]]; then
        log_error "DB_PASSWORD is not set. Please configure your .env file."
        exit 1
    fi
    
    log_success "Pre-flight checks passed."
}

# -----------------------------------------------------------------------------
# Find Backup File
# -----------------------------------------------------------------------------
find_backup_file() {
    local backup_file="$1"
    
    if [[ -n "$backup_file" ]]; then
        # Specific file provided
        if [[ -f "$backup_file" ]]; then
            BACKUP_FILE="$backup_file"
        elif [[ -f "$BACKUP_DIR/$backup_file" ]]; then
            BACKUP_FILE="$BACKUP_DIR/$backup_file"
        else
            log_error "Backup file not found: $backup_file"
            exit 1
        fi
    else
        # Find the latest backup (recursively search for newest .sql.gz file)
        log_info "Searching for latest backup in $BACKUP_DIR..."
        
        BACKUP_FILE=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [[ -z "$BACKUP_FILE" ]]; then
            # Try without printf (macOS compatibility)
            BACKUP_FILE=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -exec stat -f '%m %N' {} \; 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        fi
        
        if [[ -z "$BACKUP_FILE" ]]; then
            log_error "No backup files found in $BACKUP_DIR"
            log_info "Backup files should have .sql.gz extension"
            exit 1
        fi
    fi
    
    # Get file info
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    BACKUP_DATE=$(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f %Sm "$BACKUP_FILE" 2>/dev/null)
    
    log_success "Found backup: $BACKUP_FILE"
    log_info "Size: $BACKUP_SIZE | Modified: $BACKUP_DATE"
}

# -----------------------------------------------------------------------------
# Danger Zone Confirmation
# -----------------------------------------------------------------------------
confirm_restore() {
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ⚠️  DANGER ZONE ⚠️                               ║${NC}"
    echo -e "${RED}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║  This will:                                                       ║${NC}"
    echo -e "${RED}║    1. STOP the backend service                                    ║${NC}"
    echo -e "${RED}║    2. DROP the current database (ALL DATA WILL BE LOST)          ║${NC}"
    echo -e "${RED}║    3. RESTORE from the backup file                                ║${NC}"
    echo -e "${RED}║    4. RESTART the backend service                                 ║${NC}"
    echo -e "${RED}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║  Database: ${DB_NAME}                                             ║${NC}"
    echo -e "${RED}║  Backup:   $(basename "$BACKUP_FILE")                             ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    read -p "Type 'RESTORE' to confirm (case-sensitive): " confirmation
    
    if [[ "$confirmation" != "RESTORE" ]]; then
        log_info "Restore cancelled by user."
        exit 0
    fi
    
    echo ""
    read -p "Are you ABSOLUTELY sure? This cannot be undone. [y/N]: " final_confirm
    
    if [[ "$final_confirm" != "y" && "$final_confirm" != "Y" ]]; then
        log_info "Restore cancelled by user."
        exit 0
    fi
}

# -----------------------------------------------------------------------------
# Stop Backend Service
# -----------------------------------------------------------------------------
stop_backend() {
    log_info "Stopping backend service..."
    
    if docker ps --format '{{.Names}}' | grep -q "$BACKEND_CONTAINER"; then
        docker-compose -f "$COMPOSE_FILE" stop backend
        log_success "Backend stopped."
    else
        log_warning "Backend container not running."
    fi
}

# -----------------------------------------------------------------------------
# Restore Database
# -----------------------------------------------------------------------------
restore_database() {
    log_info "Starting database restore..."
    
    # Check if DB container is running
    if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
        log_error "Database container is not running. Starting it..."
        docker-compose -f "$COMPOSE_FILE" up -d db
        sleep 10  # Wait for DB to be ready
    fi
    
    # Terminate active connections to the database
    log_info "Terminating active database connections..."
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " > /dev/null 2>&1 || true
    
    # Drop and recreate database
    log_info "Dropping existing database..."
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || {
        log_error "Failed to drop database. There may be active connections."
        exit 1
    }
    
    log_info "Creating fresh database..."
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    # Restore from backup
    log_info "Restoring from backup (this may take a while)..."
    
    # Check if file is encrypted (GPG)
    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        if [[ -z "$BACKUP_ENCRYPTION_KEY" ]]; then
            log_error "Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set."
            exit 1
        fi
        log_info "Decrypting backup..."
        gpg --batch --passphrase "$BACKUP_ENCRYPTION_KEY" -d "$BACKUP_FILE" | gunzip | \
            docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    elif [[ "$BACKUP_FILE" == *.sql ]]; then
        cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    else
        log_error "Unsupported backup format. Expected .sql, .sql.gz, or .sql.gz.gpg"
        exit 1
    fi
    
    log_success "Database restored successfully!"
}

# -----------------------------------------------------------------------------
# Start Backend Service
# -----------------------------------------------------------------------------
start_backend() {
    log_info "Starting backend service..."
    docker-compose -f "$COMPOSE_FILE" up -d backend
    
    # Wait for backend to be healthy
    log_info "Waiting for backend to become healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec "$BACKEND_CONTAINER" python manage.py check > /dev/null 2>&1; then
            log_success "Backend is healthy!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    log_warning "Backend health check timed out. Check logs with: docker logs $BACKEND_CONTAINER"
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------
main() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}       AccountSafe Database Restore (The Doomsday Protocol)        ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    preflight_checks
    find_backup_file "$1"
    confirm_restore
    
    echo ""
    log_info "Beginning restore process..."
    echo ""
    
    stop_backend
    restore_database
    start_backend
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    ✅ RESTORE COMPLETE                            ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    log_info "Next steps:"
    echo "  1. Verify the application: https://your-domain.com"
    echo "  2. Check logs: docker logs $BACKEND_CONTAINER"
    echo "  3. Run migrations if needed: docker exec $BACKEND_CONTAINER python manage.py migrate"
    echo ""
}

# Run main function with all arguments
main "$@"
