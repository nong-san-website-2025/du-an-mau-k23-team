from django.contrib import admin
from .models import Product, Category, Subcategory, ProductFeature

admin.site.register(Category)
admin.site.register(Subcategory)
admin.site.register(Product)
admin.site.register(ProductFeature)
        