# promotions/views.py
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Q
from django.utils.timezone import now
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import Voucher, FlashSale, UserVoucher
from .serializers import (
    VoucherDetailSerializer,
    FlashSaleSerializer,
    FlashSaleAdminSerializer,
    UserVoucherSerializer,
)

User = get_user_model()


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by('-created_at')
    serializer_class = VoucherDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_staff:
            seller = getattr(user, 'seller', None) or getattr(user, 'store', None)
            if seller:
                return qs.filter(Q(scope="system") | Q(seller=seller))
            return qs.filter(scope="system")
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if serializer.validated_data.get('scope') == 'system' and not user.is_staff:
            raise PermissionError("Chỉ admin mới tạo voucher hệ thống.")
        voucher = serializer.save(created_by=user)

        # If direct distribution requested, distribute to active users up to total_quantity
        if voucher.distribution_type == Voucher.DistributionType.DIRECT:
            users_qs = User.objects.filter(is_active=True)
            remaining = voucher.total_quantity if voucher.total_quantity is not None else None

            bulk = []
            for u in users_qs:
                if remaining is not None and remaining <= 0:
                    break
                give = voucher.per_user_quantity
                if remaining is not None:
                    give = min(give, remaining)
                if not UserVoucher.objects.filter(user=u, voucher=voucher).exists():
                    bulk.append(UserVoucher(user=u, voucher=voucher, quantity=give))
                    if remaining is not None:
                        remaining -= give

            if bulk:
                UserVoucher.objects.bulk_create(bulk, ignore_conflicts=True)


# -------------------------
# Helper: safe get + calc
# -------------------------
def _safe_get_voucher_for_claim(code):
    return Voucher.objects.filter(code=code, distribution_type=Voucher.DistributionType.CLAIM, active=True).order_by('id').first()


def _safe_get_user_voucher_by_code(user, code, for_update=False):
    qs = UserVoucher.objects.select_related("voucher").filter(user=user, voucher__code=code).order_by("id")
    if for_update:
        qs = qs.select_for_update()
    return qs.first()


def _calc_discount_for_voucher(voucher, order_total):
    discount = 0.0
    if voucher.discount_amount:
        discount = float(voucher.discount_amount)
    elif voucher.discount_percent:
        discount = (float(order_total) * float(voucher.discount_percent)) / 100.0
        if voucher.max_discount_amount and discount > float(voucher.max_discount_amount):
            discount = float(voucher.max_discount_amount)
    elif voucher.freeship_amount:
        discount = float(voucher.freeship_amount)
    return float(discount)


# -------------------------
# Claim voucher
# -------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def claim_voucher(request):
    code = request.data.get("code")
    user = request.user

    if not code:
        return Response({"error": "Thiếu mã voucher"}, status=400)

    try:
        with transaction.atomic():
            voucher = Voucher.objects.select_for_update().filter(
                code=code, distribution_type=Voucher.DistributionType.CLAIM, active=True
            ).order_by('id').first()

            if not voucher:
                return Response({"error": "Voucher không tồn tại hoặc không claim được"}, status=400)

            if voucher.start_at and now() < voucher.start_at:
                return Response({"error": "Voucher chưa bắt đầu"}, status=400)
            if voucher.end_at and now() > voucher.end_at:
                return Response({"error": "Voucher đã hết hạn"}, status=400)

            if UserVoucher.objects.filter(user=user, voucher=voucher).exists():
                return Response({"error": "Bạn đã nhận voucher này rồi"}, status=400)

            if voucher.total_quantity is not None:
                issued = voucher.issued_count()
                remaining = voucher.total_quantity - issued
                if remaining <= 0:
                    return Response({"error": "Voucher đã hết"}, status=400)
                give = min(voucher.per_user_quantity, remaining)
            else:
                give = voucher.per_user_quantity

            uv = UserVoucher.objects.create(user=user, voucher=voucher, quantity=give)

    except Exception as e:
        return Response({"error": str(e)}, status=400)

    serializer = UserVoucherSerializer(uv)
    return Response({"success": True, "user_voucher": serializer.data})


