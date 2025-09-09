from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdvertisementViewSet, AdvertisementActiveListView

router = DefaultRouter()
router.register(r'', AdvertisementViewSet, basename='advertisement')

urlpatterns = [
    path('active/', AdvertisementActiveListView.as_view(), name='advertisement-active'),
    path('', include(router.urls)),  # <-- QUAN TRỌNG: thêm dòng này
]
