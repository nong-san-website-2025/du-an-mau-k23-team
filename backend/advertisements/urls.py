from django.urls import path
from . import views

urlpatterns = [
    path('active/', views.AdvertisementActiveListView.as_view(), name='advertisement-active'),
]
