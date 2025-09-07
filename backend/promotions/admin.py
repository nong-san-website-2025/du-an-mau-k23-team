# promotions/admin.py
from django.contrib import admin
from .models import Voucher, FlashSale, FlashSaleItem

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ("code", "scope", "seller", "discount_percent", "active", "start_at", "end_at")
    list_filter = ("scope", "active", "start_at", "end_at")
    search_fields = ("code", "title", "description")

class FlashSaleItemInline(admin.TabularInline):
    model = FlashSaleItem
    extra = 1

@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ("title", "start_at", "end_at", "active")
    list_filter = ("active", "start_at", "end_at")
    search_fields = ("title", "description")
    inlines = [FlashSaleItemInline]

@admin.register(FlashSaleItem)
class FlashSaleItemAdmin(admin.ModelAdmin):
    list_display = ("flashsale", "product", "sale_price", "stock_limit")
    search_fields = ("product__name",)
