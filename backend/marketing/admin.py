# apps/marketing/admin.py
from django.contrib import admin
from .models import Banner, FlashSale, FlashSaleItem, Voucher, VoucherUsage

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["title", "position", "priority", "start_at", "end_at", "is_active"]
    list_filter = ["position", "is_active"]
    search_fields = ["title"]


class FlashSaleItemInline(admin.TabularInline):
    model = FlashSaleItem
    extra = 1


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ["name", "start_at", "end_at", "is_active"]
    inlines = [FlashSaleItemInline]


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "discount_type", "value", "start_at", "end_at", "is_active", "used_count"]
    search_fields = ["code", "name"]


@admin.register(VoucherUsage)
class VoucherUsageAdmin(admin.ModelAdmin):
    list_display = ["voucher", "user", "count"]
    search_fields = ["voucher__code", "user__username"]
