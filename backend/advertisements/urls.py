from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdvertisementViewSet, AdvertisementActiveListView

router = DefaultRouter()
router.register(r'', AdvertisementViewSet, basename='advertisement')  # chỉ admin CRUD

urlpatterns = [
    path('active/', AdvertisementActiveListView.as_view(), name='advertisement-active'),
    path('banner/', AdvertisementActiveListView.as_view(), name='advertisement-banner'),  # public
    path('admin/', include(router.urls)),  # chỉ CRUD cho admin
]
