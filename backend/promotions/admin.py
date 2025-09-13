from django.contrib import admin
from .models import Promotion, Voucher

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'start', 'end', 'active', 'created_at')
    search_fields = ('code', 'name')
    list_filter = ('type', 'active')

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'scope', 'discount_type', 
                    'discount_percent', 'discount_amount', 'freeship_amount', 
                    'min_order_value', 'start_at', 'end_at', 'active', 'seller', 'created_at')
    search_fields = ('code', 'title')
    list_filter = ('scope', 'active')
