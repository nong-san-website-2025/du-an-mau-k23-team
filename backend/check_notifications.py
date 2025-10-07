import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Notification

print(f'Total notifications in database: {Notification.objects.count()}')
print('\nRecent 10 notifications:')
for n in Notification.objects.all().order_by('-created_at')[:10]:
    print(f'  - [{n.type}] {n.title}')
    print(f'    User: {n.user_id}, Read: {n.is_read}, Time: {n.created_at}')
    print(f'    Message: {n.message}')
    print()