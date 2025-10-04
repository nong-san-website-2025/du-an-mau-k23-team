# management/commands/seed_products.py
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
import random

from sellers.models import Seller
from products.models import Category, Subcategory, Product


class Command(BaseCommand):
    help = "Tạo 100 sản phẩm nông sản mẫu nếu chưa có, kèm danh mục, rating và review_count."

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # 1. Tạo seller mẫu nếu chưa có
            if not Seller.objects.exists():
                user = None
                # Nếu bạn có model User liên kết, hãy tạo user trước
                # Ví dụ: user = User.objects.create(username="seller1", ...)
                seller = Seller.objects.create(
                    user=user,
                    store_name="Nông Trại Xanh",
                    phone="0909123456",
                    address="Đà Lạt, Lâm Đồng"
                )
                self.stdout.write(self.style.SUCCESS("✅ Đã tạo seller mẫu."))
            else:
                seller = Seller.objects.first()

            # 2. Tạo categories
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
                {"name": "Vật tư nông nghiệp", "key": "agriculture_supplies", "icon": "Tool"},
            ]

            categories = {}
            for cat_data in categories_data:
                category, _ = Category.objects.get_or_create(
                    key=cat_data["key"],
                    defaults={"name": cat_data["name"], "icon": cat_data["icon"]},
                )
                categories[cat_data["key"]] = category

            # 3. Tạo subcategories
            subcategories_data = [
                ("fruits", "Trái cây nhiệt đới"),
                ("fruits", "Trái cây ôn đới"),
                ("vegetables", "Rau lá"),
                ("vegetables", "Củ quả"),
                ("processed", "Thịt chế biến"),
                ("processed", "Hải sản chế biến"),
                ("meat_eggs", "Thịt tươi"),
                ("meat_eggs", "Trứng"),
                ("dairy_drinks", "Sữa tươi"),
                ("dairy_drinks", "Nước ép"),
                ("grains_nuts", "Gạo & Ngũ cốc"),
                ("grains_nuts", "Hạt & Đậu"),
                ("spices_herbs", "Gia vị"),
                ("spices_herbs", "Rau thơm"),
                ("tea_coffee", "Trà"),
                ("tea_coffee", "Cà phê"),
                ("dried_jam", "Mứt & Hoa quả sấy"),
                ("dried_jam", "Hạt khô"),
                ("organic", "Rau hữu cơ"),
                ("organic", "Trái cây hữu cơ"),
                ("seafood", "Hải sản tươi"),
                ("agriculture_supplies", "Hạt giống & Phân bón"),
                ("agriculture_supplies", "Dụng cụ nông nghiệp"),
            ]

            subcategories = []
            for cat_key, sub_name in subcategories_data:
                sub, _ = Subcategory.objects.get_or_create(
                    category=categories[cat_key],
                    name=sub_name,
                )
                subcategories.append(sub)

            # 4. Dữ liệu mẫu
            product_names = [
                "Táo Fuji", "Cam Sành", "Chuối Tiêu", "Xoài Cát", "Dưa Hấu", "Nho Đỏ",
                "Dưa Chuột", "Cà Chua", "Cà Rốt", "Khoai Tây", "Bí Đỏ", "Ớt Chuông",
                "Thịt bò tươi", "Thịt gà", "Trứng gà ta", "Sữa tươi", "Nước ép cam",
                "Gạo Jasmine", "Hạt hạnh nhân", "Tỏi Lý Sơn", "Húng quế", "Trà xanh",
                "Cà phê rang xay", "Mứt dâu", "Hạt bí rang", "Rau hữu cơ Đà Lạt",
                "Táo hữu cơ", "Cá hồi", "Hạt giống cà chua", "Bình tưới cây",
                "Dâu tây Đà Lạt", "Khoai lang Nhật", "Bơ sáp", "Hạt điều",
                "Cải bó xôi", "Bắp Mỹ", "Trà thảo mộc", "Cà phê hạt Arabica",
                "Mứt xoài", "Hạt macca", "Măng tây", "Bưởi da xanh", "Sầu riêng Ri6",
                "Thanh long ruột đỏ", "Ổi không hạt", "Măng cụt", "Chôm chôm",
                "Đậu Hà Lan", "Bí ngòi", "Hành tím", "Gừng", "Nghệ", "Mật ong rừng",
                "Nấm linh chi", "Yến mạch", "Quinoa", "Hạt chia", "Dầu olive",
                "Giấm táo", "Nước mắm", "Tương ớt", "Mì gạo", "Bánh tráng",
                "Rong biển", "Tảo spirulina", "Bột nghệ", "Trà ô long", "Cà phê chồn",
                "Rượu vang", "Mật mía", "Đường thốt nốt", "Bánh pía", "Bánh ít",
                "Trà atiso", "Cà phê sữa đá", "Sinh tố bơ", "Nước dừa", "Rau má",
                "Lá lốt", "Lá chanh", "Lá dứa", "Hoa thiên lý", "Hoa chuối",
                "Củ dền", "Củ cải trắng", "Su hào", "Bắp cải", "Xà lách",
                "Rau muống", "Rau ngót", "Rau dền", "Rau mồng tơi", "Rau sam",
            ]

            # Làm sạch URL: loại bỏ khoảng trắng thừa
            image_urls = [
                "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce",
                "https://images.unsplash.com/photo-1572745590581-5c13a470b223",
                "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
                "https://images.unsplash.com/photo-1589923188900-4ae74f6e637d",
                "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
                "https://images.unsplash.com/photo-1592928302807-83d8c6cf2c02",
                "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2",
                "https://images.unsplash.com/photo-1600195077073-2d6bbd330f4b",
                "https://images.unsplash.com/photo-1604908177520-56b76a238a6a",
                "https://images.unsplash.com/photo-1603079550014-bfcb8c7c0f4f",
            ]

            # 5. Tạo sản phẩm (chỉ khi chưa có)
            existing_count = Product.objects.count()
            if existing_count >= 100:
                self.stdout.write(
                    self.style.WARNING(f"⚠️ Đã có {existing_count} sản phẩm. Không tạo thêm.")
                )
                return

            num_to_create = 100 - existing_count
            self.stdout.write(f"🌱 Sẽ tạo thêm {num_to_create} sản phẩm...")

            for i in range(num_to_create):
                name = f"{random.choice(product_names)} ({i + 1})"
                sub = random.choice(subcategories)
                price = Decimal(random.randint(10, 300) * 1000)  # 10k → 300k
                description = f"Sản phẩm {name} chất lượng cao, được chọn lọc kỹ lưỡng."
                image_url = random.choice(image_urls)

                Product.objects.create(
                    seller=seller,
                    category=sub.category,
                    subcategory=sub,
                    name=name,
                    description=description,
                    price=price,
                    unit="kg",
                    stock=random.randint(5, 100),
                    image=image_url,
                    rating=round(random.uniform(3.0, 5.0), 1),
                    review_count=random.randint(0, 200),
                    location="Đà Lạt",
                    brand="Nông sản Việt",
                    status="approved",
                )

            self.stdout.write(
                self.style.SUCCESS(f"✅ Đã tạo {num_to_create} sản phẩm nông sản mẫu.")
            )