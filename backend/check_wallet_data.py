#!/usr/bin/env python
"""
Script để kiểm tra dữ liệu wallet trong database
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import WalletRequest, UserWallet
from users.models import CustomUser

def check_wallet_data():
    print("🔍 Kiểm tra dữ liệu wallet...")
    print("=" * 50)
    
    # Kiểm tra users
    users = CustomUser.objects.all()
    print(f"👥 Tổng số users: {users.count()}")
    for user in users:
        print(f"   - {user.username} (admin: {user.is_superuser}, seller: {getattr(user, 'is_seller', False)})")
    
    print("\n" + "=" * 50)
    
    # Kiểm tra wallet requests
    requests = WalletRequest.objects.all()
    print(f"💰 Tổng số wallet requests: {requests.count()}")
    for req in requests:
        print(f"   - {req.user.username}: {req.amount} ₫ ({req.status}) - {req.created_at}")
    
    print("\n" + "=" * 50)
    
    # Kiểm tra user wallets
    wallets = UserWallet.objects.all()
    print(f"👛 Tổng số user wallets: {wallets.count()}")
    for wallet in wallets:
        print(f"   - {wallet.user.username}: {wallet.balance} ₫")

if __name__ == "__main__":
    check_wallet_data()