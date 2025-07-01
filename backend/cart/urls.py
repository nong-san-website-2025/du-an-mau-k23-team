from rest_framework.routers import DefaultRouter
from .views import CartItemViewSet

router = DefaultRouter()
router.register("", CartItemViewSet, basename="cartitems")
urlpatterns = router.urls
