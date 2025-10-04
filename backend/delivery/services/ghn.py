# services/ghn.py
import requests
from django.conf import settings
from decouple import config
import logging

logger = logging.getLogger(__name__)

class GHNClient:
    # 🔥 FIX: Loại bỏ khoảng trắng thừa và đảm bảo URL đúng
    BASE_URL = config('GHN_API_BASE_URL', 'https://dev-online-gateway.ghn.vn/shiip/public-api').rstrip()
    TOKEN = config('GHN_TOKEN', '')  # Default empty string
    SHOP_ID = config('GHN_SHOP_ID', '')  # Default empty string

    HEADERS = {
        'Content-Type': 'application/json',
        'Token': TOKEN,
        'ShopId': SHOP_ID,
    }

    @classmethod
    def _headers(cls):
        # Ensure latest values from env
        return {
            'Content-Type': 'application/json',
            'Token': cls.TOKEN,
            'ShopId': cls.SHOP_ID,
        }

    @classmethod
    def calculate_shipping_fee(cls, payload):
        # 🔥 FIX: Đảm bảo URL đúng
        url = f"{cls.BASE_URL}/v2/shipping-order/fee"

        print("📦 GHN Payload:", payload)
        print("🔑 Headers:", cls._headers())
        print("🔗 Full URL:", url)

        # Kiểm tra token và shop_id
        if not cls.TOKEN or not cls.SHOP_ID or cls.TOKEN == '' or cls.SHOP_ID == '':
            print("❌ Missing GHN credentials")
            return {
                'success': False,
                'fee': 0,
                'message': 'Missing GHN Token or ShopId in environment variables'
            }

        # Đảm bảo headers được cập nhật với giá trị mới nhất
        headers = cls._headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            print("📡 GHN Status Code:", response.status_code)
            print("📡 GHN Response Text:", response.text)

            # Luôn cố gắng parse JSON (kể cả khi status 4xx)
            try:
                data = response.json()
            except ValueError:
                data = None

            # Thành công: HTTP 200 và code == 200
            if response.status_code == 200 and isinstance(data, dict) and data.get('code') == 200 and data.get('data'):
                return {
                    'success': True,
                    'fee': data['data'].get('total', 0),
                    'detail': data['data'],
                    'message': data.get('message', 'Success')
                }

            # Trả về lỗi chi tiết từ GHN (không raise để không bị che lỗi)
            if isinstance(data, dict):
                print("❌ GHN Error Message:", data.get('message'))
                return {
                    'success': False,
                    'fee': 0,
                    'error_code': data.get('code_message') or data.get('code'),
                    'message': data.get('message', 'Unknown error from GHN'),
                    'detail': data
                }

            # Trường hợp không parse được JSON
            return {
                'success': False,
                'fee': 0,
                'message': f"HTTP {response.status_code}: {response.text[:300]}"
            }

        except requests.exceptions.Timeout:
            print("⏰ Request timeout")
            return {
                'success': False,
                'fee': 0,
                'message': "Request timeout when calling GHN API"
            }
        except requests.exceptions.RequestException as e:
            # Cố gắng lấy nội dung phản hồi nếu có
            err_text = getattr(e.response, 'text', str(e)) if hasattr(e, 'response') and e.response is not None else str(e)
            print("🌐 Network error:", err_text)
            return {
                'success': False,
                'fee': 0,
                'message': f"Network error: {err_text[:300]}"
            }
        except Exception as e:
            print("💥 Unexpected error:", str(e))
            return {
                'success': False,
                'fee': 0,
                'message': f"Unexpected error: {str(e)}"
            }

    # ===== Master Data (Provinces / Districts / Wards) =====
    @classmethod
    def get_provinces(cls):
        url = f"{cls.BASE_URL}/master-data/province"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            try:
                data = resp.json()
            except ValueError:
                data = None
            if resp.status_code == 200 and isinstance(data, dict):
                return {'success': True, 'data': data.get('data', [])}
            return {
                'success': False,
                'message': (data or {}).get('message', f"HTTP {resp.status_code}"),
                'detail': data
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}

    @classmethod
    def get_districts(cls, province_id):
        url = f"{cls.BASE_URL}/master-data/district"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, params={'province_id': int(province_id)}, timeout=10)
            try:
                data = resp.json()
            except ValueError:
                data = None
            if resp.status_code == 200 and isinstance(data, dict):
                return {'success': True, 'data': data.get('data', [])}
            return {
                'success': False,
                'message': (data or {}).get('message', f"HTTP {resp.status_code}"),
                'detail': data
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}

    @classmethod
    def get_wards(cls, district_id):
        url = f"{cls.BASE_URL}/master-data/ward"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, params={'district_id': int(district_id)}, timeout=10)
            try:
                data = resp.json()
            except ValueError:
                data = None
            if resp.status_code == 200 and isinstance(data, dict):
                return {'success': True, 'data': data.get('data', [])}
            return {
                'success': False,
                'message': (data or {}).get('message', f"HTTP {resp.status_code}"),
                'detail': data
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}