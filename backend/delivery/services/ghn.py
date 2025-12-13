# delivery/services/ghn.py
import requests
from decouple import config
import logging

logger = logging.getLogger(__name__)

class GHNClient:
    # 🔥 FIX: Loại bỏ khoảng trắng thừa và đảm bảo URL đúng
    BASE_URL = config('GHN_API_BASE_URL', 'https://dev-online-gateway.ghn.vn/shiip/public-api').rstrip()
    TOKEN = config('GHN_TOKEN', '')  # Default empty string
    SHOP_ID = config('GHN_SHOP_ID', '')  # Default empty string

    @classmethod
    def _headers(cls):
        # Ensure latest values from env
        return {
            'Content-Type': 'application/json',
            'Token': cls.TOKEN,
            'ShopId': cls.SHOP_ID,
        }

    # ==========================================
    # 🆕 MỚI THÊM: HÀM LẤY SERVICE ID KHẢ DỤNG
    # ==========================================
    @classmethod
    def get_available_services(cls, from_district, to_district, weight=None):
        """
        Lấy danh sách các gói dịch vụ (Chuẩn, Nhanh, Tiết kiệm...)
        khả dụng giữa 2 quận.
        QUAN TRỌNG: Cần gửi weight để GHN lọc bỏ các gói không phù hợp (như gói Tài liệu).
        """
        url = f"{cls.BASE_URL}/v2/shipping-order/available-services"
        headers = cls._headers()
        
        # Payload theo tài liệu GHN
        payload = {
            "shop_id": int(cls.SHOP_ID) if cls.SHOP_ID and cls.SHOP_ID.isdigit() else 0,
            "from_district": int(from_district),
            "to_district": int(to_district),
            # 👇👇 [QUAN TRỌNG] THÊM DÒNG NÀY ĐỂ FIX LỖI 👇👇
            "weight": int(weight) if weight else 200 
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            try:
                data = response.json()
            except ValueError:
                data = None

            if response.status_code == 200 and isinstance(data, dict) and data.get('code') == 200:
                return {
                    'success': True, 
                    'data': data.get('data', [])
                }
            
            return {
                'success': False,
                'message': (data or {}).get('message', 'Failed to get services'),
                'detail': data
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}

    # ==========================================
    # CÁC HÀM CŨ (GIỮ NGUYÊN)
    # ==========================================

    @classmethod
    def calculate_shipping_fee(cls, payload):
        # 🔥 FIX: Đảm bảo URL đúng
        url = f"{cls.BASE_URL}/v2/shipping-order/fee"

        # print("GHN Payload:", payload) # Debug nếu cần
        
        if not cls.TOKEN or not cls.SHOP_ID:
            return {
                'success': False,
                'fee': 0,
                'message': 'Missing GHN Token or ShopId'
            }

        headers = cls._headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            try:
                data = response.json()
            except ValueError:
                data = None

            # Thành công
            if response.status_code == 200 and isinstance(data, dict) and data.get('code') == 200 and data.get('data'):
                return {
                    'success': True,
                    'fee': data['data'].get('total', 0),
                    'detail': data['data'],
                    'message': data.get('message', 'Success')
                }

            # Lỗi từ GHN
            return {
                'success': False,
                'fee': 0,
                'error_code': (data or {}).get('code'),
                'message': (data or {}).get('message', 'Unknown GHN Error'),
                'detail': data
            }

        except Exception as e:
            print("GHN Exception:", str(e))
            return {
                'success': False,
                'fee': 0,
                'message': f"System Error: {str(e)}"
            }

    @classmethod
    def get_provinces(cls):
        url = f"{cls.BASE_URL}/master-data/province"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            data = resp.json() if resp.status_code == 200 else None
            
            if data and data.get('code') == 200:
                 return {'success': True, 'data': data.get('data', [])}
            return {'success': False, 'message': 'Failed to fetch provinces'}
        except Exception as e:
            return {'success': False, 'message': str(e)}

    @classmethod
    def get_districts(cls, province_id):
        url = f"{cls.BASE_URL}/master-data/district"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, params={'province_id': int(province_id)}, timeout=10)
            data = resp.json() if resp.status_code == 200 else None
            
            if data and data.get('code') == 200:
                 return {'success': True, 'data': data.get('data', [])}
            return {'success': False, 'message': 'Failed to fetch districts'}
        except Exception as e:
            return {'success': False, 'message': str(e)}

    @classmethod
    def get_wards(cls, district_id):
        url = f"{cls.BASE_URL}/master-data/ward"
        headers = cls._headers()
        try:
            resp = requests.get(url, headers=headers, params={'district_id': int(district_id)}, timeout=10)
            data = resp.json() if resp.status_code == 200 else None
            
            if data and data.get('code') == 200:
                 return {'success': True, 'data': data.get('data', [])}
            return {'success': False, 'message': 'Failed to fetch wards'}
        except Exception as e:
            return {'success': False, 'message': str(e)}