# apps/marketing/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BannerViewSet, AdSlotViewSet
)

router = DefaultRouter()
router.register(r"banners", BannerViewSet)
router.register(r"slots", AdSlotViewSet)


urlpatterns = [
    path("", include(router.urls)),

]
