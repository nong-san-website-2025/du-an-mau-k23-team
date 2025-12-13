# views.py
import logging
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.ghn import GHNClient
from sellers.models import Seller 

# Thiết lập Logger
logger = logging.getLogger(__name__)

# Thời gian cache cho Master Data (Tỉnh/Huyện/Xã): 24 giờ
CACHE_TTL = 86400 

class CalculateShippingFeePerSellerView(APIView):
    def post(self, request):
        sellers_data = request.data.get('sellers', []) 
        to_district_id = request.data.get('to_district_id')
        to_ward_code = request.data.get('to_ward_code')

        print(f"\n📦 [GHN REQUEST] Calculating for {len(sellers_data)} sellers -> District: {to_district_id}")

        if not sellers_data or not to_district_id or not to_ward_code:
            return Response({'error': 'Thiếu thông tin'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_district_id = int(to_district_id)
            to_ward_code = str(to_ward_code).strip()
        except ValueError:
            return Response({'error': 'Định dạng địa chỉ lỗi'}, status=status.HTTP_400_BAD_REQUEST)

        results = {}
        total_fee_all = 0

        for item in sellers_data:
            seller_id = item.get('seller_id')
            
            # Xử lý cân nặng
            weight = int(item.get('weight', 200)) 
            if weight <= 0: weight = 200
            if weight > 30000: weight = 29900 # Giới hạn 30kg

            try:
                seller = Seller.objects.get(pk=seller_id)
            except Seller.DoesNotExist:
                results[str(seller_id)] = {'success': False, 'error': f'Seller {seller_id} not found'}
                continue

            if not seller.district_id or not seller.ward_code:
                results[str(seller_id)] = {'success': False, 'error': 'Seller thiếu địa chỉ kho'}
                continue

            try:
                # 1. GỌI API LẤY DANH SÁCH DỊCH VỤ
                services_res = GHNClient.get_available_services(
                    from_district=seller.district_id,
                    to_district=to_district_id,
                    weight=weight 
                )

                chosen_service_id = None
                
                if services_res.get('success') and services_res.get('data'):
                    services = services_res['data']
                    
                    # Debug: In ra xem Seller này có những gói nào
                    print(f"   🔍 Seller {seller_id} services: {[s['service_id'] for s in services]}")

                    # --- BƯỚC 1: LỌC BỎ GÓI LỖI (Blacklist) ---
                    valid_services = []
                    for s in services:
                        s_id = s.get('service_id')
                        name = s.get('short_name', '').lower()

                        # Gói 100039 thường gây lỗi với hàng > 200g
                        if weight > 200 and s_id == 100039:
                            continue
                        # Gói Tài liệu
                        if weight > 500 and "tài liệu" in name:
                            continue
                        
                        valid_services.append(s)

                    # Nếu lọc xong mà rỗng, thì đành dùng lại list gốc
                    if not valid_services:
                        valid_services = services

                    # --- BƯỚC 2: CHỌN GÓI TỐT NHẤT (Best Match) ---
                    
                    # Ưu tiên A: Tìm gói E-commerce (Type 2) hoặc gói Chuẩn (53320, 53321, 53322)
                    preferred_ids = [53322, 53321, 53320]
                    
                    # Kiểm tra xem có ID ưu tiên nào nằm trong danh sách valid không
                    for pid in preferred_ids:
                        for s in valid_services:
                            if s['service_id'] == pid:
                                chosen_service_id = pid
                                break
                        if chosen_service_id: break
                    
                    # Ưu tiên B: Nếu không có gói ưu tiên, tìm theo tên "Chuẩn"
                    if not chosen_service_id:
                        for s in valid_services:
                            if s.get('service_type_id') == 2: # Gói chuẩn chung
                                chosen_service_id = s['service_id']
                                break
                    
                    # Ưu tiên C: Lấy gói đầu tiên trong danh sách hợp lệ (QUAN TRỌNG: Không được hardcode)
                    if not chosen_service_id and valid_services:
                        chosen_service_id = valid_services[0]['service_id']
                        print(f"   ⚠️ Seller {seller_id}: Using first available service: {chosen_service_id}")

                    print(f"✅ Seller {seller_id}: Selected ServiceID: {chosen_service_id}")

                else:
                    # Trường hợp hãn hữu: API không trả về gói nào -> Ép buộc thử 53320
                    logger.warning(f"Seller {seller_id}: No services found via API. Force fallback 53320.")
                    chosen_service_id = 53320 

                # 2. TÍNH PHÍ
                payload = {
                    'from_district_id': int(seller.district_id),
                    'from_ward_code': str(seller.ward_code).strip(),
                    'to_district_id': to_district_id,
                    'to_ward_code': to_ward_code,
                    'weight': weight,
                    'length': 20, 'width': 15, 'height': 10,
                    'service_id': chosen_service_id, # ID này chắc chắn lấy từ danh sách GHN
                    'insurance_value': 0, 
                    'coupon': None 
                }

                api_result = GHNClient.calculate_shipping_fee(payload)

                if api_result['success']:
                    fee = api_result['fee']
                    total_fee_all += fee
                    results[str(seller_id)] = {
                        'success': True,
                        'fee': fee,
                        'service_id': chosen_service_id,
                        'detail': api_result.get('detail')
                    }
                else:
                    err_msg = api_result.get('message', 'Lỗi tính phí GHN')
                    logger.error(f"GHN Error Seller {seller_id}: {err_msg}")
                    results[str(seller_id)] = {'success': False, 'error': err_msg}

            except Exception as e:
                logger.error(f"System Error: {str(e)}")
                results[str(seller_id)] = {'success': False, 'error': str(e)}

        return Response({
            'success': True,
            'data': results, 
            'sellers': results, 
            'total_shipping_fee': total_fee_all 
        }, status=status.HTTP_200_OK)


class CalculateShippingFeeView(APIView):
    """
    API tính phí đơn lẻ (test)
    """
    def post(self, request):
        try:
            payload = request.data.copy()
            required_fields = ['from_district_id', 'to_district_id', 'weight', 'length', 'width', 'height']
            for field in required_fields:
                if field not in payload or payload[field] is None:
                    return Response({'error': f'Missing field: {field}'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                payload['weight'] = max(int(payload['weight']), 1)
                payload['length'] = max(int(payload['length']), 1)
                payload['width'] = max(int(payload['width']), 1)
                payload['height'] = max(int(payload['height']), 1)
                payload['from_district_id'] = int(payload['from_district_id'])
                payload['to_district_id'] = int(payload['to_district_id'])
            except (ValueError, TypeError):
                return Response({'error': 'Invalid number format'}, status=status.HTTP_400_BAD_REQUEST)

            payload['to_ward_code'] = str(payload.get('to_ward_code', '')).strip()
            payload['from_ward_code'] = str(payload.get('from_ward_code', '')).strip()

            if not payload['to_ward_code'] or not payload['from_ward_code']:
                 return Response({'error': 'Missing ward code'}, status=status.HTTP_400_BAD_REQUEST)

            # Tự động tìm Service ID
            service_id = 53320
            services_res = GHNClient.get_available_services(
                payload['from_district_id'], 
                payload['to_district_id'],
                weight=payload['weight']
            )
            
            if services_res.get('success') and services_res.get('data'):
                # Lấy cái đầu tiên
                service_id = services_res['data'][0]['service_id']
            
            payload['service_id'] = service_id
            payload.setdefault('insurance_value', 0)
            payload.setdefault('coupon', None)

            result = GHNClient.calculate_shipping_fee(payload)

            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error in CalculateShippingFeeView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# MASTER DATA VIEWS (WITH CACHING)
# ==========================================
# (Phần này giữ nguyên, không cần thay đổi)
class GHNProvincesView(APIView):
    def get(self, request):
        cache_key = 'ghn_provinces'
        data = cache.get(cache_key)
        if not data:
            res = GHNClient.get_provinces()
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else: return Response(res, status=400)
        return Response(data, status=200)

class GHNDistrictsView(APIView):
    def get(self, request):
        province_id = request.query_params.get('province_id')
        if not province_id: return Response({'success': False}, status=400)
        cache_key = f'ghn_districts_{province_id}'
        data = cache.get(cache_key)
        if not data:
            res = GHNClient.get_districts(province_id)
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else: return Response(res, status=400)
        return Response(data, status=200)

class GHNWardsView(APIView):
    def get(self, request):
        district_id = request.query_params.get('district_id')
        if not district_id: return Response({'success': False}, status=400)
        cache_key = f'ghn_wards_{district_id}'
        data = cache.get(cache_key)
        if not data:
            res = GHNClient.get_wards(district_id)
            if res.get('success'):
                data = res
                cache.set(cache_key, data, CACHE_TTL)
            else: return Response(res, status=400)
        return Response(data, status=200)