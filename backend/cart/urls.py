from rest_framework.routers import DefaultRouter
from .views import CartViewSet, CartItemViewSet

router = DefaultRouter()
router.register("items", CartItemViewSet, basename="cartitem")
router.register("", CartViewSet, basename="cart")

urlpatterns = router.urls
