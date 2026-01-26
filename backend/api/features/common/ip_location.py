# api/features/common/ip_location.py
"""
IP geolocation utilities.
"""

import logging
import requests
from functools import lru_cache

# Module-level logger
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1000)
def get_ip_location(ip_address: str) -> dict:
    """
    Get location information from IP address using ip-api.com (free, no API key required).
    Returns dict with city, country, country_code, or empty values on failure.
    Results are cached to avoid excessive API calls.
    """
    # Skip local/private IPs
    if ip_address in ('127.0.0.1', 'localhost', '::1') or ip_address.startswith(('10.', '192.168.', '172.')):
        return {
            'city': 'Local',
            'country': 'Local Network',
            'country_code': 'LO',
            'location': 'Local Network'
        }
    
    try:
        # Using ip-api.com (free, 45 requests per minute)
        response = requests.get(
            f'http://ip-api.com/json/{ip_address}',
            params={'fields': 'status,city,country,countryCode'},
            timeout=3
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                city = data.get('city', '')
                country = data.get('country', '')
                country_code = data.get('countryCode', '')
                
                # Build location string
                if city and country:
                    location = f"{city}, {country}"
                elif country:
                    location = country
                else:
                    location = ''
                
                return {
                    'city': city,
                    'country': country,
                    'country_code': country_code,
                    'location': location
                }
    except Exception as e:
        logger.warning(f"[IP Location] Error getting location for {ip_address}: {e}")
    
    return {
        'city': '',
        'country': '',
        'country_code': '',
        'location': ''
    }


def get_location_string(ip_address: str) -> str:
    """Get just the location string for an IP address."""
    result = get_ip_location(ip_address)
    return result.get('location', '')


def get_country_code(ip_address: str) -> str:
    """Get just the country code for an IP address."""
    result = get_ip_location(ip_address)
    return result.get('country_code', '')
