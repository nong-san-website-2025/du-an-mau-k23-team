# orders/services.py
from django.db import transaction
from django.db.models import F
from products.models import Product
import logging

logger = logging.getLogger(__name__)


class OrderProcessingError(Exception):
    """Custom exception cho các lỗi xử lý đơn hàng"""
    pass


@transaction.atomic
def reduce_stock_for_order(order):
    """
    Giảm tồn kho cho tất cả sản phẩm trong đơn hàng.
    Idempotent: chỉ thực hiện nếu order.stock_deducted = False.
    Sử dụng SELECT ... FOR UPDATE để khóa row và tránh race condition.
    """
    # Nếu đã trừ trước đó, bỏ qua
    if getattr(order, 'stock_deducted', False):
        logger.info(f"Order #{order.id} đã trừ tồn kho trước đó, bỏ qua.")
        return

    logger.info(f"Bắt đầu giảm tồn kho cho Order #{order.id}")
    
    # Lock các sản phẩm liên quan để tránh race condition
    product_ids = order.items.values_list('product_id', flat=True)
    products = Product.objects.select_for_update().filter(id__in=product_ids)

    products_map = {p.id: p for p in products}

    for item in order.items.all():
        product = products_map.get(item.product_id)

        if not product:
            logger.error(f"Order #{order.id} - Sản phẩm {item.product_id} không tồn tại hoặc đã bị xóa.")
            raise OrderProcessingError(f"Sản phẩm với ID {item.product_id} không tồn tại hoặc đã bị xóa.")

        if product.stock < item.quantity:
            logger.warning(
                f"Order #{order.id} - Không đủ tồn kho cho sản phẩm '{product.name}'. "
                f"Còn: {product.stock}, Cần: {item.quantity}"
            )
            raise OrderProcessingError(
                f"Sản phẩm '{product.name}' không đủ tồn kho. "
                f"(Còn {product.stock}, Cần {item.quantity})"
            )

        # Giảm tồn kho trực tiếp
        product.stock = F('stock') - item.quantity
        product.save(update_fields=['stock'])
        logger.info(f"Order #{order.id} - Đã trừ {item.quantity} tồn kho cho '{product.name}'.")

    # Đánh dấu đã trừ để tránh trừ lặp
    order.stock_deducted = True
    order.save(update_fields=['stock_deducted'])

    logger.info(f"Hoàn tất giảm tồn kho cho Order #{order.id}")


@transaction.atomic
def complete_order(order, seller):
    """
    Seller xác nhận hoàn tất đơn hàng:
    - Kiểm tra quyền seller với sản phẩm
    - Giảm tồn kho
    - Cập nhật trạng thái đơn hàng -> delivery (chờ khách xác nhận)
    """
    logger.info(f"Seller {seller.id} bắt đầu hoàn tất Order #{order.id}")

    # 1. Kiểm tra trạng thái đơn hàng
    if order.status != 'shipping':
        logger.warning(f"Order #{order.id} không ở trạng thái shipping. Hiện tại: {order.status}")
        raise OrderProcessingError("Chỉ có thể hoàn tất đơn ở trạng thái 'shipping'.")

    # 2. Lấy danh sách sản phẩm thuộc seller này
    seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
    order_product_ids = set(order.items.values_list('product_id', flat=True))

    # Kiểm tra seller có quyền với ít nhất 1 sản phẩm trong order
    if not seller_product_ids.intersection(order_product_ids):
        logger.warning(
            f"Seller {seller.id} không có quyền hoàn tất Order #{order.id} "
            f"(Seller products: {seller_product_ids}, Order products: {order_product_ids})"
        )
        raise OrderProcessingError("Bạn không có quyền hoàn tất đơn này.")

    # 3. Giảm tồn kho (chỉ trừ một lần duy nhất)
    reduce_stock_for_order(order)

    # 4. Cập nhật trạng thái đơn hàng sang 'delivery'
    order.status = 'delivery'
    order.save(update_fields=['status'])

    logger.info(f"Seller {seller.id} đã xác nhận giao Order #{order.id}. Trạng thái -> delivery")
    return order
