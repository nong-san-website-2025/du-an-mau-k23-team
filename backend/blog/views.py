from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import BlogPost, BlogCategory, Comment, Like, Bookmark
from .serializers import (
    BlogPostSerializer, BlogCategorySerializer, CommentSerializer,
    LikeSerializer, BookmarkSerializer
)
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BlogPost
from django.db.models import F

class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Người dùng chỉ được đọc, like, bookmark, tăng view.
    """
    queryset = BlogPost.objects.filter(is_published=True).select_related('category', 'author').order_by('-created_at')
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    # 🧡 Like
    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, slug=None):
        post = self.get_object()
        user = request.user
        like, created = Like.objects.get_or_create(post=post, user=user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        post.refresh_from_db()
        return Response({
            "liked": liked,
            "likes_count": post.likes.count()
        })

    # 💾 Bookmark
    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        post = self.get_object()
        user = request.user
        bookmark, created = Bookmark.objects.get_or_create(post=post, user=user)
        if not created:
            bookmark.delete()
            bookmarked = False
        else:
            bookmarked = True
        return Response({
            "bookmarked": bookmarked,
            "bookmarks_count": post.bookmarks.count()
        })

    # 👁️ Tăng lượt xem
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny], url_path='increase-view')
    def increase_view(self, request, slug=None):
        post = self.get_object()
        session_key = f"viewed_{slug}"
        if not request.session.get(session_key):
            try:
                # Lấy post trực tiếp và tăng view
                post.views += 1
                post.save(update_fields=['views'])
                request.session[session_key] = True
                return Response({'views': post.views, 'increased': True})
            except Exception as e:
                return Response({
                    'error': str(e),
                    'views': post.views,
                    'increased': False
                }, status=500)
        return Response({'views': post.views, 'increased': False})
    
class AdminBlogViewSet(viewsets.ModelViewSet):
    """
    Quản lý bài viết cho admin (CRUD, publish/unpublish)
    """
    queryset = BlogPost.objects.select_related('category', 'author').all().order_by('-created_at')
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'

    def perform_create(self, serializer):
        """
        Tự động gán author là user hiện tại khi tạo bài viết mới
        """
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        """
        Khi update, giữ nguyên author cũ
        """
        serializer.save()
    
    @action(detail=True, methods=['patch'])
    def toggle_publish(self, request, slug=None):
        post = self.get_object()
        post.is_published = request.data.get('is_published', not post.is_published)
        post.save()
        return Response({'is_published': post.is_published})


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.AllowAny]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_approved=True)
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        post_id = self.request.data.get("post")
        if not post_id:
            raise ValidationError({"post": "Thiếu ID bài viết"})
        try:
            post = BlogPost.objects.get(id=post_id)
        except BlogPost.DoesNotExist:
            raise ValidationError({"post": "Bài viết không tồn tại"})

        serializer.save(author=self.request.user, post=post)


class LikeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.AllowAny]


class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]
