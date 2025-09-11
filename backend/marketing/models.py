# apps/marketing/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Banner(models.Model):
    POSITION_CHOICES = [
        ("hero", "Hero - top"),
        ("carousel", "Carousel"),
        ("side", "Sidebar"),
        ("mobile", "Mobile only"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="banners/%Y/%m/")
    click_url = models.URLField(blank=True, null=True)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default="carousel")
    priority = models.IntegerField(default=0)  # higher renders first
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    target_category = models.ForeignKey("products.Category", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-priority", "-start_at"]

    def __str__(self):
        return self.title or f"Banner {self.id}"

    def is_live(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_at and now < self.start_at:
            return False
        if self.end_at and now > self.end_at:
            return False
        return True


class FlashSale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    products = models.ManyToManyField("products.Product", through="FlashSaleItem")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class FlashSaleItem(models.Model):
    flashsale = models.ForeignKey(
        FlashSale, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="marketing_flashsale_items"
    )
    discounted_price = models.DecimalField(max_digits=12, decimal_places=2)
    limited_stock = models.IntegerField(null=True, blank=True)
    sold = models.IntegerField(default=0)

    class Meta:
        unique_together = ("flashsale", "product")

    def __str__(self):
        return f"{self.flashsale.name} - {self.product.name}"



class Voucher(models.Model):
    CODE_TYPE = [("single", "single-code"), ("bulk", "bulk")]
    DISCOUNT_TYPE = [("percent", "%"), ("amount", "Amount")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    usage_limit = models.IntegerField(null=True, blank=True)
    per_user_limit = models.IntegerField(default=1)
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class VoucherUsage(models.Model):
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    count = models.IntegerField(default=0)

    class Meta:
        unique_together = ("voucher", "user")

    def __str__(self):
        return f"{self.user.username} - {self.voucher.code} ({self.count})"
