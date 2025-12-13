# urls.py
from django.urls import path
from .views import (
    CalculateShippingFeeView,
    CalculateShippingFeePerSellerView,
    GHNProvincesView,
    GHNDistrictsView,
    GHNWardsView,
)

urlpatterns = [
    path('fee/', CalculateShippingFeeView.as_view(), name='calculate-shipping-fee'),
    path('fee-per-seller/', CalculateShippingFeePerSellerView.as_view(), name='calculate-shipping-fee-per-seller'),
    path('master/provinces/', GHNProvincesView.as_view(), name='ghn-provinces'),
    path('master/districts/', GHNDistrictsView.as_view(), name='ghn-districts'),
    path('master/wards/', GHNWardsView.as_view(), name='ghn-wards'),
]