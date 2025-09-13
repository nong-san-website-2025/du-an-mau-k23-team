from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, promotions_overview, FlashSaleViewSet

router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='vouchers')
router.register(r'flashsales', FlashSaleViewSet, basename='flashsales')

urlpatterns = [
    path('overview/', promotions_overview, name='promotions-overview'),
] + router.urls
