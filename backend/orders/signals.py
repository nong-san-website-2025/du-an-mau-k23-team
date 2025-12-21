"""
Django Signals for Order notifications
Automatically send SSE notifications when order status changes
"""
from decimal import Decimal

from django.apps import apps
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db.models import F
from django.conf import settings

from .models import Order, OrderItem
from wallet.models import Wallet
from users.models import CustomUser
from .services import get_platform_wallet, reduce_stock_for_order  # Import từ services

import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Store old status to detect changes
_order_old_status = {}

COMPLETED_ORDER_STATUSES = {"success", "delivered"}


# ✅ SỬA LỖI: Gộp 2 hàm pre_save thành 1
@receiver(pre_save, sender=Order)
def capture_previous_status(sender, instance: Order, **kwargs):
    """
    Lưu trạng thái cũ của Order để kiểm tra khi post_save
    """
    if instance.pk:
        try:
            old_order = Order.objects.get(pk=instance.pk)
            _order_old_status[instance.pk] = old_order.status
        except Order.DoesNotExist:
            _order_old_status[instance.pk] = None


# ✅ Helper: Tạo thanh toán khi đơn hàng hoàn thành
def ensure_payment_for_completed_order(instance, created, old_status):
    """Create or update Payment when an order moves into a completed status."""
    if instance.status not in COMPLETED_ORDER_STATUSES:
        return

    payment_model = apps.get_model("payments", "Payment")

    order_total = instance.total_price or Decimal("0")
    if order_total <= 0:
        return

    status_changed = old_status != instance.status if old_status is not None else created
    payment, payment_created = payment_model.objects.get_or_create(
        order=instance,
        defaults={
            "amount": order_total,
            "status": "success",
        },
    )

    update_fields = []
    if payment.amount != order_total:
        payment.amount = order_total
        update_fields.append("amount")
    if payment.status != "success":
        payment.status = "success"
        update_fields.append("status")

    if payment_created:
        if instance.created_at and payment.created_at != instance.created_at:
            payment.created_at = instance.created_at
            update_fields.append("created_at")
    elif not status_changed and not update_fields:
        return

    if update_fields:
        payment.save(update_fields=list(set(update_fields)))

    logger.info(
        "Ensured payment for completed order %s (created=%s, updated_fields=%s)",
        instance.id,
        payment_created,
        update_fields,
    )


