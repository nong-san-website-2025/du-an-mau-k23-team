from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

@receiver(post_save, sender=Notification)
def send_notification_websocket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        # Sửa lại cho khớp với Consumer của bạn
        group_name = f"user_updates_{instance.user.id}" 
        
        serializer = NotificationSerializer(instance)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification", 
                "event": "new_notification",
                "data": serializer.data
            }
        )

# @receiver(post_save, sender=Order)
# def notify_order_status_change(sender, instance, created, **kwargs):
#     # Nếu là đơn hàng mới hoặc trạng thái thay đổi
#     title = ""
#     message = ""
    
#     if created:
#         title = "Đặt hàng thành công"
#         message = f"Đơn hàng #{instance.order_code} đã được hệ thống ghi nhận."
#     elif instance.status == 'SHIPPING':
#         title = "Đơn hàng đang giao"
#         message = f"Đơn hàng #{instance.order_code} đang trên đường đến bạn."
#     # ... thêm các trạng thái khác ...

#     if title:
#         Notification.objects.create(
#             user=instance.user, # Khách hàng
#             title=title,
#             message=message,
#             type="ORDER",
#             # Quan trọng: Gửi ID đơn hàng qua metadata
#             metadata={"order_id": instance.id, "type": "ORDER_DETAIL"} 
#         )