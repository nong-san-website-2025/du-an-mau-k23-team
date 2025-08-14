#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser

def create_admin_user():
    """Tạo tài khoản admin mặc định"""
    
    # Kiểm tra xem admin đã tồn tại chưa
    if CustomUser.objects.filter(username='admin').exists():
        print("❌ Tài khoản admin đã tồn tại!")
        admin_user = CustomUser.objects.get(username='admin')
        print(f"📧 Email: {admin_user.email}")
        print(f"🔑 Username: {admin_user.username}")
        return
    
    # Tạo tài khoản admin mới
    admin_user = CustomUser.objects.create_user(
        username='admin',
        email='admin@nongsan.vn',
        password='admin123',  # Mật khẩu mặc định
        full_name='Administrator',
        is_admin=True,
        is_staff=True,
        is_superuser=True,
        role='admin'
    )
    
    print("✅ Tạo tài khoản admin thành công!")
    print(f"📧 Email: {admin_user.email}")
    print(f"🔑 Username: {admin_user.username}")
    print(f"🔒 Password: admin123")
    print(f"👑 Role: {admin_user.role}")
    print(f"🛡️ Is Admin: {admin_user.is_admin}")

if __name__ == '__main__':
    create_admin_user()