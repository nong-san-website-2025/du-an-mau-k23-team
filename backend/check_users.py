#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser

def check_users():
    print("All users in database:")
    users = CustomUser.objects.all()
    for user in users:
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Is admin: {getattr(user, 'is_admin', False)}")
        print(f"  Is staff: {user.is_staff}")
        print(f"  Is superuser: {user.is_superuser}")
        print(f"  Is active: {user.is_active}")
        print("  ---")
    
    # Test password for admin user
    try:
        admin_user = CustomUser.objects.get(email='admin@example.com')
        print(f"\nTesting password for admin user:")
        print(f"  check_password('admin123'): {admin_user.check_password('admin123')}")
        
        # Try to set password again
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"  Password reset and saved")
        print(f"  check_password('admin123') after reset: {admin_user.check_password('admin123')}")
        
    except CustomUser.DoesNotExist:
        print("Admin user not found")

if __name__ == '__main__':
    check_users()