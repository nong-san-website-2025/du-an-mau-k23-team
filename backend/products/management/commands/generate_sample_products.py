# products/management/commands/reset_and_generate_products.py
from django.core.management.base import BaseCommand
from django.db import connection
from decimal import Decimal
import random
from datetime import datetime

from sellers.models import Seller
from products.models import Category, Subcategory, Product


def reset_autoincrement(model):
    """Reset lại Auto Increment ID cho bảng của model"""
    table = model._meta.db_table
    with connection.cursor() as cursor:
        if connection.vendor == 'sqlite':
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
        elif connection.vendor == 'postgresql':
            cursor.execute(f"ALTER SEQUENCE {table}_id_seq RESTART WITH 1")
        elif connection.vendor == 'mysql':
            cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")


class Command(BaseCommand):
    help = "Xóa toàn bộ sản phẩm cũ, reset ID và tạo lại 20 sản phẩm mẫu"

    def handle(self, *args, **kwargs):
        sellers = Seller.objects.all()
        if not sellers.exists():
            self.stdout.write(self.style.ERROR("⚠️ Chưa có seller nào. Hãy tạo seller trước."))
            return

        # 1. Xóa toàn bộ sản phẩm cũ
        Product.objects.all().delete()
        self.stdout.write(self.style.WARNING("🗑️ Đã xoá toàn bộ sản phẩm cũ."))

        # 2. Reset Auto Increment ID
        reset_autoincrement(Product)
        self.stdout.write(self.style.WARNING("🔄 Đã reset ID của bảng Product."))

        # 3. Tạo lại categories & subcategories
        categories_data = [
            {"name": "Trái cây", "key": "fruits", "icon": "Apple"},
            {"name": "Rau củ", "key": "vegetables", "icon": "Carrot"},
            {"name": "Thực phẩm chế biến", "key": "processed", "icon": "Box"},
        ]

        categories = {}
        for cat_data in categories_data:
            category, _ = Category.objects.get_or_create(
                key=cat_data["key"],
                defaults={"name": cat_data["name"], "icon": cat_data["icon"]},
            )
            categories[cat_data["key"]] = category

        subcategories_data = [
            {"key": "fruits", "name": "Trái cây nhiệt đới"},
            {"key": "fruits", "name": "Trái cây ôn đới"},
            {"key": "vegetables", "name": "Rau lá"},
            {"key": "vegetables", "name": "Củ quả"},
            {"key": "processed", "name": "Thịt chế biến"},
            {"key": "processed", "name": "Hải sản chế biến"},
        ]

        subcategories = {}
        for sub_data in subcategories_data:
            subcategory, _ = Subcategory.objects.get_or_create(
                category=categories[sub_data["key"]],
                name=sub_data["name"],
            )
            subcategories[sub_data["name"]] = subcategory

        # 4. Danh sách 20 sản phẩm mẫu
        products_data = [
            ("Táo Mỹ", 50, "Trái cây ôn đới"),
            ("Cam Sành", 40, "Trái cây nhiệt đới"),
            ("Chuối Tiêu", 30, "Trái cây nhiệt đới"),
            ("Xoài Cát", 60, "Trái cây nhiệt đới"),

            ("Cà rốt Đà Lạt", 25, "Rau lá"),
            ("Khoai Tây", 20, "Củ quả"),
            ("Bí Đỏ", 15, "Củ quả"),
            ("Bắp Cải", 18, "Rau lá"),

            ("Thịt Bò Úc", 200, "Thịt chế biến"),
            ("Cá Hồi Nauy", 250, "Hải sản chế biến"),
            ("Thịt Gà Ta", 120, "Thịt chế biến"),
            ("Tôm Sú", 180, "Hải sản chế biến"),

            ("iPhone 15", 25000, "Trái cây nhiệt đới"),
            ("Samsung Galaxy S23", 20000, "Trái cây ôn đới"),
            ("Xiaomi Redmi Note", 7000, "Rau lá"),

            ("MacBook Pro", 40000, "Củ quả"),
            ("Dell XPS 13", 35000, "Thịt chế biến"),
            ("HP Pavilion", 15000, "Hải sản chế biến"),

            ("Tai nghe AirPods", 5000, "Rau lá"),
            ("Chuột Logitech", 800, "Củ quả"),
        ]

        for name, price, sub_name in products_data:
            sub = subcategories.get(sub_name)
            if not sub:
                self.stdout.write(self.style.ERROR(f"⚠️ Subcategory '{sub_name}' chưa tồn tại!"))
                continue

            seller = random.choice(sellers)

            Product.objects.create(
                seller=seller,
                name=name,
                price=Decimal(price),
                stock=random.randint(5, 50),
                subcategory=sub,
                status="active",
            )

        self.stdout.write(self.style.SUCCESS("✅ Đã reset và tạo lại 20 sản phẩm mẫu (ID chạy từ 1 → 20)."))
