from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import create_momo_payment, momo_ipn

router = DefaultRouter()

urlpatterns = [
    path('momo/create/', create_momo_payment, name='create_momo_payment'),
    path('momo/ipn/', momo_ipn, name='momo_ipn'),
]
