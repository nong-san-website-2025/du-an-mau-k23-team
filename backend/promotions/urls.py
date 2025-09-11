# promotions/urls.py
from django.urls import path
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VoucherViewSet, FlashSaleViewSet, FlashSaleItemViewSet, apply_voucher, PromotionListCreateAPIView, PromotionDetailAPIView

router = DefaultRouter()
router.register(r"vouchers", VoucherViewSet, basename="vouchers")
router.register(r"flashsales", FlashSaleViewSet, basename="flashsales")
router.register(r"flashsale-items", FlashSaleItemViewSet, basename="flashsale-items")


urlpatterns = [
    path('', PromotionListCreateAPIView.as_view(), name='promotion-list'),
    path('<int:pk>/', PromotionDetailAPIView.as_view(), name='promotion-detail'),
    path("apply-voucher/", apply_voucher, name="apply-voucher"),
] + router.urls
