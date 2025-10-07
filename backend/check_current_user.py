import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

print("=== All Users ===")
for user in User.objects.all()[:10]:
    notif_count = Notification.objects.filter(user=user).count()
    print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}, Notifications: {notif_count}")

print("\n=== Users with Notifications ===")
for user in User.objects.all():
    notif_count = Notification.objects.filter(user=user).count()
    if notif_count > 0:
        print(f"\nUser ID: {user.id}, Username: {user.username}")
        print(f"Total notifications: {notif_count}")
        print("Recent notifications:")
        for n in Notification.objects.filter(user=user).order_by('-created_at')[:3]:
            print(f"  - [{n.type}] {n.title} (read={n.is_read})")