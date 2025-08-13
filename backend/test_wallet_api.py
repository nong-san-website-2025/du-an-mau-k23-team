#!/usr/bin/env python
"""
Script để test wallet API
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

def get_admin_token():
    """Lấy token cho admin"""
    try:
        # Login để lấy token
        response = requests.post('http://localhost:8000/api/users/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return None

def test_wallet_api():
    print("🧪 Testing Wallet API...")
    print("=" * 50)
    
    # Lấy admin token
    token = get_admin_token()
    if not token:
        print("❌ Không thể lấy admin token")
        return
    
    print(f"✅ Admin token: {token[:20]}...")
    
    # Test API endpoints
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Get all wallet requests
    print("\n📋 Test 1: Get all wallet requests")
    try:
        response = requests.get('http://localhost:8000/api/wallet/requests/', headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('results', data))} requests")
            for req in data.get('results', data):
                print(f"   - {req.get('user', {}).get('username')}: {req.get('amount')} ₫ ({req.get('status')})")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Get wallet stats
    print("\n📊 Test 2: Get wallet stats")
    try:
        response = requests.get('http://localhost:8000/api/wallet/admin/stats/', headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 3: Verify admin
    print("\n🔐 Test 3: Verify admin")
    try:
        response = requests.get('http://localhost:8000/api/users/verify-admin/', headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin verification: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_wallet_api()