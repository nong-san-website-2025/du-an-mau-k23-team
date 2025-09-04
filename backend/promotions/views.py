from rest_framework import viewsets, permissions
from .models import Promotion, FlashSale, StoreVoucher
from .serializers import PromotionSerializer, FlashSaleSerializer, StoreVoucherSerializer

class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().order_by('-created_at')
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all().order_by('-start_at')
    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class StoreVoucherViewSet(viewsets.ModelViewSet):
    queryset = StoreVoucher.objects.all().order_by('-start_at')
    serializer_class = StoreVoucherSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
