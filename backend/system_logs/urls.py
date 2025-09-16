from rest_framework.routers import DefaultRouter
from .views import SystemLogViewSet

router = DefaultRouter()
router.register(r'system-logs', SystemLogViewSet, basename='systemlog')

urlpatterns = router.urls
