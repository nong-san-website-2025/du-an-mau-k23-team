import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order

# Kiểm tra đơn hàng
print("=== KIỂM TRA ĐỠN HÀNG ===")
all_orders = Order.objects.all()
print(f"Tổng số đơn hàng: {all_orders.count()}")

delivered_orders = Order.objects.filter(status__in=['delivered', 'completed'])
print(f"Đơn hàng đã giao thành công: {delivered_orders.count()}")

print("\n=== CHI TIẾT ĐƠN HÀNG THÀNH CÔNG ===")
for order in delivered_orders[:5]:
    print(f"Order #{order.id} - Status: {order.status} - Province ID: {order.province_id}")
    if hasattr(order, 'user') and order.user:
        from users.models import Address
        default_addr = Address.objects.filter(user=order.user, is_default=True).first()
        if default_addr:
            print(f"  User's default address province_id: {default_addr.province_id}")

print("\n=== THỐNG KÊ THEO TRẠNG THÁI ===")
from django.db.models import Count
status_counts = Order.objects.values('status').annotate(count=Count('id')).order_by('-count')
for item in status_counts:
    print(f"{item['status']}: {item['count']}")
