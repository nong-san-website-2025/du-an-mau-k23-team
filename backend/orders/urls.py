# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PreorderDeleteView, PreorderListCreateView

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [          # /api/orders/ # /api/orders/top-products/
    path("preorders/", PreorderListCreateView.as_view(), name="preorder_list_create"),
    path('preorders/<int:pk>/delete/', PreorderDeleteView.as_view(), name='delete_preorder')

]
# Include router-generated routes (list, retrieve, custom @action endpoints)
urlpatterns += router.urls

