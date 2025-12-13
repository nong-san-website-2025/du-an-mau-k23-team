# Generated migration for adding GHN shipping address fields to Seller

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sellers', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='seller',
            name='district_id',
            field=models.IntegerField(blank=True, help_text='GHN DistrictID for shipping fee calculation', null=True),
        ),
        migrations.AddField(
            model_name='seller',
            name='ward_code',
            field=models.CharField(blank=True, help_text='GHN WardCode for shipping fee calculation', max_length=20, null=True),
        ),
    ]
