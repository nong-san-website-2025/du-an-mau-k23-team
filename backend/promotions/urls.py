from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PromotionViewSet, FlashSaleViewSet, StoreVoucherViewSet

router = DefaultRouter()
router.register(r'promotions', PromotionViewSet)
router.register(r'flash-sales', FlashSaleViewSet)
router.register(r'store-vouchers', StoreVoucherViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
