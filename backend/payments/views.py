from rest_framework import viewsets, permissions
from .models import Payment
from .serializers import PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests

class VNPayCreatePaymentView(APIView):
    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Missing amount'}, status=400)
        # Gửi request sang PHP để lấy link thanh toán
        php_url = 'http://localhost/vnpay_php/vnpay_create_payment.php'
        data = {
            'amount': amount,
            'order_id': 'ORDER123',  # TODO: sinh mã đơn hàng duy nhất nếu cần
            # Thêm các trường khác nếu PHP yêu cầu
        }
        try:
            resp = requests.post(php_url, data=data)
            result = resp.json()
        except Exception:
            return Response({'error': 'Lỗi kết nối VNPAY'}, status=500)
        if result.get('code') == '00':
            return Response({'payment_url': result['data']})
        return Response({'error': 'Không tạo được link thanh toán'}, status=500)
