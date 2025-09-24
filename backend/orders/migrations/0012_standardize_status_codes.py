from django.db import migrations


OLD_TO_NEW = {
    'delivering': 'out_for_delivery',
    'delivery_fail': 'delivery_failed',
    'damage': 'damaged',
    'return': 'returned',
}

NEW_TO_OLD = {v: k for k, v in OLD_TO_NEW.items()}


def forwards(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for old, new in OLD_TO_NEW.items():
        Order.objects.filter(status=old).update(status=new)


def backwards(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for new, old in NEW_TO_OLD.items():
        Order.objects.filter(status=new).update(status=old)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0011_order_ghn_order_code_alter_order_status'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]