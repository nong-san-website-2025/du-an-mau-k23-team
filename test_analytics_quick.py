import requests
import json

# Test Analytics API
BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TESTING ANALYTICS API")
print("=" * 60)

# Step 1: Login
print("\n1. Logging in as thamvo1...")
login_data = {
    "username": "thamvo1",
    "password": "123"
}

try:
    login_response = requests.post(f"{BASE_URL}/api/users/login/", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        tokens = login_response.json()
        access_token = tokens.get("access")
        print(f"✅ Login successful! Token: {access_token[:20]}...")
        
        # Step 2: Test Overview API
        print("\n2. Testing Overview API...")
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"period": "30days"}
        
        overview_response = requests.get(
            f"{BASE_URL}/api/sellers/analytics/overview/",
            headers=headers,
            params=params
        )
        
        print(f"Overview Status: {overview_response.status_code}")
        
        if overview_response.status_code == 200:
            data = overview_response.json()
            print("✅ Overview API works!")
            print(f"Revenue: {data['kpis']['revenue']['value']}")
            print(f"Orders: {data['kpis']['orders']['value']}")
            print(f"Trend chart points: {len(data['trend_chart'])}")
            print(f"Top products: {len(data['top_products'])}")
        else:
            print(f"❌ Error: {overview_response.text}")
            
        # Step 3: Test Sales API
        print("\n3. Testing Sales API...")
        sales_response = requests.get(
            f"{BASE_URL}/api/sellers/analytics/sales/",
            headers=headers,
            params=params
        )
        
        print(f"Sales Status: {sales_response.status_code}")
        if sales_response.status_code == 200:
            print("✅ Sales API works!")
        else:
            print(f"❌ Error: {sales_response.text}")
            
        # Step 4: Test Products API
        print("\n4. Testing Products API...")
        products_response = requests.get(
            f"{BASE_URL}/api/sellers/analytics/products/",
            headers=headers,
            params=params
        )
        
        print(f"Products Status: {products_response.status_code}")
        if products_response.status_code == 200:
            print("✅ Products API works!")
        else:
            print(f"❌ Error: {products_response.text}")
            
        # Step 5: Test Traffic API
        print("\n5. Testing Traffic API...")
        traffic_response = requests.get(
            f"{BASE_URL}/api/sellers/analytics/traffic/",
            headers=headers,
            params=params
        )
        
        print(f"Traffic Status: {traffic_response.status_code}")
        if traffic_response.status_code == 200:
            print("✅ Traffic API works!")
        else:
            print(f"❌ Error: {traffic_response.text}")
            
    else:
        print(f"❌ Login failed: {login_response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETED")
print("=" * 60)