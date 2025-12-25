from django.core.management.base import BaseCommand
from django.utils import timezone
from reviews.models import Review, ReviewImage
from products.models import Product
from users.models import CustomUser
from django.db import IntegrityError
import random
from faker import Faker
from datetime import timedelta

fake = Faker(['vi_VN', 'en_US'])


class Command(BaseCommand):
    help = 'Seed 500 review data for products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=500,
            help='Number of reviews to create (default: 500)'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        products = list(Product.objects.all())
        users = list(CustomUser.objects.all())

        if not products:
            self.stdout.write(self.style.ERROR('❌ Không có sản phẩm nào trong hệ thống'))
            return

        if not users:
            self.stdout.write(self.style.ERROR('❌ Không có người dùng nào trong hệ thống'))
            return

        self.stdout.write(f'📝 Bắt đầu tạo {count} đánh giá...')
        self.stdout.write(f'✓ Sản phẩm: {len(products)}, Người dùng: {len(users)}')

        created_count = 0
        skipped_count = 0
        comment_templates = [
            "Sản phẩm chất lượng, giao hàng nhanh!",
            "Rất hài lòng với chất lượng này",
            "Giá tốt, hàng đúng như mô tả",
            "Sản phẩm tuyệt vời, sẽ mua lại",
            "Chất lượng ổn, đóng gói cẩn thận",
            "Giao hàng nhanh, sản phẩm như hình",
            "Rất thích, cảm ơn cửa hàng",
            "Hàng tốt, shop tốt bụng",
            "Sẽ recommend cho bạn bè",
            "Giá rẻ, chất lượng tốt",
            "Không tiếc tiền, sẽ mua tiếp",
            "Tuyệt vời! Rất hài lòng",
            "Chất lượng vượt mong đợi",
            "Shop chuyên nghiệp, sản phẩm tốt",
            "Rất nhanh giao hàng và tốt",
        ]

        for i in range(count):
            try:
                product = random.choice(products)
                user = random.choice(users)
                rating = random.randint(3, 5)
                comment = random.choice(comment_templates)

                created_at = timezone.now() - timedelta(days=random.randint(1, 365))
                review = Review.objects.create(
                    user=user,
                    product=product,
                    rating=rating,
                    comment=comment,
                    created_at=created_at,
                    is_hidden=False
                )

                created_count += 1

                if (i + 1) % 50 == 0:
                    self.stdout.write(f'✓ Đã tạo {i + 1}/{count} đánh giá')

            except IntegrityError:
                skipped_count += 1
                continue
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'⚠ Lỗi tạo review: {str(e)}'))
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Hoàn tất!\n'
                f'   📊 Đánh giá tạo: {created_count}\n'
                f'   ⏭ Bỏ qua (trùng): {skipped_count}'
            )
        )
