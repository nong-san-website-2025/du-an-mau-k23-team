"""
Script test để kiểm tra endpoint analytics
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import CustomUser
from sellers.views import seller_analytics_detail
import json

# Tạo admin user
admin_user, created = CustomUser.objects.get_or_create(
    username='admin_test',
    defaults={'is_staff': True, 'is_superuser': True, 'email': 'admin@test.com'}
)

# Tạo JWT token
refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)

# Tạo request giả lập
factory = APIRequestFactory()
request = factory.get('/sellers/analytics/1/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
request.user = admin_user

# Gọi view trực tiếp (bypass decorator)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser

# Gọi view
response = seller_analytics_detail(request, seller_id=1)

# In kết quả
print('Status Code:', response.status_code)
print('='*50)

if response.status_code == 200:
    data = response.data
    print('Response Keys:', list(data.keys()))
    print('='*50)
    
    print('\n📊 OVERVIEW:')
    print(json.dumps(data['overview'], indent=2, ensure_ascii=False))
    
    print('\n📈 PERFORMANCE:')
    performance = data['performance']
    print(f"  Growth Rate: {performance['growth_rate']}%")
    print(f"  Cancel Rate: {performance['cancel_rate']}%")
    print(f"  Return Rate: {performance['return_rate']}%")
    print(f"  Revenue Trend (7 days):")
    for trend in performance['revenue_trend']:
        print(f"    {trend['date']}: {trend['revenue']:,.0f}đ")
    
    print('\n🛍️ TOP PRODUCTS:')
    for i, product in enumerate(data['top_products'], 1):
        print(f"  {i}. {product['name']}")
        print(f"     Quantity: {product['quantity']} | Revenue: {product['revenue']:,.0f}đ")
    
    print('\n💰 FINANCE:')
    finance = data['finance']
    print(f"  Total Revenue: {finance['total_revenue']:,.0f}đ")
    print(f"  Commission: {finance['total_commission']:,.0f}đ")
    print(f"  Available Balance: {finance['available_balance']:,.0f}đ")
    
    print('\n⭐ REVIEWS:')
    reviews = data['reviews']
    print(f"  Avg Rating: {reviews['avg_rating']}/5")
    print(f"  Total Reviews: {reviews['total_reviews']}")
    
    print('\n📊 RATING DISTRIBUTION:')
    print(json.dumps(data['rating_distribution'], indent=2, ensure_ascii=False))
    
else:
    print('Error:', response.data)

print('\n✅ Test completed!')

print('\n✅ Test completed!')
