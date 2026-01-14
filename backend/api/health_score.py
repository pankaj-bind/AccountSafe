"""
Security Health Score Calculator

Calculates a comprehensive security health score (0-100) for a user's vault
based on password strength, uniqueness, breach status, and hygiene.
"""

import hashlib
import requests
from datetime import datetime, timedelta
from typing import Dict, Tuple
from django.db.models import Count, Case, When, IntegerField, Q, Avg, F
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Profile


def calculate_health_score(user: User) -> Dict:
    """
    Calculate the security health score for a user's vault.
    
    Score = (Strength × 40%) + (Uniqueness × 30%) + (Integrity × 20%) + (Hygiene × 10%)
    
    Returns:
        Dict with overall score and breakdown of each component
    """
    profiles = Profile.objects.filter(organization__category__user=user)
    total_count = profiles.count()
    
    if total_count == 0:
        return {
            'overall_score': 100,
            'total_passwords': 0,
            'strength_score': 100,
            'uniqueness_score': 100,
            'integrity_score': 100,
            'hygiene_score': 100,
            'breakdown': {
                'weak_passwords': 0,
                'reused_passwords': 0,
                'breached_passwords': 0,
                'outdated_passwords': 0,
            }
        }
    
    # 1. Strength Score (40%): Normalized average zxcvbn score
    # zxcvbn scores are 0-4, normalize to 0-100
    avg_strength = profiles.aggregate(
        avg_strength=Avg('password_strength')
    )['avg_strength'] or 0
    strength_score = (avg_strength / 4) * 100  # Normalize 0-4 to 0-100
    
    # 2. Uniqueness Score (30%): Percentage of unique passwords
    # Count profiles with unique encrypted passwords
    password_counts = profiles.values('password_encrypted').annotate(
        count=Count('id')
    )
    unique_passwords = sum(1 for pc in password_counts if pc['count'] == 1)
    uniqueness_score = (unique_passwords / total_count) * 100 if total_count > 0 else 100
    
    # 3. Integrity Score (20%): Percentage NOT breached
    safe_count = profiles.filter(is_breached=False).count()
    integrity_score = (safe_count / total_count) * 100 if total_count > 0 else 100
    
    # 4. Hygiene Score (10%): Percentage updated in last 365 days
    one_year_ago = timezone.now() - timedelta(days=365)
    recent_count = profiles.filter(
        Q(last_password_update__gte=one_year_ago) | Q(last_password_update__isnull=True)
    ).count()
    # If last_password_update is None, we assume it's recent (benefit of doubt for new passwords)
    hygiene_score = (recent_count / total_count) * 100 if total_count > 0 else 100
    
    # Calculate weighted overall score
    overall_score = (
        strength_score * 0.40 +
        uniqueness_score * 0.30 +
        integrity_score * 0.20 +
        hygiene_score * 0.10
    )
    
    # Calculate breakdown counts for UI
    weak_passwords = profiles.filter(password_strength__lte=2).count()
    reused_passwords = total_count - unique_passwords
    breached_passwords = profiles.filter(is_breached=True).count()
    outdated_passwords = profiles.filter(
        last_password_update__lt=one_year_ago,
        last_password_update__isnull=False
    ).count()
    
    return {
        'overall_score': round(overall_score, 1),
        'total_passwords': total_count,
        'strength_score': round(strength_score, 1),
        'uniqueness_score': round(uniqueness_score, 1),
        'integrity_score': round(integrity_score, 1),
        'hygiene_score': round(hygiene_score, 1),
        'breakdown': {
            'weak_passwords': weak_passwords,
            'reused_passwords': reused_passwords,
            'breached_passwords': breached_passwords,
            'outdated_passwords': outdated_passwords,
        }
    }


def check_password_breach_sync(password: str) -> Tuple[bool, int]:
    """
    Check if a password has been breached using HIBP k-Anonymity API.
    
    Uses k-Anonymity model: Only sends first 5 characters of SHA-1 hash,
    receives back all hashes matching that prefix, then checks locally.
    
    Args:
        password: The plaintext password to check
        
    Returns:
        Tuple of (is_breached: bool, breach_count: int)
    """
    if not password:
        return False, 0
    
    # Generate SHA-1 hash of the password
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    
    try:
        # Query HIBP API with first 5 characters
        response = requests.get(
            f'https://api.pwnedpasswords.com/range/{prefix}',
            timeout=5,
            headers={'User-Agent': 'AccountSafe-SecurityChecker'}
        )
        
        if response.status_code == 200:
            # Parse response: each line is "SUFFIX:COUNT"
            hashes = response.text.split('\n')
            for hash_line in hashes:
                if ':' in hash_line:
                    hash_suffix, count = hash_line.split(':')
                    if hash_suffix.strip() == suffix:
                        return True, int(count.strip())
            return False, 0
        else:
            # API error, assume not breached to be safe
            return False, 0
            
    except Exception as e:
        # Network error or timeout, assume not breached
        print(f"HIBP API error: {e}")
        return False, 0


# Celery task placeholder (will work when Celery is configured)
def check_credential_breach(profile_id: int):
    """
    Async Celery task to check if a credential's password has been breached.
    
    This is a placeholder that can be converted to a Celery task by adding:
    @shared_task decorator when Celery is properly configured.
    
    For now, this can be called synchronously for testing.
    
    Args:
        profile_id: The ID of the Profile to check
    """
    try:
        profile = Profile.objects.get(id=profile_id)
        
        # NOTE: In a real implementation with client-side encryption,
        # we cannot check breaches server-side because we don't have the plaintext password.
        # This would need to be done client-side in the browser, or the user would need
        # to temporarily provide their master password for batch checking.
        
        # For now, we'll just update the last_breach_check_date
        # In a production setup, this would be triggered from the frontend
        # after decryption, passing the plaintext password securely
        
        profile.last_breach_check_date = timezone.now()
        profile.save()
        
        return {
            'profile_id': profile_id,
            'checked': True,
            'message': 'Check timestamp updated. Actual breach check must be done client-side.'
        }
        
    except Profile.DoesNotExist:
        return {
            'profile_id': profile_id,
            'checked': False,
            'error': 'Profile not found'
        }


def update_password_strength(profile_id: int, strength_score: int):
    """
    Update the password strength score for a profile.
    
    This should be called from the frontend after calculating zxcvbn score client-side.
    
    Args:
        profile_id: The ID of the Profile to update
        strength_score: zxcvbn score (0-4)
    """
    try:
        profile = Profile.objects.get(id=profile_id)
        profile.password_strength = max(0, min(4, strength_score))  # Clamp to 0-4
        profile.save(update_fields=['password_strength'])
        return True
    except Profile.DoesNotExist:
        return False


def update_breach_status(profile_id: int, is_breached: bool, breach_count: int = 0):
    """
    Update the breach status for a profile.
    
    This should be called from the frontend after checking HIBP client-side.
    
    Args:
        profile_id: The ID of the Profile to update
        is_breached: Whether the password was found in breaches
        breach_count: Number of times it appeared in breaches
    """
    try:
        profile = Profile.objects.get(id=profile_id)
        profile.is_breached = is_breached
        profile.last_breach_check_date = timezone.now()
        profile.save(update_fields=['is_breached', 'last_breach_check_date'])
        return True
    except Profile.DoesNotExist:
        return False
