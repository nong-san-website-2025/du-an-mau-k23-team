# apps/marketing/signals.py
from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from .models import Banner, AdSlot

@receiver(post_save, sender=Banner)
def clear_homepage_cache(sender, instance, **kwargs):
    """
    Khi banner thay đổi (thêm/sửa/xóa), clear cache homepage 
    để frontend nhận data mới ngay lập tức.
    """
    from django.core.cache import cache
    # Key này phải khớp với key bạn dùng ở view Homepage (nếu có cache)
    cache.delete("homepage_config_cache") 
    cache.delete("homepage_banners")

@receiver(post_migrate)
def create_default_adslots(sender, **kwargs):
    """
    Tự động khởi tạo hoặc cập nhật các AdSlot mặc định sau khi chạy migrate.
    Dùng update_or_create để đảm bảo thông số luôn mới nhất theo code.
    """
    
    # Kiểm tra đúng app marketing mới chạy (tên app phụ thuộc vào apps.py của bạn)
    # Thường là 'apps.marketing' hoặc 'marketing'
    if sender.name not in ["apps.marketing", "marketing"]: 
        return

    # Danh sách cấu hình chuẩn (Code là duy nhất)
    # Width/Height hint được tối ưu cho giao diện Responsive cơ bản
    default_slots = [
        # 1. Slide chính (Carousel)
        {
            "code": "homepage_hero_carousel",
            "name": "Trang chủ - Slide chính (Top)",
            "description": "Slide ảnh lớn chạy ngang ở đầu trang chủ.",
            "max_banners": 5,
            "width_hint": 1200, 
            "height_hint": 400, 
        },
        # 2. Banner nhỏ bên cạnh Slide
        {
            "code": "homepage_hero_side",
            "name": "Trang chủ - Bên cạnh Slide",
            "description": "2 Banner nhỏ nằm bên phải của Slide chính.",
            "max_banners": 2,
            "width_hint": 380, 
            "height_hint": 190,
        },
        # 3. Popup quảng cáo
        {
            "code": "homepage_popup",
            "name": "Trang chủ - Popup (Modal)",
            "description": "Quảng cáo bật lên giữa màn hình khi vừa vào trang web.",
            "max_banners": 1,
            "width_hint": 800, 
            "height_hint": 600,
        },
        # 4. Giữa các section (Dưới thanh truy cập nhanh)
        {
            "code": "homepage_below_quick_access",
            "name": "Trang chủ - Dưới thanh truy cập nhanh",
            "description": "Banner dài nằm giữa Quick Access và Danh mục.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 150, # Dạng dải ngang hẹp
        },
        # 5. Trước Flash Sale
        {
            "code": "homepage_above_flash_sale",
            "name": "Trang chủ - Trên Flash Sale",
            "description": "Banner quảng cáo dẫn dắt trước khi vào khu vực Flash Sale.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 200,
        },
        # 6. Dưới Flash Sale (Trước Gợi ý cho bạn)
        {
            "code": "homepage_below_flash_sale",
            "name": "Trang chủ - Dưới Flash Sale",
            "description": "Banner phân cách giữa Flash Sale và Gợi ý sản phẩm.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 200,
        },
        # 7. Gần chân trang (Trước Blog)
        {
            "code": "homepage_above_blogs",
            "name": "Trang chủ - Gần Footer (Trên Blog)",
            "description": "Banner nằm gần cuối trang, phía trên tin tức.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 250,
        },
    ]

    print(f"🔄 Đang đồng bộ {len(default_slots)} AdSlots mặc định cho Marketing...")

    for slot_data in default_slots:
        # Tách 'code' ra để dùng làm khóa tìm kiếm
        slot_code = slot_data.pop("code")
        
        # update_or_create: 
        # - Nếu chưa có 'code' -> Tạo mới với dữ liệu trong slot_data (defaults)
        # - Nếu đã có 'code' -> Cập nhật dữ liệu trong DB bằng slot_data mới nhất
        obj, created = AdSlot.objects.update_or_create(
            code=slot_code,
            defaults=slot_data
        )
        
        # In log ra console để dễ debug (Optional)
        # action = "Tạo mới" if created else "Cập nhật"
        # print(f"   - {action}: {slot_code} ({obj.width_hint}x{obj.height_hint})")
    
    print("✅ Đồng bộ AdSlots hoàn tất.")