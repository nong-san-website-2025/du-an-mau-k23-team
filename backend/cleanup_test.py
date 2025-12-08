import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import Payment, SellerWallet, WalletTransaction
from orders.models import Order, OrderItem
from products.models import Product
from sellers.models import Seller
from users.models import CustomUser

# Clean up
print("Cleaning up...")
CustomUser.objects.filter(email="seller_test@test.com").delete()
Product.objects.filter(name="Test Product Dup").delete()
Order.objects.filter(customer_name="Test").delete()
Payment.objects.all().delete()
WalletTransaction.objects.all().delete()

print("✅ Cleaned!")
