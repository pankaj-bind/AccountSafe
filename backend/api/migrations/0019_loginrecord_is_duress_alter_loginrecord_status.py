# Generated migration for adding is_duress field to LoginRecord

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_add_duress_and_panic_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='loginrecord',
            name='is_duress',
            field=models.BooleanField(default=False, help_text='True if this was a duress password login'),
        ),
        migrations.AlterField(
            model_name='loginrecord',
            name='status',
            field=models.CharField(choices=[('success', 'Success'), ('failed', 'Failed'), ('duress', 'Duress')], max_length=10),
        ),
    ]
