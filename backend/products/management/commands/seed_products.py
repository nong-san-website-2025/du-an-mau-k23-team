import os
import random
from pathlib import Path
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from django.core.files import File

# Import các models
from sellers.models import Seller
from products.models import Category, Subcategory, Product, ProductImage

class Command(BaseCommand):
    help = "Quét thư mục seed_data (nằm cùng cấp với file lệnh này) để tạo sản phẩm kèm hình ảnh."

    def handle(self, *args, **kwargs):
        # 1. XÁC ĐỊNH ĐƯỜNG DẪN THƯ MỤC SEED_DATA
        # Lấy đường dẫn của file script hiện tại, sau đó lấy thư mục cha (.parent)
        # và nối thêm 'seed_data'
        current_dir = Path(__file__).resolve().parent
        SEED_DIR = current_dir / 'seed_data'

        # Chuyển sang string để dùng với os.walk
        SEED_DIR_STR = str(SEED_DIR)

        self.stdout.write(f"📂 Đang tìm ảnh tại: {SEED_DIR_STR}")

        if not os.path.exists(SEED_DIR_STR):
            self.stdout.write(self.style.ERROR(f"❌ Không tìm thấy thư mục: {SEED_DIR_STR}"))
            self.stdout.write(self.style.WARNING("👉 Vui lòng kiểm tra lại tên thư mục (chữ thường/hoa) hoặc vị trí."))
            return

        with transaction.atomic():
            # 2. ĐẢM BẢO CÓ SELLER
            sellers = list(Seller.objects.all())
            if not sellers:
                self.stdout.write(self.style.WARNING("⚠️ Chưa có Seller, đang tạo Seller mẫu..."))
                default_seller = Seller.objects.create(
                    user=None, store_name="Nông Trại Xanh", phone="0909123456",
                    address="Đà Lạt, Lâm Đồng", status="approved"
                )
                sellers.append(default_seller)
            
            # 3. TẠO CATEGORY & SUBCATEGORY (Dữ liệu nền)
            self.create_base_categories()

            self.stdout.write("--- Bắt đầu quét file ảnh để tạo sản phẩm ---")
            created_count = 0
            
            # 4. DUYỆT THƯ MỤC VÀ TẠO SẢN PHẨM
            for root, dirs, files in os.walk(SEED_DIR_STR):
                # Lấy tên thư mục hiện tại (ví dụ: "Hạt & đậu", "Trái Cây")
                folder_name = os.path.basename(root)
                
                # Bỏ qua thư mục gốc seed_data hoặc thư mục ẩn
                if folder_name == 'seed_data' or folder_name.startswith('.'):
                    continue

                # Tìm Subcategory trong DB dựa trên tên folder (không phân biệt hoa thường)
                subcategory = Subcategory.objects.filter(name__iexact=folder_name).first()

                if not subcategory:
                    self.stdout.write(self.style.WARNING(f"⚠️  Bỏ qua folder '{folder_name}' vì không khớp tên Subcategory nào trong DB."))
                    continue

                # Duyệt qua các file ảnh trong thư mục này
                for filename in files:
                    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                        # Tên sản phẩm = Tên file bỏ đuôi (ví dụ: "BẮP RANG BƠ.png" -> "Bắp Rang Bơ")
                        product_name = os.path.splitext(filename)[0].replace("_", " ").strip().title()

                        # Kiểm tra trùng lặp (nếu đã có sản phẩm tên này của seller bất kỳ thì bỏ qua)
                        # Bạn có thể bỏ seller__in=sellers nếu muốn check tên global
                        if Product.objects.filter(name=product_name).exists():
                            # self.stdout.write(f"  - Đã có: {product_name}, bỏ qua.")
                            continue

                        # Setup dữ liệu ngẫu nhiên
                        chosen_seller = random.choice(sellers)
                        original_price = Decimal(random.randint(20, 500) * 1000) # 20k - 500k
                        discounted_price = original_price * Decimal(random.uniform(0.7, 1.0)) # Giảm giá 0-30%
                        
                        # Tạo Product Object
                        product = Product(
                            seller=chosen_seller,
                            category=subcategory.category,
                            subcategory=subcategory,
                            name=product_name,
                            description=f"Sản phẩm {product_name} chất lượng cao, tươi ngon, nguồn gốc từ {chosen_seller.store_name}. Cam kết đổi trả nếu hư hỏng.",
                            original_price=original_price,
                            discounted_price=discounted_price,
                            unit="kg",
                            stock=random.randint(10, 200),
                            rating=round(random.uniform(4.0, 5.0), 1),
                            review_count=random.randint(5, 50),
                            location=chosen_seller.address,
                            brand="Nông Sản Việt",
                            status="approved",
                            availability_status="available",
                            weight_g=1000
                        )

                        # Đường dẫn file ảnh
                        file_path = os.path.join(root, filename)

                        try:
                            # Mở file ảnh để lưu vào Product.image (Ảnh đại diện)
                            with open(file_path, 'rb') as f:
                                product.image.save(filename, File(f), save=True)
                            
                            # Mở lại file ảnh để lưu vào ProductImage (Ảnh gallery - Slide)
                            with open(file_path, 'rb') as f:
                                ProductImage.objects.create(
                                    product=product,
                                    image=File(f, name=filename),
                                    is_primary=True,
                                    order=0
                                )
                            
                            created_count += 1
                            self.stdout.write(self.style.SUCCESS(f"✅ Đã tạo: {product_name} | Danh mục: {subcategory.name}"))

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"❌ Lỗi khi tạo {product_name}: {e}"))

            self.stdout.write(self.style.SUCCESS(f"\n🎉 HOÀN TẤT! Tổng cộng đã tạo {created_count} sản phẩm mới từ thư mục ảnh."))

    def create_base_categories(self):
        """
        Hàm này tạo danh mục gốc nếu chưa có, 
        để đảm bảo tên folder 'seed_data' khớp được với Database.
        """
        categories_data = [
            {"name": "Trái cây", "key": "fruits"},
            {"name": "Rau củ", "key": "vegetables"},
            {"name": "Thực phẩm chế biến", "key": "processed"},
            {"name": "Thịt & Trứng", "key": "meat_eggs"},
            {"name": "Sữa & Đồ uống", "key": "dairy_drinks"},
            {"name": "Các loại hạt", "key": "grains_nuts"},
            {"name": "Gia vị & Thảo mộc", "key": "spices_herbs"},
            {"name": "Trà & Cà phê", "key": "tea_coffee"},
            {"name": "Đồ khô & Mứt", "key": "dried_jam"},
            {"name": "Hữu cơ & Sạch", "key": "organic"},
            {"name": "Hải sản tươi sống", "key": "seafood"},
            {"name": "Vật tư nông nghiệp", "key": "agriculture_supplies"},
        ]
        
        cats_obj = {}
        for c in categories_data:
            cat, _ = Category.objects.get_or_create(key=c["key"], defaults={"name": c["name"]})
            cats_obj[c["key"]] = cat

        # List subcategory cần khớp với tên thư mục trong seed_data của bạn
        subcategories_data = [
             ("fruits", "Trái cây nhiệt đới"), ("fruits", "Trái cây ôn đới"), ("fruits", "Trái Cây"), # Thêm "Trái Cây" cho khớp folder của bạn
             ("vegetables", "Rau lá"), ("vegetables", "Củ quả"), ("vegetables", "Rau củ"), # Thêm "Rau củ"
             ("processed", "Thịt chế biến"), ("processed", "Hải sản chế biến"),
             ("meat_eggs", "Thịt tươi"), ("meat_eggs", "Trứng"),
             ("dairy_drinks", "Sữa tươi"), ("dairy_drinks", "Nước ép"),
             ("grains_nuts", "Các loại hạt"), ("grains_nuts", "Gạo, ngũ cốc"), ("grains_nuts", "Hạt, đậu"), # Thêm "Ngũ cốc & hạt"
             ("spices_herbs", "Gia vị"), ("spices_herbs", "Rau thơm"),
             ("tea_coffee", "Trà"), ("tea_coffee", "Cà phê"),
             ("dried_jam", "Mứt & Hoa quả sấy"), ("dried_jam", "Hạt khô"),
             ("organic", "Rau hữu cơ"), ("organic", "Trái cây hữu cơ"),
             ("seafood", "Hải sản tươi"),
             ("agriculture_supplies", "Hạt giống & Phân bón"), ("agriculture_supplies", "Dụng cụ nông nghiệp"),
        ]

        for k, sub_name in subcategories_data:
            if k in cats_obj:
                Subcategory.objects.get_or_create(category=cats_obj[k], name=sub_name)