# Generated migration for Zero-Knowledge Vault Architecture
# This adds vault_blob and auth_hash fields to UserProfile for true zero-knowledge encryption

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_profile_password_hash'),  # Latest migration
    ]

    operations = [
        # Add vault_blob field - stores entire encrypted vault (server cannot read)
        migrations.AddField(
            model_name='userprofile',
            name='vault_blob',
            field=models.TextField(
                blank=True,
                null=True,
                help_text='Encrypted vault blob (server cannot decrypt - zero-knowledge)'
            ),
        ),
        
        # Add decoy_vault_blob for duress mode (plausible deniability)
        migrations.AddField(
            model_name='userprofile',
            name='decoy_vault_blob',
            field=models.TextField(
                blank=True,
                null=True,
                help_text='Encrypted decoy vault for duress mode (server cannot decrypt)'
            ),
        ),
        
        # Add duress_salt - separate salt for duress vault
        migrations.AddField(
            model_name='userprofile',
            name='duress_salt',
            field=models.CharField(
                max_length=255,
                blank=True,
                null=True,
                help_text='Salt for duress password key derivation'
            ),
        ),
        
        # Add auth_hash - for password verification without knowing password
        migrations.AddField(
            model_name='userprofile',
            name='auth_hash',
            field=models.CharField(
                max_length=128,
                blank=True,
                null=True,
                help_text='Auth hash for login verification (derived from password, not reversible)'
            ),
        ),
        
        # Add vault_version for schema migrations
        migrations.AddField(
            model_name='userprofile',
            name='vault_version',
            field=models.CharField(
                max_length=20,
                default='1.0.0',
                help_text='Version of the vault encryption schema'
            ),
        ),
        
        # Add last_vault_sync timestamp
        migrations.AddField(
            model_name='userprofile',
            name='last_vault_sync',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Last time vault was synced from client'
            ),
        ),
    ]
