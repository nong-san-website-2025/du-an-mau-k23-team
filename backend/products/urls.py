from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, SearchAPIView, ReviewListCreateView, 
    SubcategoryViewSet, top_products, FeaturedCategoryListView,
    products_by_seller, my_products_simple_list, products_by_subcategory,
    smart_search # <--- 1. NHỚ IMPORT HÀM NÀY
)
from . import views

# Khai báo router cho ViewSet
router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("subcategories", SubcategoryViewSet)
router.register("", ProductViewSet, basename='products')

# URL patterns
urlpatterns = [
    # --- ✅ MỚI THÊM: Đặt dòng này lên ĐẦU hoặc TRƯỚC router ---
    path('smart-search/', smart_search, name='smart-search'), 
    # -----------------------------------------------------------

    path('top-products/', top_products, name='top-products'),
    path('new-products/', views.new_products, name='new-products'),
    path('best-sellers/', views.best_sellers, name='best-sellers'),
    path('import-excel/', views.ImportProductExcelView.as_view(), name='product-import-excel'),
    
    # API search cũ (nếu không dùng nữa có thể xóa)
    path("search/", SearchAPIView.as_view(), name="search"),
    
    path("<int:product_id>/reviews/", ReviewListCreateView.as_view(), name="product-reviews"),
    path("by-seller/<int:seller_id>/", products_by_seller, name="products-by-seller"),
    path("products/bulk-approve/", views.bulk_approve_products, name="bulk-approve-products"),
    path('my-products/simple/', my_products_simple_list, name='my-products-simple'),
    path('subcategories/<int:subcategory_id>/products/', products_by_subcategory),
    path('<int:product_id>/images/', views.ProductImageUploadView.as_view(), name='product-image-upload'),
    path('images/<int:image_id>/', views.ProductImageDeleteView.as_view(), name='product-image-delete'),
    path('featured-categories/', FeaturedCategoryListView.as_view(), name='featured-categories'),
    
    # Router luôn để cuối cùng để không chặn các path cụ thể bên trên
    path("", include(router.urls)),
]