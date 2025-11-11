# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PreorderDeleteView
from . import views



router = DefaultRouter()
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path("", include(router.urls)),             # /api/orders/ # /api/orders/top-products/
    path('preorders/<int:pk>/delete/', PreorderDeleteView.as_view(), name='delete_preorder'),
    path('users/<int:user_id>/behavior-stats/', views.user_behavior_stats, name='user-behavior-stats'),
]
