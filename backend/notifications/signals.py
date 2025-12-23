import logging
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps

# Import an toàn cho Channels
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
except ImportError:
    get_channel_layer = None
    async_to_sync = None

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------------

# -------------------------------------------------------------------------
@receiver(post_save, sender='notifications.Notification')
def send_notification_websocket(sender, instance, created, **kwargs):
    """
    Khi một Notification được lưu vào DB, bắn nó qua WebSocket cho người dùng.
    """
    if created and get_channel_layer and async_to_sync:
        try:
            # Lazy import Serializer để tránh lỗi vòng lặp nếu có
            from .serializers import NotificationSerializer

            channel_layer = get_channel_layer()
            # Đảm bảo group_name này khớp với group bạn định nghĩa trong consumers.py
            group_name = f"user_notifications_{instance.user.id}"

            serializer = NotificationSerializer(instance)

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "event": "new_notification",
                    "data": serializer.data
                }
            )
        except Exception as e:
            logger.error(f"Lỗi gửi WebSocket: {e}")

# -------------------------------------------------------------------------

# -------------------------------------------------------------------------
@receiver(post_save, sender='orders.Order', dispatch_uid="order_status_notification")
def notify_order_status_change(sender, instance, created, **kwargs):
    Notification = apps.get_model('notifications', 'Notification')
    title = ""
    message = ""
    order_ref = getattr(instance, 'order_code', f"#{instance.id}")

    # 1. Xử lý khi TẠO MỚI (created=True)
    if created:
        title = "🛒 Đặt hàng thành công"
        message = f"Đơn hàng {order_ref} của bạn đã được hệ thống ghi nhận."
    
    # 2. Xử lý khi CẬP NHẬT (created=False)
    else:
        # Kiểm tra xem status có nằm trong các trường vừa được update không
        # update_fields là danh sách các cột được save, ví dụ: order.save(update_fields=['status'])
        update_fields = kwargs.get('update_fields')
        
        # Chỉ xử lý nếu có update status cụ thể
        if update_fields and 'status' in update_fields:
            status = str(instance.status).upper()
            if status == 'SHIPPING':
                title = "🚚 Đơn hàng đang giao"
                message = f"Đơn hàng {order_ref} đang trên đường đến bạn."
            elif status == 'SUCCESS' or status == 'COMPLETED': # Check cả 2 trường hợp
                title = "✅ Giao hàng thành công"
                message = f"Đơn hàng {order_ref} đã hoàn tất."
            elif status == 'CANCELLED':
                title = "❌ Đơn hàng đã hủy"
                message = f"Đơn hàng {order_ref} đã bị hủy."

    # Chỉ tạo notification nếu có title
    if title and instance.user:
        try:
            Notification.objects.create(
                user=instance.user,
                title=title,
                message=message,
                type="ORDER",
                metadata={"order_id": instance.id, "type": "ORDER_DETAIL"}
            )
        except Exception as e:
            logger.error(f"Lỗi tạo Notification: {e}")
