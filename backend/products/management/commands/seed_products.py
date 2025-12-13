from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
import random

from sellers.models import Seller
from products.models import Category, Subcategory, Product


class Command(BaseCommand):
    help = "Tạo 100 sản phẩm nông sản mẫu, phân phối đều cho các seller."

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # 1. Lấy danh sách tất cả Seller hiện có
            sellers = list(Seller.objects.all())

            # Nếu chưa có seller nào, tạo 1 seller mẫu để làm fallback
            if not sellers:
                self.stdout.write(self.style.WARNING(" Chưa có Seller nào, đang tạo Seller mẫu 'Nông Trại Xanh'..."))
                default_seller = Seller.objects.create(
                    user=None,
                    store_name="Nông Trại Xanh",
                    phone="0909123456",
                    address="Đà Lạt, Lâm Đồng",
                    status="approved" # Đảm bảo seller này active
                )
                sellers.append(default_seller)
            else:
                self.stdout.write(self.style.SUCCESS(f" Tìm thấy {len(sellers)} seller để phân phối sản phẩm."))

            # 2. Tạo categories (Giữ nguyên)
            categories_data = [
                {"name": "Trái cây", "key": "fruits"},
                {"name": "Rau củ", "key": "vegetables"},
                {"name": "Thực phẩm chế biến", "key": "processed"},
                {"name": "Thịt & Trứng", "key": "meat_eggs"},
                {"name": "Sữa & Đồ uống", "key": "dairy_drinks"},
                {"name": "Ngũ cốc & Hạt", "key": "grains_nuts"},
                {"name": "Gia vị & Thảo mộc", "key": "spices_herbs"},
                {"name": "Trà & Cà phê", "key": "tea_coffee"},
                {"name": "Đồ khô & Mứt", "key": "dried_jam"},
                {"name": "Hữu cơ & Sạch", "key": "organic"},
                {"name": "Hải sản tươi sống", "key": "seafood"},
                {"name": "Vật tư nông nghiệp", "key": "agriculture_supplies"},
            ]

            categories = {}
            for cat_data in categories_data:
                category, _ = Category.objects.get_or_create(
                    key=cat_data["key"],
                    defaults={"name": cat_data["name"]},
                )
                categories[cat_data["key"]] = category

            # 3. Tạo subcategories (Giữ nguyên)
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

            # 4. Dữ liệu tên sản phẩm mẫu (Giữ nguyên)
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

            # 5. Tạo sản phẩm
            existing_count = Product.objects.count()
            if existing_count >= 100:
                self.stdout.write(
                    self.style.WARNING(f" Đã có {existing_count} sản phẩm. Không tạo thêm.")
                )
                return

            num_to_create = 100 - existing_count
            self.stdout.write(f" Sẽ tạo thêm {num_to_create} sản phẩm...")

            for i in range(num_to_create):
                name = f"{random.choice(product_names)} ({i + 1})"
                sub = random.choice(subcategories)
                original_price = Decimal(random.randint(20, 500) * 1000)
                discounted_price = original_price * Decimal(random.uniform(0.7, 1.0))
                
                # --- LOGIC MỚI: CHỌN NGẪU NHIÊN 1 SELLER ---
                chosen_seller = random.choice(sellers)
                
                description = f"Sản phẩm {name} chất lượng cao từ {chosen_seller.store_name}."

                Product.objects.create(
                    seller=chosen_seller, # Gán seller ngẫu nhiên
                    category=sub.category,
                    subcategory=sub,
                    name=name,
                    description=description,
                    original_price=original_price,
                    discounted_price=discounted_price,
                    unit="kg",
                    stock=random.randint(5, 100),
                    rating=round(random.uniform(3.0, 5.0), 1),
                    review_count=random.randint(0, 200),
                    location=chosen_seller.address, # Lấy địa chỉ của chính seller đó
                    brand="Nông sản Việt",
                    status="approved",
                )

            self.stdout.write(
                self.style.SUCCESS(f" Đã tạo {num_to_create} sản phẩm và chia đều cho {len(sellers)} seller.")
            )