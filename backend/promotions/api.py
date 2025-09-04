# promotions/api.py
from rest_framework import viewsets
from .models import Promotion, FlashSale, Voucher
from .serializers import PromotionSerializer, FlashSaleSerializer, VoucherSerializer

class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Promotion.objects.filter(active=True)
    serializer_class = PromotionSerializer

class FlashSaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FlashSale.objects.filter(active=True)
    serializer_class = FlashSaleSerializer

class VoucherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Voucher.objects.filter(active=True)
    serializer_class = VoucherSerializer
