"""
Test script to check basket analysis data
Run: python manage.py shell < test_basket_analysis.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order, OrderItem
from products.models import Product
from sellers.models import Seller
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

print("=" * 80)
print("BASKET ANALYSIS DEBUG SCRIPT")
print("=" * 80)

# Get all sellers
sellers = Seller.objects.all()
print(f"\nTotal sellers: {sellers.count()}")

for seller in sellers:
    print(f"\n{'='*80}")
    print(f"Seller: {seller.user.username} (ID: {seller.id})")
    print(f"{'='*80}")
    
    # Get seller's products
    products = Product.objects.filter(seller=seller)
    product_ids = list(products.values_list("id", flat=True))
    print(f"Total products: {len(product_ids)}")
    
    # Get orders containing seller's products
    order_ids = OrderItem.objects.filter(
        product_id__in=product_ids
    ).values_list("order_id", flat=True).distinct()
    print(f"Total orders with seller's products: {len(order_ids)}")
    
    # Get orders in last 30 days
    now = timezone.now()
    start_date = now - timedelta(days=30)
    
    orders_in_period = Order.objects.filter(
        id__in=order_ids,
        created_at__gte=start_date,
        created_at__lte=now
    )
    print(f"Orders in last 30 days: {orders_in_period.count()}")
    
    # Get orders with multiple items
    orders_with_multiple_items = OrderItem.objects.filter(
        order_id__in=orders_in_period.values_list("id", flat=True),
        product_id__in=product_ids
    ).values("order_id").annotate(
        item_count=Count("id")
    ).filter(item_count__gte=2)
    
    print(f"Orders with 2+ items from this seller: {orders_with_multiple_items.count()}")
    
    if orders_with_multiple_items.count() > 0:
        print("\nDetailed order breakdown:")
        for order_data in orders_with_multiple_items:
            order_id = order_data["order_id"]
            item_count = order_data["item_count"]
            
            order = Order.objects.get(id=order_id)
            items = OrderItem.objects.filter(
                order_id=order_id,
                product_id__in=product_ids
            ).select_related("product")
            
            print(f"\n  Order #{order_id} ({order.created_at.strftime('%Y-%m-%d %H:%M')})")
            print(f"  Status: {order.status}")
            print(f"  Items ({item_count}):")
            for item in items:
                if item.product:
                    print(f"    - {item.product.name} (ID: {item.product.id}) x{item.quantity}")
                else:
                    print(f"    - [Product deleted] x{item.quantity}")
    else:
        print("\n⚠️  NO ORDERS WITH MULTIPLE ITEMS FOUND!")
        print("\nTo fix this, create orders with 2+ products from the same seller.")
        print("Example:")
        print("  1. Login as a customer")
        print("  2. Add 2-3 products from the same seller to cart")
        print("  3. Complete the order")
        print("  4. Repeat 2-3 times with different product combinations")

print("\n" + "=" * 80)
print("END OF REPORT")
print("=" * 80)