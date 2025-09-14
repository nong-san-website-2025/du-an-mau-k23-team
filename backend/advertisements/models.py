from django.db import models
from django.utils import timezone


class Advertisement(models.Model):
    # --------- Loại quảng cáo ---------
    class AdType(models.TextChoices):
        POPUP = 'popup', 'Popup Modal'
        BANNER = 'banner', 'Banner'
        FLASH_SALE = 'flash_sale', 'Flash Sale'

    # --------- Vị trí hiển thị quảng cáo ---------
    class Position(models.TextChoices):
        HOME_TOP = 'home_top', 'Trang chủ - Phía trên'
        HOME_MIDDLE = 'home_middle', 'Trang chủ - Giữa'
        HOME_BOTTOM = 'home_bottom', 'Trang chủ - Dưới'
        SIDEBAR = 'sidebar', 'Sidebar'
        PRODUCT_PAGE = 'product_page', 'Trang sản phẩm'
        CHECKOUT = 'checkout', 'Trang thanh toán'

    # --------- Nhắm mục tiêu đối tượng ---------
    class TargetType(models.TextChoices):
        ALL_USERS = 'all_users', 'Tất cả người dùng'
        NEW_USERS = 'new_users', 'Khách hàng mới'
        RETURNING_USERS = 'returning_users', 'Khách quay lại'
        VIP_USERS = 'vip_users', 'Khách VIP'
        SELLER = 'seller', 'Người bán'
        CUSTOM = 'custom', 'Tùy chỉnh'

    # --------- Thông tin cơ bản ---------
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Hình ảnh quảng cáo
    image = models.ImageField(upload_to='advertisements/')

    # Link điều hướng khi click
    redirect_link = models.URLField(
        blank=True,
        null=True,
        help_text="Link dẫn đến sản phẩm hoặc trang khuyến mãi"
    )

    # Loại quảng cáo (Banner, Popup, Flash Sale)
    ad_type = models.CharField(
        max_length=50,
        choices=AdType.choices,
        default=AdType.BANNER
    )

    # Vị trí hiển thị (Home Top, Middle, Bottom, Sidebar, etc.)
    position = models.CharField(
        max_length=50,
        choices=Position.choices,
        default=Position.HOME_TOP
    )

    # Nhắm mục tiêu khách hàng
    target_type = models.CharField(
        max_length=50,
        choices=TargetType.choices,
        default=TargetType.ALL_USERS
    )

    # --------- Thời gian hiển thị ---------
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)

    # --------- Quản lý hiển thị ---------
    priority = models.PositiveIntegerField(
        default=0,
        help_text="Thứ tự ưu tiên, số nhỏ hiển thị trước"
    )
    is_active = models.BooleanField(default=True)

    # --------- Tracking ---------
    views = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)

    # --------- Thời gian tạo / cập nhật ---------
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', '-created_at']
        permissions = [
            ("can_manage_ads", "Can manage advertisements")
        ]
        verbose_name = "Advertisement"
        verbose_name_plural = "Advertisements"

    def __str__(self):
        return f"{self.title} ({self.get_ad_type_display()})"

    # Kiểm tra quảng cáo có đang hoạt động không
    def is_currently_active(self):
        now = timezone.now()
        return (
            self.is_active and
            self.start_date <= now and
            (self.end_date is None or self.end_date >= now)
        )

    @property
    def status(self):
        """Trả về trạng thái hiển thị"""
        return "Đang hiển thị" if self.is_currently_active() else "Không hiển thị"
