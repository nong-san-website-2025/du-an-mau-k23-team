#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser

def check_user_status():
    print("Checking user status:")
    users = CustomUser.objects.all()
    for user in users:
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Status: {user.status}")
        print(f"  Is active: {user.is_active}")
        print(f"  Role: {user.role.name if user.role else 'None'}")
        print("  ---")
    
    # Fix users with None status
    users_with_none_status = CustomUser.objects.filter(status__isnull=True)
    if users_with_none_status.exists():
        print(f"\nFound {users_with_none_status.count()} users with None status. Fixing...")
        for user in users_with_none_status:
            user.status = 'active'
            user.save()
            print(f"  Fixed user {user.username} - set status to 'active'")
    
    # Fix users with pending status
    users_with_pending_status = CustomUser.objects.filter(status='pending')
    if users_with_pending_status.exists():
        print(f"\nFound {users_with_pending_status.count()} users with pending status.")
        for user in users_with_pending_status:
            print(f"  User {user.username} has pending status")
            # Optionally activate them
            user.status = 'active'
            user.save()
            print(f"  Activated user {user.username}")

if __name__ == '__main__':
    check_user_status()