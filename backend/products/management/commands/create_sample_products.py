from django.core.management.base import BaseCommand
from products.models import Product, Subcategory
from sellers.models import Seller

class Command(BaseCommand):
    help = 'Tạo dữ liệu sản phẩm mẫu'

    def handle(self, *args, **options):
        # Tạo seller mẫu nếu chưa có
        seller, created = Seller.objects.get_or_create(
            name="Nông trại Xanh",
            defaults={
                'email': 'nongtrai@example.com',
                'phone': '0123456789',
                'address': 'Đà Lạt, Lâm Đồng'
            }
        )
        
        if created:
            self.stdout.write(f'Đã tạo seller: {seller.name}')

        # Dữ liệu sản phẩm mẫu
        sample_products = [
            {
                'name': 'Rau cải xanh hữu cơ',
                'description': 'Rau cải xanh tươi ngon, giàu vitamin, được trồng hữu cơ tại Đà Lạt.',
                'price': 18000,
                'stock': 100,
            },
            {
                'name': 'Củ cải trắng',
                'description': 'Củ cải trắng tươi ngon, thích hợp nấu canh và làm kimchi.',
                'price': 35000,
                'stock': 50,
            },
            {
                'name': 'Nấm hương khô',
                'description': 'Nấm hương khô cao cấp, thơm ngon bổ dưỡng từ Sapa.',
                'price': 120000,
                'stock': 25,
            },
            {
                'name': 'Rau thơm tổng hợp',
                'description': 'Gói rau thơm tổng hợp: húng quế, ngò, tía tô tươi ngon.',
                'price': 15000,
                'stock': 80,
            },
            {
                'name': 'Cà chua bi',
                'description': 'Cà chua bi ngọt, tươi ngon, giàu vitamin C.',
                'price': 25000,
                'stock': 60,
            },
            {
                'name': 'Xà lách xoăn',
                'description': 'Xà lách xoăn tươi giòn, thích hợp làm salad.',
                'price': 20000,
                'stock': 40,
            },
        ]

        # Map tên sản phẩm với subcategory (phải khớp với tên subcategory trong DB)
        product_sub_map = {
            'Rau cải xanh hữu cơ': 'Rau lá xanh',
            'Củ cải trắng': 'Củ quả',
            'Nấm hương khô': 'Nấm các loại',
            'Rau thơm tổng hợp': 'Rau thơm',
            'Cà chua bi': 'Củ quả',
            'Xà lách xoăn': 'Rau lá xanh',
        }

        created_count = 0
        for product_data in sample_products:
            sub_name = product_sub_map.get(product_data['name'])
            try:
                sub = Subcategory.objects.get(name=sub_name)
            except Subcategory.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Subcategory "{sub_name}" không tồn tại, bỏ qua sản phẩm {product_data["name"]}'))
                continue
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                seller=seller,
                subcategory=sub,
                defaults=product_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'Đã tạo sản phẩm: {product.name} (subcategory: {sub.name})')

        self.stdout.write(
            self.style.SUCCESS(
                f'Hoàn thành! Đã tạo {created_count} sản phẩm mới. '
                f'Tổng cộng có {Product.objects.count()} sản phẩm trong database.'
            )
        )