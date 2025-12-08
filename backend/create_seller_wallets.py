#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sellers.models import Seller
from payments.models import SellerWallet, WalletTransaction
from decimal import Decimal

sellers = Seller.objects.all()
for seller in sellers:
    wallet, created = SellerWallet.objects.get_or_create(seller=seller)
    if created:
        # Tạo dữ liệu demo
        wallet.balance = Decimal('1000000.00')  # 1 triệu
        wallet.pending_balance = Decimal('500000.00')  # 500k
        wallet.save()
        
        # Tạo transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=Decimal('1000000.00'),
            type='add',
            note='Demo: Số dư khả dụng'
        )
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=Decimal('500000.00'),
            type='pending_add',
            note='Demo: Số dư chờ duyệt'
        )
        print(f"✅ Tạo wallet cho: {seller.store_name}")
    else:
        print(f"⚠️ Wallet đã tồn tại: {seller.store_name}")

print(f"\nTổng cộng: {SellerWallet.objects.count()} wallets")
