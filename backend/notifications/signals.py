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
@receiver(post_save, sender='orders.Order')
def notify_order_status_change(sender, instance, created, **kwargs):
    """
    Khi đơn hàng thay đổi, chỉ cần tạo bản ghi Notification.
    Signal 1 ở trên sẽ tự động lo việc gửi Real-time.
    """
    # Lấy model Notification động để an toàn tuyệt đối
    Notification = apps.get_model('notifications', 'Notification')

    title = ""
    message = ""

    # Lấy mã đơn hàng (fallback về ID nếu không có order_code)
    order_ref = getattr(instance, 'order_code', f"#{instance.id}")

    if created:
        title = "🛒 Đặt hàng thành công"
        message = f"Đơn hàng {order_ref} của bạn đã được hệ thống ghi nhận."
    elif 'status' in (kwargs.get('update_fields') or []):
        # Logic cho các trạng thái cập nhật
        status = str(instance.status).upper()
        if status == 'SHIPPING':
            title = "🚚 Đơn hàng đang giao"
            message = f"Đơn hàng {order_ref} đang trên đường đến bạn."
        elif status == 'SUCCESS':
            title = "✅ Giao hàng thành công"
            message = f"Đơn hàng {order_ref} đã được giao thành công."
        elif status == 'CANCELLED':
            title = "❌ Đơn hàng đã hủy"
            message = f"Đơn hàng {order_ref} đã bị hủy."

    if title and instance.user:
        # Tránh phá vỡ transaction hiện tại: tạo Notification sau khi commit
        def _create_notification():
            try:
                Notification.objects.create(
                    user=instance.user,
                    title=title,
                    message=message,
                    # Khớp với TYPE_CHOICES để tránh lỗi validate
                    type=("order_created" if created else "order_status_changed"),
                    metadata={"order_id": instance.id, "type": "ORDER_DETAIL"}
                )
            except Exception as e:
                logger.error(f"Lỗi tạo Notification cho Order: {e}")

        transaction.on_commit(_create_notification)
