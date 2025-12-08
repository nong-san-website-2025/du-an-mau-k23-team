from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  seller_finance, withdraw_history, revenue_chart, wallet_balance, withdraw_request, seed_finance_demo_data, create_payment, vnpay_return, vnpay_callback, vnpay_return_api, get_wallets, approve_pending_balance, get_wallet_transactions, recalculate_pending_balance, get_withdraw_requests, approve_withdraw_request, reject_withdraw_request, wallet_balance_detail 

router = DefaultRouter()

urlpatterns = [
    path('seller/finance/', seller_finance, name='seller_finance'),
    path('withdraw/history/', withdraw_history, name='withdraw_history'),
    path('seller/revenue_chart/', revenue_chart, name='revenue_chart'),
    path('wallet/balance/', wallet_balance, name='wallet_balance'),
    path('withdraw/request/', withdraw_request, name='withdraw_request'),
    path('withdraw/requests/', get_withdraw_requests, name='get_withdraw_requests'),
    path('withdraw/<int:withdraw_id>/approve/', approve_withdraw_request, name='approve_withdraw_request'),
    path('withdraw/<int:withdraw_id>/reject/', reject_withdraw_request, name='reject_withdraw_request'),
    path('seed-finance-demo-data/', seed_finance_demo_data, name='seed_finance_demo_data'),
    path("vnpay/", create_payment, name="vnpay_create_payment"),
    path("vnpay/return/", vnpay_return, name="vnpay_return"),
    path("vnpay/return-api/", vnpay_return_api, name="vnpay_return_api"),
    path("vnpay/callback/", vnpay_callback, name="vnpay_callback"),
    path('wallets/', get_wallets, name='get_wallets'),
    path('wallets/<int:seller_id>/approve-pending/', approve_pending_balance, name='approve_pending_balance'),
    path('wallets/<int:seller_id>/transactions/', get_wallet_transactions, name='get_wallet_transactions'),
    path('wallets/<int:seller_id>/recalculate/', recalculate_pending_balance, name='recalculate_pending_balance'),
    path('wallets/<int:seller_id>/balance-detail/', wallet_balance_detail, name='wallet_balance_detail'),
]
