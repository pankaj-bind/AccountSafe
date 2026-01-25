#!/bin/bash

# =============================================================================
# AccountSafe - Let's Encrypt SSL Certificate Initialization
# =============================================================================
# This script initializes SSL certificates for AWS EC2 deployment.
# Run this ONCE on your server before starting docker-compose.
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Domain DNS pointing to this server's IP
#   - Ports 80 and 443 open in security group
#
# Usage: 
#   chmod +x init-letsencrypt.sh
#   sudo ./init-letsencrypt.sh
# =============================================================================

set -e

# =============================================================================
# CONFIGURATION - EDIT THESE VALUES
# =============================================================================
DOMAINS=(accountsafe.yourdomain.com)  # Your domain(s) - add www if needed
EMAIL="admin@yourdomain.com"           # Email for Let's Encrypt notifications
STAGING=0                               # Set to 1 for testing (avoids rate limits)

# Paths
DATA_PATH="./certbot"
COMPOSE_FILE="docker-compose.prod.yml"
NGINX_CONF="./nginx/nginx.conf"
RSA_KEY_SIZE=4096

# =============================================================================
# Color Output
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# =============================================================================
# Header
# =============================================================================
echo -e "${GREEN}"
echo "============================================================"
echo "  AccountSafe - SSL Certificate Initialization"
echo "  Production Deployment for AWS EC2"
echo "============================================================"
echo -e "${NC}"

# =============================================================================
# Validation
# =============================================================================
log_step "Validating configuration..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check docker-compose
if ! docker-compose version > /dev/null 2>&1; then
    log_error "Docker Compose is not installed."
    exit 1
fi

# Check domain configuration
if [ "${DOMAINS[0]}" = "accountsafe.yourdomain.com" ]; then
    log_error "Please edit this script and set your domain name!"
    echo -e "${YELLOW}Edit the 'DOMAINS' variable at the top of this script.${NC}"
    exit 1
fi

if [ "$EMAIL" = "admin@yourdomain.com" ]; then
    log_error "Please edit this script and set your email address!"
    echo -e "${YELLOW}Edit the 'EMAIL' variable at the top of this script.${NC}"
    exit 1
fi

# Check .env file
if [ ! -f ".env" ]; then
    log_error ".env file not found!"
    echo -e "${YELLOW}Copy .env.production.example to .env and configure it.${NC}"
    exit 1
fi

log_info "Configuration validated."
echo ""
echo -e "${YELLOW}Domain(s):${NC} ${DOMAINS[*]}"
echo -e "${YELLOW}Email:${NC} $EMAIL"
echo -e "${YELLOW}Staging:${NC} $( [ $STAGING = 1 ] && echo 'Yes (test certificates)' || echo 'No (production certificates)')"
echo ""

read -p "Continue with SSL setup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warn "Aborted by user."
    exit 0
fi

# =============================================================================
# Step 1: Create directories
# =============================================================================
log_step "[1/7] Creating certificate directories..."
mkdir -p "$DATA_PATH/conf/live/${DOMAINS[0]}"
mkdir -p "$DATA_PATH/www"
log_info "Directories created."

# =============================================================================
# Step 2: Download TLS parameters
# =============================================================================
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
    log_step "[2/7] Downloading recommended TLS parameters..."
    
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        > "$DATA_PATH/conf/options-ssl-nginx.conf"
    
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
        > "$DATA_PATH/conf/ssl-dhparams.pem"
    
    log_info "TLS parameters downloaded."
else
    log_step "[2/7] TLS parameters already exist. Skipping."
fi

# =============================================================================
# Step 3: Update nginx.conf with domain
# =============================================================================
log_step "[3/7] Updating nginx configuration with domain..."
if [ -f "$NGINX_CONF" ]; then
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAINS[0]}/g" "$NGINX_CONF"
    log_info "Nginx configuration updated."
else
    log_error "nginx.conf not found at $NGINX_CONF"
    exit 1
fi

# =============================================================================
# Step 4: Create dummy certificate
# =============================================================================
log_step "[4/7] Creating dummy certificate for ${DOMAINS[0]}..."
path="/etc/letsencrypt/live/${DOMAINS[0]}"

docker-compose -f "$COMPOSE_FILE" run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot

log_info "Dummy certificate created."

# =============================================================================
# Step 5: Start nginx
# =============================================================================
log_step "[5/7] Starting nginx with dummy certificate..."
docker-compose -f "$COMPOSE_FILE" up --force-recreate -d frontend

log_info "Waiting for nginx to start..."
sleep 10

# Verify nginx is running
if ! docker-compose -f "$COMPOSE_FILE" ps frontend | grep -q "Up"; then
    log_error "Nginx failed to start. Check logs:"
    docker-compose -f "$COMPOSE_FILE" logs frontend
    exit 1
fi
log_info "Nginx is running."

# =============================================================================
# Step 6: Delete dummy certificate and request real one
# =============================================================================
log_step "[6/7] Requesting real certificate from Let's Encrypt..."

# Delete dummy certificate
docker-compose -f "$COMPOSE_FILE" run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/${DOMAINS[0]} && \
    rm -Rf /etc/letsencrypt/archive/${DOMAINS[0]} && \
    rm -Rf /etc/letsencrypt/renewal/${DOMAINS[0]}.conf" certbot

# Build domain arguments
domain_args=""
for domain in "${DOMAINS[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Select staging or production
staging_arg=""
if [ $STAGING != "0" ]; then
    staging_arg="--staging"
    log_warn "Using STAGING environment (test certificates)"
fi

# Request certificate
docker-compose -f "$COMPOSE_FILE" run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $EMAIL \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

log_info "Certificate obtained successfully."

# =============================================================================
# Step 7: Reload nginx with real certificate
# =============================================================================
log_step "[7/7] Reloading nginx with real certificate..."
docker-compose -f "$COMPOSE_FILE" exec frontend nginx -s reload
log_info "Nginx reloaded."

# =============================================================================
# Complete
# =============================================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  SSL Certificate Installation Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "${YELLOW}Your site is now available at:${NC}"
echo -e "  ${GREEN}https://${DOMAINS[0]}${NC}"
echo ""
echo -e "${YELLOW}To start all services:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml up -d${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo ""
echo -e "${YELLOW}Certificate renewal is automatic (every 12 hours).${NC}"
echo ""
