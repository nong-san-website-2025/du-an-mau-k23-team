from django.db import models
from users.models import CustomUser
from django.conf import settings

class Seller(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    store_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)  
    phone = models.CharField(max_length=20, blank=True)     
    image = models.ImageField(upload_to='stores/', blank=True, null=True)  
    created_at = models.DateTimeField(auto_now_add=True)

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

