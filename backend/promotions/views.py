from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Voucher, FlashSale
from .serializers import VoucherDetailSerializer, FlashSaleSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff

class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by('-created_at')
    serializer_class = VoucherDetailSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_staff:
            # seller users see system + their seller's vouchers
            seller = getattr(user, 'seller', None) or getattr(user, 'store', None)
            if seller:
                return qs.filter(Q(scope="system") | Q(seller=seller))
            return qs.filter(scope="system")
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # admin can create system voucher OR seller voucher. Non-admin cannot create here (permission block)
        if serializer.validated_data.get('scope') == 'system' and not user.is_staff:
            raise PermissionError("Chỉ admin mới tạo voucher hệ thống.")
        serializer.save(created_by=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def promotions_overview(request):
    """
    Trả về list flatten vouchers (dùng cho UI bảng chung).
    Có hỗ trợ search theo code hoặc name.
    """
    user = request.user
    search = request.query_params.get("search")  # <-- lấy query param search

    # get vouchers per visibility rules
    if user.is_staff:
        vouchers = Voucher.objects.all().order_by('-created_at')
    else:
        seller = getattr(user, 'seller', None) or getattr(user, 'store', None)
        if seller:
            vouchers = Voucher.objects.filter(Q(scope='system') | Q(seller=seller)).order_by('-created_at')
        else:
            vouchers = Voucher.objects.filter(scope='system').order_by('-created_at')

    # Nếu có search thì filter
    if search:
        vouchers = vouchers.filter(
            Q(title__icontains=search) | 
            Q(code__icontains=search)
        )

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
        })
    return Response(data)


class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all().prefetch_related("items__product")
    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.IsAdminUser]  # chỉ admin quản lý

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]  # khách cũng xem được flash sale
        return [permissions.IsAdminUser()]