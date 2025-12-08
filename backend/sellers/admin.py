from django.contrib import admin
from .models import Seller

@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ('id', 'store_name', 'status', 'user', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('store_name', 'user__username', 'user__email')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Thông tin cửa hàng', {
            'fields': ('user', 'store_name', 'bio', 'address', 'phone', 'image')
        }),
        ('Trạng thái', {
            'fields': ('status', 'rejection_reason')
        }),
        ('Thời gian', {
            'fields': ('created_at',)
        }),
    )
