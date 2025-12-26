from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from ..models import Order

# Import class vnpay từ app vnpay_python
from vnpay_python.vnpay import vnpay 

@api_view(['GET'])
@permission_classes([AllowAny])
def payment_ipn(request):
    """
    VNPAY gọi vào đây để báo trạng thái thanh toán (Server-to-Server)
    """
    inputData = request.GET
    if not inputData:
        return Response({'RspCode': '99', 'Message': 'Invalid Params'})

    # Khởi tạo class vnpay
    vnp = vnpay()
    vnp.responseData = inputData.dict()
    
    # 1. Lấy secret key từ dictionary trong settings (sửa cho đúng với file settings của bạn)
    vnp_config = settings.VNPAY_CONFIG
    secret_key = vnp_config['HASH_SECRET_KEY']

    # 2. Xử lý vnp_TxnRef để lấy ra ID thật
    vnp_TxnRef = inputData.get('vnp_TxnRef') # Ví dụ: "45_1703665522"
    
    # Dùng split để tách chuỗi qua dấu gạch dưới và lấy phần đầu tiên (ID đơn hàng)
    try:
        order_id = vnp_TxnRef.split('_')[0] 
    except:
        order_id = vnp_TxnRef

    amount = inputData.get('vnp_Amount')
    vnp_ResponseCode = inputData.get('vnp_ResponseCode')
    
    # Kiểm tra Checksum
    if vnp.validate_response(secret_key):
        try:
            # Tìm đơn hàng theo ID đã tách
            order = Order.objects.get(id=order_id)
            
            # Kiểm tra số tiền (VNPay trả về amount * 100)
            if int(order.total_price * 100) != int(amount):
                 return Response({'RspCode': '04', 'Message': 'Invalid Amount'})
            
            # Kiểm tra trạng thái đơn hàng (để tránh update lại đơn đã xong)
            # Lưu ý: Nếu đơn hàng đã shipping/paid rồi thì báo Order Already Confirmed
            if order.payment_status is True: 
                return Response({'RspCode': '02', 'Message': 'Order Already Confirmed'})
            
            if vnp_ResponseCode == '00':
                # --- THANH TOÁN THÀNH CÔNG ---
                order.status = 'shipping' # Hoặc trạng thái nào bạn muốn sau khi thanh toán
                order.payment_status = True
                order.save()
                return Response({'RspCode': '00', 'Message': 'Confirm Success'})
            else:
                # --- THANH TOÁN THẤT BẠI / NGƯỜI DÙNG HỦY ---
                # Có thể log lại hoặc không làm gì
                return Response({'RspCode': '00', 'Message': 'Payment Failed'})
                
        except Order.DoesNotExist:
            return Response({'RspCode': '01', 'Message': 'Order Not Found'})
    else:
        return Response({'RspCode': '97', 'Message': 'Invalid Checksum'})