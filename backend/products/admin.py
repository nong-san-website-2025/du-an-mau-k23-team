from django.contrib import admin
from .models import Product, Category, Subcategory, ProductFeature, ProductImage

admin.site.register(Category)
admin.site.register(Subcategory)
admin.site.register(Product)
admin.site.register(ProductFeature)
admin.site.register(ProductImage)

        