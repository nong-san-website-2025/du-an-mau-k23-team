from django.contrib import admin
from .models import Product  # Xóa Category nếu không có

admin.site.register(Product)
