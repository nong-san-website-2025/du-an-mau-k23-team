from django.db import models
from django.utils import timezone


class Advertisement(models.Model):
    class AdType(models.TextChoices):
        POPUP = 'popup', 'Popup Modal'
        BANNER = 'banner', 'Banner'
        FLASH_SALE = 'flash_sale', 'Flash Sale'
        HOME_TOP = 'home_top', 'Home Top Banner'
        HOME_MIDDLE = 'home_middle', 'Home Middle Banner'
        HOME_BOTTOM = 'home_bottom', 'Home Bottom Banner'

    class TargetType(models.TextChoices):
        ALL_USERS = 'all_users', 'Tất cả người dùng'
        NEW_USERS = 'new_users', 'Khách hàng mới'
        RETURNING_USERS = 'returning_users', 'Khách quay lại'
        VIP_USERS = 'vip_users', 'Khách VIP'
        SELLER = 'seller', 'Người bán'
        CUSTOM = 'custom', 'Tùy chỉnh'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Hình ảnh quảng cáo
    image = models.ImageField(upload_to='advertisements/')

    # Link điều hướng khi click
    redirect_link = models.URLField(blank=True, null=True, help_text="Link dẫn đến sản phẩm/trang khuyến mãi")

    # Loại quảng cáo
    ad_type = models.CharField(max_length=50, choices=AdType.choices, default=AdType.BANNER)

    # Nhắm mục tiêu
    target_type = models.CharField(max_length=50, choices=TargetType.choices, default=TargetType.ALL_USERS)

    # Thời gian hiển thị
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    # Ưu tiên sắp xếp
    priority = models.PositiveIntegerField(default=0, help_text="Thứ tự ưu tiên hiển thị, số nhỏ hiện trước")

    # Trạng thái hoạt động
    is_active = models.BooleanField(default=True)

    # Tracking
    views = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_ad_type_display()})"

    def is_currently_active(self):
        now = timezone.now()
        return self.is_active and self.start_date <= now and (self.end_date is None or self.end_date >= now)
