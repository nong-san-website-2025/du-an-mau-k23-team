from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("", ProductViewSet)

urlpatterns = router.urls
