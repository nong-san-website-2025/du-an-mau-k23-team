from django.urls import path
from .views import PromotionListCreateAPIView, PromotionDetailAPIView

urlpatterns = [
    path('', PromotionListCreateAPIView.as_view(), name='promotion-list'),
    path('<int:pk>/', PromotionDetailAPIView.as_view(), name='promotion-detail'),
]
