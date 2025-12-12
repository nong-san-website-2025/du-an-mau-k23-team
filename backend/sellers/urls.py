from django.urls import path
from .views import (
    SellerListAPIView,
    SellerDetailAPIView,
    SellerRegisterAPIView,
    SellerPendingListAPIView,
    SellerApproveAPIView,
    SellerRejectAPIView,
    SellerViewSet,
)
from rest_framework.routers import DefaultRouter
from .views import (
    SellerViewSet,
    ShopViewSet,    SellerLockAPIView,
    SellerByStatusAPIView,
    SellerProductsAPIView,
    SellerMeAPIView,
    SellerActivateAPIView,
)
from sellers import views
from sellers import views_analytics
from products.views import ProductViewSet
from .views import check_store_name


router = DefaultRouter()
router.register(r'sellers', SellerViewSet, basename="sellers")
router.register(r'shops', ShopViewSet, basename="shops")
router.register(r"products", ProductViewSet, basename="seller-products")
urlpatterns = [
    path('', SellerListAPIView.as_view(), name='seller-list'),
    path('register/', SellerRegisterAPIView.as_view(), name='seller-register'),
    path('pending/', SellerPendingListAPIView.as_view(), name='seller-pending'),
    path('me/', SellerMeAPIView.as_view(), name='seller-me'),
    path("search/", views.search_sellers, name="search-sellers"),
    path('activate/', SellerActivateAPIView.as_view(), name='seller-activate'),
    path('productseller/', SellerProductsAPIView.as_view()),
    path("group/<str:group>/", SellerByStatusAPIView.as_view()),
    path('my/following/', views.MyFollowedSellersAPIView.as_view(), name='my-followed-sellers'),
    path('my/followers/', views.MyFollowersAPIView.as_view(), name='my-followers'),
    
    # Analytics APIs
    path('analytics/overview/', views_analytics.analytics_overview, name='analytics-overview'),
    path('analytics/sales/', views_analytics.analytics_sales, name='analytics-sales'),
    path('analytics/products/', views_analytics.analytics_products, name='analytics-products'),
    path('analytics/traffic/', views_analytics.analytics_traffic, name='analytics-traffic'),
    path('analytics/<int:seller_id>/', views.seller_analytics_detail, name='seller-analytics-detail'),
    path('report/agriculture/', views.agriculture_report, name='agriculture-report'),
    path('report/categories/', views.category_report_api, name='category_report'),
    
    # Activity - ĐẶT TRƯỚC <int:pk>/
    path('activity/<int:seller_id>/', views.seller_activity_history, name='seller-activity'),
    
    # Products and Orders
    path('<int:seller_id>/products/', views.seller_products_list, name='seller-products'),
    path('<int:seller_id>/orders/', views.seller_orders_list, name='seller-orders'),
    
    # Actions with ID - ĐẶT TRƯỚC <int:pk>/
    path('<int:pk>/approve/', SellerApproveAPIView.as_view(), name='seller-approve'),
    path('<int:pk>/reject/', SellerRejectAPIView.as_view(), name='seller-reject'),
    path("<int:pk>/lock/", SellerLockAPIView.as_view(), name="seller-lock"),
    path('<int:seller_id>/follow/', views.FollowSellerAPIView.as_view(), name='seller-follow'),
    
    # Generic detail - ĐẶT CUỐI CÙNG
    path('<int:pk>/', SellerDetailAPIView.as_view(), name='seller-detail'),
    path('pending-count/', views.pending_sellers_count, name='pending-sellers-count'),

    path("check-store-name/", check_store_name),
    
] + router.urls
