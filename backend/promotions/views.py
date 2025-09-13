# promotions/views.py
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Voucher, FlashSale, FlashSaleItem
from .serializers import VoucherSerializer, FlashSaleSerializer, FlashSaleItemSerializer
from django.utils import timezone
from rest_framework import generics
from .models import Promotion
from .serializers import PromotionSerializer




class IsAdminOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        # Cho phép mọi người (kể cả chưa đăng nhập) đọc dữ liệu
        if request.method in permissions.SAFE_METHODS:
            return True
        # Chỉ admin mới được ghi
        return bool(request.user and request.user.is_staff)


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by("-created_at")
    serializer_class = VoucherSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]  # chỉ dùng search + ordering
    search_fields = ["code", "campaign_name", "title", "description"]
    ordering_fields = ["created_at", "start_at", "end_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        qp = self.request.query_params

        seller = qp.get("seller")
        if seller:
            qs = qs.filter(seller_id=seller)

        scope = qp.get("scope")
        if scope:
            qs = qs.filter(scope=scope)

        return qs


class FlashSaleViewSet(viewsets.ModelViewSet):
    """
    API cho FlashSale - includes nested items (read-only nested).
    """
    queryset = FlashSale.objects.all().order_by("-created_at")
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["start_at", "end_at", "created_at"]


class FlashSaleItemViewSet(viewsets.ModelViewSet):
    """
    API cho FlashSaleItem: thêm/xoá/sửa sản phẩm trong flash sale.
    """
    queryset = FlashSaleItem.objects.all().order_by("-id")
    serializer_class = FlashSaleItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["flashsale", "product"]
    search_fields = ["product__name"]

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_voucher(request):
    """
    Body JSON: { "code": "SALE50", "order_total": 500000, "seller_id": 12 }
    - Nếu voucher scope = "seller" thì chỉ áp dụng khi seller_id khớp với voucher.seller
    """
    from decimal import Decimal, InvalidOperation

    code = request.data.get("code")
    order_total_raw = request.data.get("order_total")
    seller_id = request.data.get("seller_id")

    if not code or order_total_raw is None:
        return Response({"error": "Thiếu dữ liệu"}, status=400)

    try:
        order_total = Decimal(str(order_total_raw))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "order_total không hợp lệ"}, status=400)

    try:
        voucher = Voucher.objects.get(code=code, active=True)
    except Voucher.DoesNotExist:
        return Response({"error": "Voucher không tồn tại hoặc không hợp lệ"}, status=400)

    now = timezone.now()
    if voucher.start_at and voucher.start_at > now:
        return Response({"error": "Voucher chưa bắt đầu"}, status=400)
    if voucher.end_at and voucher.end_at < now:
        return Response({"error": "Voucher đã hết hạn"}, status=400)

    # Ràng buộc theo cửa hàng nếu là voucher của seller
    if voucher.scope == "seller":
        if not seller_id:
            return Response({"error": "Thiếu seller_id cho voucher của cửa hàng"}, status=400)
        if str(voucher.seller_id) != str(seller_id):
            return Response({"error": "Voucher chỉ áp dụng cho cửa hàng tương ứng"}, status=400)

    if voucher.min_order_value and order_total < voucher.min_order_value:
        return Response({"error": "Đơn hàng chưa đạt giá trị tối thiểu"}, status=400)

    discount = Decimal("0")
    if voucher.discount_percent:
        try:
            discount = (order_total * (Decimal(voucher.discount_percent) / Decimal("100")))
        except Exception:
            discount = Decimal("0")
    elif voucher.discount_amount:
        discount = Decimal(voucher.discount_amount)

    final_total = order_total - discount
    if final_total < 0:
        final_total = Decimal("0")

    return Response({
        "success": True,
        "voucher": voucher.code,
        "scope": voucher.scope,
        "seller_id": voucher.seller_id,
        "discount": float(discount),
        "final_total": float(final_total)
    })

class PromotionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]

class PromotionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer