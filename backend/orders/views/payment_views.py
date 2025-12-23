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
    
    order_id = inputData.get('vnp_TxnRef')
    amount = inputData.get('vnp_Amount')
    vnp_ResponseCode = inputData.get('vnp_ResponseCode')
    
    # Kiểm tra Checksum
    if vnp.validate_response(settings.VNPAY_HASH_SECRET):
        try:
            order = Order.objects.get(id=order_id)
            
            # Kiểm tra số tiền
            if order.total_price * 100 != int(amount):
                 return Response({'RspCode': '04', 'Message': 'Invalid Amount'})
            
            # Kiểm tra xem đơn đã check rồi chưa
            if order.status == 'completed':
                return Response({'RspCode': '02', 'Message': 'Order Already Confirmed'})
            
            if vnp_ResponseCode == '00':
                # --- THANH TOÁN THÀNH CÔNG ---
                order.status = 'shipping'
                order.payment_status = True
                order.save()
                return Response({'RspCode': '00', 'Message': 'Confirm Success'})
            else:
                return Response({'RspCode': '00', 'Message': 'Payment Failed'})
                
        except Order.DoesNotExist:
            return Response({'RspCode': '01', 'Message': 'Order Not Found'})
    else:
        return Response({'RspCode': '97', 'Message': 'Invalid Checksum'})