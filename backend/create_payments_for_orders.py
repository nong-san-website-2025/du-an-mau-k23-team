"""
Script để tạo Payment records cho các Orders hiện có trong database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order
from payments.models import Payment
from django.utils import timezone

def create_payments_for_orders():
    """Tạo Payment cho các Orders chưa có Payment"""
    orders_without_payment = Order.objects.filter(payment__isnull=True)
    
    print(f"Tìm thấy {orders_without_payment.count()} đơn hàng chưa có Payment")
    
    created_count = 0
    for order in orders_without_payment:
        # Map order status to payment status
        payment_status = "SUCCESS" if order.status in ["Đã giao", "Hoàn thành", "Đã thanh toán"] else "PENDING"
        
        # Tạo Payment
        payment = Payment.objects.create(
            order=order,
            amount=order.total_price,
            status=payment_status,
            created_at=order.created_at or timezone.now()
        )
        created_count += 1
        print(f"✓ Tạo Payment #{payment.id} cho Order #{order.id} - {payment_status} - {order.total_price:,.0f} VNĐ")
    
    print(f"\n✅ Đã tạo {created_count} Payment records!")
    
    # Hiển thị thống kê
    total_payments = Payment.objects.count()
    success_payments = Payment.objects.filter(status__in=["SUCCESS", "Đã thanh toán"]).count()
    pending_payments = Payment.objects.filter(status="PENDING").count()
    
    print(f"\n📊 Thống kê:")
    print(f"   - Tổng số Payments: {total_payments}")
    print(f"   - Payments thành công: {success_payments}")
    print(f"   - Payments đang chờ: {pending_payments}")
    
    # Tính tổng doanh thu
    total_revenue = sum(p.amount for p in Payment.objects.filter(status__in=["SUCCESS", "Đã thanh toán"]))
    print(f"   - Tổng doanh thu: {total_revenue:,.0f} VNĐ")

if __name__ == "__main__":
    create_payments_for_orders()