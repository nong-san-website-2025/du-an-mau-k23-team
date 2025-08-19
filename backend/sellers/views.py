from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView

class SellerRejectAPIView(APIView):
    def post(self, request, pk):
        from .models import Seller
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response({"detail": "Seller not found or already processed."}, status=drf_status.HTTP_404_NOT_FOUND)
        seller.status = "rejected"
        seller.save()
        return Response({"detail": "Seller rejected."}, status=drf_status.HTTP_200_OK)
from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework import generics
from .models import Seller
from .serializers import SellerListSerializer, SellerDetailSerializer, SellerRegisterSerializer

class SellerApproveAPIView(APIView):
    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response({"detail": "Seller not found or already approved."}, status=drf_status.HTTP_404_NOT_FOUND)
        seller.status = "approved"
        seller.save()
        return Response({"detail": "Seller approved."}, status=drf_status.HTTP_200_OK)



class SellerListAPIView(generics.ListAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerListSerializer

class SellerRegisterAPIView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer

    def perform_create(self, serializer):
        seller = serializer.save()
        # Cập nhật is_seller cho user
        user = seller.user
        user.is_seller = True
        user.save()

class SellerPendingListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer
    def get_queryset(self):
        return Seller.objects.filter(status="pending")

class SellerDetailAPIView(generics.RetrieveAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer

from rest_framework import viewsets, permissions
from .models import Seller, Shop, Product, Order, Voucher
from .serializers import SellerSerializer,  ShopSerializer, ProductSerializer, OrderSerializer, VoucherSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.models import User



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

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(shop__owner=self.request.user)

class VoucherViewSet(viewsets.ModelViewSet):
    serializer_class = VoucherSerializer
    queryset = Voucher.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Voucher.objects.filter(shop__owner=self.request.user)

