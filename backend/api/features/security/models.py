# api/features/security/models.py
"""
Security Models

Models for security-related features: Canary Traps (Honeytokens).
"""

import uuid
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class CanaryTrap(models.Model):
    """
    Canary Trap (Honeytoken) model for breach detection.
    
    A "trap credential" that looks real but triggers a high-priority alert 
    when accessed. This is for DIGITAL protection (breach detection), 
    distinct from Duress Mode which is for PHYSICAL protection.
    
    How it works:
    1. User generates a trap via the UI
    2. System creates a unique token URL: /api/security/trap/{token}/
    3. User places this URL as a fake credential in their vault
    4. If an attacker accesses the URL, an alert is triggered
    5. The endpoint returns a deceptive response (403 or fake login page)
    """
    
    TRAP_TYPE_CHOICES = [
        ('web_login', 'Web Login URL'),
        ('api_key', 'API Key'),
        ('webhook', 'Webhook URL'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='canary_traps',
        help_text="Owner of the canary trap"
    )
    
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        help_text="Unique high-entropy token for the trap URL"
    )
    
    label = models.CharField(
        max_length=100,
        help_text="Human-readable label, e.g., 'Fake AWS Key', 'Corporate VPN'"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of what this trap is meant to look like"
    )
    
    trap_type = models.CharField(
        max_length=20,
        choices=TRAP_TYPE_CHOICES,
        default='web_login',
        help_text="Type of trap credential"
    )
    
    # Auto-created vault profile ID (if a vault profile was auto-generated)
    vault_profile_id = models.IntegerField(
        blank=True,
        null=True,
        help_text="ID of the auto-created vault profile containing this trap"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the trap is active (will trigger alerts)"
    )
    
    triggered_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times the trap has been triggered"
    )
    
    last_triggered_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the trap was last triggered"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the trap was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the trap was last updated"
    )
    
    class Meta:
        verbose_name = "Canary Trap"
        verbose_name_plural = "Canary Traps"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.label} ({self.token})"
    
    def get_trap_url(self, base_url: str = None) -> str:
        """
        Get the full trap URL.
        
        Args:
            base_url: Base URL of the site. If not provided, uses settings.
        
        Returns:
            Full URL to the trap endpoint.
        """
        if base_url is None:
            base_url = getattr(settings, 'SITE_URL', 'https://accountsafe.pythonanywhere.com')
        
        # Remove trailing slash from base_url
        base_url = base_url.rstrip('/')
        
        return f"{base_url}/api/security/trap/{self.token}/"
    
    def trigger(self, ip_address: str = None, user_agent: str = None, 
                referer: str = None, additional_data: dict = None) -> 'CanaryTrapTrigger':
        """
        Record a trigger event for this trap.
        
        Args:
            ip_address: IP address of the accessor
            user_agent: User-Agent header
            referer: Referer header
            additional_data: Any additional data to log
        
        Returns:
            The created trigger record.
        """
        self.triggered_count += 1
        self.last_triggered_at = timezone.now()
        self.save(update_fields=['triggered_count', 'last_triggered_at'])
        
        return CanaryTrapTrigger.objects.create(
            trap=self,
            ip_address=ip_address or 'Unknown',
            user_agent=user_agent or '',
            referer=referer or '',
            additional_data=additional_data or {}
        )


class CanaryTrapTrigger(models.Model):
    """
    Record of a canary trap being triggered.
    
    Logs all available information about the accessor for forensic analysis.
    """
    
    trap = models.ForeignKey(
        CanaryTrap,
        on_delete=models.CASCADE,
        related_name='triggers',
        help_text="The trap that was triggered"
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="IP address of the accessor"
    )
    
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text="User-Agent header from the request"
    )
    
    referer = models.URLField(
        max_length=2048,
        blank=True,
        default='',
        help_text="Referer header (where the request came from)"
    )
    
    country = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Country from IP geolocation"
    )
    
    isp = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text="ISP from IP geolocation"
    )
    
    additional_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data captured during trigger"
    )
    
    alert_sent = models.BooleanField(
        default=False,
        help_text="Whether an alert email was sent"
    )
    
    triggered_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the trigger occurred"
    )
    
    class Meta:
        verbose_name = "Canary Trap Trigger"
        verbose_name_plural = "Canary Trap Triggers"
        ordering = ['-triggered_at']
    
    def __str__(self):
        return f"Trigger for {self.trap.label} from {self.ip_address} at {self.triggered_at}"
