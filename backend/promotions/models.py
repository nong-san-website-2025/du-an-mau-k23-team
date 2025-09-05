from django.db import models

class Promotion(models.Model):
    TYPE_CHOICES = [
        ("Promotion", "Promotion"),
        ("Flash Sale", "Flash Sale"),
        ("Voucher", "Voucher"),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    discount = models.FloatField(default=0)
    start = models.DateTimeField()
    end = models.DateTimeField()
    products = models.IntegerField(default=0)  # số sản phẩm áp dụng
    used = models.IntegerField(default=0)      # số lượt đã dùng
    total = models.IntegerField(default=0)     # tổng số lượt

    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @property
    def discount_display(self):
        return f"{self.discount}%"
