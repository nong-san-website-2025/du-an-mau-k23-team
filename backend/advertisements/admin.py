from django.contrib import admin
from .models import Advertisement

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    # Hiển thị các cột chính trong danh sách
    list_display = (
        'title', 'ad_type', 'target_type', 'start_date', 
        'end_date', 'priority', 'is_active', 'views', 'clicks'
    )
    
    # Bộ lọc bên phải
    list_filter = (
        'ad_type', 'target_type', 'is_active', 'start_date', 'end_date'
    )
    
    # Ô tìm kiếm
    search_fields = ('title', 'description')
    
    # Các trường chỉ đọc
    readonly_fields = ('views', 'clicks', 'created_at', 'updated_at')

    # Nhóm trường thành các phần riêng
    fieldsets = (
        ("Thông tin cơ bản", {
            'fields': ('title', 'description', 'image', 'redirect_link', 'ad_type')
        }),
        ("Cài đặt hiển thị", {
            'fields': ('target_type', 'start_date', 'end_date', 'priority', 'is_active')
        }),
        ("Thống kê", {
            'fields': ('views', 'clicks')
        }),
        ("Thông tin hệ thống", {
            'fields': ('created_at', 'updated_at')
        }),
    )

    # Sắp xếp mặc định
    ordering = ('priority', '-created_at')
