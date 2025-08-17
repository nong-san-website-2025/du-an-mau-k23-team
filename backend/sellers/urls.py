from django.urls import path
from .views import SellerListAPIView, SellerDetailAPIView, SellerRegisterAPIView, SellerPendingListAPIView, SellerApproveAPIView, SellerRejectAPIView

urlpatterns = [
    path('', SellerListAPIView.as_view(), name='seller-list'),  # api/sellers/
    path('register/', SellerRegisterAPIView.as_view(), name='seller-register'),  # api/sellers/register/
    path('pending/', SellerPendingListAPIView.as_view(), name='seller-pending'),  # api/sellers/pending/
    path('<int:pk>/approve/', SellerApproveAPIView.as_view(), name='seller-approve'),  # api/sellers/<id>/approve/
    path('<int:pk>/reject/', SellerRejectAPIView.as_view(), name='seller-reject'),  # api/sellers/<id>/reject/
    path('<int:pk>/', SellerDetailAPIView.as_view(), name='seller-detail'),  # api/sellers/1/
]
