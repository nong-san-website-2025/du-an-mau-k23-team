from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import my_vouchers, apply_voucher, claim_voucher, promotions_overview
from .views import VoucherViewSet, FlashSaleViewSet

router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='vouchers')
router.register(r'flashsales', FlashSaleViewSet, basename='flashsales')

urlpatterns = [
    path('overview/', promotions_overview, name='promotions-overview'),
    path('vouchers/my_vouchers/', my_vouchers, name='my-vouchers'),
    path('vouchers/claim/', claim_voucher, name='claim-voucher'),
    path('vouchers/apply/', apply_voucher, name='apply-voucher'),
] + router.urls
