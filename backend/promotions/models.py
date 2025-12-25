from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.db.models import Sum
from django.core.exceptions import ValidationError

# Import các model cần thiết từ các app khác
from products.models import Product
from sellers.models import Seller

class Promotion(models.Model):
    TYPE_VOUCHER = "voucher"
    TYPE_FLASHSALE = "flashsale"
    TYPE_CHOICES = (
        (TYPE_VOUCHER, "Voucher"),
        (TYPE_FLASHSALE, "Flash Sale"),
    )
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_VOUCHER)
    description = models.TextField(blank=True, null=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return f"{self.code} ({self.type})"


class Voucher(models.Model):
    class Scope(models.TextChoices):
        SYSTEM = "system", "Hệ thống"
        SELLER = "seller", "Seller"

    class DistributionType(models.TextChoices):
        CLAIM = "claim", "Kho voucher (người dùng phải nhận)"
        DIRECT = "direct", "Push thẳng vào tài khoản user"

    class ProductScope(models.TextChoices):
        ALL = "ALL", "Tất cả sản phẩm của cửa hàng"
        CATEGORY = "CATEGORY", "Theo danh mục" 
        SPECIFIC = "SPECIFIC", "Sản phẩm tùy chọn"

    product_scope = models.CharField(
        max_length=10,
        choices=ProductScope.choices,
        default=ProductScope.ALL,
        help_text="Áp dụng cho sản phẩm nào của cửa hàng"
    )

    applicable_products = models.ManyToManyField(
        Product,
        blank=True,
        help_text="Danh sách sản phẩm được áp dụng nếu product_scope là SPECIFIC"
    )

    promotion = models.OneToOneField(
        Promotion, null=True, blank=True, on_delete=models.CASCADE, related_name="voucher"
    )
    distribution_type = models.CharField(
        max_length=10,
        choices=DistributionType.choices,
        default=DistributionType.CLAIM,
    )
    code = models.CharField(max_length=50, unique=True, db_index=True) 
    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)
    scope = models.CharField(max_length=10, choices=Scope.choices, default=Scope.SYSTEM)
    seller = models.ForeignKey(Seller, null=True, blank=True, on_delete=models.CASCADE, related_name="vouchers")
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    freeship_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    
    total_quantity = models.PositiveIntegerField(default=0, help_text="Tổng số lượng phát hành")
    used_quantity = models.PositiveIntegerField(default=0, help_text="Số lượng đã sử dụng thực tế") 
    per_user_quantity = models.PositiveIntegerField(default=1)
    
    min_order_value = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_vouchers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def discount_type(self):
        if self.freeship_amount: return "freeship"
        if self.discount_percent: return "percent"
        if self.discount_amount: return "amount"
        return "unknown"

    def clean(self):
        set_count = sum([bool(self.freeship_amount), bool(self.discount_percent), bool(self.discount_amount)])
        if set_count > 1:
            raise ValidationError("Chỉ được chọn 1 loại giảm: freeship OR percent OR amount")

    def issued_count(self):
        return sum([uv.quantity for uv in self.user_vouchers.all()]) if hasattr(self, 'user_vouchers') else 0

    def remaining_quantity(self):
        if self.total_quantity is None: return None
        remaining = self.total_quantity - self.issued_count()
        return max(0, remaining)

    def __str__(self):
        return f"{self.code} ({self.scope})"


class FlashSale(models.Model):
    products = models.ManyToManyField(Product, related_name='flash_sales')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-start_time']
        indexes = [models.Index(fields=['is_active', 'start_time', 'end_time']),]
    def __str__(self):
        return f"Flash: {self.id} ({self.start_time} → {self.end_time})"
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now < self.end_time
    @property
    def remaining_time(self):
        if not self.is_ongoing: return 0
        return int((self.end_time - timezone.now()).total_seconds())
    
class FlashSaleProduct(models.Model):
    flashsale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name='flashsale_products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    flash_price = models.DecimalField(max_digits=12, decimal_places=0, validators=[MinValueValidator(1)])
    stock = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = ('flashsale', 'product')
    def __str__(self):
        return f"{self.product.name} - {self.flash_price}"
    def clean(self):
        if self.flash_price >= self.product.original_price:
            raise ValidationError({'flash_price': 'Flash price phải thấp hơn giá gốc.'})

    @property
    def remaining_stock(self):
        from orders.models import OrderItem
        sold = OrderItem.objects.filter(
            product=self.product,
            order__status__in=['shipping', 'delivered', 'completed'],
            created_at__gte=self.flashsale.start_time,
            created_at__lt=self.flashsale.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0
        return max(0, self.stock - sold)

    
class UserVoucher(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_vouchers"
    )
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        related_name="user_vouchers"
    )
    quantity = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "voucher")

    def remaining_for_user(self):
        """Trả về số lượt còn lại của user"""
        return max(0, self.quantity - self.used_count)

    def mark_used_once(self):
        """Đánh dấu đã sử dụng 1 lần và lưu DB"""
        self.used_count += 1
        self.used_at = timezone.now()
        
        # Nếu đã dùng hết số lượng cho phép -> Đánh dấu là đã dùng xong (is_used = True)
        if self.used_count >= self.quantity:
            self.is_used = True
            
        self.save(update_fields=['used_count', 'is_used', 'used_at'])

    def restore_usage(self):
        """Hoàn lại 1 lượt sử dụng (Dùng khi hủy đơn)"""
        if self.used_count > 0:
            self.used_count -= 1
            # Nếu voucher đang bị đánh dấu là hết lượt (is_used=True), mở lại (is_used=False)
            if self.is_used:
                self.is_used = False
            self.save(update_fields=['used_count', 'is_used'])

    def __str__(self):
        return f"{self.user.username} - {self.voucher.code} - {self.used_count}/{self.quantity}"
    # ... (Giữ nguyên code cũ của file models.py bên trên) ...

# === THÊM MỚI CLASS NÀY VÀO CUỐI FILE ===

class VoucherUsage(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="voucher_usages",
        verbose_name="Người dùng"
    )
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        related_name="usage_history",
        verbose_name="Voucher"
    )
    # Dùng chuỗi string 'orders.Order' để tránh lỗi Import vòng (Circular Import)
    # Giả định app đơn hàng của bạn tên là 'orders' và Model là 'Order'
    order = models.ForeignKey(
        'orders.Order', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="voucher_usages",
        verbose_name="Đơn hàng"
    )
    discount_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=0, 
        default=0,
        verbose_name="Số tiền giảm"
    )
    used_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian dùng")

    class Meta:
        ordering = ["-used_at"]
        verbose_name = "Lịch sử dùng Voucher"
        verbose_name_plural = "Lịch sử dùng Voucher"

    def __str__(self):
        return f"{self.user} - {self.voucher.code}"