
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('chat', '0001_initial'),
        ('sellers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='seller',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conversations', to='sellers.seller'),
        ),
    ]
