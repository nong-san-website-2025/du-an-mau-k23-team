# cart/urls.py
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, CartItemViewSet

router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'cartitems', CartItemViewSet, basename='cartitems')

urlpatterns = router.urls
