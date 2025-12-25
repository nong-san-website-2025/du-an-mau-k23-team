from django.urls import path
from rest_framework.routers import DefaultRouter

# Import views
from sellers import views 
from sellers import views_analytics 
from products.views import ProductViewSet

router = DefaultRouter()
router.register(r'sellers', views.SellerViewSet, basename="sellers")
router.register(r'shops', views.ShopViewSet, basename="shops")
router.register(r"products", ProductViewSet, basename="seller-products")

urlpatterns = [
    # --- PUBLIC / GENERAL ---
    path('', views.SellerListAPIView.as_view(), name='seller-list'),
    path("search/", views.search_sellers, name="search-sellers"),
    path("check-store-name/", views.check_store_name, name='check-store-name'),
    path("group/<str:group>/", views.SellerByStatusAPIView.as_view(), name='seller-by-group'),

    # --- SELLER DASHBOARD (ME) ---
    path('register/', views.SellerRegisterAPIView.as_view(), name='seller-register'),
    path('me/', views.SellerMeAPIView.as_view(), name='seller-me'),
    path('activate/', views.SellerActivateAPIView.as_view(), name='seller-activate'),
    
    # Products quản lý bởi Seller
    path('productseller/', views.SellerProductsAPIView.as_view(), name='seller-products-manage'),
    path('productseller/with-import-requests/', views.SellerImportRequestProductsAPIView.as_view(), name='seller-products-import-requests'),

    # Following System
    path('<int:seller_id>/follow/', views.FollowSellerAPIView.as_view(), name='seller-follow'),
    path('my/following/', views.MyFollowedSellersAPIView.as_view(), name='my-followed-sellers'),
    path('my/followers/', views.MyFollowersAPIView.as_view(), name='my-followers'),
    
    # --- ADMIN / APPROVAL SYSTEM ---
    path('pending/', views.SellerPendingListAPIView.as_view(), name='seller-pending'),
    path('pending-count/', views.pending_sellers_count, name='pending-sellers-count'),
    path('<int:pk>/approve/', views.SellerApproveAPIView.as_view(), name='seller-approve'),
    path('<int:pk>/reject/', views.SellerRejectAPIView.as_view(), name='seller-reject'),
    
    # [QUAN TRỌNG] Các API Khóa / Mở Khóa / Set Pending
    path("<int:pk>/toggle-lock/", views.SellerToggleLockAPIView.as_view(), name="seller-toggle-lock"),
    path("bulk-lock/", views.SellerBulkLockAPIView.as_view(), name="seller-bulk-lock"),
    path("bulk-unlock/", views.SellerBulkUnlockAPIView.as_view(), name="seller-bulk-unlock"),
    
    # --- [MỚI] Đường dẫn cho tính năng Chuyển về Chờ duyệt ---
    path('<int:pk>/set-pending/', views.SellerSetPendingAPIView.as_view(), name='seller-set-pending'),

    # --- ANALYTICS & REPORTS (ADMIN VIEW & SELLER CENTER) ---
    path('analytics/overview/', views_analytics.analytics_overview, name='analytics-overview'),
    path('analytics/sales/', views_analytics.analytics_sales, name='analytics-sales'),
    path('analytics/products/', views_analytics.analytics_products, name='analytics-products'),
    path('analytics/traffic/', views_analytics.analytics_traffic, name='analytics-traffic'),
    
    # API cho Admin Detail Drawer
    path('analytics/<int:seller_id>/', views_analytics.seller_analytics_detail, name='seller-analytics-detail'),
    
    # Reports khác
    path('report/agriculture/', views.agriculture_report, name='agriculture-report'),
    path('report/categories/', views.category_report_api, name='category_report'),
    
    # Activity & Detail Lists (Admin view specific seller)
    path('activity/<int:seller_id>/', views.seller_activity_history, name='seller-activity'),
    path('<int:seller_id>/products/', views.seller_products_list, name='seller-products-admin-list'),
    path('<int:seller_id>/orders/', views.seller_orders_list, name='seller-orders-admin-list'),
    
    # Generic detail - ĐẶT CUỐI CÙNG
    path('<int:pk>/', views.SellerDetailAPIView.as_view(), name='seller-detail'),
    
] + router.urls