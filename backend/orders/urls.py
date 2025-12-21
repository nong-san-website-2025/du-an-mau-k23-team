# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PreorderDeleteView, order_notifications_sse, payment_ipn
from . import views



router = DefaultRouter()
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path('preorders/<int:pk>/delete/', PreorderDeleteView.as_view(), name='delete_preorder'),
    path('users/<int:user_id>/behavior-stats/', views.user_behavior_stats, name='user-behavior-stats'),
    path('users/<int:user_id>/', views.user_orders, name='user-orders'),
    path('admin/revenue-report/', views.revenue_report, name='revenue-report'),
    path('admin/order-statistics/', views.order_statistics_report, name='order-statistics-report'),
    path('admin/notifications/sse/', order_notifications_sse, name='order-notifications-sse'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path("", include(router.urls)),  
    path('payment_ipn/', payment_ipn, name='payment_ipn'),
]
