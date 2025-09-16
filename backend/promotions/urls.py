from django.urls import path
from .views import my_vouchers, apply_voucher
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, FlashSaleViewSet, promotions_overview

router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='vouchers')
router.register(r'flashsales', FlashSaleViewSet, basename='flashsales')

urlpatterns = [
    path('overview/', promotions_overview, name='promotions-overview'),
    path('vouchers/my_vouchers/', my_vouchers, name='my-vouchers'),
    path('vouchers/apply/', apply_voucher, name='apply-voucher'),
] + router.urls
