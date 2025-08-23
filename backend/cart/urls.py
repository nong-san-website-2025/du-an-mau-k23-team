# cart/urls.py
from rest_framework.routers import DefaultRouter
from .views import CartItemViewSet

router = DefaultRouter()
router.register(r'cartitems', CartItemViewSet, basename='cartitems')

urlpatterns = router.urls