# api/features/common/health.py
"""
Lightweight Health Check Endpoint

Provides a comprehensive health check without external dependencies.
Designed for load balancers, container orchestrators, and uptime monitors.

Usage:
    GET /api/health/         -> Full health check (all services)
    GET /api/health/?quick=1 -> Quick check (HTTP 200 only, no DB)

Response Codes:
    200 - All services healthy
    503 - One or more services degraded/unhealthy
"""

import logging
import shutil
import time
from typing import Any

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Minimum free disk space before warning (bytes)
DISK_SPACE_WARNING_THRESHOLD = 500 * 1024 * 1024  # 500 MB

# Database query timeout (seconds)
DB_TIMEOUT_SECONDS = 5.0

# Cache timeout (seconds)
CACHE_TIMEOUT_SECONDS = 2.0


# =============================================================================
# HEALTH CHECK VIEW
# =============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request: Request) -> Response:
    """
    Comprehensive health check endpoint.
    
    Checks:
        - Database connectivity (PostgreSQL SELECT 1)
        - Cache connectivity (Redis PING if configured)
        - Disk space (warn if < 500MB free)
        - Application version
    
    Query Parameters:
        quick: If "1" or "true", skip detailed checks (for fast polling)
    
    Returns:
        JSON with service status and HTTP 200 (healthy) or 503 (degraded)
    """
    # Quick mode: Return immediately for fast polling
    quick_mode = request.query_params.get('quick', '').lower() in ('1', 'true')
    if quick_mode:
        return Response({
            'status': 'ok',
            'mode': 'quick',
        })
    
    # Full health check
    services: dict[str, dict[str, Any]] = {}
    overall_healthy = True
    
    # -------------------------------------------------------------------------
    # 1. Database Check
    # -------------------------------------------------------------------------
    db_status = _check_database()
    services['database'] = db_status
    if db_status['status'] != 'ok':
        overall_healthy = False
    
    # -------------------------------------------------------------------------
    # 2. Cache Check (Redis, if configured)
    # -------------------------------------------------------------------------
    cache_status = _check_cache()
    services['cache'] = cache_status
    # Cache is optional - don't fail health check if not configured
    if cache_status['status'] == 'error':
        overall_healthy = False
    
    # -------------------------------------------------------------------------
    # 3. Disk Space Check
    # -------------------------------------------------------------------------
    disk_status = _check_disk_space()
    services['disk'] = disk_status
    if disk_status['status'] == 'critical':
        overall_healthy = False
    
    # -------------------------------------------------------------------------
    # Build Response
    # -------------------------------------------------------------------------
    response_data = {
        'status': 'ok' if overall_healthy else 'degraded',
        'timestamp': time.time(),
        'version': getattr(settings, 'APP_VERSION', '1.0.0'),
        'environment': 'production' if not settings.DEBUG else 'development',
        'services': services,
    }
    
    http_status = status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    # Log health check result (structured for JSON logging)
    if not overall_healthy:
        logger.warning(
            "Health check degraded",
            extra={
                'event': 'health_check',
                'status': 'degraded',
                'services': {k: v['status'] for k, v in services.items()},
            }
        )
    
    return Response(response_data, status=http_status)


# =============================================================================
# INDIVIDUAL SERVICE CHECKS
# =============================================================================

def _check_database() -> dict[str, Any]:
    """
    Check database connectivity by executing SELECT 1.
    
    Returns:
        Dict with status, latency_ms, and optional error message.
    """
    try:
        start = time.perf_counter()
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        latency_ms = (time.perf_counter() - start) * 1000
        
        return {
            'status': 'ok',
            'latency_ms': round(latency_ms, 2),
            'engine': connection.vendor,
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            'status': 'error',
            'error': str(e),
            'latency_ms': None,
        }


def _check_cache() -> dict[str, Any]:
    """
    Check cache (Redis) connectivity if configured.
    
    Returns:
        Dict with status and optional latency/error.
    """
    # Check if cache is configured beyond the default LocMemCache
    cache_backend = getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', '')
    
    if 'redis' not in cache_backend.lower() and 'memcached' not in cache_backend.lower():
        return {
            'status': 'not_configured',
            'message': 'Using local memory cache (no external service)',
        }
    
    try:
        from django.core.cache import cache
        
        start = time.perf_counter()
        # Try to set and get a test value
        test_key = '_health_check_'
        cache.set(test_key, 'ok', timeout=10)
        result = cache.get(test_key)
        cache.delete(test_key)
        latency_ms = (time.perf_counter() - start) * 1000
        
        if result == 'ok':
            return {
                'status': 'ok',
                'latency_ms': round(latency_ms, 2),
            }
        else:
            return {
                'status': 'error',
                'error': 'Cache read/write mismatch',
            }
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return {
            'status': 'error',
            'error': str(e),
        }


def _check_disk_space() -> dict[str, Any]:
    """
    Check available disk space on the volume containing BASE_DIR.
    
    Returns:
        Dict with status, free_bytes, free_mb, and threshold warning.
    """
    try:
        # Get disk usage for the directory containing the app
        usage = shutil.disk_usage(settings.BASE_DIR)
        free_bytes = usage.free
        free_mb = free_bytes / (1024 * 1024)
        total_mb = usage.total / (1024 * 1024)
        
        # Determine status based on threshold
        if free_bytes < DISK_SPACE_WARNING_THRESHOLD // 2:
            disk_status = 'critical'
        elif free_bytes < DISK_SPACE_WARNING_THRESHOLD:
            disk_status = 'warning'
        else:
            disk_status = 'ok'
        
        return {
            'status': disk_status,
            'free_mb': round(free_mb, 0),
            'total_mb': round(total_mb, 0),
            'threshold_mb': DISK_SPACE_WARNING_THRESHOLD // (1024 * 1024),
        }
    except Exception as e:
        logger.error(f"Disk space check failed: {e}")
        return {
            'status': 'error',
            'error': str(e),
        }