# ✅ Signal 1: Gửi thông báo (Giữ nguyên logic của bạn)
@receiver(post_save, sender=Order)
def send_order_status_notification(sender, instance, created, **kwargs):
    """Send SSE notification and ensure payment when order updates."""
    from users.views import send_notification_to_user
    Notification = apps.get_model("users", "Notification")

    old_status = _order_old_status.get(instance.pk)
    
    # Logic tạo Payment của bạn (đã sửa helper ở trên)
    ensure_payment_for_completed_order(instance=instance, created=created, old_status=old_status)

    user_id = instance.user.id if instance.user else None
    if not user_id:
        # Dọn dẹp cache nếu user không tồn tại để signal kia không chạy
        if instance.pk in _order_old_status:
            del _order_old_status[instance.pk]
        return

    # Map status to Vietnamese
    STATUS_MAP = {
        "pending": "Chờ xác nhận",
        "shipping": "Đang giao hàng",
        "success": "Đã giao hàng",
        "cancelled": "Đã huỷ",
        "ready_to_pick": "Sẵn sàng lấy hàng",
        "picking": "Đang lấy hàng",
        "delivered": "Đã nhận hàng",
        "out_for_delivery": "Đang giao",
        "delivery_failed": "Giao hàng thất bại",
        "lost": "Thất lạc",
        "damaged": "Hư hỏng",
        "returned": "Đã trả hàng",
    }

    if created:
        # --- 1. THÔNG BÁO CHO KHÁCH HÀNG (Giữ nguyên logic của bạn) ---
        status_text = STATUS_MAP.get(instance.status, instance.status)
        title_cus = f"🛒 {status_text}"
        message_cus = f"Đơn hàng #{instance.id} - {status_text}"
        detail_cus = "Đơn hàng của bạn đã được tạo và đang chờ xác nhận từ người bán"

        try:
            Notification.objects.create(
                user=instance.user,
                type="order_created",
                title=title_cus,
                message=message_cus,
                detail=detail_cus,
                metadata={ "order_id": instance.id },
            )
            send_notification_to_user(user_id, {
                "type": "order_created",
                "title": title_cus,
                "message": message_cus,
                "order_id": instance.id,
            })
        except Exception as e:
            logger.error("Lỗi gửi thông báo cho khách: %s", e)

        # --- 2. THÊM MỚI: THÔNG BÁO CHO SELLER ---
        try:
            # Lấy danh sách ID của tất cả User là chủ Shop trong đơn hàng này
            seller_user_ids = OrderItem.objects.filter(order=instance)\
                .values_list('product__seller__user_id', flat=True)\
                .distinct()

            for s_user_id in seller_user_ids:
                if s_user_id:
                    s_title = "🔔 Đơn hàng mới!"
                    s_message = f"Bạn có đơn hàng mới #{instance.id}"
                    s_detail = f"Khách hàng {instance.user.get_full_name() or instance.user.username} vừa đặt hàng."
                    
                    # Lưu vào DB cho Seller
                    Notification.objects.create(
                        user_id=s_user_id, # Gửi cho User của Seller
                        type="new_order_seller",
                        title=s_title,
                        message=s_message,
                        detail=s_detail,
                        metadata={ "order_id": instance.id },
                    )
                    
                    # Bắn SSE cho Seller Center
                    send_notification_to_user(s_user_id, {
                        "type": "new_order_seller",
                        "title": s_title,
                        "message": s_message,
                        "order_id": instance.id,
                    })
            logger.info("Đã gửi thông báo đơn hàng mới cho các Seller liên quan.")
        except Exception as e:
            logger.error("Lỗi gửi thông báo cho Seller: %s", e)

    else:
        # Check if status changed
        new_status = instance.status

        if old_status and old_status != new_status:
            # Status changed - send notification
            icon_map = {
                "pending": "⏳",
                "shipping": "🚚",
                "success": "✅",
                "cancelled": "❌",
                 # ... (các icon khác)
            }
            icon = icon_map.get(new_status, "📢")
            status_text = STATUS_MAP.get(new_status, new_status)
            old_status_text = STATUS_MAP.get(old_status, old_status)
            
            detail_map = {
                "pending": "Đơn hàng đang chờ người bán xác nhận",
                "shipping": "Đơn hàng đang được giao đến bạn",
                "delivered": "Đơn hàng đã được giao thành công",
                "success": "Đơn hàng đã hoàn thành",
                "cancelled": "Đơn hàng đã bị hủy",
            }

            title = f"{icon} {status_text}"
            message = f"Đơn hàng #{instance.id} - {status_text}"
            detail = detail_map.get(
                new_status, f'Trạng thái đã chuyển từ "{old_status_text}" sang "{status_text}"'
            )

            # Sửa lỗi: Thay /* ... */ bằng các trường cụ thể hoặc để trống
            notification_data = {
                "type": "order_status_changed",
                "title": title,
                "message": message,
                "detail": detail,
                "order_id": instance.id,
                # Thêm các trường cụ thể nếu cần, ví dụ:
                # "user_id": user_id,
                # "timestamp": instance.updated_at.isoformat(),
            }

            try:
                # Save to database
                Notification.objects.create(
                    user=instance.user,
                    type="order_status_changed",
                    title=title,
                    message=message,
                    detail=detail,
                    metadata={ "order_id": instance.id }, # Sửa lỗi: loại bỏ /* ... */
                )
                # Send via SSE
                send_notification_to_user(user_id, notification_data)
                logger.info(
                    "Sent order status change notification to user %s: %s -> %s",
                    user_id,
                    old_status,
                    new_status,
                )
            except Exception as e:
                logger.error("Failed to send order status notification: %s", e)

    # Dọn dẹp cache sau khi xử lý xong
    if instance.pk in _order_old_status:
        del _order_old_status[instance.pk]


