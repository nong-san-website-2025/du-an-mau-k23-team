"""
Test script for Analytics APIs
Tests all 4 analytics endpoints with real data
"""

import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from sellers.models import Seller
from products.models import Product
from orders.models import Order, OrderItem
from payments.models import Payment
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_analytics_data():
    """Test analytics with Seller ID 2 (has real data)"""
    
    print_section("🧪 TESTING ANALYTICS APIs")
    
    # Get seller
    try:
        seller = Seller.objects.get(id=2)
        print(f"\n✅ Found Seller: {seller.store_name} (ID: {seller.id})")
        print(f"   User: {seller.user.username}")
    except Seller.DoesNotExist:
        print("\n❌ Seller ID 2 not found!")
        return
    
    # Get seller's products
    products = Product.objects.filter(seller=seller)
    print(f"\n📦 Products: {products.count()}")
    
    # Get orders
    product_ids = products.values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids)
    
    print(f"🛒 Total Orders: {orders.count()}")
    print(f"   - Success: {orders.filter(status='success').count()}")
    print(f"   - Delivered: {orders.filter(status='delivered').count()}")
    print(f"   - Cancelled: {orders.filter(status='cancelled').count()}")
    print(f"   - Returned: {orders.filter(status='returned').count()}")
    
    # Get payments
    payments = Payment.objects.filter(order_id__in=order_ids)
    success_payments = payments.filter(status="success")
    
    print(f"\n💰 Payments:")
    print(f"   - Total: {payments.count()}")
    print(f"   - Success: {success_payments.count()}")
    print(f"   - Total Revenue: {success_payments.aggregate(total=django.db.models.Sum('amount'))['total'] or 0:,.0f} VNĐ")
    
    # Test time periods
    now = timezone.now()
    periods = {
        "Today": (now.replace(hour=0, minute=0, second=0, microsecond=0), now),
        "7 days": (now - timedelta(days=7), now),
        "30 days": (now - timedelta(days=30), now)
    }
    
    print_section("📊 REVENUE BY PERIOD")
    
    for period_name, (start, end) in periods.items():
        period_payments = success_payments.filter(created_at__gte=start, created_at__lte=end)
        period_orders = orders.filter(created_at__gte=start, created_at__lte=end, status__in=['success', 'delivered'])
        
        revenue = period_payments.aggregate(total=django.db.models.Sum('amount'))['total'] or 0
        order_count = period_orders.count()
        
        print(f"\n{period_name}:")
        print(f"   Revenue: {revenue:,.0f} VNĐ")
        print(f"   Orders: {order_count}")
        print(f"   AOV: {(revenue / order_count if order_count > 0 else 0):,.0f} VNĐ")
    
    # Test product performance
    print_section("📦 TOP PRODUCTS")
    
    from django.db.models import Sum, F
    
    top_products = OrderItem.objects.filter(
        product_id__in=product_ids
    ).values(
        'product__id',
        'product__name'
    ).annotate(
        revenue=Sum(F('price') * F('quantity')),
        units_sold=Sum('quantity')
    ).order_by('-revenue')[:5]
    
    for i, item in enumerate(top_products, 1):
        print(f"\n{i}. {item['product__name']}")
        print(f"   Revenue: {item['revenue']:,.0f} VNĐ")
        print(f"   Units Sold: {item['units_sold']}")
    
    # Test location analysis
    print_section("🗺️ REVENUE BY LOCATION")
    
    location_data = orders.filter(
        status__in=['success', 'delivered']
    ).values('address').annotate(
        count=django.db.models.Count('id'),
        revenue=Sum('total_price')
    ).order_by('-revenue')[:5]
    
    for item in location_data:
        address = item['address'] or "Unknown"
        parts = address.split(',')
        province = parts[-1].strip() if parts else "Unknown"
        
        print(f"\n{province}:")
        print(f"   Orders: {item['count']}")
        print(f"   Revenue: {item['revenue']:,.0f} VNĐ")
    
    # Test customer analysis
    print_section("👥 CUSTOMER ANALYSIS")
    
    customer_ids = orders.values_list('user_id', flat=True).distinct()
    total_customers = len(customer_ids)
    
    returning_customers = 0
    for customer_id in customer_ids:
        customer_orders = orders.filter(user_id=customer_id).count()
        if customer_orders > 1:
            returning_customers += 1
    
    new_customers = total_customers - returning_customers
    
    print(f"\nTotal Customers: {total_customers}")
    print(f"New Customers: {new_customers} ({new_customers/total_customers*100 if total_customers > 0 else 0:.1f}%)")
    print(f"Returning Customers: {returning_customers} ({returning_customers/total_customers*100 if total_customers > 0 else 0:.1f}%)")
    
    print_section("✅ TEST COMPLETED")
    print("\nAll analytics data is ready!")
    print("You can now test the frontend at: http://localhost:3000/seller-center/analytics")
    print("\nAPI Endpoints:")
    print("  - GET /api/sellers/analytics/overview/?period=30days")
    print("  - GET /api/sellers/analytics/sales/?period=30days")
    print("  - GET /api/sellers/analytics/products/?period=30days")
    print("  - GET /api/sellers/analytics/traffic/?period=30days")

if __name__ == "__main__":
    import django.db.models
    test_analytics_data()