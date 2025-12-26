# promotions/management/commands/seed_promotions.py
import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction

from promotions.models import Promotion, Voucher, FlashSale, FlashSaleProduct, UserVoucher
from sellers.models import Seller
from products.models import Product
from users.models import CustomUser

class Command(BaseCommand):
    help = "Seed data for Promotions and Vouchers"

    def handle(self, *args, **kwargs):
        self.stdout.write("Checking current data...")
        
        # 1. Xóa dữ liệu cũ để tránh lỗi UNIQUE (Tùy chọn - khuyên dùng khi dev)
        # Promotion.objects.all().delete()
        # FlashSale.objects.all().delete()

        admin_user = CustomUser.objects.filter(role__name="admin").first() or CustomUser.objects.first()
        sellers = list(Seller.objects.all())
        products = list(Product.objects.all())

        if not sellers or not products:
            self.stdout.write(self.style.ERROR("Cần có Seller và Product trong DB trước!"))
            return

        with transaction.atomic():
            self.stdout.write("Seeding Vouchers...")
            for i in range(1, 16):
                code = f"PROMO{i:03d}" # Đổi tiền tố để tránh trùng mã cũ
                
                # Sử dụng update_or_create để nếu có rồi thì cập nhật, chưa có thì tạo mới
                promo, _ = Promotion.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": f"Chiến dịch {code}",
                        "type": Promotion.TYPE_VOUCHER,
                        "start": timezone.now(),
                        "end": timezone.now() + timedelta(days=30),
                        "active": True,
                        "created_by": admin_user
                    }
                )

                # Cấu hình Voucher
                discount_type = random.choice(["freeship", "percent", "amount"])
                
                Voucher.objects.update_or_create(
                    code=code,
                    defaults={
                        "promotion": promo,
                        "title": f"Voucher Giảm Giá {i}",
                        "scope": random.choice([Voucher.Scope.SYSTEM, Voucher.Scope.SELLER]),
                        "seller": random.choice(sellers) if random.random() > 0.5 else None,
                        "freeship_amount": random.randint(10000, 20000) if discount_type == "freeship" else None,
                        "discount_percent": random.choice([10, 20]) if discount_type == "percent" else None,
                        "discount_amount": random.randint(20000, 50000) if discount_type == "amount" else None,
                        "total_quantity": 100,
                        "start_at": timezone.now(),
                        "end_at": timezone.now() + timedelta(days=30),
                        "created_by": admin_user
                    }
                )

            self.stdout.write(self.style.SUCCESS("Successfully seeded Vouchers and Flash Sales!"))