from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from products.models import Product
from products.serializers import ProductListSerializer
from django.utils import timezone
from django.core.validators import MinValueValidator



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

    promotion = models.OneToOneField(
        Promotion, null=True, blank=True, on_delete=models.CASCADE, related_name="voucher"
    )

    distribution_type = models.CharField(
        max_length=10,
        choices=DistributionType.choices,
        default=DistributionType.CLAIM,
    )

    code = models.CharField(max_length=50)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    scope = models.CharField(max_length=10, choices=Scope.choices, default=Scope.SYSTEM)
    seller = models.ForeignKey("store.Store", null=True, blank=True, on_delete=models.CASCADE)

    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    freeship_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)

    # --- Quantity management ---
    total_quantity = models.PositiveIntegerField(null=True, blank=True,
                                                 help_text="Tổng số lượng voucher (pool). Null = không giới hạn")
    per_user_quantity = models.PositiveIntegerField(null=True, blank=True,default=1,
                                                    help_text="Số lượng cấp cho 1 user khi nhận / được push")

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
        if self.freeship_amount:
            return "freeship"
        if self.discount_percent:
            return "percent"
        if self.discount_amount:
            return "amount"
        return "unknown"

    def clean(self):
        set_count = sum(
            [
                bool(self.freeship_amount),
                bool(self.discount_percent),
                bool(self.discount_amount),
            ]
        )
        if set_count > 1:
            from django.core.exceptions import ValidationError

            raise ValidationError("Chỉ được chọn 1 loại giảm: freeship OR percent OR amount")

    def issued_count(self):
        # tổng số lượng đã phát (sum quantity trên UserVoucher)
        return sum([uv.quantity for uv in self.user_vouchers.all()]) if hasattr(self, 'user_vouchers') else 0

    def remaining_quantity(self):
        if self.total_quantity is None:
            return None
        remaining = self.total_quantity - self.issued_count()
        return max(0, remaining)

    def __str__(self):
        return f"{self.code} ({self.scope})"


class FlashSale(models.Model):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='flash_sale',
        # Không dùng null=True — FlashSale luôn phải có Product
    )
    original_price = models.DecimalField(max_digits=12, decimal_places=0, editable=False)
    flash_price = models.DecimalField(max_digits=12, decimal_places=0)
    stock = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['is_active', 'start_time', 'end_time']),
        ]

    def __str__(self):
        return f"Flash: {self.product.name} - {self.flash_price}"

    def clean(self):
        if self.product is None:
            raise ValidationError({'product': 'Flash sale must have a product.'})

        if self.flash_price >= self.product.price:
            raise ValidationError({'flash_price': 'Flash price must be lower than original price.'})

        if self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})

    def save(self, *args, **kwargs):
        # Gọi clean() trước khi save
        self.full_clean()

        # Chỉ set original_price khi tạo mới
        if self._state.adding:
            self.original_price = self.product.price

        super().save(*args, **kwargs)

    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now < self.end_time

    @property
    def remaining_time(self):
        if not self.is_ongoing:
            return 0
        return int((self.end_time - timezone.now()).total_seconds())

    @property
    def remaining_stock(self):
        if self.product is None:
            return 0  # hoặc raise Exception nếu muốn

        from orders.models import OrderItem
        sold = OrderItem.objects.filter(
            product=self.product,
            order__status__in=['paid', 'shipped', 'delivered'],
            created_at__gte=self.start_time,
            created_at__lt=self.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0

        return max(0, self.stock - sold)
    
    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now < self.end_time
    
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
    # quantity: số lượt voucher cấp cho user (ví dụ 1 hoặc 3)
    quantity = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "voucher")

    def remaining_for_user(self):
        return max(0, self.quantity - self.used_count)

    def mark_used_once(self):
        self.used_count += 1
        if self.used_count >= self.quantity:
            self.is_used = True
            from django.utils.timezone import now
            self.used_at = now()
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.voucher.code} - {self.used_count}/{self.quantity}"
