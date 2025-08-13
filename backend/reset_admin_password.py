#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser

def reset_admin_password():
    """Reset mật khẩu admin"""
    
    try:
        # Tìm user admin
        admin_user = CustomUser.objects.get(username='admin')
        
        # Đặt mật khẩu mới
        new_password = 'admin123'
        admin_user.set_password(new_password)
        admin_user.save()
        
        print("🎉 RESET MẬT KHẨU ADMIN THÀNH CÔNG!")
        print("=" * 50)
        print(f"👤 Username: {admin_user.username}")
        print(f"📧 Email: {admin_user.email}")
        print(f"🔒 Password mới: {new_password}")
        print("=" * 50)
        print("\n📋 HƯỚNG DẪN ĐĂNG NHẬP:")
        print("1. Mở trình duyệt: http://localhost:3000/login")
        print(f"2. Nhập Username: {admin_user.username}")
        print(f"3. Nhập Password: {new_password}")
        print("4. Sau khi đăng nhập, truy cập: http://localhost:3000/admin/wallet")
        print("\n🎯 TẠI TRANG ADMIN/WALLET BẠN CÓ THỂ:")
        print("✅ Xem danh sách yêu cầu nạp tiền")
        print("✅ Xác nhận hoặc từ chối yêu cầu")
        print("✅ Xem chi tiết từng giao dịch")
        
    except CustomUser.DoesNotExist:
        print("❌ Không tìm thấy tài khoản admin!")
        print("💡 Chạy lệnh: python create_admin.py để tạo tài khoản admin")

if __name__ == '__main__':
    reset_admin_password()