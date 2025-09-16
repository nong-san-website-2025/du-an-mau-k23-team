from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import create_momo_payment, momo_ipn, seller_finance, withdraw_history, revenue_chart, wallet_balance, withdraw_request, seed_finance_demo_data

router = DefaultRouter()

urlpatterns = [
    path('momo/create/', create_momo_payment, name='create_momo_payment'),
    path('momo/ipn/', momo_ipn, name='momo_ipn'),
    path('seller/finance/', seller_finance, name='seller_finance'),
    path('withdraw/history/', withdraw_history, name='withdraw_history'),
    path('seller/revenue_chart/', revenue_chart, name='revenue_chart'),
    path('wallet/balance/', wallet_balance, name='wallet_balance'),
    path('withdraw/request/', withdraw_request, name='withdraw_request'),
    path('seed-finance-demo-data/', seed_finance_demo_data, name='seed_finance_demo_data'),
]
