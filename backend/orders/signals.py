"""
Django Signals for Order notifications
Automatically send SSE notifications when order status changes
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Order
import logging

logger = logging.getLogger(__name__)

# Store old status to detect changes
_order_old_status = {}

@receiver(pre_save, sender=Order)
def capture_old_status(sender, instance, **kwargs):
    """Capture old status before save"""
    if instance.pk:
        try:
            old_order = Order.objects.get(pk=instance.pk)
            _order_old_status[instance.pk] = old_order.status
        except Order.DoesNotExist:
            _order_old_status[instance.pk] = None


@receiver(post_save, sender=Order)
def send_order_status_notification(sender, instance, created, **kwargs):
    """
    Send SSE notification when order status changes and save to database
    """
    # Import here to avoid circular import
    from users.views import send_notification_to_user
    from django.apps import apps
    Notification = apps.get_model('users', 'Notification')
    
    user_id = instance.user.id if instance.user else None
    if not user_id:
        return
    
    # Map status to Vietnamese
    STATUS_MAP = {
        'pending': 'Chờ xác nhận',
        'shipping': 'Đang giao hàng',
        'success': 'Đã giao hàng',
        'cancelled': 'Đã huỷ',
        'ready_to_pick': 'Sẵn sàng lấy hàng',
        'picking': 'Đang lấy hàng',
        'delivered': 'Đã nhận hàng',
        'out_for_delivery': 'Đang giao',
        'delivery_failed': 'Giao hàng thất bại',
        'lost': 'Thất lạc',
        'damaged': 'Hư hỏng',
        'returned': 'Đã trả hàng',
    }
    
    if created:
        # New order created
        status_text = STATUS_MAP.get(instance.status, instance.status)
        title = f'🛒 {status_text}'
        message = f'Đơn hàng #{instance.id} - {status_text}'
        detail = f'Đơn hàng của bạn đã được tạo và đang chờ xác nhận từ người bán'
        
        notification_data = {
            'type': 'order_created',
            'title': title,
            'message': message,
            'detail': detail,
            'order_id': instance.id,
            'order_code': instance.ghn_order_code or f"{instance.id}",
            'order_total': float(instance.total_price or 0),
            'shop_name': (instance.items.first().product.seller.store_name if instance.items.first() and instance.items.first().product and instance.items.first().product.seller else None),
            'status': instance.status,
            'timestamp': instance.created_at.isoformat() if instance.created_at else None,
        }
        
        try:
            # Save to database
            Notification.objects.create(
                user=instance.user,
                type='order_created',
                title=title,
                message=message,
                detail=detail,
                metadata={
                    'order_id': instance.id,
                    'order_code': instance.ghn_order_code or f"{instance.id}",
                    'order_total': float(instance.total_price or 0),
                    'shop_name': (instance.items.first().product.seller.store_name if instance.items.first() and instance.items.first().product and instance.items.first().product.seller else None),
                    'status': instance.status,
                }
            )
            
            # Send via SSE
            send_notification_to_user(user_id, notification_data)
            logger.info(f"Sent order created notification to user {user_id} for order {instance.id}")
        except Exception as e:
            logger.error(f"Failed to send order notification: {e}")
    
    else:
        # Check if status changed
        old_status = _order_old_status.get(instance.pk)
        new_status = instance.status
        
        if old_status and old_status != new_status:
            # Status changed - send notification
            
            # Choose icon based on status
            icon_map = {
                'pending': '⏳',
                'shipping': '🚚',
                'success': '✅',
                'cancelled': '❌',
                'delivered': '📦',
                'ready_to_pick': '📋',
                'picking': '🏃',
                'out_for_delivery': '🚛',
                'delivery_failed': '⚠️',
                'lost': '🔍',
                'damaged': '💔',
                'returned': '↩️',
            }
            
            icon = icon_map.get(new_status, '📢')
            status_text = STATUS_MAP.get(new_status, new_status)
            old_status_text = STATUS_MAP.get(old_status, old_status)
            
            # Custom detail messages for each status
            detail_map = {
                'pending': 'Đơn hàng đang chờ người bán xác nhận',
                'shipping': 'Đơn hàng đang được giao đến bạn',
                'delivered': 'Đơn hàng đã được giao thành công',
                'success': 'Đơn hàng đã hoàn thành',
                'cancelled': 'Đơn hàng đã bị hủy',
                'ready_to_pick': 'Đơn hàng sẵn sàng để lấy',
                'picking': 'Shipper đang lấy hàng',
                'out_for_delivery': 'Đơn hàng đang trên đường giao',
                'delivery_failed': 'Giao hàng thất bại, vui lòng liên hệ',
            }
            
            title = f'{icon} {status_text}'
            message = f'Đơn hàng #{instance.id} - {status_text}'
            detail = detail_map.get(new_status, f'Trạng thái đã chuyển từ "{old_status_text}" sang "{status_text}"')
            
            notification_data = {
                'type': 'order_status_changed',
                'title': title,
                'message': message,
                'detail': detail,
                'order_id': instance.id,
                'order_code': instance.ghn_order_code or f"{instance.id}",
                'order_total': float(instance.total_price or 0),
                'shop_name': (instance.items.first().product.seller.store_name if instance.items.first() and instance.items.first().product and instance.items.first().product.seller else None),
                'old_status': old_status,
                'new_status': new_status,
                'timestamp': instance.created_at.isoformat() if instance.created_at else None,
            }
            
            try:
                # Save to database
                Notification.objects.create(
                    user=instance.user,
                    type='order_status_changed',
                    title=title,
                    message=message,
                    detail=detail,
                    metadata={
                        'order_id': instance.id,
                        'order_code': instance.ghn_order_code or f"{instance.id}",
                        'order_total': float(instance.total_price or 0),
                        'shop_name': (instance.items.first().product.seller.store_name if instance.items.first() and instance.items.first().product and instance.items.first().product.seller else None),
                        'old_status': old_status,
                        'new_status': new_status,
                    }
                )
                
                # Send via SSE
                send_notification_to_user(user_id, notification_data)
                logger.info(f"Sent order status change notification to user {user_id}: {old_status} -> {new_status}")
            except Exception as e:
                logger.error(f"Failed to send order status notification: {e}")
            
            # Clean up old status
            if instance.pk in _order_old_status:
                del _order_old_status[instance.pk]