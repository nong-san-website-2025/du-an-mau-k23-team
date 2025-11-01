# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PreorderDeleteView

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path("", include(router.urls)),             # /api/orders/ # /api/orders/top-products/
    path('preorders/<int:pk>/delete/', PreorderDeleteView.as_view(), name='delete_preorder')
    
]