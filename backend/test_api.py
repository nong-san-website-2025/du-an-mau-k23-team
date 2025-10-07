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
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

# Get a user
user = User.objects.filter(id=2).first()
if not user:
    print("User with ID 2 not found!")
    sys.exit(1)

print(f"Testing API for user: {user.username} (ID: {user.id})")

# Create JWT token for the user
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"JWT Token: {access_token[:50]}...")

# Test API
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("\n--- Testing GET /api/users/notifications/ ---")
response = client.get('/api/users/notifications/')
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"Data: {response.data}")
else:
    print(f"Error: {response.content}")

print(f"\n--- Notifications in database for user {user.id} ---")
notifications = Notification.objects.filter(user=user).order_by('-created_at')
print(f"Count: {notifications.count()}")
for n in notifications[:5]:
    print(f"  - [{n.type}] {n.title} (read={n.is_read})")