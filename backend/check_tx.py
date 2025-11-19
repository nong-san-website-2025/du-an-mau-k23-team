import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import SellerWallet, WalletTransaction
from sellers.models import Seller

# Check seller_test2
seller = Seller.objects.get(store_name="Test Store 2")
transactions = WalletTransaction.objects.filter(wallet__seller=seller).order_by('id')

print(f"Tất cả transactions của seller '{seller.store_name}':")
for t in transactions:
    print(f"ID={t.id}, Order={t.note.split('#')[-1].rstrip(')') if 'đơn hàng' in t.note else 'N/A'}, Amount={t.amount}, Type={t.type}")
