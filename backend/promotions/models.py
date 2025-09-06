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
