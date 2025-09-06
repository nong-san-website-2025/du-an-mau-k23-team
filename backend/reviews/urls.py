from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReviewViewSet,
    MyReviewView,
    ReviewReplyViewSet,
    CustomerSupportViewSet
)

# Tạo router cho các viewset
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='reviews')
router.register(r'review-replies', ReviewReplyViewSet, basename='review-replies')
router.register(r'support', CustomerSupportViewSet, basename='support')

# URL patterns chính
urlpatterns = [
    # Lấy review của user hiện tại cho 1 sản phẩm
    path("products/<int:product_id>/my-review/", MyReviewView.as_view(), name="my-review"),

    # Các route của viewset
    path("", include(router.urls)),
]
