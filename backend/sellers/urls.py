
from rest_framework.routers import DefaultRouter
from .views import SellerViewSet, ShopViewSet, ProductViewSet, OrderViewSet, VoucherViewSet

router = DefaultRouter()
router.register(r'sellers', SellerViewSet, basename="sellers")
router.register(r'shops', ShopViewSet, basename="shops")
router.register(r"products", ProductViewSet)
router.register(r"orders", OrderViewSet)
router.register(r"vouchers", VoucherViewSet)
urlpatterns = router.urls

