"""
Django Signals for Order notifications
Automatically send SSE notifications when order status changes
"""
from decimal import Decimal

from django.apps import apps
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Order
import logging

logger = logging.getLogger(__name__)

# Store old status to detect changes
_order_old_status = {}

COMPLETED_ORDER_STATUSES = {"success", "delivered"}


def ensure_payment_for_completed_order(instance, created, old_status):
    """Create or update Payment when an order moves into a completed status."""
    if instance.status not in COMPLETED_ORDER_STATUSES:
        return

    payment_model = apps.get_model("payments", "Payment")
from collections import defaultdict
from .models import Order, OrderItem
from wallet.models import Wallet


def get_platform_wallet():
    """
    Trả về ví của nền tảng (admin ví hệ thống).
    Ưu tiên lấy user có username = settings.PLATFORM_WALLET_USERNAME,
    nếu không có thì lấy superuser đầu tiên.
    """
    from django.conf import settings
    from users.models import CustomUser

    platform_user = None
    configured_username = getattr(settings, 'PLATFORM_WALLET_USERNAME', None)

    if configured_username:
        try:
            platform_user = CustomUser.objects.get(username=configured_username)
        except CustomUser.DoesNotExist:
            platform_user = None

    order_total = instance.total_price or Decimal("0")
    if order_total <= 0:
        return

    # Only create/update when status changed to completed or payment missing
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
        # Align creation timestamp with order if available
        if instance.created_at and payment.created_at != instance.created_at:
            payment.created_at = instance.created_at
            update_fields.append("created_at")
    elif not status_changed and not update_fields:
        # No status change and no data updates required
        return

    if update_fields:
        payment.save(update_fields=list(set(update_fields)))

    logger.info(
        "Ensured payment for completed order %s (created=%s, updated_fields=%s)",
        instance.id,
        payment_created,
        update_fields,
    )

@receiver(pre_save, sender=Order)
def capture_old_status(sender, instance, **kwargs):
    """Capture old status before save"""
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


@receiver(post_save, sender=Order)
def send_order_status_notification(sender, instance, created, **kwargs):
    """Send SSE notification and ensure payment when order updates."""
    # Import inside to avoid circular imports
    from users.views import send_notification_to_user
    Notification = apps.get_model("users", "Notification")

    old_status = _order_old_status.get(instance.pk)
    ensure_payment_for_completed_order(instance=instance, created=created, old_status=old_status)

    user_id = instance.user.id if instance.user else None
    if not user_id:
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
        # New order created
        status_text = STATUS_MAP.get(instance.status, instance.status)
        title = f"🛒 {status_text}"
        message = f"Đơn hàng #{instance.id} - {status_text}"
        detail = "Đơn hàng của bạn đã được tạo và đang chờ xác nhận từ người bán"

        notification_data = {
            "type": "order_created",
            "title": title,
            "message": message,
            "detail": detail,
            "order_id": instance.id,
            "order_code": instance.ghn_order_code or f"{instance.id}",
            "order_total": float(instance.total_price or 0),
            "shop_name": (
                instance.items.first().product.seller.store_name
                if instance.items.first()
                and instance.items.first().product
                and instance.items.first().product.seller
                else None
            ),
            "status": instance.status,
            "timestamp": instance.created_at.isoformat() if instance.created_at else None,
        }

        try:
            # Save to database
            Notification.objects.create(
                user=instance.user,
                type="order_created",
                title=title,
                message=message,
                detail=detail,
                metadata={
                    "order_id": instance.id,
                    "order_code": instance.ghn_order_code or f"{instance.id}",
                    "order_total": float(instance.total_price or 0),
                    "shop_name": (
                        instance.items.first().product.seller.store_name
                        if instance.items.first()
                        and instance.items.first().product
                        and instance.items.first().product.seller
                        else None
                    ),
                    "status": instance.status,
                },
            )

            # Send via SSE
            send_notification_to_user(user_id, notification_data)
            logger.info("Sent order created notification to user %s for order %s", user_id, instance.id)
        except Exception as e:
            logger.error("Failed to send order notification: %s", e)

    else:
        # Check if status changed
        new_status = instance.status

        if old_status and old_status != new_status:
            # Status changed - send notification

            # Choose icon based on status
            icon_map = {
                "pending": "⏳",
                "shipping": "🚚",
                "success": "✅",
                "cancelled": "❌",
                "delivered": "📦",
                "ready_to_pick": "📋",
                "picking": "🏃",
                "out_for_delivery": "🚛",
                "delivery_failed": "⚠️",
                "lost": "🔍",
                "damaged": "💔",
                "returned": "↩️",
            }

            icon = icon_map.get(new_status, "📢")
            status_text = STATUS_MAP.get(new_status, new_status)
            old_status_text = STATUS_MAP.get(old_status, old_status)

            # Custom detail messages for each status
            detail_map = {
                "pending": "Đơn hàng đang chờ người bán xác nhận",
                "shipping": "Đơn hàng đang được giao đến bạn",
                "delivered": "Đơn hàng đã được giao thành công",
                "success": "Đơn hàng đã hoàn thành",
                "cancelled": "Đơn hàng đã bị hủy",
                "ready_to_pick": "Đơn hàng sẵn sàng để lấy",
                "picking": "Shipper đang lấy hàng",
                "out_for_delivery": "Đơn hàng đang trên đường giao",
                "delivery_failed": "Giao hàng thất bại, vui lòng liên hệ",
            }

            title = f"{icon} {status_text}"
            message = f"Đơn hàng #{instance.id} - {status_text}"
            detail = detail_map.get(
                new_status, f'Trạng thái đã chuyển từ "{old_status_text}" sang "{status_text}"'
            )

            notification_data = {
                "type": "order_status_changed",
                "title": title,
                "message": message,
                "detail": detail,
                "order_id": instance.id,
                "order_code": instance.ghn_order_code or f"{instance.id}",
                "order_total": float(instance.total_price or 0),
                "shop_name": (
                    instance.items.first().product.seller.store_name
                    if instance.items.first()
                    and instance.items.first().product
                    and instance.items.first().product.seller
                    else None
                ),
                "old_status": old_status,
                "new_status": new_status,
                "timestamp": instance.created_at.isoformat() if instance.created_at else None,
            }

            try:
                # Save to database
                Notification.objects.create(
                    user=instance.user,
                    type="order_status_changed",
                    title=title,
                    message=message,
                    detail=detail,
                    metadata={
                        "order_id": instance.id,
                        "order_code": instance.ghn_order_code or f"{instance.id}",
                        "order_total": float(instance.total_price or 0),
                        "shop_name": (
                            instance.items.first().product.seller.store_name
                            if instance.items.first()
                            and instance.items.first().product
                            and instance.items.first().product.seller
                            else None
                        ),
                        "old_status": old_status,
                        "new_status": new_status,
                    },
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

    # Always clean up cached status after processing this save
    if instance.pk in _order_old_status:
        del _order_old_status[instance.pk]
def update_wallet_on_success(sender, instance: Order, created, **kwargs):
    """
    Xử lý khi trạng thái đơn hàng thay đổi:
    - not-success -> success:
        + Trừ tồn kho (reduce_stock_for_order)
        + Cập nhật ordered_quantity (tổng số lượng đã đặt)
        + 10% tổng giá trị vào ví admin, 90% chia cho các seller tương ứng
    - success -> cancelled:
        + Hoàn lại ví (rollback)
        + Giảm ordered_quantity tương ứng
    """
    try:
        old_status = getattr(instance, "_old_status", None)
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
                seller_share = Decimal('0.90') * item_total
                mapping[it.product.seller.user_id] += seller_share
            return mapping

        # Khi chuyển sang success
        if new_status == 'success' and old_status != 'success':
            # --- Trừ tồn kho ---
            try:
                from .services import reduce_stock_for_order
                reduce_stock_for_order(instance)
            except Exception:
                pass  # Không chặn dòng tiền nếu lỗi tồn kho

            # --- Cập nhật số lượng đã đặt ---
            items = OrderItem.objects.filter(order=instance)
            for it in items:
                if it.product:
                    it.product.ordered_quantity = (it.product.ordered_quantity or 0) + it.quantity
                    it.product.save(update_fields=['ordered_quantity'])

            # --- Chia tiền cho admin & seller ---
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) + admin_commission
                admin_wallet.save(update_fields=['balance'])

            seller_amounts = compute_seller_amounts(instance)
            if seller_amounts:
                from users.models import CustomUser
                for user_id, amount in seller_amounts.items():
                    try:
                        user = CustomUser.objects.get(pk=user_id)
                    except CustomUser.DoesNotExist:
                        continue
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    wallet.balance = (wallet.balance or 0) + amount.quantize(Decimal('1'))
                    wallet.save(update_fields=['balance'])
            return

        # Khi chuyển từ success -> cancelled (hoàn tiền & rollback ordered_quantity)
        if old_status == 'success' and new_status == 'cancelled':
            # --- Hoàn tiền admin ---
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) - admin_commission
                admin_wallet.save(update_fields=['balance'])

            # --- Hoàn tiền seller ---
            seller_amounts = compute_seller_amounts(instance)
            if seller_amounts:
                from users.models import CustomUser
                for user_id, amount in seller_amounts.items():
                    try:
                        user = CustomUser.objects.get(pk=user_id)
                    except CustomUser.DoesNotExist:
                        continue
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    wallet.balance = (wallet.balance or 0) - amount.quantize(Decimal('1'))
                    wallet.save(update_fields=['balance'])

            # --- Giảm lại số lượng đã đặt ---
            items = OrderItem.objects.filter(order=instance)
            for it in items:
                if it.product:
                    it.product.ordered_quantity = max((it.product.ordered_quantity or 0) - it.quantity, 0)
                    it.product.save(update_fields=['ordered_quantity'])

    except Exception:
        # Không chặn luồng order nếu có lỗi, nhưng nên log ra
        pass
