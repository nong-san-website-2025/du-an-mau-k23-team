from django.core.management.base import BaseCommand
from products.models import Product, Category, Subcategory
from sellers.models import Seller
from users.models import CustomUser

class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu đơn giản để test API'

    def handle(self, *args, **options):
        # Tạo user mẫu
        user, created = CustomUser.objects.get_or_create(
            email='seller@example.com',
            defaults={
                'username': 'seller_test',
                'first_name': 'Test',
                'last_name': 'Seller'
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(f'Đã tạo user: {user.email}')
        
        # Tạo seller mẫu
        seller, created = Seller.objects.get_or_create(
            user=user,
            defaults={
                'store_name': 'Cửa hàng mẫu',
                'bio': 'Cửa hàng bán thực phẩm sạch'
            }
        )
        
        if created:
            self.stdout.write(f'Đã tạo seller: {seller.store_name}')

        # Tạo categories
        categories_data = [
            {
                'name': 'Rau Củ Quả',
                'key': 'rau-cu-qua',
                'icon': 'Carrot',
                'subcategories': [
                    {
                        'name': 'Rau lá xanh',
                        'products': [
                            {
                                'name': 'Rau cải xanh API',
                                'description': 'Rau cải xanh từ API backend',
                                'price': 20000,
                                'unit': 'kg',
                                'stock': 100,
                                'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
                                'rating': 4.2,
                                'review_count': 30,
                                'is_new': True,
                                'is_organic': True,
                                'discount': 15,
                                'location': 'Đà Lạt',
                                'brand': 'API Farm',
                                'is_best_seller': False,
                            }
                        ]
                    }
                ]
            },
            {
                'name': 'Trái Cây',
                'key': 'trai-cay',
                'icon': 'Apple',
                'subcategories': [
                    {
                        'name': 'Trái cây nhiệt đới',
                        'products': [
                            {
                                'name': 'Xoài cát API',
                                'description': 'Xoài cát từ API backend',
                                'price': 50000,
                                'unit': 'kg',
                                'stock': 50,
                                'image': 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
                                'rating': 4.8,
                                'review_count': 120,
                                'is_new': False,
                                'is_organic': True,
                                'discount': 0,
                                'location': 'Tiền Giang',
                                'brand': 'API Fruit',
                                'is_best_seller': True,
                            }
                        ]
                    }
                ]
            }
        ]

        created_count = 0
        for cat_data in categories_data:
            # Tạo category
            category, created = Category.objects.get_or_create(
                key=cat_data['key'],
                defaults={
                    'name': cat_data['name'],
                    'icon': cat_data['icon']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'Đã tạo category: {category.name}')

            # Tạo subcategories và products
            for sub_data in cat_data['subcategories']:
                subcategory, created = Subcategory.objects.get_or_create(
                    category=category,
                    name=sub_data['name']
                )
                if created:
                    created_count += 1
                    self.stdout.write(f'Đã tạo subcategory: {subcategory.name}')

                # Tạo products
                for prod_data in sub_data['products']:
                    product, created = Product.objects.get_or_create(
                        name=prod_data['name'],
                        seller=seller,
                        defaults={
                            **prod_data,
                            'subcategory': subcategory
                        }
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(f'Đã tạo product: {product.name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Hoàn thành! Đã tạo {created_count} items mới.\n'
                f'Tổng cộng có {Category.objects.count()} categories, '
                f'{Subcategory.objects.count()} subcategories, '
                f'{Product.objects.count()} products trong database.'
            )
        )