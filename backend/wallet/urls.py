from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletRequestViewSet, UserWalletView, AdminWalletStatsView

router = DefaultRouter()
router.register(r'requests', WalletRequestViewSet, basename='wallet-requests')

urlpatterns = [
    path('', include(router.urls)),
    path('my-wallet/', UserWalletView.as_view(), name='user-wallet'),
    path('admin/stats/', AdminWalletStatsView.as_view(), name='admin-wallet-stats'),
]