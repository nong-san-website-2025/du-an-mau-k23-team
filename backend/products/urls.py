from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("products", ProductViewSet)

urlpatterns = router.urls
