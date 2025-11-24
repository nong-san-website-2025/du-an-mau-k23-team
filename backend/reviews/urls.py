from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReviewViewSet,
    MyReviewView,
    ReviewReplyViewSet,
    CustomerSupportViewSet,
    SellerReviewsView,
    SellerReviewsSummaryView,
    SellerRecentActivitiesView,
    AdminReviewViewSet,
)

# Tạo router cho các viewset
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='reviews')
router.register(r'review-replies', ReviewReplyViewSet, basename='review-replies')
router.register(r'support', CustomerSupportViewSet, basename='support')
router.register(r'admin/reviews', AdminReviewViewSet, basename='admin-reviews')

# URL patterns chính
urlpatterns = [
    # Lấy review của user hiện tại cho 1 sản phẩm
    path("products/<int:product_id>/my-review/", MyReviewView.as_view(), name="my-review"),
    # Danh sách review cho seller (lọc theo cửa hàng/sản phẩm)
    path("seller/reviews/", SellerReviewsView.as_view(), name="seller-reviews"),
    # Thống kê Dashboard cho seller (xu hướng theo tháng/năm)
    path("seller/reviews/summary/", SellerReviewsSummaryView.as_view(), name="seller-reviews-summary"),
    # Hoạt động gần đây (tối đa 5)
    path("seller/reviews/recent-activities/", SellerRecentActivitiesView.as_view(), name="seller-reviews-recent"),

    # Các route của viewset
    path("", include(router.urls)),
]
