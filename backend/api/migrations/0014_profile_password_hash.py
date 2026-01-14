from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_profile_is_breached_profile_last_breach_check_date_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='password_hash',
            field=models.CharField(blank=True, help_text='SHA-256 hash of password for uniqueness checking (not for authentication)', max_length=64, null=True),
        ),
    ]
