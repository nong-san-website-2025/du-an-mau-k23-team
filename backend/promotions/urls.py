from django.urls import path
from .views import PromotionListCreateAPIView, PromotionDetailAPIView
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, FlashSaleViewSet, FlashSaleItemViewSet
from .views import VoucherViewSet, FlashSaleViewSet, FlashSaleItemViewSet, apply_voucher

router = DefaultRouter()
router.register(r"vouchers", VoucherViewSet, basename="vouchers")
router.register(r"flashsales", FlashSaleViewSet, basename="flashsales")
router.register(r"flashsale-items", FlashSaleItemViewSet, basename="flashsale-items")


urlpatterns = [
    path('promotions/', PromotionListCreateAPIView.as_view(), name='promotion-list'),
    path('promotions/<int:pk>/', PromotionDetailAPIView.as_view(), name='promotion-detail'),
    path("apply-voucher/", apply_voucher, name="apply-voucher"),
] + router.urls