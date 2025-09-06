from django.urls import path
from .views import PromotionListCreateAPIView, PromotionDetailAPIView

urlpatterns = [
    path('promotions/', PromotionListCreateAPIView.as_view(), name='promotion-list'),
    path('promotions/<int:pk>/', PromotionDetailAPIView.as_view(), name='promotion-detail'),
]
