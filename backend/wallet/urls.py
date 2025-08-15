# wallets/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, WalletTopUpAdminViewSet

router = DefaultRouter()
router.register(r'wallet', WalletViewSet, basename='wallet')
router.register(r'admin_wallet_requests', WalletTopUpAdminViewSet, basename='admin-wallet-requests')

urlpatterns = [
    path('', include(router.urls)),
]
