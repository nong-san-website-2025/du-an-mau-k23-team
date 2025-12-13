# apps/marketing/signals.py
from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from django.core.cache import cache
from .models import Banner, AdSlot

@receiver(post_save, sender=Banner)
def clear_homepage_cache(sender, instance, **kwargs):
    """
    Khi banner thay đổi (thêm/sửa/xóa), clear cache homepage 
    để frontend nhận data mới ngay lập tức.
    """
    cache.delete("homepage_config_cache") 
    cache.delete("homepage_banners")
    
    if instance.slot:
        # Clear cache cụ thể cho từng slot
        cache.delete(f"banner_{instance.slot.code}")

@receiver(post_migrate)
def create_default_adslots(sender, **kwargs):
    """
    Tự động khởi tạo cấu trúc AdSlot chuẩn cho Homepage GreenFarm.
    Chạy tự động sau khi lệnh 'python manage.py migrate' hoàn tất.
    """
    
    if sender.name not in ["apps.marketing", "marketing"]: 
        return

    default_slots = [
        # --- 1. KHU VỰC HERO (ĐẦU TRANG - GIỮ NGUYÊN) ---
        {
            "code": "homepage_hero_carousel",
            "name": "Trang chủ - Slide chính (Carousel)",
            "description": "Slide ảnh lớn chạy ngang (Chiếm 2/3 màn hình bên trái).",
            "max_banners": 5,
            "width_hint": 800, 
            "height_hint": 300,
        },
        {
            "code": "homepage_hero_right_top",
            "name": "Trang chủ - Bên phải Slide (Trên)",
            "description": "Banner nhỏ nằm góc trên bên phải, cạnh slide chính.",
            "max_banners": 1,
            "width_hint": 390, 
            "height_hint": 148,
        },
        {
            "code": "homepage_hero_right_bottom",
            "name": "Trang chủ - Bên phải Slide (Dưới)",
            "description": "Banner nhỏ nằm góc dưới bên phải, cạnh slide chính.",
            "max_banners": 1,
            "width_hint": 390, 
            "height_hint": 148, 
        },

        # --- 2. POPUP ---
        {
            "code": "homepage_popup",
            "name": "Trang chủ - Popup (Modal)",
            "description": "Quảng cáo bật lên giữa màn hình khi vừa vào trang web.",
            "max_banners": 1,
            "width_hint": 800, 
            "height_hint": 600,
        },

        # --- 3. CÁC BANNER THEO SECTION (MỚI - 1200x600) ---
        {
            "code": "homepage_section_category",
            "name": "Trang chủ - Banner Mục Danh mục",
            "description": "Banner lớn nằm trên phần Danh mục nổi bật.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 600, 
        },
        {
            "code": "homepage_section_flashsale",
            "name": "Trang chủ - Banner Mục Flash Sale",
            "description": "Banner lớn nằm trên phần Flash Sale.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 600, 
        },
        {
            "code": "homepage_section_product",
            "name": "Trang chủ - Banner Mục Sản phẩm",
            "description": "Banner lớn nằm trên phần Sản phẩm mới & Bán chạy.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 600, 
        },
        {
            "code": "homepage_section_personalization",
            "name": "Trang chủ - Banner Mục Gợi ý",
            "description": "Banner lớn nằm trên phần Gợi ý cho bạn.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 600, 
        },
        {
            "code": "homepage_section_blog",
            "name": "Trang chủ - Banner Mục Tin tức",
            "description": "Banner lớn nằm trên phần Góc nhà nông.",
            "max_banners": 1,
            "width_hint": 1200, 
            "height_hint": 600, 
        },
    ]

    print(f"🔄 [Marketing] Đang đồng bộ {len(default_slots)} AdSlots cho Homepage...")

    for slot_data in default_slots:
        slot_code = slot_data.pop("code")
        AdSlot.objects.update_or_create(
            code=slot_code,
            defaults=slot_data
        )
        
    print("✅ [Marketing] Đồng bộ AdSlots hoàn tất.")