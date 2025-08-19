from django.db import models
from users.models import CustomUser
from django.conf import settings

class Seller(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="seller")
    store_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)  
    phone = models.CharField(max_length=20, blank=True)     
    image = models.ImageField(upload_to='stores/', blank=True, null=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = [
        ("pending", "Chờ duyệt"),
        ("approved", "Đã duyệt"),
        ("rejected", "Bị từ chối"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return self.store_name
class Shop(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    name = models.CharField(max_length=255)              # tên cửa hàng
    description = models.TextField(blank=True, null=True) # mô tả
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Order(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="orders")
    customer_name = models.CharField(max_length=100)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

class Voucher(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="vouchers")
    code = models.CharField(max_length=50, unique=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    active = models.BooleanField(default=True)