from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment, SellerWallet, WalletTransaction
from orders.models import OrderItem
from decimal import Decimal
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# 🆕 Signal: Tự động tạo wallet khi seller mới được tạo
@receiver(post_save, sender='sellers.Seller')
def create_seller_wallet_on_seller_creation(sender, instance, created, **kwargs):
    """
    Automatically create SellerWallet when a new Seller is created
    """
    if created:
        wallet, _ = SellerWallet.objects.get_or_create(seller=instance)
        logger.info(f"✅ Created wallet for new seller: {instance.store_name}")

@receiver(post_save, sender=Payment)
def update_seller_wallet_on_payment(sender, instance, created, **kwargs):
    """
    Update SellerWallet when Payment is created or status changes to 'success'.
    Prevents duplicate additions by only processing on creation or status transitions.
    """
    if not instance.order:
        return

    # ✅ Chỉ xử lý khi Payment mới được tạo với status 'success'
    if not created and instance.status != 'success':
        return

    # Kiểm tra xem đã cộng vào wallet chưa (tránh duplicate)
    existing_transaction = WalletTransaction.objects.filter(
        note__contains=f"Thanh toán thành công cho đơn hàng #{instance.order.id}"
    ).exists()
    
    if existing_transaction:
        # Đã xử lý rồi, không cộng lần nữa
        logger.info(f"Payment {instance.id} already processed")
        return

    if instance.status != 'success':
        # Chỉ xử lý khi payment thành công
        return

    # Calculate seller amounts for this order
    seller_amounts = defaultdict(Decimal)
    order_items = OrderItem.objects.filter(order=instance.order).select_related('product__seller')
    for item in order_items:
        if item.product and item.product.seller:
            item_total = Decimal(str(item.price)) * Decimal(str(item.quantity))
            seller_share = (Decimal('0.90') * item_total).quantize(Decimal('1'))
            seller_amounts[item.product.seller] += seller_share

    for seller, amount in seller_amounts.items():
        wallet, _ = SellerWallet.objects.get_or_create(seller=seller)

        # Add to pending_balance (chờ admin duyệt)
        wallet.pending_balance += amount
        transaction_type = 'pending_income'
        note = f"Thanh toán thành công cho đơn hàng #{instance.order.id}"

        wallet.save()

        # Create transaction record
        WalletTransaction.objects.create(
            wallet=wallet,
            order=instance.order, # Lưu FK order
            amount=amount,
            type=transaction_type,
            note=note
        )

        logger.info(f"✅ Added {amount} to pending balance for seller {seller.user.email} for order #{instance.order.id}")

        