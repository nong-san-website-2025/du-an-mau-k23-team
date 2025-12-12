from django.contrib import admin
from django.utils.html import mark_safe
from .models import Seller, SellerActivityLog, Shop, Voucher, SellerFollow


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ("store_name", "user", "status", "created_at")
    list_filter = ("status", "business_type")
    search_fields = ("store_name", "user__email", "phone")

    readonly_fields = [
        "preview_shop_image",
        "preview_cccd_front",
        "preview_cccd_back",
        "created_at",  # 🔥 QUAN TRỌNG: thêm vào để tránh lỗi
    ]

    fieldsets = (
        ("Thông tin cửa hàng", {
            "fields": (
                "user", "store_name", "bio", "address", "phone",
                "image", "preview_shop_image",
            )
        }),
        ("Thông tin pháp lý", {
            "fields": (
                "business_type",
                "tax_code",
                "cccd_front", "preview_cccd_front",
                "cccd_back", "preview_cccd_back",
                "business_license",
            )
        }),
        ("Trạng thái", {
            "fields": ("status", "rejection_reason")
        }),
        ("Thời gian", {
            "fields": ("created_at",),   # OK vì đã nằm trong readonly_fields
        }),
    )

    def preview_shop_image(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="200" style="border-radius: 6px;" />')
        return "Chưa có ảnh"
    preview_shop_image.short_description = "Ảnh cửa hàng"

    def preview_cccd_front(self, obj):
        if obj.cccd_front:
            return mark_safe(f'<img src="{obj.cccd_front.url}" width="250" />')
        return "Chưa có ảnh"
    preview_cccd_front.short_description = "CCCD mặt trước"

    def preview_cccd_back(self, obj):
        if obj.cccd_back:
            return mark_safe(f'<img src="{obj.cccd_back.url}" width="250" />')
        return "Chưa có ảnh"
    preview_cccd_back.short_description = "CCCD mặt sau"


admin.site.register(SellerActivityLog)
admin.site.register(Shop)
admin.site.register(Voucher)
admin.site.register(SellerFollow)
