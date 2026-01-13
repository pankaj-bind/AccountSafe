# api/signals.py

import os
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a UserProfile when a new User is created.
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Automatically save the UserProfile when the User is saved.
    """
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()


@receiver(pre_save, sender=Profile)
def delete_old_document_on_update(sender, instance, **kwargs):
    """
    Delete old document file when updating with a new one.
    """
    if not instance.pk:
        return False

    try:
        old_profile = Profile.objects.get(pk=instance.pk)
    except Profile.DoesNotExist:
        return False

    # Check if document field has changed
    if old_profile.document and old_profile.document != instance.document:
        # Delete the old file
        try:
            if os.path.isfile(old_profile.document.path):
                os.remove(old_profile.document.path)
        except Exception as e:
            # Log the error but continue with the update
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error deleting old file {old_profile.document.path}: {e}")


@receiver(pre_delete, sender=Profile)
def delete_profile_document(sender, instance, **kwargs):
    """
    Automatically delete the document file when a Profile is deleted.
    """
    if instance.document:
        try:
            if os.path.isfile(instance.document.path):
                os.remove(instance.document.path)
        except Exception as e:
            # Log the error but don't prevent deletion
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error deleting file {instance.document.path}: {e}")
