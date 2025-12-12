from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BlogPostViewSet, BlogCategoryViewSet, CommentViewSet,
    LikeViewSet, BookmarkViewSet, AdminBlogViewSet
)

router = DefaultRouter()

# 👨‍💻 User-facing API
router.register(r'blogs', BlogPostViewSet, basename='blog')
router.register(r'categories', BlogCategoryViewSet, basename='blog-category')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'likes', LikeViewSet, basename='like')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

# ⚙️ Admin API
router.register(r'admin/blogs', AdminBlogViewSet, basename='admin-blog')

urlpatterns = [
    path("", include(router.urls)),
]
