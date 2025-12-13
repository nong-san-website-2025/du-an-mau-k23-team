from django.db import models
from users.models import CustomUser
from django.conf import settings
from products.models import Product


class Seller(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="seller")
    store_name = models.CharField(max_length=255, db_index=True)
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    image = models.ImageField(upload_to='stores/', blank=True, null=True)
    
    district_id = models.IntegerField(
        null=True, blank=True, help_text='GHN DistrictID for shipping fee calculation'
    )
    ward_code = models.CharField(
        max_length=20, null=True, blank=True, help_text='GHN WardCode for shipping fee calculation'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = [
        ("pending", "Chờ duyệt"),
        ("approved", "Đã duyệt"),
        ("rejected", "Bị từ chối"),
        ("active", "Đang hoạt động"),
        ("locked", "Đã khóa"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True, null=True)

    BUSINESS_TYPE_CHOICES = [
        ("personal", "Cá nhân"),
        ("business", "Doanh nghiệp"),
        ("household", "Hộ kinh doanh"),
    ]

    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES, blank=True, null=True)
    tax_code = models.CharField(max_length=50, blank=True, null=True)

    cccd_front = models.ImageField(upload_to="cccd/", blank=True, null=True)
    cccd_back = models.ImageField(upload_to="cccd/", blank=True, null=True)
    business_license = models.ImageField(upload_to="licenses/", blank=True, null=True)

    def __str__(self):
        return self.store_name

class Shop(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="shop"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class SellerActivityLog(models.Model):
    ACTION_TYPES = [
        ("login", "Đăng nhập"),
        ("logout", "Đăng xuất"), 
        ("add_product", "Thêm sản phẩm"),
        ("update_product", "Cập nhật sản phẩm"),
        ("delete_product", "Xóa sản phẩm"),
        ("order_success", "Hoàn tất đơn hàng"),
        ("account_locked", "Tài khoản bị khóa"),
        ("account_unlocked", "Tài khoản được mở"),
        ("profile_updated", "Cập nhật hồ sơ"),
        ("other", "Khác"),
    ]

    seller = models.ForeignKey("Seller", on_delete=models.CASCADE, related_name="activity_logs")
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.seller.store_name}] {self.get_action_display()} - {self.created_at:%d/%m/%Y %H:%M}"

class Voucher(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="vouchers")
    code = models.CharField(max_length=50, unique=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    active = models.BooleanField(default=True)


class SellerFollow(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followed_sellers",
    )
    seller = models.ForeignKey(
        Seller,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "seller")
        verbose_name = "Seller Follow"
        verbose_name_plural = "Seller Follows"

    def __str__(self):
        return f"{self.user_id} -> {self.seller_id}"