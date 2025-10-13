from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, SearchAPIView, ReviewListCreateView, SubcategoryViewSet, top_products
from .views import products_by_seller
from .views import my_products_simple_list # Import view mới
from . import views
# Khai báo router cho ViewSet
router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("subcategories", SubcategoryViewSet)
router.register("", ProductViewSet, basename='products')

# URL patterns
urlpatterns = [
    path('top-products/', top_products, name='top-products'),
    path("search/", SearchAPIView.as_view(), name="search"),  # API tìm kiếm
    path("", include(router.urls)),  # Các API của Product & Category
    path("<int:product_id>/reviews/", ReviewListCreateView.as_view(), name="product-reviews"),
    path("by-seller/<int:seller_id>/", products_by_seller, name="products-by-seller"),
    path("products/bulk-approve/", views.bulk_approve_products, name="bulk-approve-products"),
    path('my-products/simple/', my_products_simple_list, name='my-products-simple'),
]