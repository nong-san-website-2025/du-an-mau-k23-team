from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework import generics
from .models import Seller
from .serializers import SellerListSerializer, SellerDetailSerializer, SellerRegisterSerializer
from rest_framework import viewsets, permissions
from .models import Seller, Shop, Product, Order, Voucher
from .serializers import SellerSerializer,  ShopSerializer, ProductSerializer, OrderSerializer, VoucherSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

@api_view(["GET"])
def search_sellers(request):
    q = request.GET.get("q", "")
    # Giới hạn số lượng trả về (ví dụ 20) để tránh quá tải
    sellers = Seller.objects.filter(store_name__icontains=q)[:20]
    serializer = SellerSerializer(sellers, many=True)
    return Response(serializer.data)
class SellerRejectAPIView(APIView):
    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already processed."},
                status=drf_status.HTTP_404_NOT_FOUND,
            )

        seller.status = "rejected"
        seller.save()

        # ❌ Không đổi role user, họ vẫn là customer
        return Response(
            {"detail": "Seller rejected."}, status=drf_status.HTTP_200_OK
        )



class SellerApproveAPIView(APIView):
    def post(self, request, pk):
        from users.models import Role  # import Role riêng của bạn

        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already approved."},
                status=drf_status.HTTP_404_NOT_FOUND,
            )

        # Đổi trạng thái seller
        seller.status = "approved"
        seller.save()

        # 🔥 Đổi role user sang "seller"
        try:
            seller_role = Role.objects.get(name="seller")
        except Role.DoesNotExist:
            return Response(
                {"detail": "Role 'seller' chưa tồn tại."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        user = seller.user
        user.role = seller_role
        user.save(update_fields=["role"])

        Shop.objects.get_or_create(owner=user, defaults={"name": seller.store_name})

        return Response(
            {"detail": "Seller approved & user role updated."},
            status=drf_status.HTTP_200_OK,
        )

class SellerLockAPIView(APIView):
    def post(self, request, pk):
        seller = Seller.objects.get(pk=pk)
        if seller.status == "active":
            seller.status = "locked"
        elif seller.status == "locked":
            seller.status = "active"
        seller.save()
        return Response({"status": seller.status})



class SellerListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        statuses = self.request.query_params.getlist("status")
        queryset = Seller.objects.all()
        if statuses:
            queryset = queryset.filter(status__in=statuses)
        return queryset

class SellerRegisterAPIView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer

    def perform_create(self, serializer):
        seller = serializer.save()

class SellerPendingListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer
    def get_queryset(self):
        return Seller.objects.filter(status="pending")

class SellerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer

class SellerByStatusAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        status_group = self.kwargs["group"]
        if status_group == "business":  # active & locked
            return Seller.objects.filter(status__in=["active", "locked"])
        elif status_group == "approval":  # pending, approved, rejected
            return Seller.objects.filter(status__in=["pending", "approved", "rejected"])
        return Seller.objects.none()

@api_view(['GET'])
def available_users(request):
    # Lấy danh sách id user đã có Seller
    existing_sellers = Seller.objects.values_list('user_id', flat=True)
    # Chỉ lấy những user chưa có seller
    users = User.objects.exclude(id__in=existing_sellers).values("id", "username", "email")
    return Response(users)
class SellerViewSet(viewsets.ModelViewSet):
    serializer_class = SellerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Seller.objects.all()

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()  # admin tạo cho user khác
        else:
            serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = SellerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class SellerProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response({"detail": "Bạn không phải seller"}, status=403)

        search = request.GET.get("search", "")
        status_filter = request.GET.get("status", "")

        products = Product.objects.filter(seller=seller)

        if search:
            products = products.filter(name__icontains=search)

        if status_filter:
            products = products.filter(status=status_filter)

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class SellerMeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return current user's seller profile"""
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response({"detail": "Không tìm thấy seller của bạn"}, status=404)
        serializer = SellerDetailSerializer(seller)
        return Response(serializer.data)

class ShopViewSet(viewsets.ModelViewSet):
    serializer_class = ShopSerializer
    queryset = Shop.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admin -> thấy tất cả shop
        if user.is_staff or getattr(user, "is_admin", False):
            return Shop.objects.all()
        # Seller -> chỉ thấy shop của chính mình
        return Shop.objects.filter(owner=user)

    def perform_create(self, serializer):
        # Khi tạo shop -> tự động gán owner là user đang đăng nhập
        serializer.save(owner=self.request.user)

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(shop__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        # Gán shop theo user hiện tại để tránh phải gửi từ frontend
        shop = Shop.objects.filter(owner=request.user).first()
        if not shop:
            return Response({"detail": "Bạn chưa có shop"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data["shop"] = shop.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SellerActivateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response({"detail": "Không tìm thấy seller của bạn"}, status=404)

        if seller.status != "approved":
            return Response({"detail": "Chỉ có seller đã được duyệt mới mở cửa hàng"}, status=400)

        seller.status = "active"
        seller.save()

        # 🔥 Đổi role user sang seller (nếu chưa đổi ở bước approve)
        from users.models import Role
        try:
            seller_role = Role.objects.get(name="seller")
            request.user.role = seller_role
            request.user.save(update_fields=["role"])
        except Role.DoesNotExist:
            return Response({"detail": "Role 'seller' chưa tồn tại"}, status=400)

        return Response({"detail": "Cửa hàng đã được mở và hoạt động", "role": "seller"}, status=200)
