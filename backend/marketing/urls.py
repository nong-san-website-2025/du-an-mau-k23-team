# apps/marketing/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BannerViewSet, FlashSaleViewSet, VoucherViewSet,
    homepage_config, validate_voucher, redeem_voucher
)

router = DefaultRouter()
router.register(r"banners", BannerViewSet)
router.register(r"flashsales", FlashSaleViewSet)
router.register(r"vouchers", VoucherViewSet)

urlpatterns = [
    path("admin/", include(router.urls)),
    path("homepage/config/", homepage_config, name="homepage-config"),
    path("vouchers/validate/", validate_voucher, name="validate-voucher"),
    path("vouchers/redeem/", redeem_voucher, name="redeem-voucher"),
]
