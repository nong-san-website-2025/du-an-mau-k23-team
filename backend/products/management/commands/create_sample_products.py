from django.core.management.base import BaseCommand
from products.models import Product
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

        created_count = 0
        for product_data in sample_products:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                seller=seller,
                defaults=product_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'Đã tạo sản phẩm: {product.name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Hoàn thành! Đã tạo {created_count} sản phẩm mới. '
                f'Tổng cộng có {Product.objects.count()} sản phẩm trong database.'
            )
        )