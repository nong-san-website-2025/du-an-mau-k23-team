# delivery/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.ghn import GHNClient

CACHE_TTL = 86400

class CalculateShippingFeeView(APIView):
    def post(self, request):

        print("Received request data:", request.data)  # Log dữ liệu nhận được
        
        payload = request.data.copy()  # Tạo bản sao để tránh sửa request gốc

        # Validate required fields
        required_fields = [
            'from_district_id', 'to_district_id', 'weight',
            'length', 'width', 'height'
        ]
        for field in required_fields:
            if field not in payload or payload[field] is None:
                return Response({
                    'error': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Ensure numbers > 0
        try:
            payload['weight'] = max(int(payload['weight']), 1)
            payload['length'] = max(int(payload['length']), 1)
            payload['width'] = max(int(payload['width']), 1)
            payload['height'] = max(int(payload['height']), 1)
            payload['from_district_id'] = int(payload['from_district_id'])
            payload['to_district_id'] = int(payload['to_district_id'])
        except (ValueError, TypeError) as e:
            return Response({
                'error': f'Invalid number format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ SỬA Ở ĐÂY: Xử lý ward_code tốt hơn
        # Xử lý to_ward_code
        if 'to_ward_code' in payload and payload['to_ward_code'] is not None:
            # Chuyển về string và loại bỏ khoảng trắng
            payload['to_ward_code'] = str(payload['to_ward_code']).strip()
            # Nếu là chuỗi rỗng thì xóa field
            if not payload['to_ward_code']:
                payload.pop('to_ward_code', None)
        else:
            payload.pop('to_ward_code', None)

        # Xử lý from_ward_code  
        if 'from_ward_code' in payload and payload['from_ward_code'] is not None:
            payload['from_ward_code'] = str(payload['from_ward_code']).strip()
            if not payload['from_ward_code']:
                payload.pop('from_ward_code', None)
        else:
            payload.pop('from_ward_code', None)

        # Optional fields - set default if needed
        payload.setdefault('service_type_id', 2)
        payload.setdefault('insurance_value', 0)

        print("Sending to GHN:", payload)  # Debug log

        # Gọi GHN service
        result = GHNClient.calculate_shipping_fee(payload)

        if result['success']:
            return Response({
                'fee': result['fee'],
                'detail': result['detail']
            }, status=status.HTTP_200_OK)
        else:
            print("GHN Error:", result)  # Debug log
            return Response({
                'error': result['message'],
                'code': result.get('error_code')
            }, status=status.HTTP_400_BAD_REQUEST)

from django.core.cache import cache  # Import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.ghn import GHNClient

# Thời gian cache: 24 giờ (86400 giây) vì địa chính ít thay đổi
CACHE_TTL = 86400 

class GHNProvincesView(APIView):
    def get(self, request):
        cache_key = 'ghn_provinces'
        data = cache.get(cache_key)

        if not data:
            print("Fetching provinces from GHN (Cache Miss)...")
            res = GHNClient.get_provinces()
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else:
                return Response(res, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(data, status=status.HTTP_200_OK)

class GHNDistrictsView(APIView):
    def get(self, request):
        province_id = request.query_params.get('province_id')
        if not province_id:
            return Response({'success': False, 'message': 'Missing province_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cache key phải unique theo province_id
        cache_key = f'ghn_districts_{province_id}'
        data = cache.get(cache_key)

        if not data:
            res = GHNClient.get_districts(province_id)
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else:
                return Response(res, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(data, status=status.HTTP_200_OK)

class GHNWardsView(APIView):
    def get(self, request):
        district_id = request.query_params.get('district_id')
        if not district_id:
            return Response({'success': False, 'message': 'Missing district_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        cache_key = f'ghn_wards_{district_id}'
        data = cache.get(cache_key)

        if not data:
            res = GHNClient.get_wards(district_id)
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else:
                return Response(res, status=status.HTTP_400_BAD_REQUEST)

        return Response(data, status=status.HTTP_200_OK)