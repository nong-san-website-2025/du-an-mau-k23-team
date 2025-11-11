# orders/services.py

from django.db import transaction
from django.db.models import F
from products.models import Product
import logging
from decimal import Decimal
from collections import defaultdict

# ✅ THÊM CÁC IMPORT CẦN THIẾT
from django.conf import settings
from users.models import CustomUser
from wallet.models import Wallet
from .models import Order, OrderItem
from payments.models import Payment # (Giả sử đường dẫn này đúng)

logger = logging.getLogger(__name__)


class OrderProcessingError(Exception):
    """Custom exception cho các lỗi xử lý đơn hàng"""
    pass


# ✅ HELPER LẤY VÍ ADMIN (CHUYỂN TỪ SIGNALS.PY SANG)
def get_platform_wallet():
    platform_user = None
    configured_username = getattr(settings, 'PLATFORM_WALLET_USERNAME', None)

    if configured_username:
        try:
            platform_user = CustomUser.objects.get(username=configured_username)
        except CustomUser.DoesNotExist:
            platform_user = None
            
    if not platform_user:
        platform_user = CustomUser.objects.filter(is_superuser=True).first()
        
    if platform_user:
        wallet, _ = Wallet.objects.get_or_create(user=platform_user)
        return wallet
    
    logger.error("Không tìm thấy ví của nền tảng (Platform Wallet).")
    return None


@transaction.atomic
def reduce_stock_for_order(order):
    """
    Giảm tồn kho cho tất cả sản phẩm trong đơn hàng.
    Idempotent: chỉ thực hiện nếu order.stock_deducted = False.
    """
    if getattr(order, 'stock_deducted', False):
        logger.info(f"Order #{order.id} đã trừ tồn kho trước đó, bỏ qua.")
        return

    logger.info(f"Bắt đầu giảm tồn kho cho Order #{order.id}")
    
    product_ids = order.items.values_list('product_id', flat=True)
    products = Product.objects.select_for_update().filter(id__in=product_ids)

    products_map = {p.id: p for p in products}

    for item in order.items.all():
        product = products_map.get(item.product_id)

        if not product:
            logger.error(f"Order #{order.id} - Sản phẩm {item.product_id} không tồn tại.")
            raise OrderProcessingError(f"Sản phẩm với ID {item.product_id} không tồn tại.")

        if product.stock < item.quantity:
            logger.warning(f"Order #{order.id} - Không đủ tồn kho cho '{product.name}'.")
            raise OrderProcessingError(f"Sản phẩm '{product.name}' không đủ tồn kho.")

        # Dùng F() để giảm tồn kho an toàn
        product.stock = F('stock') - item.quantity
        product.save(update_fields=['stock'])
        logger.info(f"Order #{order.id} - Đã trừ {item.quantity} tồn kho cho '{product.name}'.")

    order.stock_deducted = True
    order.save(update_fields=['stock_deducted'])
    logger.info(f"Hoàn tất giảm tồn kho cho Order #{order.id}")


