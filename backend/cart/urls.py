from rest_framework.routers import DefaultRouter
from .views import CartViewSet, CartItemViewSet

router = DefaultRouter()
<<<<<<< HEAD
router.register("items", CartItemViewSet, basename="cartitem")
router.register("", CartViewSet, basename="cart")
=======
router.register(r'cart', CartViewSet)
router.register(r'cartitems', CartItemViewSet)
>>>>>>> feature/backend_cart_NhatNguyen

urlpatterns = router.urls
