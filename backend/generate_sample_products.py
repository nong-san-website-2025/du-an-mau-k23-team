from django.utils import timezone
from decimal import Decimal
import random
from sellers.models import Seller
from products.models import Category, Subcategory, Product

def generate_sample_products():
    # Giả sử đã có một số seller trong database
    sellers = Seller.objects.all()
    if not sellers:
        print("No sellers found. Please create some sellers first.")
        return

    # Tạo categories
    categories_data = [
        {"name": "Trái cây", "key": "fruits", "icon": "Apple"},
        {"name": "Rau củ", "key": "vegetables", "icon": "Carrot"},
        {"name": "Thực phẩm chế biến", "key": "processed", "icon": "Box"},
    ]
    
    categories = []
    for cat_data in categories_data:
        category, _ = Category.objects.get_or_create(
            key=cat_data["key"],
            defaults={
                "name": cat_data["name"],
                "icon": cat_data["icon"],
                "created_at": timezone.now()
            }
        )
        categories.append(category)

    # Tạo subcategories
    subcategories_data = [
        {"category": categories[0], "name": "Trái cây nhiệt đới"},
        {"category": categories[0], "name": "Trái cây ôn đới"},
        {"category": categories[1], "name": "Rau lá"},
        {"category": categories[1], "name": "Củ quả"},
        {"category": categories[2], "name": "Thịt chế biến"},
        {"category": categories[2], "name": "Hải sản chế biến"},
    ]
    
    subcategories = []
    for sub_data in subcategories_data:
        subcategory, _ = Subcategory.objects.get_or_create(
            category=sub_data["category"],
            name=sub_data["name"],
            defaults={"created_at": timezone.now()}
        )
        subcategories.append(subcategory)

    # Danh sách sản phẩm mẫu
    products_data = [
        {
            "name": "Xoài Cát Hòa Lộc",
            "subcategory": subcategories[0],
            "category": categories[0],
            "description": "Xoài ngọt, thơm, cơm vàng, dẻo",
            "price": Decimal("45000"),
            "unit": "kg",
            "stock": 100,
            "rating": Decimal("4.5"),
            "review_count": 50,
            "is_organic": True,
            "discount": 10,
        },
        {
            "name": "Táo Fuji",
            "subcategory": subcategories[1],
            "category": categories[0],
            "description": "Táo giòn, ngọt, nhập khẩu từ Nhật",
            "price": Decimal("120000"),
            "unit": "kg",
            "stock": 50,
            "rating": Decimal("4.8"),
            "review_count": 30,
            "is_new": True,
        },
        {
            "name": "Cải xanh",
            "subcategory": subcategories[2],
            "category": categories[1],
            "description": "Cải xanh tươi, sạch, trồng tại Đà Lạt",
            "price": Decimal("20000"),
            "unit": "kg",
            "stock": 200,
            "rating": Decimal("4.2"),
            "review_count": 25,
            "is_organic": True,
        },
        {
            "name": "Khoai lang Nhật",
            "subcategory": subcategories[3],
            "category": categories[1],
            "description": "Khoai lang ngọt, bùi, chất lượng cao",
            "price": Decimal("30000"),
            "unit": "kg",
            "stock": 150,
            "rating": Decimal("4.6"),
            "review_count": 40,
            "is_best_seller": True,
        },
        {
            "name": "Chả lụa",
            "subcategory": subcategories[4],
            "category": categories[2],
            "description": "Chả lụa truyền thống, thơm ngon",
            "price": Decimal("180000"),
            "unit": "kg",
            "stock": 80,
            "rating": Decimal("4.3"),
            "review_count": 35,
        },
        {
            "name": "Cá basa phi lê",
            "subcategory": subcategories[5],
            "category": categories[2],
            "description": "Cá basa phi lê đông lạnh, chất lượng cao",
            "price": Decimal("90000"),
            "unit": "kg",
            "stock": 60,
            "rating": Decimal("4.1"),
            "review_count": 20,
            "discount": 5,
        },
        {
            "name": "Chuối già hương",
            "subcategory": subcategories[0],
            "category": categories[0],
            "description": "Chuối ngọt, thơm, chín tự nhiên",
            "price": Decimal("25000"),
            "unit": "kg",
            "stock": 120,
            "rating": Decimal("4.4"),
            "review_count": 45,
        },
        {
            "name": "Nho mẫu đơn",
            "subcategory": subcategories[1],
            "category": categories[0],
            "description": "Nho mẫu đơn ngọt, không hạt",
            "price": Decimal("150000"),
            "unit": "kg",
            "stock": 40,
            "rating": Decimal("4.7"),
            "review_count": 28,
            "is_new": True,
        },
        {
            "name": "Rau muống",
            "subcategory": subcategories[2],
            "category": categories[1],
            "description": "Rau muống tươi, sạch",
            "price": Decimal("15000"),
            "unit": "kg",
            "stock": 180,
            "rating": Decimal("4.0"),
            "review_count": 15,
        },
        {
            "name": "Cà rốt",
            "subcategory": subcategories[3],
            "category": categories[1],
            "description": "Cà rốt Đà Lạt, tươi ngon",
            "price": Decimal("25000"),
            "unit": "kg",
            "stock": 140,
            "rating": Decimal("4.3"),
            "review_count": 22,
            "is_organic": True,
        },
        {
            "name": "Thịt nguội",
            "subcategory": subcategories[4],
            "category": categories[2],
            "description": "Thịt nguội nhập khẩu, chất lượng cao",
            "price": Decimal("250000"),
            "unit": "kg",
            "stock": 70,
            "rating": Decimal("4.5"),
            "review_count": 38,
        },
        {
            "name": "Mực khô",
            "subcategory": subcategories[5],
            "category": categories[2],
            "description": "Mực khô loại 1, thơm ngon",
            "price": Decimal("600000"),
            "unit": "kg",
            "stock": 30,
            "rating": Decimal("4.9"),
            "review_count": 55,
            "is_best_seller": True,
        },
        {
            "name": "Cam sành",
            "subcategory": subcategories[0],
            "category": categories[0],
            "description": "Cam sành mọng nước, ngọt thanh",
            "price": Decimal("30000"),
            "unit": "kg",
            "stock": 110,
            "rating": Decimal("4.2"),
            "review_count": 32,
        },
        {
            "name": "Lê Hàn Quốc",
            "subcategory": subcategories[1],
            "category": categories[0],
            "description": "Lê giòn, ngọt, nhập khẩu Hàn Quốc",
            "price": Decimal("130000"),
            "unit": "kg",
            "stock": 45,
            "rating": Decimal("4.6"),
            "review_count": 29,
        },
        {
            "name": "Bắp cải",
            "subcategory": subcategories[2],
            "category": categories[1],
            "description": "Bắp cải tươi, sạch, Đà Lạt",
            "price": Decimal("18000"),
            "unit": "kg",
            "stock": 160,
            "rating": Decimal("4.1"),
            "review_count": 18,
        },
        {
            "name": "Su hào",
            "subcategory": subcategories[3],
            "category": categories[1],
            "description": "Su hào giòn, ngọt, chất lượng cao",
            "price": Decimal("20000"),
            "unit": "kg",
            "stock": 130,
            "rating": Decimal("4.2"),
            "review_count": 20,
        },
        {
            "name": "Pate gan",
            "subcategory": subcategories[4],
            "category": categories[2],
            "description": "Pate gan thơm ngon, chuẩn vị",
            "price": Decimal("80000"),
            "unit": "kg",
            "stock": 90,
            "rating": Decimal("4.4"),
            "review_count": 42,
        },
        {
            "name": "Tôm khô",
            "subcategory": subcategories[5],
            "category": categories[2],
            "description": "Tôm khô loại 1, ngọt tự nhiên",
            "price": Decimal("450000"),
            "unit": "kg",
            "stock": 35,
            "rating": Decimal("4.8"),
            "review_count": 60,
            "is_best_seller": True,
        },
        {
            "name": "Dưa leo",
            "subcategory": subcategories[3],
            "category": categories[1],
            "description": "Dưa leo tươi, sạch",
            "price": Decimal("15000"),
            "unit": "kg",
            "stock": 170,
            "rating": Decimal("4.0"),
            "review_count": 12,
        },
        {
            "name": "Sầu riêng",
            "subcategory": subcategories[0],
            "category": categories[0],
            "description": "Sầu riêng Ri6, thơm béo",
            "price": Decimal("120000"),
            "unit": "kg",
            "stock": 60,
            "rating": Decimal("4.7"),
            "review_count": 48,
            "discount": 15,
        },
    ]

    # Tạo products
    for product_data in products_data:
        Product.objects.get_or_create(
            name=product_data["name"],
            defaults={
                "seller": random.choice(sellers),
                "subcategory": product_data["subcategory"],
                "category": product_data["category"],
                "description": product_data["description"],
                "price": product_data["price"],
                "unit": product_data["unit"],
                "stock": product_data["stock"],
                "rating": product_data["rating"],
                "review_count": product_data["review_count"],
                "is_organic": product_data.get("is_organic", False),
                "is_new": product_data.get("is_new", False),
                "is_best_seller": product_data.get("is_best_seller", False),
                "discount": product_data.get("discount", 0),
                "location": "Việt Nam",
                "brand": "Local Brand",
                "created_at": timezone.now(),
                "updated_at": timezone.now(),
            }
        )

    print(f"Successfully created {len(products_data)} sample products.")

if __name__ == "__main__":
    generate_sample_products()