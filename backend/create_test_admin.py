#!/usr/bin/env python
"""
Script để tạo tài khoản admin test
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import CustomUser
from wallet.models import WalletRequest, UserWallet
from decimal import Decimal

def create_test_admin():
    """Tạo tài khoản admin test"""
    username = "admin"
    email = "admin@test.com"
    password = "Admin123"
    
    # Kiểm tra xem admin đã tồn tại chưa
    if CustomUser.objects.filter(username=username).exists():
        print(f"❌ Admin user '{username}' đã tồn tại!")
        admin = CustomUser.objects.get(username=username)
    else:
        # Tạo admin user
        admin = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_superuser=True,
            is_staff=True,
            is_admin=True,
            full_name="Administrator"
        )
        print(f"✅ Đã tạo admin user: {username}")
    
    print(f"📧 Email: {admin.email}")
    print(f"🔑 Password: {password}")
    print(f"🔐 Is Admin: {admin.is_admin}")
    print(f"🔐 Is Superuser: {admin.is_superuser}")
    
    return admin

def create_test_users_and_requests():
    """Tạo user test và yêu cầu nạp tiền"""
    
    # Tạo test users
    test_users = [
        {
            'username': 'user1',
            'email': 'user1@test.com',
            'password': 'User123',
            'full_name': 'Nguyễn Văn A'
        },
        {
            'username': 'user2', 
            'email': 'user2@test.com',
            'password': 'User123',
            'full_name': 'Trần Thị B'
        },
        {
            'username': 'user3',
            'email': 'user3@test.com', 
            'password': 'User123',
            'full_name': 'Lê Văn C'
        }
    ]
    
    created_users = []
    for user_data in test_users:
        user, created = CustomUser.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'full_name': user_data['full_name']
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"✅ Đã tạo user: {user.username}")
        else:
            print(f"ℹ️ User {user.username} đã tồn tại")
        
        created_users.append(user)
    
    # Tạo wallet requests
    wallet_requests_data = [
        {
            'user': created_users[0],
            'amount': Decimal('100000'),
            'message': 'Yêu cầu nạp 100,000 ₫ vào ví',
            'status': 'pending'
        },
        {
            'user': created_users[1], 
            'amount': Decimal('500000'),
            'message': 'Yêu cầu nạp 500,000 ₫ vào ví',
            'status': 'pending'
        },
        {
            'user': created_users[2],
            'amount': Decimal('200000'), 
            'message': 'Yêu cầu nạp 200,000 ₫ vào ví',
            'status': 'approved'
        }
    ]
    
    for req_data in wallet_requests_data:
        request, created = WalletRequest.objects.get_or_create(
            user=req_data['user'],
            amount=req_data['amount'],
            defaults={
                'message': req_data['message'],
                'status': req_data['status']
            }
        )
        if created:
            print(f"✅ Đã tạo wallet request: {request.user.username} - {request.amount} ₫")
            
            # Nếu đã approved, tạo wallet cho user
            if req_data['status'] == 'approved':
                wallet, wallet_created = UserWallet.objects.get_or_create(
                    user=req_data['user'],
                    defaults={'balance': req_data['amount']}
                )
                if wallet_created:
                    print(f"✅ Đã tạo wallet cho {req_data['user'].username}: {req_data['amount']} ₫")
        else:
            print(f"ℹ️ Wallet request cho {req_data['user'].username} đã tồn tại")

def main():
    print("🚀 Tạo dữ liệu test cho hệ thống wallet...")
    print("=" * 50)
    
    # Tạo admin
    admin = create_test_admin()
    
    print("\n" + "=" * 50)
    print("👥 Tạo test users và wallet requests...")
    
    # Tạo test users và requests
    create_test_users_and_requests()
    
    print("\n" + "=" * 50)
    print("✅ Hoàn thành! Thông tin đăng nhập:")
    print(f"🔐 Admin: admin / Admin123")
    print(f"👤 User1: user1 / User123") 
    print(f"👤 User2: user2 / User123")
    print(f"👤 User3: user3 / User123")
    print("\n🌐 Truy cập:")
    print(f"📱 User: http://localhost:3000/wallet")
    print(f"⚙️ Admin: http://localhost:3000/admin/wallet")

if __name__ == "__main__":
    main()