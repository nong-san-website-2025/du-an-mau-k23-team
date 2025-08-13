#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser

def check_and_update_admin():
    """Kiểm tra và cập nhật quyền admin"""
    
    try:
        # Tìm user admin
        admin_user = CustomUser.objects.get(username='admin')
        
        print("=== THÔNG TIN TÀI KHOẢN ADMIN ===")
        print(f"👤 Username: {admin_user.username}")
        print(f"📧 Email: {admin_user.email}")
        print(f"👑 Is Admin: {admin_user.is_admin}")
        print(f"🛡️ Is Staff: {admin_user.is_staff}")
        print(f"🔑 Is Superuser: {admin_user.is_superuser}")
        print(f"📝 Role: {admin_user.role}")
        print(f"🔒 Is Active: {admin_user.is_active}")
        
        # Cập nhật quyền nếu cần
        updated = False
        if not admin_user.is_admin:
            admin_user.is_admin = True
            updated = True
            print("✅ Đã cập nhật is_admin = True")
            
        if not admin_user.is_staff:
            admin_user.is_staff = True
            updated = True
            print("✅ Đã cập nhật is_staff = True")
            
        if admin_user.role != 'admin':
            admin_user.role = 'admin'
            updated = True
            print("✅ Đã cập nhật role = 'admin'")
            
        if not admin_user.is_active:
            admin_user.is_active = True
            updated = True
            print("✅ Đã cập nhật is_active = True")
            
        if updated:
            admin_user.save()
            print("\n🎉 Đã cập nhật quyền admin thành công!")
        else:
            print("\n✨ Tài khoản admin đã có đầy đủ quyền!")
            
        print("\n=== HƯỚNG DẪN ĐĂNG NHẬP ===")
        print("🌐 URL: http://localhost:3000/login")
        print(f"👤 Username: {admin_user.username}")
        print(f"📧 Email: {admin_user.email}")
        print("🔒 Password: [Bạn cần biết mật khẩu]")
        print("\n🎯 Sau khi đăng nhập, truy cập: http://localhost:3000/admin/wallet")
        
    except CustomUser.DoesNotExist:
        print("❌ Không tìm thấy tài khoản admin!")
        print("💡 Chạy lệnh: python create_admin.py để tạo tài khoản admin")

if __name__ == '__main__':
    check_and_update_admin()