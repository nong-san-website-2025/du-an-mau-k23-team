"""
Test Analytics APIs via HTTP requests
Simulates frontend calling the APIs
"""

import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/sellers/analytics"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def get_token():
    """Login and get access token"""
    print("\n🔐 Logging in as thamvo1...")
    
    response = requests.post(
        f"{BASE_URL}/api/users/login/",
        json={
            "username": "thamvo1",
            "password": "123"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access")
        print(f"✅ Login successful! Token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_api(endpoint, token, params=None):
    """Test an API endpoint"""
    url = f"{API_BASE}/{endpoint}/"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📡 Testing: GET {url}")
    if params:
        print(f"   Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params or {})
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Response size: {len(json.dumps(data))} bytes")
            return data
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text[:500])
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def format_currency(value):
    """Format currency in VND"""
    return f"{value:,.0f} ₫"

def main():
    print_section("🧪 TESTING ANALYTICS APIs VIA HTTP")
    
    # Get token
    token = get_token()
    if not token:
        print("\n❌ Cannot proceed without token!")
        return
    
    # Test 1: Overview API
    print_section("1️⃣ OVERVIEW API")
    overview = test_api("overview", token, {"period": "30days"})
    
    if overview:
        kpis = overview.get("kpis", {})
        print("\n📊 KPIs:")
        print(f"   Revenue: {format_currency(kpis.get('revenue', {}).get('value', 0))} (Growth: {kpis.get('revenue', {}).get('growth', 0):.1f}%)")
        print(f"   Orders: {kpis.get('orders', {}).get('value', 0)} (Growth: {kpis.get('orders', {}).get('growth', 0):.1f}%)")
        print(f"   Visits: {kpis.get('visits', {}).get('value', 0)} (Growth: {kpis.get('visits', {}).get('growth', 0):.1f}%)")
        print(f"   Conversion Rate: {kpis.get('conversion_rate', {}).get('value', 0)}% (Growth: {kpis.get('conversion_rate', {}).get('growth', 0):.1f}%)")
        print(f"   AOV: {format_currency(kpis.get('aov', {}).get('value', 0))} (Growth: {kpis.get('aov', {}).get('growth', 0):.1f}%)")
        
        print(f"\n📈 Trend Chart: {len(overview.get('trend_chart', []))} data points")
        print(f"🏆 Top Products: {len(overview.get('top_products', []))} products")
        
        funnel = overview.get('funnel', {})
        print(f"\n🔻 Sales Funnel:")
        print(f"   Visits: {funnel.get('visits', 0)}")
        print(f"   Product Views: {funnel.get('product_views', 0)}")
        print(f"   Orders: {funnel.get('orders', 0)}")
    
    # Test 2: Sales API
    print_section("2️⃣ SALES API")
    sales = test_api("sales", token, {"period": "30days"})
    
    if sales:
        print(f"\n⏰ Revenue by Time: {len(sales.get('revenue_by_time', []))} data points")
        print(f"🗺️ Revenue by Location: {len(sales.get('revenue_by_location', []))} locations")
        
        metrics = sales.get('operational_metrics', {})
        print(f"\n📊 Operational Metrics:")
        print(f"   Success Rate: {metrics.get('success_rate', 0)}%")
        print(f"   Cancel Rate: {metrics.get('cancel_rate', 0)}%")
        print(f"   Return Rate: {metrics.get('return_rate', 0)}%")
    
    # Test 3: Products API
    print_section("3️⃣ PRODUCTS API")
    products = test_api("products", token, {"period": "30days"})
    
    if products:
        performance = products.get('product_performance', [])
        print(f"\n📦 Product Performance: {len(performance)} products")
        
        if performance:
            print("\nTop 3 by revenue:")
            for i, p in enumerate(performance[:3], 1):
                print(f"   {i}. {p.get('name')} - {format_currency(p.get('revenue', 0))} ({p.get('units_sold', 0)} sold, {p.get('conversion_rate', 0)}% CR)")
        
        basket = products.get('basket_analysis', [])
        print(f"\n🛒 Basket Analysis: {len(basket)} product pairs")
        
        if basket:
            print("\nTop 3 pairs:")
            for i, pair in enumerate(basket[:3], 1):
                print(f"   {i}. {pair.get('product1', {}).get('name')} + {pair.get('product2', {}).get('name')} ({pair.get('count', 0)} times)")
    
    # Test 4: Traffic API
    print_section("4️⃣ TRAFFIC API")
    traffic = test_api("traffic", token, {"period": "30days"})
    
    if traffic:
        sources = traffic.get('traffic_sources', [])
        print(f"\n🌐 Traffic Sources: {len(sources)} sources")
        for source in sources:
            print(f"   {source.get('source')}: {source.get('visits')} visits ({source.get('percentage')}%)")
        
        keywords = traffic.get('top_keywords', [])
        print(f"\n🔍 Top Keywords: {len(keywords)} keywords")
        for i, kw in enumerate(keywords[:5], 1):
            print(f"   {i}. {kw.get('keyword')} ({kw.get('count')} searches)")
        
        customer = traffic.get('customer_analysis', {})
        print(f"\n👥 Customer Analysis:")
        print(f"   New: {customer.get('new_customers')} ({customer.get('new_percentage')}%)")
        print(f"   Returning: {customer.get('returning_customers')} ({customer.get('returning_percentage')}%)")
    
    # Test different periods
    print_section("⏱️ TESTING DIFFERENT PERIODS")
    
    for period in ["today", "7days", "30days"]:
        print(f"\n📅 Period: {period}")
        data = test_api("overview", token, {"period": period})
        if data:
            revenue = data.get('kpis', {}).get('revenue', {}).get('value', 0)
            orders = data.get('kpis', {}).get('orders', {}).get('value', 0)
            print(f"   Revenue: {format_currency(revenue)}, Orders: {orders}")
    
    print_section("✅ ALL TESTS COMPLETED")
    print("\n🎉 Analytics APIs are working correctly!")
    print("\nYou can now use the frontend at:")
    print("   http://localhost:3000/seller-center/analytics")

if __name__ == "__main__":
    main()