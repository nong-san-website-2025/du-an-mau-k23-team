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

# Get user
user = User.objects.filter(id=2).first()
if not user:
    print("User with ID 2 not found!")
    sys.exit(1)

print(f"Creating test notifications for user: {user.username} (ID: {user.id})")

# Get an order to test with
order = Order.objects.filter(user=user).first()
if not order:
    print("No orders found for this user!")
    sys.exit(1)

print(f"Using order ID: {order.id}")

# Create notifications for different order statuses
statuses = [
    ('pending', 'Chờ xác nhận', '⏳'),
    ('shipping', 'Đang giao hàng', '🚚'),
    ('delivered', 'Đã giao hàng', '✅'),
    ('cancelled', 'Đã hủy', '❌'),
]

for status, status_display, emoji in statuses:
    notification = Notification.objects.create(
        user=user,
        type='order_status_changed',
        title=f'{emoji} Cập nhật đơn hàng',
        message=f'Đơn hàng #{order.id} - {status_display}',
        detail=f'Trạng thái: {status_display}',
        metadata={'order_id': order.id, 'status': status},
        is_read=False
    )
    print(f"Created: {notification.title}")

print(f"\nTotal notifications for user {user.id}: {Notification.objects.filter(user=user).count()}")