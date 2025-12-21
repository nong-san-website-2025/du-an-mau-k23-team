from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Order
from notifications.models import Notification

_order_old_status = {}


def update_user_tier_on_order_complete(user):
    """
    Update user tier after order completion
    """
    try:
        from users.utils import update_user_tier
        update_user_tier(user)
    except Exception as e:
        print(f"Warning: Failed to update user tier: {e}")

@receiver(pre_save, sender=Order)
def capture_order_old_status(sender, instance, **kwargs):
    """Lấy status cũ trước khi save"""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            _order_old_status[instance.pk] = old_instance.status
        except Order.DoesNotExist:
            _order_old_status[instance.pk] = None


@receiver(post_save, sender=Order)
def create_order_status_notification(sender, instance, created, **kwargs):
    """Tạo thông báo khi order status thay đổi"""
    
    if created:
        return
    
    old_status = _order_old_status.pop(instance.pk, None)
    if not old_status or old_status == instance.status:
        return
    
    user = instance.user
    new_status = instance.status
    
    title = ""
    message = ""
    metadata = {
        "order_id": instance.id,
        "order_code": f"#{instance.id}",
        "old_status": old_status,
        "new_status": new_status,
    }
    
    if new_status == 'shipping':
        title = "Đơn hàng đang vận chuyển"
        message = f"Đơn hàng #{instance.id} đã được xác nhận và đang vận chuyển"
        metadata["type"] = "order_status_changed"
    
    elif new_status == 'delivered':
        title = "Đơn hàng đã giao"
        message = f"Đơn hàng #{instance.id} đã được giao thành công"
        metadata["type"] = "order_delivered"
    
    elif new_status == 'completed':
        title = "Đơn hàng hoàn tất"
        message = f"Đơn hàng #{instance.id} đã hoàn tất"
        metadata["type"] = "order_completed"
    
    elif new_status == 'cancelled':
        title = "Đơn hàng bị hủy"
        message = f"Đơn hàng #{instance.id} đã bị hủy"
        metadata["type"] = "order_cancelled"
    
    elif new_status == 'returned':
        title = "Đơn hàng trả hàng/hoàn tiền"
        message = f"Đơn hàng #{instance.id} đang xử lý trả hàng/hoàn tiền"
        metadata["type"] = "order_returned"
    
    if title and message:
        Notification.objects.create(
            user=user,
            type='order_status_changed',
            title=title,
            message=message,
            metadata=metadata,
            is_read=False
        )
    
    if new_status in ['completed', 'delivered']:
        update_user_tier_on_order_complete(user)
