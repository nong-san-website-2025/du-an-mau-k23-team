# promotions/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, FlashSaleViewSet, FlashSaleItemViewSet
from .views import VoucherViewSet, FlashSaleViewSet, FlashSaleItemViewSet, apply_voucher

router = DefaultRouter()
router.register(r"vouchers", VoucherViewSet, basename="vouchers")
router.register(r"flashsales", FlashSaleViewSet, basename="flashsales")
router.register(r"flashsale-items", FlashSaleItemViewSet, basename="flashsale-items")

urlpatterns = router.urls + [
    path("apply-voucher/", apply_voucher, name="apply-voucher"),
]
