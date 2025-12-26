#!/usr/bin/env python3
"""
🔧 Test script để verify tất cả admin APIs hoạt động đúng
Chạy sau khi start backend server
"""

import requests
import json
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
BASE_URL = "http://172.16.102.155:8000/api"
ADMIN_TOKEN = "YOUR_ADMIN_TOKEN_HERE"  # Thay bằng token thực

headers = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json"
}

# Màu sắc cho console output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

# ==========================================
# TEST FUNCTIONS
# ==========================================

def test_endpoint(name, method, url, expected_status=200):
    """Test một endpoint"""
    print(f"\n{Colors.BLUE}🔍 Testing: {name}{Colors.END}")
    print(f"   URL: {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, timeout=10)
        
        if response.status_code == expected_status or response.status_code == 200:
            print(f"   {Colors.GREEN}✅ Status: {response.status_code}{Colors.END}")
            
            # Parse và hiển thị data
            try:
                data = response.json()
                if isinstance(data, dict):
                    if 'results' in data:  # DRF pagination
                        print(f"   📊 Results: {len(data['results'])} items (Total: {data.get('count', '?')})")
                        if data['results']:
                            print(f"      First item keys: {list(data['results'][0].keys())[:5]}...")
                    elif 'status' in data:  # Health check
                        print(f"   📊 Status: {data.get('status', 'N/A')}")
                    elif isinstance(data, list):
                        print(f"   📊 Items: {len(data)}")
                    else:
                        print(f"   📊 Response keys: {list(data.keys())[:5]}...")
            except:
                print(f"   📊 Response: {response.text[:100]}...")
            
            return True
        else:
            print(f"   {Colors.RED}❌ Expected {expected_status}, got {response.status_code}{Colors.END}")
            print(f"   Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   {Colors.RED}❌ Connection Error: {str(e)}{Colors.END}")
        return False

# ==========================================
# RUN TESTS
# ==========================================

print(f"""
{Colors.YELLOW}
╔═══════════════════════════════════════════════════╗
║   🧪 ADMIN API TEST SUITE                        ║
║   Testing all admin endpoints & functionality   ║
╚═══════════════════════════════════════════════════╝
{Colors.END}
""")

print(f"Base URL: {BASE_URL}")
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Token: {'✅ Configured' if ADMIN_TOKEN != 'YOUR_ADMIN_TOKEN_HERE' else '❌ NOT SET'}")

results = {}

# Test 1: Health Check
results['health_check'] = test_endpoint(
    "Health Check",
    "GET",
    f"{BASE_URL}/health/",
)

# Test 2: Endpoints List
results['endpoints_list'] = test_endpoint(
    "API Endpoints",
    "GET",
    f"{BASE_URL}/endpoints/",
)

# Test 3: Dashboard Stats
results['dashboard'] = test_endpoint(
    "Dashboard Stats",
    "GET",
    f"{BASE_URL}/dashboard/",
)

# Test 4: Orders Admin List
results['orders_admin'] = test_endpoint(
    "Orders Admin List",
    "GET",
    f"{BASE_URL}/orders/admin-list/?page=1&page_size=10",
)

# Test 5: Users List
results['users_list'] = test_endpoint(
    "Users List",
    "GET",
    f"{BASE_URL}/users/list/?page=1&page_size=10",
)

# Test 6: Products Admin
results['products_admin'] = test_endpoint(
    "Products List",
    "GET",
    f"{BASE_URL}/products/?page=1&page_size=10",
)

# Test 7: Revenue Report
results['revenue_report'] = test_endpoint(
    "Revenue Report",
    "GET",
    f"{BASE_URL}/orders/revenue-report/",
)

# Test 8: Order Statistics
results['order_stats'] = test_endpoint(
    "Order Statistics",
    "GET",
    f"{BASE_URL}/orders/order-statistics-report/",
)

# ==========================================
# SUMMARY
# ==========================================

print(f"\n{Colors.BLUE}{'='*50}{Colors.END}")
print(f"{Colors.YELLOW}📋 TEST SUMMARY{Colors.END}")
print(f"{Colors.BLUE}{'='*50}{Colors.END}")

passed = sum(1 for v in results.values() if v)
total = len(results)

for test_name, passed_test in results.items():
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed_test else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"  {test_name:<25} {status}")

print(f"\n{Colors.BLUE}{'='*50}{Colors.END}")
print(f"Total: {passed}/{total} tests passed ({int(passed/total*100)}%)")

if passed == total:
    print(f"{Colors.GREEN}🎉 ALL TESTS PASSED!{Colors.END}")
else:
    print(f"{Colors.YELLOW}⚠️  Some tests failed. Check backend logs.{Colors.END}")

print(f"{Colors.BLUE}{'='*50}{Colors.END}\n")

# ==========================================
# INSTRUCTIONS
# ==========================================

print(f"""
{Colors.YELLOW}📝 HOW TO USE THIS SCRIPT:{Colors.END}

1. Get your admin token:
   - Login to admin dashboard
   - Open browser DevTools (F12)
   - Go to Application > Local Storage
   - Copy 'token' value

2. Update this script:
   - Replace 'YOUR_ADMIN_TOKEN_HERE' with your token
   
3. Run the script:
   python test_admin_apis.py
   
4. Check results:
   - ✅ Green = API working
   - ❌ Red = API has issues (check backend logs)
   
{Colors.YELLOW}🔧 TROUBLESHOOTING:{Colors.END}

If tests fail:
1. Check backend is running: http://172.16.102.155:8000/
2. Verify token is valid (shouldn't be expired)
3. Check Django logs for errors: backend/debug.log
4. Run: python manage.py check
5. Run: python manage.py migrate

{Colors.YELLOW}📊 EXPECTED RESULTS:{Colors.END}

✅ health_check  - Should show database: "connected"
✅ endpoints_list - Should show list of all API endpoints  
✅ dashboard - Should show: users_count, orders_count, total_revenue, etc.
✅ orders_admin - Should show results array with order data
✅ users_list - Should show results array with user data
✅ products_admin - Should show results array with product data
✅ revenue_report - Should show: total_revenue, monthly breakdown
✅ order_stats - Should show: pending, processing, delivered counts

{Colors.BLUE}{'='*50}{Colors.END}
""")
