import os
import sys
import django
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order
from payments.models import Payment
from products.models import Product

print("=" * 80)
print("KIỂM TRA DỮ LIỆU DASHBOARD VS FINANCE")
print("=" * 80)

# Get seller thamvo1 (ID: 2)
seller_id = 2
seller_products = Product.objects.filter(seller_id=seller_id)
seller_product_ids = list(seller_products.values_list('id', flat=True))

print(f"\n📦 SELLER ID: {seller_id}")
print(f"   Sản phẩm: {list(seller_products.values_list('name', flat=True))}")
print(f"   Product IDs: {seller_product_ids}")

# Get today's date range
today = datetime.now().date()
today_start = datetime.combine(today, datetime.min.time())
today_end = datetime.combine(today, datetime.max.time())

# Get this week's date range
from datetime import timedelta
week_start = today - timedelta(days=today.weekday())  # Monday
week_end = today

# Get this month's date range
month_start = today.replace(day=1)
month_end = today

print(f"\n📅 KHOẢNG THỜI GIAN:")
print(f"   Hôm nay: {today}")
print(f"   Tuần này: {week_start} đến {week_end}")
print(f"   Tháng này: {month_start} đến {month_end}")

# ============================================================================
# DASHBOARD DATA (from Orders)
# ============================================================================
print("\n" + "=" * 80)
print("📊 DASHBOARD DATA (từ Orders)")
print("=" * 80)

# Get completed orders (status='success')
completed_orders = Order.objects.filter(
    items__product_id__in=seller_product_ids,
    status='success'
).distinct()

print(f"\n✅ Tổng số orders SUCCESS: {completed_orders.count()}")

# Today's revenue from orders
today_orders = completed_orders.filter(created_at__date=today)
today_revenue_orders = sum(
    sum(
        float(item.price) * item.quantity 
        for item in order.items.filter(product_id__in=seller_product_ids)
    )
    for order in today_orders
)

print(f"\n📅 HÔM NAY ({today}):")
print(f"   - Số orders: {today_orders.count()}")
print(f"   - Doanh thu (từ Orders): {today_revenue_orders:,.0f} VNĐ")

# This week's revenue from orders
week_orders = completed_orders.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
week_revenue_orders = sum(
    sum(
        float(item.price) * item.quantity 
        for item in order.items.filter(product_id__in=seller_product_ids)
    )
    for order in week_orders
)

print(f"\n📅 TUẦN NÀY ({week_start} - {week_end}):")
print(f"   - Số orders: {week_orders.count()}")
print(f"   - Doanh thu (từ Orders): {week_revenue_orders:,.0f} VNĐ")

# This month's revenue from orders
month_orders = completed_orders.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
month_revenue_orders = sum(
    sum(
        float(item.price) * item.quantity 
        for item in order.items.filter(product_id__in=seller_product_ids)
    )
    for order in month_orders
)

print(f"\n📅 THÁNG NÀY ({month_start} - {month_end}):")
print(f"   - Số orders: {month_orders.count()}")
print(f"   - Doanh thu (từ Orders): {month_revenue_orders:,.0f} VNĐ")

# ============================================================================
# FINANCE DATA (from Payments)
# ============================================================================
print("\n" + "=" * 80)
print("💰 FINANCE DATA (từ Payments)")
print("=" * 80)

# Get all payments for seller's orders
order_ids = Order.objects.filter(
    items__product_id__in=seller_product_ids
).distinct().values_list('id', flat=True)

all_payments = Payment.objects.filter(order_id__in=order_ids)
success_payments = all_payments.filter(status='success')

print(f"\n✅ Tổng số payments SUCCESS: {success_payments.count()}")

# Today's revenue from payments
today_payments = success_payments.filter(created_at__date=today)
today_revenue_payments = sum(float(p.amount) for p in today_payments)

print(f"\n📅 HÔM NAY ({today}):")
print(f"   - Số payments: {today_payments.count()}")
print(f"   - Doanh thu (từ Payments): {today_revenue_payments:,.0f} VNĐ")

# This week's revenue from payments
week_payments = success_payments.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
week_revenue_payments = sum(float(p.amount) for p in week_payments)

print(f"\n📅 TUẦN NÀY ({week_start} - {week_end}):")
print(f"   - Số payments: {week_payments.count()}")
print(f"   - Doanh thu (từ Payments): {week_revenue_payments:,.0f} VNĐ")

# This month's revenue from payments
month_payments = success_payments.filter(created_at__date__gte=month_start, created_at__date__lte=month_end)
month_revenue_payments = sum(float(p.amount) for p in month_payments)

print(f"\n📅 THÁNG NÀY ({month_start} - {month_end}):")
print(f"   - Số payments: {month_payments.count()}")
print(f"   - Doanh thu (từ Payments): {month_revenue_payments:,.0f} VNĐ")

# ============================================================================
# SO SÁNH
# ============================================================================
print("\n" + "=" * 80)
print("🔍 SO SÁNH DASHBOARD vs FINANCE")
print("=" * 80)

print(f"\n📅 HÔM NAY:")
print(f"   Dashboard (Orders): {today_revenue_orders:,.0f} VNĐ")
print(f"   Finance (Payments): {today_revenue_payments:,.0f} VNĐ")
print(f"   Chênh lệch: {abs(today_revenue_orders - today_revenue_payments):,.0f} VNĐ")

print(f"\n📅 TUẦN NÀY:")
print(f"   Dashboard (Orders): {week_revenue_orders:,.0f} VNĐ")
print(f"   Finance (Payments): {week_revenue_payments:,.0f} VNĐ")
print(f"   Chênh lệch: {abs(week_revenue_orders - week_revenue_payments):,.0f} VNĐ")

print(f"\n📅 THÁNG NÀY:")
print(f"   Dashboard (Orders): {month_revenue_orders:,.0f} VNĐ")
print(f"   Finance (Payments): {month_revenue_payments:,.0f} VNĐ")
print(f"   Chênh lệch: {abs(month_revenue_orders - month_revenue_payments):,.0f} VNĐ")

# ============================================================================
# CHI TIẾT ORDERS HÔM NAY
# ============================================================================
print("\n" + "=" * 80)
print("📋 CHI TIẾT ORDERS HÔM NAY")
print("=" * 80)

for order in today_orders:
    order_total = sum(
        float(item.price) * item.quantity 
        for item in order.items.filter(product_id__in=seller_product_ids)
    )
    payment = Payment.objects.filter(order_id=order.id).first()
    payment_amount = float(payment.amount) if payment else 0
    
    print(f"\n   Order #{order.id}:")
    print(f"      - Created: {order.created_at}")
    print(f"      - Status: {order.status}")
    print(f"      - Order Total: {order_total:,.0f} VNĐ")
    print(f"      - Payment Amount: {payment_amount:,.0f} VNĐ")
    print(f"      - Payment Status: {payment.status if payment else 'NO PAYMENT'}")

print("\n" + "=" * 80)