# notifications/admin.py
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    # Các cột sẽ hiển thị ở danh sách
    list_display = ('user', 'title', 'type', 'is_read', 'created_at')
    
    # Bộ lọc bên phải
    list_filter = ('is_read', 'type', 'created_at')
    
    # Ô tìm kiếm
    search_fields = ('title', 'message', 'user__username')
    
    # Sắp xếp mặc định
    ordering = ('-created_at',)