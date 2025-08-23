from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, SearchAPIView, ReviewListCreateView

# Khai báo router cho ViewSet
router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("", ProductViewSet)

# URL patterns
urlpatterns = [
    path("search/", SearchAPIView.as_view(), name="search"),  # API tìm kiếm
    path("", include(router.urls)),  # Các API của Product & Category
    path("<int:pk>/", ProductViewSet.as_view({'get': 'retrieve'})),
    path("<int:product_id>/reviews/", ReviewListCreateView.as_view(), name="product-reviews"),
]