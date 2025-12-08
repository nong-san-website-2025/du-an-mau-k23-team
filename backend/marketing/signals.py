# apps/marketing/signals.py
from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from .models import Banner, AdSlot

@receiver(post_save, sender=Banner)
def clear_homepage_cache(sender, instance, **kwargs):
    """
    Khi banner thay đổi, clear cache homepage để frontend nhận data mới
    """
    from django.core.cache import cache
    cache.delete("homepage_config_cache")

@receiver(post_migrate)
def create_default_adslots(sender, **kwargs):
    if sender.name != "marketing":  # Đảm bảo chỉ chạy cho app này
        return

    defaults = [
        # 1. Slide chính (Carousel)
        {
            "code": "homepage_hero_carousel",
            "name": "Trang chủ - Slide chính (Top)",
            "description": "Slide ảnh lớn chạy ngang ở đầu trang chủ.",
            "max_banners": 5
        },
        # 2. Banner nhỏ bên cạnh Slide
        {
            "code": "homepage_hero_side",
            "name": "Trang chủ - Bên cạnh Slide",
            "description": "2 Banner nhỏ nằm bên phải của Slide chính.",
            "max_banners": 2
        },
        # 3. Popup quảng cáo
        {
            "code": "homepage_popup",
            "name": "Trang chủ - Popup (Modal)",
            "description": "Quảng cáo bật lên khi vừa vào trang web.",
            "max_banners": 1
        },
        # 4. Giữa các section (Dưới thanh truy cập nhanh)
        {
            "code": "homepage_below_quick_access",
            "name": "Trang chủ - Dưới thanh truy cập nhanh",
            "description": "Banner dài nằm giữa Quick Access và Danh mục.",
            "max_banners": 1
        },
        # 5. Trước Flash Sale
        {
            "code": "homepage_above_flash_sale",
            "name": "Trang chủ - Trên Flash Sale",
            "description": "Banner quảng cáo trước khi vào khu vực Flash Sale.",
            "max_banners": 1
        },
        # 6. Dưới Flash Sale (Trước Gợi ý cho bạn)
        {
            "code": "homepage_below_flash_sale",
            "name": "Trang chủ - Dưới Flash Sale",
            "description": "Banner phân cách giữa Flash Sale và Gợi ý sản phẩm.",
            "max_banners": 1
        },
        # 7. Gần chân trang (Trước Blog)
        {
            "code": "homepage_above_blogs",
            "name": "Trang chủ - Gần Footer (Trên Blog)",
            "description": "Banner nằm gần cuối trang, phía trên tin tức.",
            "max_banners": 1
        },
    ]

    for slot in defaults:
        AdSlot.objects.get_or_create(code=slot["code"], defaults=slot)