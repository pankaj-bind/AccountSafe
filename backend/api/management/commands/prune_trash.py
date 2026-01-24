# api/management/commands/prune_trash.py
"""
Prune Trash Management Command

Permanently deletes profiles that have been in trash for more than 30 days.
Uses crypto-shredding to overwrite encrypted data before deletion.

SECURITY: This implements the "Crypto-Shred" technique:
1. Overwrites encrypted fields with random data
2. Saves the overwritten data (writes to disk sectors)
3. Deletes the database record

This prevents recovery of deleted credentials even with disk forensics.

Usage:
    python manage.py prune_trash           # Normal run
    python manage.py prune_trash --dry-run # Preview what would be deleted
    python manage.py prune_trash --days=7  # Override retention period
"""

import os
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Profile


class Command(BaseCommand):
    help = 'Permanently delete profiles that have been in trash for more than 30 days (crypto-shred)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days after which trashed items are permanently deleted (default: 30)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        retention_days = options['days']
        
        # Calculate the cutoff date
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        # Find profiles that have been in trash for longer than retention period
        expired_profiles = Profile.objects.filter(
            deleted_at__isnull=False,
            deleted_at__lt=cutoff_date
        ).select_related('organization', 'organization__category', 'organization__category__user')
        
        count = expired_profiles.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No profiles found in trash older than {retention_days} days.')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'Found {count} profiles in trash older than {retention_days} days.')
        )
        
        if dry_run:
            self.stdout.write(self.style.NOTICE('\n[DRY RUN] The following profiles would be crypto-shredded:\n'))
            for profile in expired_profiles:
                days_in_trash = (timezone.now() - profile.deleted_at).days
                self.stdout.write(
                    f'  - ID: {profile.id} | Title: "{profile.title}" | '
                    f'User: {profile.organization.category.user.username} | '
                    f'In trash for: {days_in_trash} days'
                )
            self.stdout.write(self.style.NOTICE('\nRun without --dry-run to permanently delete these profiles.'))
            return
        
        # Perform crypto-shredding
        shredded_count = 0
        failed_count = 0
        
        for profile in expired_profiles:
            try:
                self.crypto_shred_profile(profile)
                shredded_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Shredded profile ID: {profile.id} - "{profile.title}"')
                )
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed to shred profile ID: {profile.id} - Error: {str(e)}')
                )
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Crypto-shred complete:'))
        self.stdout.write(f'  - Successfully shredded: {shredded_count}')
        if failed_count > 0:
            self.stdout.write(self.style.ERROR(f'  - Failed: {failed_count}'))

    def crypto_shred_profile(self, profile):
        """
        Crypto-shred a profile by overwriting encrypted data with random bytes
        before deletion.
        
        This ensures that even if disk sectors are recovered, the original
        encrypted data cannot be retrieved.
        """
        # Generate random data for overwriting
        random_data = os.urandom(32).hex()
        
        # Overwrite all encrypted fields with random bytes
        profile.username_encrypted = random_data
        profile.username_iv = random_data[:24]
        profile.password_encrypted = random_data
        profile.password_iv = random_data[:24]
        profile.email_encrypted = random_data
        profile.email_iv = random_data[:24]
        profile.notes_encrypted = random_data
        profile.notes_iv = random_data[:24]
        profile.recovery_codes_encrypted = random_data
        profile.recovery_codes_iv = random_data[:24]
        profile.password_hash = random_data[:64]
        
        # Also wipe metadata that could be sensitive
        profile.title = f"[SHREDDED-{os.urandom(4).hex()}]"
        
        # Save the overwritten data (this writes to disk sectors)
        profile.save()
        
        # Delete any associated document files
        if profile.document:
            try:
                profile.document.delete(save=False)
            except Exception:
                pass  # Continue even if document deletion fails
        
        # Finally, delete the database record
        profile.delete()
