from decimal import Decimal
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order
from wallet.models import Wallet


def get_platform_wallet():
    """
    Resolve platform wallet owner by settings.PLATFORM_WALLET_USERNAME if provided,
    otherwise fallback to the first superuser.
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
    # Attach previous status to the instance for transition detection
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
    Handle wallet movements on status transitions:
    - not-success -> success: +10% to admin, +90% to sellers
    - success -> cancelled: -10% from admin, -90% from sellers (rollback)
    """
    try:
        old_status = getattr(instance, "_old_status", None)
        new_status = instance.status

        # Nothing to do if status unchanged or initial create without transition
        if old_status == new_status:
            return

        # Helper to compute seller amounts (90% of each item total)
        from collections import defaultdict
        from .models import OrderItem  # local import to avoid circulars
        def compute_seller_amounts(order: Order):
            mapping = defaultdict(Decimal)
            items = OrderItem.objects.filter(order=order).select_related('product__seller__user')
            for it in items:
                if not it.product or not it.product.seller or not it.product.seller.user_id:
                    continue
                item_total = (Decimal(it.price) * Decimal(it.quantity))
                seller_share = (Decimal('0.90') * item_total)
                mapping[it.product.seller.user_id] += seller_share
            return mapping

        # Transition: to success (credit)
        if new_status == 'success' and old_status != 'success':
            # 10% to platform admin
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) + admin_commission
                admin_wallet.save(update_fields=['balance'])

            # 90% to sellers
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

        # Transition: success -> cancelled (rollback)
        if old_status == 'success' and new_status == 'cancelled':
            # -10% from platform admin
            admin_wallet = get_platform_wallet()
            if admin_wallet:
                admin_commission = (Decimal('0.10') * Decimal(instance.total_price)).quantize(Decimal('1'))
                admin_wallet.balance = (admin_wallet.balance or 0) - admin_commission
                admin_wallet.save(update_fields=['balance'])

            # -90% from sellers
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
    except Exception:
        # Avoid breaking order flow; consider logging
        pass