import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order
from payments.models import Payment

print("=" * 80)
print("ĐỒNG BỘ STATUS PAYMENT VỚI ORDER")
print("=" * 80)

# Get all payments
payments = Payment.objects.all()
print(f"\n📊 Tổng số payments: {payments.count()}")

updated_count = 0

# Update payment status to match order status
for payment in payments:
    if payment.order:
        old_status = payment.status
        
        # Map order status to payment status
        if payment.order.status in ['success', 'Đã thanh toán', 'completed']:
            new_status = 'success'
        elif payment.order.status in ['pending', 'Chờ xác nhận', 'processing', 'shipping']:
            new_status = 'pending'
        elif payment.order.status in ['cancelled', 'Đã hủy']:
            new_status = 'failed'
        else:
            new_status = 'pending'
        
        if old_status != new_status:
            payment.status = new_status
            payment.save(update_fields=['status'])
            updated_count += 1
            print(f"   ✓ Payment #{payment.id} (Order #{payment.order.id}): {old_status} → {new_status} (Order status: {payment.order.status})")

print(f"\n✅ Đã cập nhật {updated_count} payments")

print("\n" + "=" * 80)
print("KIỂM TRA KẾT QUẢ")
print("=" * 80)

# Count by status
from django.db.models import Count, Sum

payment_stats = Payment.objects.values('status').annotate(
    count=Count('id'),
    total=Sum('amount')
).order_by('status')

print(f"\n📊 Thống kê Payments theo status:")
for stat in payment_stats:
    print(f"   {stat['status'].upper()}: {stat['count']} payments = {stat['total']:,.0f} VNĐ")

order_stats = Order.objects.values('status').annotate(
    count=Count('id')
).order_by('status')

print(f"\n📊 Thống kê Orders theo status:")
for stat in order_stats:
    print(f"   {stat['status']}: {stat['count']} orders")

print("\n" + "=" * 80)