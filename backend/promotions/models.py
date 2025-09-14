from django.db import models
from django.conf import settings
from products.models import Product
from products.serializers import ProductListSerializer

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

    promotion = models.OneToOneField(
        Promotion, null=True, blank=True, on_delete=models.CASCADE, related_name="voucher"
    )

    code = models.CharField(max_length=50) 
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    scope = models.CharField(max_length=10, choices=Scope.choices, default=Scope.SYSTEM)
    seller = models.ForeignKey("store.Store", null=True, blank=True, on_delete=models.CASCADE)

    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    freeship_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)

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

    def __str__(self):
        return f"{self.code} ({self.scope})"


class FlashSale(models.Model):
    name = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class FlashSaleItem(models.Model):
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="flashsale_items")
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)  # số lượng áp dụng khuyến mãi
    sold = models.PositiveIntegerField(default=0)      # số đã bán trong flash sale

    class Meta:
        unique_together = ("flash_sale", "product")  # tránh trùng sản phẩm trong 1 đợt sale

    def __str__(self):
        return f"{self.product.name} - {self.sale_price} (FS: {self.flash_sale.name})"
