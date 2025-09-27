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
        order__status__in=['paid', 'shipped', 'delivered'],
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

    return order_item

def apply_voucher(voucher: Voucher, subtotal: int, shipping_fee: int):
    """Tính số tiền giảm dựa trên loại voucher"""
    discount = 0

    if voucher.discount_amount:
        discount = voucher.discount_amount
    elif voucher.discount_percent:
        discount = subtotal * voucher.discount_percent // 100
        if voucher.max_discount_amount:
            discount = min(discount, voucher.max_discount_amount)
    elif voucher.freeship_amount:
        discount = min(shipping_fee, voucher.freeship_amount)

    # Không cho giảm vượt quá tổng đơn
    discount = min(discount, subtotal + shipping_fee)
    return discount


def preview_voucher(user, code, subtotal, shipping_fee):
    """Xem thử áp dụng voucher vào đơn hàng (không mark used)."""
    try:
        user_voucher = UserVoucher.objects.select_related("voucher").get(
            user=user, voucher__code=code, is_used=False
        )
    except UserVoucher.DoesNotExist:
        raise ValidationError("Voucher không tồn tại hoặc đã dùng.")

    voucher = user_voucher.voucher

    # Check thời gian hiệu lực
    now = timezone.now()
    if voucher.start_at and now < voucher.start_at:
        raise ValidationError("Voucher chưa đến thời gian sử dụng.")
    if voucher.end_at and now > voucher.end_at:
        raise ValidationError("Voucher đã hết hạn.")

    # Check điều kiện đơn tối thiểu
    if subtotal < voucher.min_order_value:
        raise ValidationError("Đơn hàng chưa đạt giá trị tối thiểu.")

    discount = apply_voucher(voucher, subtotal, shipping_fee)

    return {
        "voucher_code": voucher.code,
        "discount": discount,
        "total": subtotal + shipping_fee - discount
    }


def mark_voucher_used(user, code):
    """Chỉ gọi khi đơn hàng được thanh toán thành công."""
    try:
        user_voucher = UserVoucher.objects.get(user=user, voucher__code=code, is_used=False)
    except UserVoucher.DoesNotExist:
        return

    user_voucher.is_used = True
    user_voucher.used_at = timezone.now()
    user_voucher.save()