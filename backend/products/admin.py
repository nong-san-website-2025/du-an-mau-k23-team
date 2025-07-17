from django.contrib import admin
from .models import Product, Category  # Xóa Category nếu không có

admin.site.register(Product)
admin.site.register(Category)
