from django.urls import path
from .views import placeholder_svg, StoreListView

urlpatterns = [
    path('placeholder-svg/', placeholder_svg, name='placeholder_svg'),
    path('', StoreListView.as_view(), name='store-list'),
]