# ✅ Signal 2: Xử lý Logic nghiệp vụ (SOLD, VÍ TIỀN, TỒN KHO)
@receiver(post_save, sender=Order)
def update_wallet_on_success(sender, instance: Order, created, **kwargs):
    """
    Xử lý logic nghiệp vụ KHI ĐƠN HÀNG THAY ĐỔI TRẠNG THÁI.
    - success: Cộng 'sold', chia tiền ví, trừ tồn kho (1 lần duy nhất).
    - cancelled (từ success): Rollback 'sold', rollback tiền ví.
    """
    # Import Product ở đây để tránh circular import
    from products.models import Product
    
    try:
        # SỬA LỖI: Lấy old_status từ dictionary cache
        old_status = _order_old_status.get(instance.pk, None)
        new_status = instance.status

        # Nếu không thay đổi trạng thái thì bỏ qua
        if old_status == new_status:
            return

        # Helper: tính số tiền của mỗi seller
        def compute_seller_amounts(order: Order):
            mapping = defaultdict(Decimal)
            items = OrderItem.objects.filter(order=order).select_related('product__seller__user')
            for it in items:
                if not it.product or not it.product.seller or not it.product.seller.user_id:
                    continue
                item_total = Decimal(it.price) * Decimal(it.quantity)
                # Thêm quantize để làm tròn tiền
                seller_share = (Decimal('0.90') * item_total).quantize(Decimal('1')) 
                mapping[it.product.seller.user_id] += seller_share
            return mapping

        # === XỬ LÝ KHI ĐƠN HÀNG THÀNH CÔNG ===
        if new_status == 'success' and old_status != 'success':
            
            # ✅ SỬA LỖI: Thêm Idempotency
            # Chỉ chạy nếu cờ 'sold_counted' là False
            if getattr(instance, 'sold_counted', False):
                logger.warning(f"Order #{instance.id} đã được xử lý 'success' trước đó, bỏ qua signal.")
                return

            logger.info(f"Order #{instance.id} chuyển sang 'success'. Đang xử lý 'sold', 'wallet', 'stock'.")

            # --- Trừ tồn kho (Gọi service đã có) ---
            try:
                # Hàm này đã có idempotent (kiểm tra stock_deducted)
                reduce_stock_for_order(instance)
            except Exception as e:
                logger.error(f"Lỗi khi trừ tồn kho (từ signal) cho Order #{instance.id}: {e}")
                # Có thể raise lỗi ở đây để rollback transaction nếu muốn
                pass 

            # --- ✅ SỬA LỖI: Cập nhật 'sold', không phải 'ordered_quantity' ---
            items = OrderItem.objects.filter(order=instance)
            for it in items:
                if it.product:
                    # Dùng F() để tăng 'sold' một cách an toàn
                    Product.objects.filter(id=it.product_id).update(
                        sold=F('sold') + it.quantity
                    )
            
            # --- Chia tiền cho admin & seller ---
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) + admin_commission
                admin_wallet.save(update_fields=['balance'])

            seller_amounts = compute_seller_amounts(instance)
            if seller_amounts:
                for user_id, amount in seller_amounts.items():
                    try:
                        user = CustomUser.objects.get(pk=user_id)
                    except CustomUser.DoesNotExist:
                        continue
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    wallet.balance = (wallet.balance or 0) + amount
                    wallet.save(update_fields=['balance'])
            
            # ✅ SỬA LỖI: Đánh dấu đơn hàng này đã được xử lý
            instance.sold_counted = True
            instance.save(update_fields=['sold_counted'])
            
            logger.info(f"Order #{instance.id} đã xử lý 'sold' và 'wallet' thành công.")
            return

        # === XỬ LÝ KHI ĐƠN HÀNG BỊ HỦY (TỪ SUCCESS) ===
        if old_status == 'success' and new_status == 'cancelled':
            logger.info(f"Order #{instance.id} chuyển từ 'success' -> 'cancelled'. Đang rollback.")

            # --- Hoàn tiền admin ---
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) - admin_commission
                admin_wallet.save(update_fields=['balance'])

            # --- Hoàn tiền seller ---
            seller_amounts = compute_seller_amounts(instance)
            if seller_amounts:
                for user_id, amount in seller_amounts.items():
                    try:
                        user = CustomUser.objects.get(pk=user_id)
                    except CustomUser.DoesNotExist:
                        continue
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    wallet.balance = (wallet.balance or 0) - amount
                    wallet.save(update_fields=['balance'])

            # --- ✅ SỬA LỖI: Rollback 'sold', không phải 'ordered_quantity' ---
            items = OrderItem.objects.filter(order=instance)
            for it in items:
                if it.product:
                    # Dùng F() để trừ 'sold' an toàn
                    Product.objects.filter(id=it.product_id).update(
                        sold=F('sold') - it.quantity
                    )
            
            logger.info(f"Order #{instance.id} đã rollback 'sold' và 'wallet'.")

    except Exception as e:
        logger.error(f"Lỗi nghiêm trọng trong signal update_wallet_on_success cho Order #{instance.id}: {e}")
        pass
    
    # ✅ Dọn dẹp cache sau khi TẤT CẢ signal đã chạy
    finally:
        if instance.pk in _order_old_status:
            try:
                del _order_old_status[instance.pk]
            except KeyError:
                pass # An toàn nếu signal kia đã xóa


@receiver(post_save, sender=Order)
def auto_order_notification(sender, instance, created, **kwargs):
    """
    Hàm này sẽ TỰ ĐỘNG CHẠY mỗi khi một Đơn hàng được Lưu (Save)
    """
    title = ""
    # 1. Nếu là đơn hàng mới tạo
    if created:
        title = "Đặt hàng thành công"
        msg = f"Đơn hàng {instance.order_code} đã được hệ thống tiếp nhận."
    
    # 2. Nếu là cập nhật trạng thái (không phải tạo mới)
    elif 'status' in (kwargs.get('update_fields') or []):
        if instance.status == 'SHIPPING':
            title = "Đơn hàng đang giao"
            msg = f"Đơn hàng {instance.order_code} đang trên đường đến bạn."
        elif instance.status == 'DELIVERED':
            title = "Giao hàng thành công"
            msg = f"Đơn hàng {instance.order_code} đã giao đến bạn."

    # Nếu có tiêu đề phù hợp thì mới tạo thông báo
    if title:
        # Tự động lưu vào DB
        noti = Notification.objects.create(
            user=instance.user,
            title=title,
            message=msg,
            type="ORDER",
            metadata={"order_id": instance.id} # Metadata này để click là bay tới đơn hàng
        )

        # Tự động đẩy qua WebSocket để khách thấy "số đỏ" trên chuông ngay lập tức
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.user.id}",
            {
                "type": "send_notification",
                "event": "new_notification",
                "data": {
                    "id": noti.id,
                    "title": noti.title,
                    "is_read": False,
                    "metadata": noti.metadata
                }
            }
        )