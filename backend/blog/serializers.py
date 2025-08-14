from rest_framework import serializers
from .models import Post, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    category = CategorySerializer()

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'author', 'category', 'content', 'image', 'created_at']
