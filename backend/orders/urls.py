from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views # Import từ package views
from .views_admin import AdminOrderViewSet, admin_order_list

router = DefaultRouter()
router.register(r'', views.OrderViewSet, basename='orders')
router.register(r'admin', AdminOrderViewSet, basename='admin-orders')

urlpatterns = [
    # Preorder
    path('preorders/<int:pk>/delete/', views.PreorderDeleteView.as_view(), name='delete_preorder'),
    
    # User Stats & Orders
    path('users/<int:user_id>/behavior-stats/', views.user_behavior_stats, name='user-behavior-stats'),
    path('users/<int:user_id>/', views.user_orders, name='user-orders'),
    
    # Admin Reports
    path('admin/revenue-report/', views.revenue_report, name='revenue-report'),
    path('admin/order-statistics/', views.order_statistics_report, name='order-statistics-report'),
    path('admin-list/', admin_order_list, name='admin-order-list'),  # ✅ NEW
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Realtime & Payment
    path('admin/notifications/sse/', views.order_notifications_sse, name='order-notifications-sse'),
    path('payment_ipn/', views.payment_ipn, name='payment_ipn'),
    
    # ViewSet Router
    path("", include(router.urls)),  
]