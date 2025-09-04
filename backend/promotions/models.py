from django.db import models
from django.utils import timezone

# -------------------- MÃ GIẢM GIÁ CHUNG --------------------
class Promotion(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        now = timezone.now()
        if not self.active:
            return False
        if self.start_at and now < self.start_at:
            return False
        if self.end_at and now > self.end_at:
            return False
        if self.usage_limit and self.used_count >= self.usage_limit:
            return False
        return True

    def __str__(self):
        return self.code


# -------------------- FLASH SALE --------------------
class FlashSale(models.Model):
    name = models.CharField(max_length=100)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    active = models.BooleanField(default=True)

    def is_active(self):
        now = timezone.now()
        return self.active and self.start_at <= now <= self.end_at

    def __str__(self):
        return self.name


# -------------------- VOUCHER CỦA CỬA HÀNG --------------------
class StoreVoucher(models.Model):
    store_name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    active = models.BooleanField(default=True)

    def is_valid(self):
        now = timezone.now()
        return self.active and self.start_at <= now <= self.end_at

    def __str__(self):
        return f"{self.store_name} - {self.code}"