# -------------------------
# Promotions overview
# -------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def promotions_overview(request):
    user = request.user
    search = request.query_params.get("search")
    scope = request.query_params.get("scope")                # system / seller
    distribution_type = request.query_params.get("distribution_type")  # CLAIM / DIRECT
    active = request.query_params.get("active")              # true / false

    if user.is_staff:
        vouchers = Voucher.objects.all().order_by('-created_at')
    else:
        seller = getattr(user, 'seller', None) or getattr(user, 'store', None)
        if seller:
            vouchers = Voucher.objects.filter(Q(scope='system') | Q(seller=seller)).order_by('-created_at')
        else:
            vouchers = Voucher.objects.filter(scope='system').order_by('-created_at')

    if search:
        vouchers = vouchers.filter(Q(title__icontains=search) | Q(code__icontains=search))

    if scope:
        vouchers = vouchers.filter(scope=scope)

    if distribution_type:
        vouchers = vouchers.filter(distribution_type=distribution_type)

    if active is not None:
        if active.lower() in ["true", "1"]:
            vouchers = vouchers.filter(active=True)
        elif active.lower() in ["false", "0"]:
            vouchers = vouchers.filter(active=False)

    data = []
    for v in vouchers:
        data.append({
            "id": f"voucher-{v.id}",
            "code": v.code,
            "name": v.title or v.code,
            "type": "voucher",
            "discount_type": v.discount_type(),
            "discount_percent": float(v.discount_percent) if v.discount_percent is not None else None,
            "discount_amount": int(v.discount_amount) if v.discount_amount is not None else None,
            "freeship_amount": int(v.freeship_amount) if v.freeship_amount is not None else None,
            "min_order_value": int(v.min_order_value) if v.min_order_value is not None else None,
            "start": v.start_at,
            "end": v.end_at,
            "scope": v.scope,
            "active": v.active,
            "distribution_type": v.distribution_type,
            "total_quantity": v.total_quantity,
            "per_user_quantity": v.per_user_quantity,
            "issued_count": v.issued_count(),
            "remaining_quantity": v.remaining_quantity(),
        })
    return Response(data)


# -------------------------
# FlashSales
# -------------------------
class FlashSaleListView(generics.ListCreateAPIView):
    serializer_class = FlashSaleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        now_t = timezone.now()
        return FlashSale.objects.filter(
            is_active=True,
            start_time__lte=now_t,
            end_time__gt=now_t
        ).select_related('product')


# -------------------------
# My vouchers
# -------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_vouchers(request):
    user_vouchers = UserVoucher.objects.filter(user=request.user).select_related('voucher')
    serializer = UserVoucherSerializer(user_vouchers, many=True)
    return Response(serializer.data)


# -------------------------
# APPLY voucher (preview)
# -------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_voucher(request):
    code = request.data.get("code")
    order_total = request.data.get("order_total")

    if code is None or order_total is None:
        return Response({"error": "Thiếu code hoặc order_total"}, status=400)

    user_voucher = _safe_get_user_voucher_by_code(request.user, code, for_update=False)
    if not user_voucher:
        return Response({"error": "Voucher không thuộc về bạn hoặc chưa nhận"}, status=400)

    voucher = user_voucher.voucher

    if not voucher.active:
        return Response({"error": "Voucher đã tắt"}, status=400)
    if voucher.start_at and now() < voucher.start_at:
        return Response({"error": "Voucher chưa đến thời gian áp dụng"}, status=400)
    if voucher.end_at and now() > voucher.end_at:
        return Response({"error": "Voucher đã hết hạn"}, status=400)
    if user_voucher.remaining_for_user() <= 0:
        return Response({"error": "Bạn đã sử dụng hết voucher này"}, status=400)
    try:
        order_total_f = float(order_total)
    except (TypeError, ValueError):
        return Response({"error": "order_total không hợp lệ"}, status=400)
    if voucher.min_order_value and order_total_f < float(voucher.min_order_value):
        return Response({"error": f"Đơn tối thiểu {voucher.min_order_value}₫ để áp dụng voucher"}, status=400)

    discount = _calc_discount_for_voucher(voucher, order_total_f)
    new_total = max(0.0, order_total_f - discount)

    return Response({"success": True, "discount": discount, "new_total": new_total})


# -------------------------
# CONSUME voucher (mark used)
# -------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def consume_voucher(request):
    code = request.data.get("code")
    order_total = request.data.get("order_total")

    if code is None or order_total is None:
        return Response({"error": "Thiếu code hoặc order_total"}, status=400)

    try:
        with transaction.atomic():
            user_voucher = _safe_get_user_voucher_by_code(request.user, code, for_update=True)
            if not user_voucher:
                return Response({"error": "Voucher không thuộc về bạn hoặc chưa nhận"}, status=400)

            voucher = user_voucher.voucher

            if not voucher.active:
                return Response({"error": "Voucher đã tắt"}, status=400)
            if voucher.start_at and now() < voucher.start_at:
                return Response({"error": "Voucher chưa đến thời gian áp dụng"}, status=400)
            if voucher.end_at and now() > voucher.end_at:
                return Response({"error": "Voucher đã hết hạn"}, status=400)
            if user_voucher.remaining_for_user() <= 0:
                return Response({"error": "Bạn đã sử dụng hết voucher này"}, status=400)
            try:
                order_total_f = float(order_total)
            except (TypeError, ValueError):
                return Response({"error": "order_total không hợp lệ"}, status=400)
            if voucher.min_order_value and order_total_f < float(voucher.min_order_value):
                return Response({"error": f"Đơn tối thiểu {voucher.min_order_value}₫ để áp dụng voucher"}, status=400)

            discount = _calc_discount_for_voucher(voucher, order_total_f)
            user_voucher.mark_used_once()

            return Response({"success": True, "discount": discount})
    except Exception as exc:
        return Response({"error": str(exc)}, status=400)


# -------------------------
# Admin flashsale viewset
# -------------------------
class FlashSaleAdminViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all().select_related('product')
    serializer_class = FlashSaleAdminSerializer
    permission_classes = [IsAdminUser]
