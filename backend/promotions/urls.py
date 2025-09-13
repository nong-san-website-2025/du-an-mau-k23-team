from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VoucherViewSet,
    FlashSaleViewSet,
    FlashSaleItemViewSet,
    apply_voucher,
    PromotionListCreateAPIView,
    PromotionDetailAPIView,
)

router = DefaultRouter()
router.register(r"vouchers", VoucherViewSet, basename="vouchers")
router.register(r"flashsales", FlashSaleViewSet, basename="flashsales")
router.register(r"flashsale-items", FlashSaleItemViewSet, basename="flashsale-items")

urlpatterns = [
    # API cho Promotion
    path("", PromotionListCreateAPIView.as_view(), name="promotion-list"),
    path("<int:pk>/", PromotionDetailAPIView.as_view(), name="promotion-detail"),
    path("apply-voucher/", apply_voucher, name="apply-voucher"),

    # Router cho Voucher, FlashSale, FlashSaleItem
    path("", include(router.urls)),
]
