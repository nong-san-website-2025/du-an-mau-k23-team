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
        if request.method in permissions.SAFE_METHODS:
            return True  # Cho phép mọi người đọc công khai
        return request.user and request.user.is_staff


class VoucherViewSet(viewsets.ModelViewSet):

    queryset = Voucher.objects.all().order_by("-created_at")
    serializer_class = VoucherSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["scope", "active", "seller"]
    search_fields = ["code", "campaign_name", "title", "description"]
    ordering_fields = ["created_at", "start_at", "end_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Ưu tiên filter theo query param nếu có
        seller_id = self.request.query_params.get("seller")
        if seller_id:
            try:
                sid = int(seller_id)
                qs = qs.filter(seller_id=sid)
            except ValueError:
                qs = qs.none()
        # Chỉ trả về voucher đang active và trong thời gian hiệu lực (nếu có)
        now = timezone.now()
        qs = qs.filter(active=True).filter(
            Q(start_at__isnull=True) | Q(start_at__lte=now)
        ).filter(
            Q(end_at__isnull=True) | Q(end_at__gte=now)
        )
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
    Body JSON: { "code": "SALE50", "order_total": 500000 }
    """
    code = request.data.get("code")
    order_total = request.data.get("order_total")

    if not code or not order_total:
        return Response({"error": "Thiếu dữ liệu"}, status=400)

    try:
        voucher = Voucher.objects.get(code=code, active=True)
    except Voucher.DoesNotExist:
        return Response({"error": "Voucher không tồn tại hoặc không hợp lệ"}, status=400)

    now = timezone.now()
    if voucher.start_at and voucher.start_at > now:
        return Response({"error": "Voucher chưa bắt đầu"}, status=400)
    if voucher.end_at and voucher.end_at < now:
        return Response({"error": "Voucher đã hết hạn"}, status=400)
    if voucher.min_order_value and order_total < voucher.min_order_value:
        return Response({"error": "Đơn hàng chưa đạt giá trị tối thiểu"}, status=400)

    discount = 0
    if voucher.discount_percent:
        discount = order_total * (voucher.discount_percent / 100)
    elif voucher.discount_amount:
        discount = voucher.discount_amount

    return Response({
        "success": True,
        "voucher": voucher.code,
        "discount": float(discount),
        "final_total": float(order_total - discount)
    })

class PromotionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]

class PromotionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer