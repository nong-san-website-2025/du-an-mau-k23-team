from decimal import Decimal
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
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

    if platform_user is None:
        platform_user = CustomUser.objects.filter(is_superuser=True).order_by('id').first()

    if platform_user is None:
        return None

    wallet, _ = Wallet.objects.get_or_create(user=platform_user)
    return wallet


@receiver(pre_save, sender=Order)
def capture_previous_status(sender, instance: Order, **kwargs):
    """
    Lưu trạng thái cũ của Order để kiểm tra khi post_save
    """
    if instance.pk:
        try:
            previous = Order.all_objects.get(pk=instance.pk)
            instance._old_status = previous.status
        except Order.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Order)
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
