from django.contrib import admin
from .models import Product, Category, Subcategory, ProductFeature, ProductImage

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'status', 'commission_rate', 'created_at')
    list_filter = ('status', 'is_featured')
    search_fields = ('name', 'key')
    list_editable = ('commission_rate',)
    fields = ('name', 'key', 'status', 'image', 'is_featured', 'commission_rate', 'reject_reason')

admin.site.register(Category, CategoryAdmin)
admin.site.register(Subcategory)
admin.site.register(Product)
admin.site.register(ProductFeature)
admin.site.register(ProductImage)