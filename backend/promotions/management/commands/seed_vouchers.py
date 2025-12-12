# promotions/management/commands/seed_vouchers.py
import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from promotions.models import Voucher
from store.models import Store
from django.conf import settings
from users.models import CustomUser


class Command(BaseCommand):
    help = "Seed 20 sample vouchers"

    def handle(self, *args, **kwargs):
        now = timezone.now()
        start_at = now
        end_at = now + timedelta(days=5)

        # Lấy danh sách seller từ store nếu có
        sellers = list(Store.objects.all())

        # Người tạo voucher (admin)
        admin_user = CustomUser.objects.filter(role__name="admin").first()

        for i in range(1, 21):
            # Random loại giảm giá
            discount_type = random.choice(["freeship", "percent", "amount"])

            freeship_amount = None
            discount_percent = None
            discount_amount = None

            if discount_type == "freeship":
                freeship_amount = random.randint(10000, 50000)  # 10k - 50k
            elif discount_type == "percent":
                discount_percent = random.choice([5, 10, 15, 20])  # %
            elif discount_type == "amount":
                discount_amount = random.randint(20000, 100000)  # 20k - 100k

            # Random scope: system hoặc seller
            scope = random.choice([Voucher.Scope.SYSTEM, Voucher.Scope.SELLER])
            seller = None
            if scope == Voucher.Scope.SELLER and sellers:
                seller = random.choice(sellers)

            # Random distribution type
            distribution_type = random.choice([Voucher.DistributionType.CLAIM, Voucher.DistributionType.DIRECT])

            code = f"VOUCHER{i:03d}"

            voucher, created = Voucher.objects.get_or_create(
                code=code,
                defaults={
                    "title": f"Voucher Khuyến Mãi {i}",
                    "description": f"Đây là voucher mẫu số {i} để thử nghiệm hệ thống.",
                    "scope": scope,
                    "seller": seller,
                    "distribution_type": distribution_type,
                    "freeship_amount": freeship_amount,
                    "discount_percent": discount_percent,
                    "discount_amount": discount_amount,
                    "total_quantity": random.randint(50, 200),
                    "per_user_quantity": 1,
                    "min_order_value": random.randint(50000, 200000),
                    "max_discount_amount": random.randint(50000, 150000) if discount_percent else None,
                    "start_at": start_at,
                    "end_at": end_at,
                    "active": True,
                    "created_by": admin_user,
                },
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created voucher: {voucher.code} ({discount_type})"))
            else:
                self.stdout.write(self.style.WARNING(f"Voucher {voucher.code} already exists"))
