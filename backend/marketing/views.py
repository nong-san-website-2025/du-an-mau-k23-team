# apps/marketing/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Banner, FlashSale, Voucher, VoucherUsage
from .serializers import (
    BannerSerializer, FlashSaleSerializer, VoucherSerializer
)
from .permissions import IsMarketingAdmin

# --------- ADMIN CRUD VIEWS ---------
class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]


class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    permission_classes = [IsMarketingAdmin]


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer
    permission_classes = [AllowAny]


# --------- PUBLIC ENDPOINTS ---------
@api_view(["GET"])
def homepage_config(request):
    now = timezone.now()
    banners = Banner.objects.filter(
        is_active=True, start_at__lte=now
    ).exclude(end_at__lt=now).order_by("-priority")

    flashsales = FlashSale.objects.filter(is_active=True, start_at__lte=now, end_at__gte=now)
    vouchers = Voucher.objects.filter(is_active=True, start_at__lte=now, end_at__gte=now)

    return Response({
        "banners": BannerSerializer(banners, many=True).data,
        "flashsales": FlashSaleSerializer(flashsales, many=True).data,
        "vouchers": VoucherSerializer(vouchers, many=True).data,
    })


@api_view(["POST"])
def validate_voucher(request):
    """
    Validate voucher khi người dùng nhập code
    """
    code = request.data.get("code")
    user = request.user
    cart_total = float(request.data.get("cart_total", 0))

    try:
        voucher = Voucher.objects.get(code=code, is_active=True)
    except Voucher.DoesNotExist:
        return Response({"error": "Voucher không tồn tại hoặc đã hết hạn"}, status=400)

    now = timezone.now()
    if not (voucher.start_at <= now <= voucher.end_at):
        return Response({"error": "Voucher chưa đến thời gian sử dụng hoặc đã hết hạn"}, status=400)

    if cart_total < float(voucher.min_order_value):
        return Response({"error": "Giá trị đơn hàng chưa đạt tối thiểu"}, status=400)

    usage, _ = VoucherUsage.objects.get_or_create(voucher=voucher, user=user)
    if usage.count >= voucher.per_user_limit:
        return Response({"error": "Bạn đã dùng voucher này tối đa số lần cho phép"}, status=400)

    # Calculate discount
    discount = (cart_total * float(voucher.value) / 100) if voucher.discount_type == "percent" else float(voucher.value)
    return Response({"valid": True, "discount": discount, "new_total": cart_total - discount})


@api_view(["POST"])
def redeem_voucher(request):
    """
    Xác nhận voucher khi checkout thành công (atomic)
    """
    code = request.data.get("code")
    user = request.user

    with transaction.atomic():
        try:
            voucher = Voucher.objects.select_for_update().get(code=code, is_active=True)
        except Voucher.DoesNotExist:
            return Response({"error": "Voucher không hợp lệ"}, status=400)

        if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
            return Response({"error": "Voucher đã hết lượt sử dụng"}, status=400)

        usage, _ = VoucherUsage.objects.select_for_update().get_or_create(voucher=voucher, user=user)
        if usage.count >= voucher.per_user_limit:
            return Response({"error": "Bạn đã dùng voucher này tối đa số lần cho phép"}, status=400)

        voucher.used_count += 1
        voucher.save()
        usage.count += 1
        usage.save()

    return Response({"success": True})
