from django.urls import path
from .views import SellerListAPIView, SellerDetailAPIView

urlpatterns = [
    path('', SellerListAPIView.as_view(), name='seller-list'),  # api/sellers/
    path('<int:pk>/', SellerDetailAPIView.as_view(), name='seller-detail'),  # api/sellers/1/
]
