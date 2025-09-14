# products/management/commands/reset_and_generate_products.py
from django.core.management.base import BaseCommand
from django.db import connection
from decimal import Decimal
import random

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
    help = "Xóa toàn bộ sản phẩm cũ, reset ID và tạo lại 50 sản phẩm nông sản mẫu trải đều 13 danh mục"

    def handle(self, *args, **kwargs):
        sellers = Seller.objects.all()
        if not sellers.exists():
            self.stdout.write(self.style.ERROR("⚠️ Chưa có seller nào. Hãy tạo seller trước."))
            return

        # 1. Xóa sản phẩm cũ
        Product.objects.all().delete()
        self.stdout.write(self.style.WARNING("🗑️ Đã xoá toàn bộ sản phẩm cũ."))

        # 2. Reset Auto Increment
        reset_autoincrement(Product)
        self.stdout.write(self.style.WARNING("🔄 Đã reset ID của bảng Product."))

        # 3. Tạo categories & subcategories
        categories_data = [
            {"name": "Trái cây", "key": "fruits", "icon": "Apple"},
            {"name": "Rau củ", "key": "vegetables", "icon": "Carrot"},
            {"name": "Thực phẩm chế biến", "key": "processed", "icon": "Box"},
            {"name": "Thịt & Trứng", "key": "meat_eggs", "icon": "Drumstick"},
            {"name": "Sữa & Đồ uống", "key": "dairy_drinks", "icon": "Milk"},
            {"name": "Ngũ cốc & Hạt", "key": "grains_nuts", "icon": "Wheat"},
            {"name": "Gia vị & Thảo mộc", "key": "spices_herbs", "icon": "Leaf"},
            {"name": "Trà & Cà phê", "key": "tea_coffee", "icon": "Coffee"},
            {"name": "Đồ khô & Mứt", "key": "dried_jam", "icon": "Gift"},
            {"name": "Hữu cơ & Sạch", "key": "organic", "icon": "Seedling"},
            {"name": "Hải sản tươi sống", "key": "seafood", "icon": "Fish"},
            {"name": "Đồ uống có cồn", "key": "alcohol", "icon": "Wine"},
            {"name": "Vật tư nông nghiệp", "key": "agriculture_supplies", "icon": "Tool"},
        ]

        categories = {}
        for cat_data in categories_data:
            category, _ = Category.objects.get_or_create(
                key=cat_data["key"],
                defaults={"name": cat_data["name"], "icon": cat_data["icon"]},
            )
            categories[cat_data["key"]] = category

        subcategories_data = [
            # Trái cây
            {"key": "fruits", "name": "Trái cây nhiệt đới"},
            {"key": "fruits", "name": "Trái cây ôn đới"},
            # Rau củ
            {"key": "vegetables", "name": "Rau lá"},
            {"key": "vegetables", "name": "Củ quả"},
            # Thực phẩm chế biến
            {"key": "processed", "name": "Thịt chế biến"},
            {"key": "processed", "name": "Hải sản chế biến"},
            # Thịt & Trứng
            {"key": "meat_eggs", "name": "Thịt tươi"},
            {"key": "meat_eggs", "name": "Trứng"},
            # Sữa & Đồ uống
            {"key": "dairy_drinks", "name": "Sữa tươi"},
            {"key": "dairy_drinks", "name": "Nước ép"},
            # Ngũ cốc & Hạt
            {"key": "grains_nuts", "name": "Gạo & Ngũ cốc"},
            {"key": "grains_nuts", "name": "Hạt & Đậu"},
            # Gia vị & Thảo mộc
            {"key": "spices_herbs", "name": "Gia vị"},
            {"key": "spices_herbs", "name": "Rau thơm"},
            # Trà & Cà phê
            {"key": "tea_coffee", "name": "Trà"},
            {"key": "tea_coffee", "name": "Cà phê"},
            # Đồ khô & Mứt
            {"key": "dried_jam", "name": "Mứt & Hoa quả sấy"},
            {"key": "dried_jam", "name": "Hạt khô"},
            # Hữu cơ & Sạch
            {"key": "organic", "name": "Rau hữu cơ"},
            {"key": "organic", "name": "Trái cây hữu cơ"},
            # Hải sản tươi sống
            {"key": "seafood", "name": "Hải sản tươi"},
            # Đồ uống có cồn
            {"key": "alcohol", "name": "Rượu vang & Bia"},
            # Vật tư nông nghiệp
            {"key": "agriculture_supplies", "name": "Hạt giống & Phân bón"},
            {"key": "agriculture_supplies", "name": "Dụng cụ nông nghiệp"},
        ]

        subcategories = {}
        for sub_data in subcategories_data:
            subcategory, _ = Subcategory.objects.get_or_create(
                category=categories[sub_data["key"]],
                name=sub_data["name"],
            )
            subcategories[sub_data["name"]] = subcategory

        # 4. Tạo 50 sản phẩm mẫu trải đều
        products_data = [
            # Trái cây
            ("Táo Fuji", 50000, "Trái cây ôn đới", "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce"),
            ("Cam Sành", 40000, "Trái cây nhiệt đới", "https://images.unsplash.com/photo-1572745590581-5c13a470b223"),
            ("Chuối Tiêu", 30000, "Trái cây nhiệt đới", "https://images.unsplash.com/photo-1574226516831-e1dff420e43e"),
            ("Xoài Cát", 60000, "Trái cây nhiệt đới", "https://images.unsplash.com/photo-1589923188900-4ae74f6e637d"),
            ("Dưa Hấu", 25000, "Trái cây nhiệt đới", "https://images.unsplash.com/photo-1574226516831-e1dff420e43e"),
            ("Nho Đỏ", 35000, "Trái cây ôn đới", "https://images.unsplash.com/photo-1506806732259-39c2d0268443"),
            # Rau củ
            ("Dưa Chuột", 15000, "Rau lá", "https://images.unsplash.com/photo-1592928302807-83d8c6cf2c02"),
            ("Cà Chua", 20000, "Rau lá", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
            ("Cà Rốt", 10000, "Rau lá", "https://images.unsplash.com/photo-1582515073490-3998136b1b50"),
            ("Khoai Tây", 18000, "Củ quả", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Bí Đỏ", 35000, "Củ quả", "https://images.unsplash.com/photo-1600195077073-2d6bbd330f4b"),
            ("Ớt Chuông", 20000, "Củ quả", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Thịt & Trứng
            ("Thịt bò tươi", 150000, "Thịt tươi", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Thịt gà", 90000, "Thịt tươi", "https://images.unsplash.com/photo-1612874743740-5221f5f89eb3"),
            ("Trứng gà ta", 30000, "Trứng", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
            # Sữa & Đồ uống
            ("Sữa tươi Vinamilk", 25000, "Sữa tươi", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Nước ép cam", 30000, "Nước ép", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Ngũ cốc & Hạt
            ("Gạo Jasmine", 40000, "Gạo & Ngũ cốc", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Hạt hạnh nhân", 120000, "Hạt & Đậu", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Gia vị & Thảo mộc
            ("Tỏi Lý Sơn", 10000, "Gia vị", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Húng quế", 8000, "Rau thơm", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
            # Trà & Cà phê
            ("Trà xanh", 50000, "Trà", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Cà phê rang xay", 120000, "Cà phê", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Đồ khô & Mứt
            ("Mứt dâu", 60000, "Mứt & Hoa quả sấy", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Hạt bí rang", 50000, "Hạt khô", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
            # Hữu cơ & Sạch
            ("Rau hữu cơ Đà Lạt", 30000, "Rau hữu cơ", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Táo hữu cơ", 70000, "Trái cây hữu cơ", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Hải sản tươi sống
            ("Cá hồi", 250000, "Hải sản tươi", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            # Đồ uống có cồn
            ("Rượu vang đỏ", 350000, "Rượu vang & Bia", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Vật tư nông nghiệp
            ("Hạt giống cà chua", 15000, "Hạt giống & Phân bón", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Bình tưới cây", 250000, "Dụng cụ nông nghiệp", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            # Thêm các sản phẩm lấp đầy 50 sản phẩm
            ("Dâu tây Đà Lạt", 65000, "Trái cây ôn đới", "https://images.unsplash.com/photo-1560807707-8cc77767d783"),
            ("Khoai lang Nhật", 22000, "Củ quả", "https://images.unsplash.com/photo-1574226516831-e1dff420e43e"),
            ("Bơ sáp", 50000, "Trái cây nhiệt đới", "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce"),
            ("Hạt điều", 150000, "Hạt & Đậu", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            ("Cải bó xôi", 12000, "Rau lá", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
            ("Bắp Mỹ", 18000, "Củ quả", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Trà thảo mộc", 40000, "Trà", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"),
            ("Cà phê hạt Arabica", 150000, "Cà phê", "https://images.unsplash.com/photo-1604908177520-56b76a238a6a"),
            ("Mứt xoài", 60000, "Mứt & Hoa quả sấy", "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f"),
            ("Hạt hạnh nhân rang", 120000, "Hạt khô", "https://images.unsplash.com/photo-1584270354949-51b55ff7e3e2"),
        ]

        for name, price, sub_name, image_url in products_data:
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
                status="approved",
                image=image_url
            )

        self.stdout.write(self.style.SUCCESS("✅ Đã reset và tạo lại 50 sản phẩm nông sản mẫu trải đều 13 danh mục."))
