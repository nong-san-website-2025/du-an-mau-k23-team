import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Notification
from django.contrib.auth import get_user_model
from orders.models import Order

User = get_user_model()

print("Creating notifications for all users with orders...")

# Get all users who have orders
users_with_orders = User.objects.filter(orders__isnull=False).distinct()

for user in users_with_orders:
    print(f"\n--- User: {user.username} (ID: {user.id}) ---")
    
    # Get user's orders
    orders = Order.objects.filter(user=user)[:3]  # Get first 3 orders
    
    for order in orders:
        # Create notification for this order
        notification = Notification.objects.create(
            user=user,
            type='order_created',
            title='🛒 Đơn hàng mới',
            message=f'Đơn hàng #{order.id} đã được tạo thành công',
            detail=f'Trạng thái: Chờ xác nhận',
            metadata={'order_id': order.id, 'status': order.status},
            is_read=False
        )
        print(f"  Created: {notification.title} for order #{order.id}")
    
    total = Notification.objects.filter(user=user).count()
    print(f"  Total notifications for this user: {total}")

print("\n=== Summary ===")
for user in User.objects.all():
    count = Notification.objects.filter(user=user).count()
    if count > 0:
        print(f"User {user.id} ({user.username}): {count} notifications")