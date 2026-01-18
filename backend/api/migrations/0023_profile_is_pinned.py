# Generated migration for adding is_pinned field to Profile model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_curatedorganization_logo_image_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='is_pinned',
            field=models.BooleanField(default=False, help_text='Pin this profile to the top of the list'),
        ),
    ]
