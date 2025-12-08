#!/usr/bin/env python
"""
Script để test API /api/promotions/flash-sales/
Chạy: python test_flash_sale_api.py
"""
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from promotions.views import FlashSaleListView
from django.contrib.auth import get_user_model

User = get_user_model()

# Tạo factory request
factory = APIRequestFactory()

# Tạo GET request
request = factory.get('/api/promotions/flash-sales/')

# Khởi tạo view
view = FlashSaleListView.as_view()

# Gọi view
try:
    response = view(request)
    print("✅ API Response Status:", response.status_code)
    print("✅ Response Data:", response.data[:100] if response.data else "No data")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! API không trả về lỗi 'Product' object has no attribute 'image'")
    else:
        print(f"\n❌ API trả về status {response.status_code}")
        print("Response:", response.data)
except AttributeError as e:
    print(f"❌ AttributeError: {e}")
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
