from rest_framework import serializers
from .models import BlogPost, BlogCategory, Comment, Like, Bookmark

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author_name", "content", "created_at"]
        
class BlogPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    bookmarks_count = serializers.IntegerField(source='bookmarked_by.count', read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "author", "author_name", "category", "category_name",
            "content", "image", "is_published", "created_at", "updated_at",
            "views", "comments", "likes_count", "bookmarks_count"
        ]
        read_only_fields = ["author", "created_at", "updated_at", "views"]

class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug"]



class LikeSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Like
        fields = ["id", "user", "post", "created_at"]

class BookmarkSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "user", "post", "created_at"]


class BlogPostAdminSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    category = BlogCategorySerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "author_name",
            "category",
            "image",
            "is_published",
            "created_at",
            "updated_at",
            "views",
        ]
