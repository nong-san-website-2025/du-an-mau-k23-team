
from rest_framework.routers import DefaultRouter
from .views import SellerViewSet, ShopViewSet

router = DefaultRouter()
router.register(r'sellers', SellerViewSet, basename="sellers")
router.register(r'shops', ShopViewSet, basename="shops")
urlpatterns = router.urls