@transaction.atomic
def complete_order(order, seller):
    """
    Seller xác nhận hoàn tất đơn hàng (LOGIC TỔNG):
    1. Kiểm tra quyền
    2. Giảm tồn kho (1 lần)
    3. Tăng 'sold' (1 lần)
    4. Chia tiền vào ví Admin và Seller (1 lần)
    5. Tạo bản ghi Payment (1 lần)
    6. Cập nhật trạng thái đơn hàng -> success
    """
    logger.info(f"Seller {seller.id} bắt đầu hoàn tất Order #{order.id}")

    # 1. Kiểm tra trạng thái đơn hàng
    if order.status not in ['shipping', 'delivery']:
        logger.warning(f"Order #{order.id} không ở trạng thái 'shipping' hoặc 'delivery'. Hiện tại: {order.status}")
        raise OrderProcessingError("Chỉ có thể hoàn tất đơn ở trạng thái 'shipping' hoặc 'delivery'.")

    # 2. Kiểm tra quyền seller
    seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
    order_product_ids = set(order.items.values_list('product_id', flat=True))

    if not seller_product_ids.intersection(order_product_ids):
        logger.warning(f"Seller {seller.id} không có quyền hoàn tất Order #{order.id}")
        raise OrderProcessingError("Bạn không có quyền hoàn tất đơn này.")

    # 3. Giảm tồn kho (chỉ trừ một lần duy nhất)
    reduce_stock_for_order(order)

    # Lấy cờ 'sold_counted' (nếu là False thì mới chạy logic 4, 5, 6)
    sold_counted = getattr(order, 'sold_counted', False)
    
    if not sold_counted:
        # 4. TĂNG SỐ LƯỢNG ĐÃ BÁN
        logger.info(f"Order #{order.id} - Bắt đầu cập nhật số lượng 'sold' cho sản phẩm.")
        order_items = order.items.all()
        for item in order_items:
            Product.objects.filter(id=item.product_id).update(
                sold=F('sold') + item.quantity
            )
        logger.info(f"Order #{order.id} - Hoàn tất cập nhật 'sold'.")

        # 5. CHIA TIỀN VÀO VÍ
        logger.info(f"Order #{order.id} - Bắt đầu chia tiền vào ví.")
        
        # --- Chia tiền cho admin ---
        admin_wallet = get_platform_wallet()
        if admin_wallet:
            admin_commission = (Decimal('0.10') * Decimal(order.total_price)).quantize(Decimal('1'))
            admin_wallet.balance = (admin_wallet.balance or 0) + admin_commission
            admin_wallet.save(update_fields=['balance'])
            logger.info(f"Order #{order.id} - Đã cộng {admin_commission} vào ví Admin.")

        # --- Chia tiền cho seller ---
        mapping = defaultdict(Decimal)
        items = OrderItem.objects.filter(order=order).select_related('product__seller__user')
        for it in items:
            if not it.product or not it.product.seller or not it.product.seller.user_id:
                continue
            item_total = Decimal(it.price) * Decimal(it.quantity)
            seller_share = (Decimal('0.90') * item_total).quantize(Decimal('1'))
            mapping[it.product.seller.user_id] += seller_share
            
        if mapping:
            for user_id, amount in mapping.items():
                try:
                    user = CustomUser.objects.get(pk=user_id)
                    wallet, _ = Wallet.objects.get_or_create(user=user)
                    wallet.balance = (wallet.balance or 0) + amount
                    wallet.save(update_fields=['balance'])
                    logger.info(f"Order #{order.id} - Đã cộng {amount} vào ví Seller (User {user_id}).")
                except CustomUser.DoesNotExist:
                    logger.warning(f"Order #{order.id} - Không tìm thấy User {user_id} để cộng tiền.")
                    continue
        
        # 6. TẠO BẢN GHI THANH TOÁN (PAYMENT)
        logger.info(f"Order #{order.id} - Đang tạo/cập nhật Payment entry.")
        order_total = order.total_price or Decimal("0")
        if order_total > 0:
            Payment.objects.get_or_create(
                order=order,
                defaults={
                    "amount": order_total,
                    "status": "success",
                },
            )

        # Đánh dấu đã chạy xong logic
        order.sold_counted = True
    
    else:
        logger.info(f"Order #{order.id} - Logic 'sold' và 'wallet' đã được cập nhật trước đó, bỏ qua.")

    # 7. Cập nhật trạng thái đơn hàng sang 'success'
    order.status = 'success'
    
    # 8. Lưu tất cả thay đổi
    update_fields = ['status']
    if not sold_counted: # Chỉ thêm 'sold_counted' nếu nó vừa được set
        update_fields.append('sold_counted')
        
    order.save(update_fields=update_fields)

    logger.info(f"Seller {seller.id} đã xác nhận giao Order #{order.id}. Trạng thái -> {order.status}")
    return order