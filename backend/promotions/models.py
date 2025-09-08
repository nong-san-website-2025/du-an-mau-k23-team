# promotions/models.py
from django.db import models

class Promotion(models.Model):
    code = models.CharField(max_length=50, unique=True)  # Mã voucher duy nhất
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)  # Mô tả ngắn
    type = models.CharField(max_length=50, choices=[('Promotion','Giảm tiền'), ('Flash Sale','Giảm %'), ('Voucher','Freeship')])
    condition = models.CharField(max_length=255, blank=True, null=True)  # Điều kiện áp dụng
    start = models.DateTimeField()
    end = models.DateTimeField()
    total = models.PositiveIntegerField(default=0)
    used = models.PositiveIntegerField(default=0)
    products = models.PositiveIntegerField(default=0)  # Số sản phẩm áp dụng

    def __str__(self):
        return f"{self.code} - {self.name}"
class Voucher(models.Model):
    SCOPE_CHOICES = (
        ("system", "System"),
        ("seller", "Seller"),
    )
    code = models.CharField(max_length=64, unique=True)
    campaign_name = models.CharField(max_length=200, blank=True)  # tên chương trình (campaign)
    title = models.CharField(max_length=200, blank=True)          # tên khuyến mãi (promotion)
    description = models.TextField(blank=True)
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default="system")
    seller = models.ForeignKey("sellers.Seller", null=True, blank=True, on_delete=models.CASCADE)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.scope})"


class FlashSale(models.Model):
    title = models.CharField(max_length=200)   # tên chương trình flash sale
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class FlashSaleItem(models.Model):
    flashsale = models.ForeignKey(FlashSale, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_limit = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("flashsale", "product")

    def __str__(self):
        return f"{self.flashsale.title} - {self.product.name}"
