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
print("ĐỒNG BỘ NGÀY TẠO PAYMENT VỚI ORDER")
print("=" * 80)

# Get all payments
payments = Payment.objects.all()
print(f"\n📊 Tổng số payments: {payments.count()}")

updated_count = 0
created_payment_count = 0

# Update payment created_at to match order created_at
for payment in payments:
    if payment.order:
        old_date = payment.created_at
        payment.created_at = payment.order.created_at
        payment.save(update_fields=['created_at'])
        updated_count += 1
        print(f"   ✓ Payment #{payment.id} (Order #{payment.order.id}): {old_date} → {payment.created_at}")

print(f"\n✅ Đã cập nhật {updated_count} payments")

# Check for orders without payments
orders_without_payment = Order.objects.exclude(
    id__in=Payment.objects.values_list('order_id', flat=True)
)

print(f"\n⚠️  Tìm thấy {orders_without_payment.count()} orders KHÔNG CÓ payment:")

for order in orders_without_payment:
    print(f"\n   Order #{order.id}:")
    print(f"      - Created: {order.created_at}")
    print(f"      - Status: {order.status}")
    print(f"      - Total: {order.total_price} VNĐ")
    
    # Create payment for this order
    payment_status = 'success' if order.status in ['success', 'Đã thanh toán'] else 'pending'
    
    payment = Payment.objects.create(
        order=order,
        amount=order.total_price,
        status=payment_status
    )
    # Update created_at manually after creation
    payment.created_at = order.created_at
    payment.save(update_fields=['created_at'])
    
    created_payment_count += 1
    print(f"      ✓ Đã tạo Payment #{payment.id} với status={payment_status}")

print(f"\n✅ Đã tạo {created_payment_count} payments mới")

print("\n" + "=" * 80)
print("KIỂM TRA KẾT QUẢ")
print("=" * 80)

# Verify results
from datetime import datetime as dt
today = dt.now().date()
month_start = today.replace(day=1)

# Count payments by date
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate

payment_by_date = Payment.objects.filter(
    status='success',
    created_at__date__gte=month_start
).annotate(
    date=TruncDate('created_at')
).values('date').annotate(
    count=Count('id'),
    total=Sum('amount')
).order_by('date')

print(f"\n📅 Payments SUCCESS trong tháng này (từ {month_start}):")
for item in payment_by_date:
    print(f"   {item['date']}: {item['count']} payments = {item['total']:,.0f} VNĐ")

# Count orders by date
order_by_date = Order.objects.filter(
    status='success',
    created_at__date__gte=month_start
).annotate(
    date=TruncDate('created_at')
).values('date').annotate(
    count=Count('id')
).order_by('date')

print(f"\n📅 Orders SUCCESS trong tháng này (từ {month_start}):")
for item in order_by_date:
    print(f"   {item['date']}: {item['count']} orders")

print("\n" + "=" * 80)