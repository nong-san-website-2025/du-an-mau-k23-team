import hmac
import hashlib
import requests
from datetime import datetime
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from orders.models import Order
from .models import Payment


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_momo_payment(request):
    """
    Tạo thanh toán MoMo:
    - Tạo Order trước
    - Tạo Payment liên kết Order
    - Gọi MoMo API
    - Trả về payUrl/QR/deeplink + orderId để frontend polling
    """
    data = request.data

    # Lấy dữ liệu từ frontend
    amount = str(data.get("amount", 0))
    customer_name = data.get("customer_name", "")
    customer_phone = data.get("customer_phone", "")
    address = data.get("address", "")
    note = data.get("note", "")

    # 1️⃣ Tạo Order
    order = Order.objects.create(
        user=request.user,
        total_price=amount,
        status="PENDING",
        customer_name=customer_name,
        customer_phone=customer_phone,
        address=address,
        note=note,
        payment_method="MOMO"
    )

    # 2️⃣ Tạo momo_order_id riêng cho MoMo (requestId & orderId)
    momo_order_id = str(int(datetime.now().timestamp() * 1000))  # timestamp ms
    order_info = f"Thanh toán đơn hàng #{order.id}"

    # 3️⃣ Tạo signature MoMo
    raw_signature = (
        f"accessKey={settings.MOMO_CONFIG['accessKey']}"
        f"&amount={amount}"
        f"&extraData="
        f"&ipnUrl={settings.MOMO_CONFIG['notifyUrl']}"
        f"&orderId={momo_order_id}"
        f"&orderInfo={order_info}"
        f"&partnerCode={settings.MOMO_CONFIG['partnerCode']}"
        f"&redirectUrl={settings.MOMO_CONFIG['redirectUrl']}"
        f"&requestId={momo_order_id}"
        f"&requestType=captureWallet"
    )
    signature = hmac.new(
        settings.MOMO_CONFIG['secretKey'].encode('utf-8'),
        raw_signature.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    payload = {
        "partnerCode": settings.MOMO_CONFIG["partnerCode"],
        "accessKey": settings.MOMO_CONFIG["accessKey"],
        "requestId": momo_order_id,
        "amount": amount,
        "orderId": momo_order_id,
        "orderInfo": order_info,
        "redirectUrl": settings.MOMO_CONFIG["redirectUrl"],
        "ipnUrl": settings.MOMO_CONFIG["notifyUrl"],
        "extraData": "",
        "requestType": "captureWallet",
        "signature": signature,
        "lang": "vi"
    }

    # 4️⃣ Gọi MoMo API
    try:
        response = requests.post(settings.MOMO_CONFIG["endpoint"], json=payload, timeout=10)
        result = response.json()
    except Exception as e:
        return Response({"error": f"Lỗi gọi MoMo: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 5️⃣ Lưu Payment liên kết Order
    Payment.objects.create(
        order=order,
        amount=amount,
        status="PENDING",
        momo_order_id=momo_order_id
    )

    # 6️⃣ Trả về frontend
    return Response({
        "payUrl": result.get("payUrl"),
        "qrCodeUrl": result.get("qrCodeUrl"),
        "deeplink": result.get("deeplink"),
        "orderId": order.id
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def momo_ipn(request):
    """MoMo gọi lại khi thanh toán xong"""
    data = request.data
    momo_order_id = data.get("orderId")
    result_code = data.get("resultCode")  # 0 = thành công

    # Cập nhật Payment dựa theo momo_order_id
    payment = Payment.objects.filter(momo_order_id=momo_order_id).first()
    if not payment:
        return Response({"error": "Payment không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

    if result_code == 0:
        payment.status = "SUCCESS"
        payment.save()
        # Đồng thời cập nhật Order
        order = payment.order
        order.status = "COMPLETED"
        order.save()
    else:
        payment.status = "FAILED"
        payment.save()

    return Response({"message": "IPN received"}, status=status.HTTP_200_OK)
