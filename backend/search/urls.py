from django.urls import path
from . import views

urlpatterns = [
    path('search-log/', views.log_search, name='log_search'),
    path('popular-keywords/', views.popular_keywords, name='popular_keywords'),
path('popular-items/', views.popular_search_items, name='popular-search-items'),
]
