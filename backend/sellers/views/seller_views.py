from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from sellers.models import Seller, Shop, SellerFollow
from sellers.serializers import (
    SellerSerializer, SellerDetailSerializer, SellerRegisterSerializer,
    ShopSerializer, SellerListSerializer
)
# Note: Import Order related logic if needed here or use raw data
from orders.models import Order, OrderItem

class SellerRegisterAPIView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors, "message": "Dữ liệu không hợp lệ"},
                status=status.HTTP_400_BAD_REQUEST
            )
        seller = serializer.save()
        return Response(
            {"message": "Đăng ký shop thành công", "seller_id": seller.id},
            status=status.HTTP_201_CREATED
        )

class SellerViewSet(viewsets.ModelViewSet):
    queryset = Seller.objects.all()
    serializer_class = SellerSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'me']:
            return SellerDetailSerializer
        return SellerSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        seller = serializer.save(user=request.user)
        out_serializer = SellerDetailSerializer(seller, context={"request": request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        data = request.data.copy()
        serializer = self.get_serializer(instance, data=data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        seller = serializer.save()
        out_serializer = SellerDetailSerializer(seller, context={"request": request})
        return Response(out_serializer.data, status=status.HTTP_200_OK)

class SellerMeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = Seller.objects.filter(user=request.user).first()
        if not seller:
            return Response({"detail": "Bạn chưa đăng ký seller"}, status=404)
        serializer = SellerDetailSerializer(seller, context={"request": request})
        return Response(serializer.data, status=200)

class SellerActivateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response({"detail": "Không tìm thấy seller của bạn"}, status=404)
        if seller.status != "approved":
            return Response({"detail": "Chỉ có seller đã được duyệt mới mở cửa hàng"}, status=400)

        seller.status = "active"
        seller.save()

        # Update role if needed
        from users.models import Role
        seller_role, created = Role.objects.get_or_create(name="seller")
        request.user.role = seller_role
        request.user.save(update_fields=["role"])

        return Response({"detail": "Cửa hàng đã được mở và hoạt động", "role": "seller"}, status=200)

class ShopViewSet(viewsets.ModelViewSet):
    serializer_class = ShopSerializer
    queryset = Shop.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "is_admin", False):
            return Shop.objects.all()
        return Shop.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

@api_view(['GET'])
def available_users(request):
    existing_sellers = Seller.objects.values_list('user_id', flat=True)
    users = User.objects.exclude(id__in=existing_sellers).values("id", "username", "email")
    return Response(users)

class MyFollowedSellersAPIView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SellerListSerializer

    def get_queryset(self):
        ids = SellerFollow.objects.filter(user=self.request.user).values_list("seller_id", flat=True)
        return Seller.objects.filter(id__in=list(ids)).order_by("-created_at")

class MyFollowersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response([], status=200)
        qs = SellerFollow.objects.filter(seller=seller).select_related("user").order_by("-created_at")
        data = [
            {
                "id": f.user.id,
                "username": f.user.username,
                "full_name": getattr(f.user, "full_name", "") or f.user.username,
                "avatar": f.user.avatar.url if getattr(f.user, "avatar", None) else None,
            }
            for f in qs
        ]
        return Response(data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser]) # Note: Code cũ là AdminUser, kiểm tra xem có cần đổi thành Seller ko?
def seller_orders_list(request, seller_id):
    # ... (Giữ nguyên logic của bạn) ...
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    
    order_ids = OrderItem.objects.filter(product__seller=seller).values_list('order_id', flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids).order_by('-created_at').prefetch_related('items', 'items__product')
    
    # ... (Copy logic serialize order data from original code) ...
    # Placeholder:
    return Response({'seller_id': seller.id, 'results': [], 'count': 0})