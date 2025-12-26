from django.core.management.base import BaseCommand
from django.conf import settings
import traceback


class Command(BaseCommand):
    help = "Debug Product list serialization to reproduce 500 error locally"

    def add_arguments(self, parser):
        parser.add_argument('--status', type=str, default='action_required')
        parser.add_argument('--risk', type=str, default='all')
        parser.add_argument('--page', type=int, default=1)
        parser.add_argument('--page_size', type=int, default=10)

    def handle(self, *args, **options):
        from products.models import Product
        from products.serializers import ProductListSerializer
        from django.utils.timezone import now, timedelta

        status = options.get('status')
        risk = options.get('risk')
        page = options.get('page')
        page_size = options.get('page_size')

        try:
            qs = Product.objects.select_related('subcategory__category', 'seller').prefetch_related('images')

            if status == 'action_required':
                qs = qs.filter(status__in=['pending', 'pending_update'])
            elif status != 'all':
                qs = qs.filter(status=status)

            if risk == 'new_shop':
                seven_days_ago = now() - timedelta(days=7)
                qs = qs.filter(seller__created_at__gte=seven_days_ago)

            start = (page - 1) * page_size
            end = start + page_size
            items = list(qs.order_by('-created_at')[start:end])

            print(f"Serializing {len(items)} products (start={start}, end={end})")
            ser = ProductListSerializer(items, many=True, context={'request': None})
            data = ser.data
            print("SUCCESS: Serialized data length:", len(data))
        except Exception as e:
            print("EXCEPTION during serialization:")
            traceback.print_exc()