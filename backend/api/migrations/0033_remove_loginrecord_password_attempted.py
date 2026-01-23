# Generated migration to remove password_attempted field
# SECURITY: This field violated zero-knowledge architecture by storing plaintext passwords

from django.db import migrations


class Migration(migrations.Migration):
    """
    Remove password_attempted field from LoginRecord.
    
    SECURITY RATIONALE:
    The password_attempted field was storing plaintext passwords for failed login attempts.
    This is a critical zero-knowledge violation because:
    1. Passwords should NEVER be stored on the server
    2. Even failed login attempts could contain valid passwords for other services
    3. Database breaches would expose these passwords
    
    With this migration, only auth_hash-based authentication is supported.
    """

    dependencies = [
        ('api', '0032_add_duress_auth_hash'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='loginrecord',
            name='password_attempted',
        ),
    ]
