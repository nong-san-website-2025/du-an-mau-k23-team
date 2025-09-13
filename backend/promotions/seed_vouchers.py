# Run: python backend/promotions/seed_vouchers.py
import os
import sys
from pathlib import Path
from datetime import timedelta

# Ensure backend is on sys.path and Django is set up
BASE_BACKEND = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_BACKEND))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
from django.utils import timezone

django.setup()

from promotions.models import Voucher
from sellers.models import Seller


def seed():
    now = timezone.now()
    start = now - timedelta(days=1)
    end = now + timedelta(days=30)

    # System voucher (applies to all stores)
    sys_code = "SYS20K"
    v_sys, created_sys = Voucher.objects.get_or_create(
        code=sys_code,
        defaults={
            "scope": "system",
            "discount_amount": 20000,
            "min_order_value": 50000,
            "start_at": start,
            "end_at": end,
            "active": True,
            "title": "Giảm 20.000đ toàn sàn",
            "description": "Áp dụng cho đơn từ 50.000đ",
        },
    )

    # Seller voucher (applies to the first seller)
    seller = Seller.objects.order_by("id").first()
    if seller is None:
        print("[seed] Không tìm thấy Seller nào. Hãy tạo ít nhất 1 seller trước.")
        return

    seller_code = "SALE10"
    v_slr, created_slr = Voucher.objects.get_or_create(
        code=seller_code,
        defaults={
            "scope": "seller",
            "seller": seller,
            "discount_percent": 10,
            "min_order_value": 100000,
            "start_at": start,
            "end_at": end,
            "active": True,
            "title": f"Giảm 10% tại {seller.store_name}",
            "description": "Áp dụng cho đơn từ 100.000đ",
        },
    )

    print("[seed] System voucher:", v_sys.code, "created=" if created_sys else "exists")
    print("[seed] Seller voucher:", v_slr.code, "(seller=", seller.id, ")", "created=" if created_slr else "exists")


if __name__ == "__main__":
    seed()