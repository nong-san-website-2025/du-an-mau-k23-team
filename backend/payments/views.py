from django.utils import timezone
def seed_finance_demo_data(request):
    """API tạm thời để seed dữ liệu demo cho seller hiện tại"""
    user = request.user
    from sellers.models import Seller
    from products.models import Product
    from orders.models import Order, OrderItem
    from .models import Payment
    from .models_withdraw import WithdrawRequest
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    # Tạo 1 sản phẩm nếu chưa có
    product, _ = Product.objects.get_or_create(seller=seller, name="Demo Product", defaults={"price": 100000, "stock": 10})
    # Tạo 2 order và payment
    for i, (date, amount, status) in enumerate([
        (timezone.now(), 500000, "SUCCESS"),
        (timezone.now() - timezone.timedelta(days=1), 300000, "PENDING")]):
        order, _ = Order.objects.get_or_create(user=user, total_price=amount, status=status, defaults={"customer_name": "Demo", "address": "Test"})
        OrderItem.objects.get_or_create(order=order, product=product, quantity=1, price=amount)
        Payment.objects.get_or_create(order=order, defaults={"amount": amount, "status": status, "created_at": date})
    # Tạo 1 withdraw
    WithdrawRequest.objects.get_or_create(seller=seller, amount=500000, status="paid", defaults={"created_at": timezone.now()})
    return Response({"message": "Demo data seeded!"})
from django.db import models
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Payment
from products.models import Product
from orders.models import OrderItem
from sellers.models import Seller
from .models_withdraw import WithdrawRequest
from .serializers import WithdrawRequestSerializer




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def withdraw_request(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    amount = request.data.get("amount")
    if not amount or float(amount) <= 0:
        return Response({"error": "Số tiền không hợp lệ"}, status=400)
    # Kiểm tra số dư
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status__in=["SUCCESS", "Đã thanh toán"])
    total_revenue = payments.aggregate(total=Sum("amount"))['total'] or 0
    total_withdrawn = WithdrawRequest.objects.filter(seller=seller, status__in=["paid", "approved"]).aggregate(total=Sum("amount"))['total'] or 0
    balance = float(total_revenue) - float(total_withdrawn)
    if float(amount) > balance:
        return Response({"error": "Số dư không đủ"}, status=400)
    # Lưu yêu cầu rút tiền
    withdraw = WithdrawRequest.objects.create(seller=seller, amount=amount, status="pending")
    return Response({"message": "Yêu cầu rút tiền đã được gửi!", "id": withdraw.id})
# API: Số dư khả dụng cho seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status__in=["SUCCESS", "Đã thanh toán"])
    total_revenue = payments.aggregate(total=Sum("amount"))['total'] or 0
    total_withdrawn = WithdrawRequest.objects.filter(seller=seller, status__in=["paid", "approved"]).aggregate(total=Sum("amount"))['total'] or 0
    balance = float(total_revenue) - float(total_withdrawn)
    return Response({"balance": balance})
# API: Doanh thu theo ngày/tháng cho seller (dùng cho biểu đồ)
from django.db.models.functions import TruncDay, TruncMonth
from django.db.models import Sum

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def revenue_chart(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status__in=["SUCCESS", "Đã thanh toán"])

    # Doanh thu theo ngày (7 ngày gần nhất)
    daily = payments.annotate(day=TruncDay("created_at")).values("day").annotate(amount=Sum("amount")).order_by("day")
    daily_data = [{"date": d["day"].strftime("%Y-%m-%d"), "amount": float(d["amount"] or 0), "type": "Ngày"} for d in daily]

    # Doanh thu theo tháng (6 tháng gần nhất)
    monthly = payments.annotate(month=TruncMonth("created_at")).values("month").annotate(amount=Sum("amount")).order_by("month")
    monthly_data = [{"date": m["month"].strftime("%Y-%m"), "amount": float(m["amount"] or 0), "type": "Tháng"} for m in monthly]

    return Response({"data": daily_data + monthly_data})
from .models_withdraw import WithdrawRequest
from .serializers import WithdrawRequestSerializer
# API: Lịch sử rút tiền của seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def withdraw_history(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    withdraws = WithdrawRequest.objects.filter(seller=seller).order_by("-created_at")
    data = WithdrawRequestSerializer(withdraws, many=True).data
    return Response({"data": data})
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
from products.models import Product
from orders.models import OrderItem
from sellers.models import Seller
from .serializers import PaymentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


# API: Lấy danh sách payment và tổng doanh thu cho seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_finance(request):
    """
    Trả về danh sách payment và tổng doanh thu cho seller hiện tại
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Lấy tất cả sản phẩm của seller
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    # Lấy tất cả order item có product thuộc seller
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    # Lấy tất cả payment liên quan các order này và đã thanh toán thành công
    payments = Payment.objects.filter(order_id__in=order_ids, status__in=["SUCCESS", "Đã thanh toán"])

    # Tổng doanh thu
    total_revenue = payments.aggregate(total=models.Sum("amount"))['total'] or 0

    # Serialize danh sách payment
    payment_data = PaymentSerializer(payments, many=True).data

    return Response({
        "payments": payment_data,
        "total_revenue": total_revenue
    })


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
