from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    FlashSaleListView,
    my_vouchers,
    apply_voucher,
    VoucherViewSet,
    promotions_overview,
    FlashSaleAdminViewSet
)


router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'flashsale-admin', FlashSaleAdminViewSet, basename='flashsale-admin')

urlpatterns = [
    path('overview/', promotions_overview, name='promotions-overview'),
    path('flash-sales/', FlashSaleListView.as_view(), name='flash-sale-list'),
    path('vouchers/my/', my_vouchers, name='my-vouchers'),
    path('vouchers/apply/', apply_voucher, name='apply-voucher'),
]

# Export router để project-level include
__all__ = ['urlpatterns', 'router']