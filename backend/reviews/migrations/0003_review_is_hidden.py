# Generated manually for adding is_hidden field to Review model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reviews', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='review',
            name='is_hidden',
            field=models.BooleanField(default=False, help_text='Admin can hide inappropriate reviews'),
        ),
    ]