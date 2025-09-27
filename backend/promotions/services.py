# services.py
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import FlashSale
from orders.models import OrderItem  # Giả sử OrderItem nằm trong app 'orders'

def validate_flash_sale_purchase(product_id, quantity):
    try:
        flash_sale = FlashSale.objects.get(product_id=product_id, is_active=True)
    except FlashSale.DoesNotExist:
        return None  # không phải flash sale

    if not flash_sale.is_ongoing:
        raise ValidationError("Flash sale đã kết thúc.")

    if flash_sale.remaining_stock < quantity:
        raise ValidationError("Số lượng flash sale không đủ.")

    return flash_sale.flash_price


@transaction.atomic
def create_order_item_for_flash_sale(user, product_id, quantity, order):
    try:
        flash_sale = FlashSale.objects.select_for_update().get(
            product_id=product_id,
            is_active=True,
            start_time__lte=timezone.now(),
            end_time__gt=timezone.now()
        )
    except FlashSale.DoesNotExist:
        raise ValidationError("Sản phẩm không còn trong flash sale.")

    # Tính lại số lượng đã bán TRONG transaction để đảm bảo tính nhất quán
    sold = OrderItem.objects.filter(
        product_id=product_id,
        order__status__in=['paid', 'shipped', 'delivered', 'success'],
        created_at__gte=flash_sale.start_time,
        created_at__lt=flash_sale.end_time
    ).aggregate(total=Sum('quantity'))['total'] or 0

    remaining = flash_sale.stock - sold
    if remaining < quantity:
        raise ValidationError("Không đủ hàng flash sale.")

    # Tạo OrderItem với giá flash
    order_item = OrderItem.objects.create(
        order=order,
        product_id=product_id,
        quantity=quantity,
        price=flash_sale.flash_price,
        is_flash_sale=True
    )
    flash_sale.refresh_from_db()  # reload để cập nhật remaining_stock

    return order_item