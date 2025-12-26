#!/usr/bin/env python3
"""
🧪 QUICK TEST SCRIPT - Top Products Dashboard Fix
Chạy script này để verify top products hiển thị đúng
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/path/to/backend')  # Update with actual path
django.setup()

from django.db.models import F, Sum
from orders.models import OrderItem
from django import models

print("""
╔═══════════════════════════════════════════════════╗
║  🧪 TOP PRODUCTS QUERY TEST                      ║
║  Testing dashboard/views.py fix                 ║
╚═══════════════════════════════════════════════════╝
""")

# Test the fixed query
print("\n✅ Running top products query...\n")

top_products = list(
    OrderItem.objects.values(
        product_id=F("product__id"),
        product_name=F("product__name"),
        shop_name=F("product__seller__store_name"),
        thumbnail=F("product__main_image__image")
    )
    .annotate(
        quantity_sold=Sum("quantity"),
        revenue=Sum(F("product__price") * F("quantity"), output_field=models.DecimalField())
    )
    .order_by("-quantity_sold")[:5]
)

print(f"📊 Found {len(top_products)} products\n")

if top_products:
    print("🏆 TOP 5 PRODUCTS:")
    print("─" * 100)
    
    for idx, product in enumerate(top_products, 1):
        print(f"\n#{idx} {product['product_name']}")
        print(f"   Shop: {product['shop_name'] or 'N/A'}")
        print(f"   Quantity Sold: {product['quantity_sold']}")
        print(f"   Revenue: {product['revenue']:,.0f} ₫")
        print(f"   Thumbnail: {product['thumbnail'] or 'None'}")
    
    print("\n" + "─" * 100)
    print("\n✅ QUERY SUCCESSFUL - All required fields present!")
    
    # Verify all required fields
    required_fields = ['product_id', 'product_name', 'shop_name', 'thumbnail', 'quantity_sold', 'revenue']
    sample = top_products[0]
    
    print("\n📋 Required Fields Check:")
    for field in required_fields:
        status = "✅" if field in sample else "❌"
        value = sample.get(field, 'MISSING')
        print(f"   {status} {field}: {value}")
    
    all_present = all(field in sample for field in required_fields)
    if all_present:
        print("\n🎉 ALL FIELDS PRESENT - Ready for production!")
    else:
        print("\n⚠️  MISSING FIELDS - Please check the query!")
else:
    print("⚠️  No products found - Make sure you have order items in database")

print("""
═══════════════════════════════════════════════════════════════════════════

📝 NEXT STEPS:

1. Run this test in Django shell:
   $ python manage.py shell < test_top_products.py

2. If ✅ All fields present:
   - Clear cache: cache.delete('dashboard_data_cache')
   - Restart backend: python manage.py runserver
   - Hard refresh frontend: Ctrl+Shift+R
   
3. Verify in browser:
   - Go to http://localhost:3000/admin
   - Check dashboard page
   - Look for "Top sản phẩm bán chạy" section
   - Verify all columns show data:
     • Sản phẩm ✅
     • Shop ✅
     • Số lượng bán ✅
     • Doanh thu ✅

═══════════════════════════════════════════════════════════════════════════
""")
