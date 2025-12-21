from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('order_created', 'Đơn hàng mới'),
        ('order_status_changed', 'Cập nhật đơn hàng'),
        ('chat', 'Tin nhắn'),
        ('system', 'Hệ thống'),
        ('promo', 'Khuyến mãi'),
        ('payment', 'Thanh toán'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_notifications")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_notifications")
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    metadata = models.JSONField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']